import { Server as SocketIOServer } from 'socket.io';
import { AuthSocket } from '../socket.server';
import { PresenceService } from '../../application/services/presence.service';
import { ConversationParticipant } from '../../infrastructure/models';
import { typingHandler } from './typing.handler';

export class PresenceHandler {
    /**
     * Handle user coming online
     */
    async handleUserOnline(io: SocketIOServer, socket: AuthSocket) {
        try {
            const userId = socket.user!.user_id;

            // Get all conversations the user is part of
            const participations = await ConversationParticipant.findAll({
                where: {
                    user_id: userId,
                    left_at: null
                }
            });

            const conversationIds = participations.map(p => p.conversation_id);

            // Get all participants from those conversations
            const allParticipants = await ConversationParticipant.findAll({
                where: {
                    conversation_id: conversationIds,
                    left_at: null
                }
            });

            // Get unique user IDs (contacts)
            const contactIds = new Set(
                allParticipants
                    .map(p => p.user_id)
                    .filter(id => id !== userId)
            );

            // Notify all contacts about online status
            contactIds.forEach(contactId => {
                io.to(`user:${contactId}`).emit('presence:update', {
                    userId,
                    username: socket.user!.username,
                    status: 'online',
                    timestamp: new Date()
                });
            });
        } catch (error) {
            console.error('Handle user online error:', error);
        }
    }

    /**
     * Handle user going offline
     */
    async handleUserOffline(io: SocketIOServer, socket: AuthSocket) {
        try {
            const userId = socket.user!.user_id;

            // Update presence to offline
            await PresenceService.setOffline(userId);

            // Clean up typing indicators
            typingHandler.cleanupUserTyping(userId, io);

            // Get all conversations the user is part of
            const participations = await ConversationParticipant.findAll({
                where: {
                    user_id: userId,
                    left_at: null
                }
            });

            const conversationIds = participations.map(p => p.conversation_id);

            // Get all participants from those conversations
            const allParticipants = await ConversationParticipant.findAll({
                where: {
                    conversation_id: conversationIds,
                    left_at: null
                }
            });

            // Get unique user IDs (contacts)
            const contactIds = new Set(
                allParticipants
                    .map(p => p.user_id)
                    .filter(id => id !== userId)
            );

            // Notify all contacts about offline status
            const presence = await PresenceService.getPresence(userId);
            contactIds.forEach(contactId => {
                io.to(`user:${contactId}`).emit('presence:update', {
                    userId,
                    username: socket.user!.username,
                    status: 'offline',
                    last_seen: presence.last_seen,
                    timestamp: new Date()
                });
            });
        } catch (error) {
            console.error('Handle user offline error:', error);
        }
    }

    /**
     * Handle user going away
     */
    async handleUserAway(io: SocketIOServer, socket: AuthSocket) {
        try {
            const userId = socket.user!.user_id;

            await PresenceService.setAway(userId);

            // Get all conversations the user is part of
            const participations = await ConversationParticipant.findAll({
                where: {
                    user_id: userId,
                    left_at: null
                }
            });

            const conversationIds = participations.map(p => p.conversation_id);

            // Get all participants from those conversations
            const allParticipants = await ConversationParticipant.findAll({
                where: {
                    conversation_id: conversationIds,
                    left_at: null
                }
            });

            // Get unique user IDs (contacts)
            const contactIds = new Set(
                allParticipants
                    .map(p => p.user_id)
                    .filter(id => id !== userId)
            );

            // Notify all contacts about away status
            contactIds.forEach(contactId => {
                io.to(`user:${contactId}`).emit('presence:update', {
                    userId,
                    username: socket.user!.username,
                    status: 'away',
                    timestamp: new Date()
                });
            });
        } catch (error) {
            console.error('Handle user away error:', error);
        }
    }
}

export const presenceHandler = new PresenceHandler();
export default presenceHandler;
