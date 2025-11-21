import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PresenceService } from '../services/presence.service';

export class PresenceController {
    /**
     * Get user presence
     * GET /api/presence/:userId
     */
    static async getPresence(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            const presence = await PresenceService.getPresence(userId);

            res.status(200).json({
                success: true,
                data: presence
            });
        } catch (error) {
            console.error('Get presence error:', error);
            res.status(500).json({ error: 'Failed to get presence' });
        }
    }

    /**
     * Get batch presence for multiple users
     * POST /api/presence/batch
     */
    static async getBatchPresence(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userIds } = req.body;

            if (!Array.isArray(userIds)) {
                res.status(400).json({ error: 'userIds must be an array' });
                return;
            }

            const presences = await PresenceService.getBatchPresence(userIds);

            res.status(200).json({
                success: true,
                data: presences
            });
        } catch (error) {
            console.error('Get batch presence error:', error);
            res.status(500).json({ error: 'Failed to get batch presence' });
        }
    }
}

export default PresenceController;
