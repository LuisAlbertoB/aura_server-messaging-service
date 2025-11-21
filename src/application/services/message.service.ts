import { Op } from 'sequelize';
import { Message, MessageStatus, ConversationParticipant, Conversation } from '../../infrastructure/models';
import { AppError } from '../middleware/error.middleware';

export class MessageService {
    /**
     * Send a new message
     */
    static async sendMessage(
        conversationId: string,
        senderId: string,
        content?: string,
        messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' = 'text',
        mediaReference?: any,
        replyTo?: string,
        metadata?: any
    ) {
        // Verify sender is a participant
        const participant = await ConversationParticipant.findOne({
            where: {
                conversation_id: conversationId,
                user_id: senderId,
                left_at: null
            }
        });

        if (!participant) {
            throw new AppError('You are not a participant in this conversation', 403);
        }

        // Create message
        const message = await Message.create({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            message_type: messageType,
            media_reference: mediaReference,
            reply_to: replyTo,
            metadata,
            sent_at: new Date(),
            is_edited: false,
            is_deleted: false
        });

        // Update conversation's last_message_at
        await Conversation.update(
            { last_message_at: message.sent_at },
            { where: { id: conversationId } }
        );

        // Create message status for all participants except sender
        const allParticipants = await ConversationParticipant.findAll({
            where: {
                conversation_id: conversationId,
                left_at: null,
                user_id: { [Op.ne]: senderId }
            }
        });

        const statusPromises = allParticipants.map(p =>
            MessageStatus.create({
                message_id: message.id,
                user_id: p.user_id,
                status: 'sent',
                timestamp: new Date()
            })
        );
        await Promise.all(statusPromises);

        // Load message with associations
        return await Message.findByPk(message.id, {
            include: [{
                model: MessageStatus,
                as: 'statuses'
            }]
        });
    }

    /**
     * Get message history for a conversation
     */
    static async getMessageHistory(
        conversationId: string,
        userId: string,
        page: number = 1,
        limit: number = 50,
        beforeMessageId?: string
    ) {
        // Verify user is a participant
        const participant = await ConversationParticipant.findOne({
            where: {
                conversation_id: conversationId,
                user_id: userId
            }
        });

        if (!participant) {
            throw new AppError('Access denied', 403);
        }

        const where: any = {
            conversation_id: conversationId,
            is_deleted: false
        };

        // If beforeMessageId is provided, get messages before that message
        if (beforeMessageId) {
            const beforeMessage = await Message.findByPk(beforeMessageId);
            if (beforeMessage) {
                where.sent_at = { [Op.lt]: beforeMessage.sent_at };
            }
        }

        // Only show messages sent after user joined
        if (participant.joined_at) {
            where.sent_at = {
                ...where.sent_at,
                [Op.gte]: participant.joined_at
            };
        }

        const offset = (page - 1) * limit;

        const messages = await Message.findAll({
            where,
            include: [
                {
                    model: MessageStatus,
                    as: 'statuses'
                },
                {
                    model: Message,
                    as: 'repliedMessage',
                    attributes: ['id', 'sender_id', 'content', 'message_type', 'sent_at']
                }
            ],
            order: [['sent_at', 'DESC']],
            limit,
            offset
        });

        const total = await Message.count({ where });

        return {
            messages: messages.reverse(), // Reverse to show oldest first
            page,
            limit,
            total,
            hasMore: total > page * limit
        };
    }

    /**
     * Mark message as delivered
     */
    static async markAsDelivered(messageId: string, userId: string) {
        const message = await Message.findByPk(messageId);
        if (!message) {
            throw new AppError('Message not found', 404);
        }

        // Don't create status for sender
        if (message.sender_id === userId) {
            return null;
        }

        const [status, created] = await MessageStatus.findOrCreate({
            where: {
                message_id: messageId,
                user_id: userId
            },
            defaults: {
                status: 'delivered',
                timestamp: new Date()
            }
        });

        if (!created && status.status === 'sent') {
            status.status = 'delivered';
            status.timestamp = new Date();
            await status.save();
        }

        return status;
    }

    /**
     * Mark message as read
     */
    static async markAsRead(messageId: string, userId: string) {
        const message = await Message.findByPk(messageId);
        if (!message) {
            throw new AppError('Message not found', 404);
        }

        // Don't create status for sender
        if (message.sender_id === userId) {
            return null;
        }

        const [status, created] = await MessageStatus.findOrCreate({
            where: {
                message_id: messageId,
                user_id: userId
            },
            defaults: {
                status: 'read',
                timestamp: new Date()
            }
        });

        if (!created) {
            status.status = 'read';
            status.timestamp = new Date();
            await status.save();
        }

        // Update participant's last_read_at
        await ConversationParticipant.update(
            { last_read_at: new Date() },
            {
                where: {
                    conversation_id: message.conversation_id,
                    user_id: userId
                }
            }
        );

        return status;
    }

    /**
     * Mark all messages in conversation as read
     */
    static async markConversationAsRead(conversationId: string, userId: string) {
        // Verify user is a participant
        const participant = await ConversationParticipant.findOne({
            where: {
                conversation_id: conversationId,
                user_id: userId,
                left_at: null
            }
        });

        if (!participant) {
            throw new AppError('Access denied', 403);
        }

        // Get all unread messages
        const messages = await Message.findAll({
            where: {
                conversation_id: conversationId,
                sender_id: { [Op.ne]: userId },
                is_deleted: false
            },
            include: [{
                model: MessageStatus,
                as: 'statuses',
                where: {
                    user_id: userId,
                    status: { [Op.ne]: 'read' }
                },
                required: false
            }]
        });

        // Mark all as read
        const promises = messages.map(msg => this.markAsRead(msg.id, userId));
        await Promise.all(promises);

        return { count: messages.length };
    }

    /**
     * Delete a message
     */
    static async deleteMessage(messageId: string, userId: string) {
        const message = await Message.findByPk(messageId);

        if (!message) {
            throw new AppError('Message not found', 404);
        }

        // Only sender can delete
        if (message.sender_id !== userId) {
            throw new AppError('You can only delete your own messages', 403);
        }

        message.is_deleted = true;
        message.content = '[Message deleted]';
        await message.save();

        return message;
    }

    /**
     * Edit a message
     */
    static async editMessage(messageId: string, userId: string, newContent: string) {
        const message = await Message.findByPk(messageId);

        if (!message) {
            throw new AppError('Message not found', 404);
        }

        // Only sender can edit
        if (message.sender_id !== userId) {
            throw new AppError('You can only edit your own messages', 403);
        }

        if (message.is_deleted) {
            throw new AppError('Cannot edit deleted message', 400);
        }

        message.content = newContent;
        message.is_edited = true;
        message.edited_at = new Date();
        await message.save();

        return message;
    }

    /**
     * Get unread message count for a conversation
     */
    static async getUnreadCount(conversationId: string, userId: string) {
        const participant = await ConversationParticipant.findOne({
            where: {
                conversation_id: conversationId,
                user_id: userId,
                left_at: null
            }
        });

        if (!participant) {
            return 0;
        }

        const lastReadAt = participant.last_read_at || participant.joined_at;

        const count = await Message.count({
            where: {
                conversation_id: conversationId,
                sender_id: { [Op.ne]: userId },
                sent_at: { [Op.gt]: lastReadAt },
                is_deleted: false
            }
        });

        return count;
    }
}

export default MessageService;
