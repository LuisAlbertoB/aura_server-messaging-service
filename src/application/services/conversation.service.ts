import { Op } from 'sequelize';
import { Conversation, ConversationParticipant, Message } from '../../infrastructure/models';
import { AppError } from '../middleware/error.middleware';

export class ConversationService {
    /**
     * Create a new conversation
     */
    static async createConversation(
        type: 'individual' | 'group',
        creatorId: string,
        participantIds: string[],
        name?: string,
        avatarUrl?: string
    ) {
        // For individual conversations, check if one already exists
        if (type === 'individual' && participantIds.length === 1) {
            const existingConversation = await this.findIndividualConversation(
                creatorId,
                participantIds[0]
            );
            if (existingConversation) {
                return existingConversation;
            }
        }

        // Create conversation
        const conversation = await Conversation.create({
            type,
            name,
            avatar_url: avatarUrl,
            created_by: creatorId,
            is_active: true
        });

        // Add creator as admin
        await ConversationParticipant.create({
            conversation_id: conversation.id,
            user_id: creatorId,
            role: 'admin',
            joined_at: new Date()
        });

        // Add other participants
        const participantPromises = participantIds.map(userId =>
            ConversationParticipant.create({
                conversation_id: conversation.id,
                user_id: userId,
                role: type === 'group' ? 'member' : 'admin',
                joined_at: new Date()
            })
        );
        await Promise.all(participantPromises);

        return this.getConversationById(conversation.id, creatorId);
    }

    /**
     * Find existing individual conversation between two users
     */
    static async findIndividualConversation(userId1: string, userId2: string) {
        const conversations = await Conversation.findAll({
            where: { type: 'individual' },
            include: [{
                model: ConversationParticipant,
                as: 'participants',
                where: {
                    user_id: {
                        [Op.in]: [userId1, userId2]
                    },
                    left_at: { [Op.is]: null }
                }
            }]
        });

        for (const conv of conversations) {
            const participants = conv.get('participants') as ConversationParticipant[];
            const userIds = participants.map(p => p.user_id);
            if (userIds.includes(userId1) && userIds.includes(userId2) && userIds.length === 2) {
                return this.getConversationById(conv.id, userId1);
            }
        }

        return null;
    }

    /**
     * Get conversation by ID
     */
    static async getConversationById(conversationId: string, userId: string) {
        const conversation = await Conversation.findByPk(conversationId, {
            include: [
                {
                    model: ConversationParticipant,
                    as: 'participants',
                    where: { left_at: { [Op.is]: null } }
                },
                {
                    model: Message,
                    as: 'messages',
                    limit: 1,
                    order: [['sent_at', 'DESC']]
                }
            ]
        });

        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        // Check if user is a participant
        const participants = conversation.get('participants') as ConversationParticipant[];
        const isParticipant = participants.some(p => p.user_id === userId);

        if (!isParticipant) {
            throw new AppError('Access denied', 403);
        }

        return conversation;
    }

    /**
     * Get all conversations for a user
     */
    static async getUserConversations(userId: string, page: number = 1, limit: number = 20) {
        const offset = (page - 1) * limit;

        const participations = await ConversationParticipant.findAll({
            where: {
                user_id: userId,
                left_at: { [Op.is]: null }
            },
            include: [{
                model: Conversation,
                as: 'conversation',
                where: { is_active: true },
                include: [
                    {
                        model: ConversationParticipant,
                        as: 'participants',
                        where: { left_at: { [Op.is]: null } }
                    },
                    {
                        model: Message,
                        as: 'messages',
                        limit: 1,
                        order: [['sent_at', 'DESC']],
                        required: false
                    }
                ]
            }],
            order: [[{ model: Conversation, as: 'conversation' }, 'last_message_at', 'DESC NULLS LAST']],
            limit,
            offset
        });

        const conversations = participations.map(p => p.get('conversation'));

        return {
            conversations,
            page,
            limit,
            total: await ConversationParticipant.count({
                where: { user_id: userId, left_at: { [Op.is]: null } }
            })
        };
    }

    /**
     * Add participant to conversation
     */
    static async addParticipant(
        conversationId: string,
        userId: string,
        newUserId: string,
        role: 'admin' | 'member' = 'member'
    ) {
        const conversation = await this.getConversationById(conversationId, userId);

        if (conversation.type === 'individual') {
            throw new AppError('Cannot add participants to individual conversations', 400);
        }

        // Check if requester is admin
        const requester = await ConversationParticipant.findOne({
            where: {
                conversation_id: conversationId,
                user_id: userId,
                left_at: { [Op.is]: null }
            }
        });

        if (!requester || requester.role !== 'admin') {
            throw new AppError('Only admins can add participants', 403);
        }

        // Check if user already exists
        const existing = await ConversationParticipant.findOne({
            where: {
                conversation_id: conversationId,
                user_id: newUserId
            }
        });

        if (existing && !existing.left_at) {
            throw new AppError('User is already a participant', 400);
        }

        if (existing && existing.left_at) {
            // Rejoin
            existing.left_at = null;
            existing.joined_at = new Date();
            existing.role = role;
            await existing.save();
            return existing;
        }

        return await ConversationParticipant.create({
            conversation_id: conversationId,
            user_id: newUserId,
            role,
            joined_at: new Date()
        });
    }

    /**
     * Remove participant from conversation
     */
    static async removeParticipant(
        conversationId: string,
        userId: string,
        targetUserId: string
    ) {
        // Verify user has access to this conversation
        await this.getConversationById(conversationId, userId);

        const participant = await ConversationParticipant.findOne({
            where: {
                conversation_id: conversationId,
                user_id: targetUserId,
                left_at: { [Op.is]: null }
            }
        });

        if (!participant) {
            throw new AppError('Participant not found', 404);
        }

        // Users can remove themselves, or admins can remove others
        if (userId !== targetUserId) {
            const requester = await ConversationParticipant.findOne({
                where: {
                    conversation_id: conversationId,
                    user_id: userId,
                    left_at: { [Op.is]: null }
                }
            });

            if (!requester || requester.role !== 'admin') {
                throw new AppError('Only admins can remove other participants', 403);
            }
        }

        participant.left_at = new Date();
        await participant.save();

        return participant;
    }

    /**
     * Update conversation details
     */
    static async updateConversation(
        conversationId: string,
        userId: string,
        updates: { name?: string; avatar_url?: string }
    ) {
        const conversation = await this.getConversationById(conversationId, userId);

        // Check if user is admin
        const participant = await ConversationParticipant.findOne({
            where: {
                conversation_id: conversationId,
                user_id: userId,
                left_at: { [Op.is]: null }
            }
        });

        if (!participant || participant.role !== 'admin') {
            throw new AppError('Only admins can update conversation details', 403);
        }

        if (updates.name !== undefined) {
            conversation.name = updates.name;
        }
        if (updates.avatar_url !== undefined) {
            conversation.avatar_url = updates.avatar_url;
        }

        await conversation.save();
        return conversation;
    }
}

export default ConversationService;
