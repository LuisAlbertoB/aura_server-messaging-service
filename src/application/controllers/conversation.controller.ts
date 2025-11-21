import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ConversationService } from '../services/conversation.service';
import { AppError } from '../middleware/error.middleware';

export class ConversationController {
    /**
     * Create a new conversation
     * POST /api/conversations
     */
    static async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { type, participantIds, name, avatarUrl } = req.body;
            const userId = req.user!.user_id;

            if (!type || !participantIds || !Array.isArray(participantIds)) {
                throw new AppError('Invalid request: type and participantIds are required', 400);
            }

            const conversation = await ConversationService.createConversation(
                type,
                userId,
                participantIds,
                name,
                avatarUrl
            );

            res.status(201).json({
                success: true,
                data: conversation
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Create conversation error:', error);
                res.status(500).json({ error: 'Failed to create conversation' });
            }
        }
    }

    /**
     * Get all user conversations
     * GET /api/conversations
     */
    static async list(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user!.user_id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await ConversationService.getUserConversations(userId, page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('List conversations error:', error);
            res.status(500).json({ error: 'Failed to fetch conversations' });
        }
    }

    /**
     * Get conversation by ID
     * GET /api/conversations/:id
     */
    static async getById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user!.user_id;

            const conversation = await ConversationService.getConversationById(id, userId);

            res.status(200).json({
                success: true,
                data: conversation
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Get conversation error:', error);
                res.status(500).json({ error: 'Failed to fetch conversation' });
            }
        }
    }

    /**
     * Update conversation
     * PUT /api/conversations/:id
     */
    static async update(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user!.user_id;
            const { name, avatar_url } = req.body;

            const conversation = await ConversationService.updateConversation(
                id,
                userId,
                { name, avatar_url }
            );

            res.status(200).json({
                success: true,
                data: conversation
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Update conversation error:', error);
                res.status(500).json({ error: 'Failed to update conversation' });
            }
        }
    }

    /**
     * Add participant to conversation
     * POST /api/conversations/:id/participants
     */
    static async addParticipant(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user!.user_id;
            const { user_id: newUserId, role } = req.body;

            if (!newUserId) {
                throw new AppError('user_id is required', 400);
            }

            const participant = await ConversationService.addParticipant(
                id,
                userId,
                newUserId,
                role
            );

            res.status(201).json({
                success: true,
                data: participant
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Add participant error:', error);
                res.status(500).json({ error: 'Failed to add participant' });
            }
        }
    }

    /**
     * Remove participant from conversation
     * DELETE /api/conversations/:id/participants/:userId
     */
    static async removeParticipant(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id, userId: targetUserId } = req.params;
            const userId = req.user!.user_id;

            await ConversationService.removeParticipant(id, userId, targetUserId);

            res.status(200).json({
                success: true,
                message: 'Participant removed successfully'
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Remove participant error:', error);
                res.status(500).json({ error: 'Failed to remove participant' });
            }
        }
    }
}

export default ConversationController;
