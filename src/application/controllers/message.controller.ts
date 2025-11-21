import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { MessageService } from '../services/message.service';
import { AppError } from '../middleware/error.middleware';

export class MessageController {
    /**
     * Send a message via REST API
     * POST /api/conversations/:conversationId/messages
     */
    static async send(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = req.user!.user_id;
            const { content, message_type, media_reference, reply_to, metadata } = req.body;

            const message = await MessageService.sendMessage(
                conversationId,
                userId,
                content,
                message_type || 'text',
                media_reference,
                reply_to,
                metadata
            );

            res.status(201).json({
                success: true,
                data: message
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Send message error:', error);
                res.status(500).json({ error: 'Failed to send message' });
            }
        }
    }

    /**
     * Get message history
     * GET /api/conversations/:conversationId/messages
     */
    static async getHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = req.user!.user_id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const beforeMessageId = req.query.before as string;

            const result = await MessageService.getMessageHistory(
                conversationId,
                userId,
                page,
                limit,
                beforeMessageId
            );

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Get message history error:', error);
                res.status(500).json({ error: 'Failed to fetch messages' });
            }
        }
    }

    /**
     * Mark message as read
     * PUT /api/messages/:messageId/read
     */
    static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { messageId } = req.params;
            const userId = req.user!.user_id;

            const status = await MessageService.markAsRead(messageId, userId);

            res.status(200).json({
                success: true,
                data: status
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Mark as read error:', error);
                res.status(500).json({ error: 'Failed to mark message as read' });
            }
        }
    }

    /**
     * Mark all messages in conversation as read
     * PUT /api/conversations/:conversationId/read
     */
    static async markConversationAsRead(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = req.user!.user_id;

            const result = await MessageService.markConversationAsRead(conversationId, userId);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Mark conversation as read error:', error);
                res.status(500).json({ error: 'Failed to mark conversation as read' });
            }
        }
    }

    /**
     * Delete a message
     * DELETE /api/messages/:messageId
     */
    static async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { messageId } = req.params;
            const userId = req.user!.user_id;

            const message = await MessageService.deleteMessage(messageId, userId);

            res.status(200).json({
                success: true,
                data: message
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Delete message error:', error);
                res.status(500).json({ error: 'Failed to delete message' });
            }
        }
    }

    /**
     * Edit a message
     * PUT /api/messages/:messageId
     */
    static async edit(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { messageId } = req.params;
            const userId = req.user!.user_id;
            const { content } = req.body;

            if (!content) {
                throw new AppError('Content is required', 400);
            }

            const message = await MessageService.editMessage(messageId, userId, content);

            res.status(200).json({
                success: true,
                data: message
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error('Edit message error:', error);
                res.status(500).json({ error: 'Failed to edit message' });
            }
        }
    }

    /**
     * Get unread count for conversation
     * GET /api/conversations/:conversationId/unread
     */
    static async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = req.user!.user_id;

            const count = await MessageService.getUnreadCount(conversationId, userId);

            res.status(200).json({
                success: true,
                data: { count }
            });
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({ error: 'Failed to get unread count' });
        }
    }
}

export default MessageController;
