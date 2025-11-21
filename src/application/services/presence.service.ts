import { UserPresence } from '../../infrastructure/models';

export class PresenceService {
    /**
     * Update user presence status
     */
    static async updatePresence(
        userId: string,
        status: 'online' | 'offline' | 'away',
        socketId?: string
    ) {
        const [presence, created] = await UserPresence.findOrCreate({
            where: { user_id: userId },
            defaults: {
                user_id: userId,
                status,
                socket_id: socketId,
                last_seen: new Date()
            }
        });

        if (!created) {
            presence.status = status;
            presence.socket_id = socketId || null;
            presence.last_seen = new Date();
            await presence.save();
        }

        return presence;
    }

    /**
     * Set user online
     */
    static async setOnline(userId: string, socketId: string) {
        return await this.updatePresence(userId, 'online', socketId);
    }

    /**
     * Set user offline
     */
    static async setOffline(userId: string) {
        return await this.updatePresence(userId, 'offline');
    }

    /**
     * Set user away
     */
    static async setAway(userId: string) {
        const presence = await UserPresence.findOne({
            where: { user_id: userId }
        });

        if (presence && presence.status === 'online') {
            return await this.updatePresence(userId, 'away', presence.socket_id);
        }

        return presence;
    }

    /**
     * Get user presence
     */
    static async getPresence(userId: string) {
        const presence = await UserPresence.findOne({
            where: { user_id: userId }
        });

        if (!presence) {
            return {
                user_id: userId,
                status: 'offline',
                last_seen: null as any
            };
        }

        return presence;
    }

    /**
     * Get multiple users' presence
     */
    static async getBatchPresence(userIds: string[]) {
        const presences = await UserPresence.findAll({
            where: {
                user_id: userIds
            }
        });

        const presenceMap = new Map(presences.map(p => [p.user_id, p]));

        // Return presence for all requested users (offline if not found)
        return userIds.map(userId => {
            const presence = presenceMap.get(userId);
            if (presence) {
                return presence;
            }
            return {
                user_id: userId,
                status: 'offline' as const,
                last_seen: null as any
            };
        });
    }

    /**
     * Get user by socket ID
     */
    static async getUserBySocketId(socketId: string) {
        const presence = await UserPresence.findOne({
            where: { socket_id: socketId }
        });

        return presence?.user_id || null;
    }

    /**
     * Check if user is online
     */
    static async isOnline(userId: string): Promise<boolean> {
        const presence = await UserPresence.findOne({
            where: { user_id: userId }
        });

        return presence?.status === 'online';
    }

    /**
     * Get all online users (for admin purposes)
     */
    static async getOnlineUsers() {
        return await UserPresence.findAll({
            where: {
                status: 'online'
            }
        });
    }
}

export default PresenceService;
