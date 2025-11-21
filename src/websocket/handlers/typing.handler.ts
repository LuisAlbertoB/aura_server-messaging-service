import { Server as SocketIOServer } from 'socket.io';
import { AuthSocket } from '../socket.server';
import { ConversationParticipant } from '../../infrastructure/models';

const typingUsers = new Map<string, Set<string>>(); // conversationId -> Set of userIds

export class TypingHandler {
    /**
     * Handle user started typing
     */
    async handleTypingStart(io: SocketIOServer, socket: AuthSocket, data: any) {
        try {
            const userId = socket.user!.user_id;
            const { conversationId } = data;

            if (!conversationId) {
                return;
            }

            // Verify user is participant
            const participant = await ConversationParticipant.findOne({
                where: {
                    conversation_id: conversationId,
                    user_id: userId,
                    left_at: null
                }
            });

            if (!participant) {
                return;
            }

            // Add user to typing set
            if (!typingUsers.has(conversationId)) {
                typingUsers.set(conversationId, new Set());
            }
            typingUsers.get(conversationId)!.add(userId);

            // Get all participants except the sender
            const participants = await ConversationParticipant.findAll({
                where: {
                    conversation_id: conversationId,
                    left_at: null
                }
            });

            // Notify other participants
            participants.forEach(p => {
                if (p.user_id !== userId) {
                    io.to(`user:${p.user_id}`).emit('typing:status', {
                        conversationId,
                        userId,
                        username: socket.user!.username,
                        isTyping: true
                    });
                }
            });
        } catch (error) {
            console.error('Typing start error:', error);
        }
    }

    /**
     * Handle user stopped typing
     */
    async handleTypingStop(io: SocketIOServer, socket: AuthSocket, data: any) {
        try {
            const userId = socket.user!.user_id;
            const { conversationId } = data;

            if (!conversationId) {
                return;
            }

            // Remove user from typing set
            const typingSet = typingUsers.get(conversationId);
            if (typingSet) {
                typingSet.delete(userId);
                if (typingSet.size === 0) {
                    typingUsers.delete(conversationId);
                }
            }

            // Get all participants except the sender
            const participants = await ConversationParticipant.findAll({
                where: {
                    conversation_id: conversationId,
                    left_at: null
                }
            });

            // Notify other participants
            participants.forEach(p => {
                if (p.user_id !== userId) {
                    io.to(`user:${p.user_id}`).emit('typing:status', {
                        conversationId,
                        userId,
                        username: socket.user!.username,
                        isTyping: false
                    });
                }
            });
        } catch (error) {
            console.error('Typing stop error:', error);
        }
    }

    /**
     * Clean up typing indicators when user disconnects
     */
    cleanupUserTyping(userId: string, io: SocketIOServer) {
        typingUsers.forEach((userSet, conversationId) => {
            if (userSet.has(userId)) {
                userSet.delete(userId);
                if (userSet.size === 0) {
                    typingUsers.delete(conversationId);
                }

                // Notify participants that user stopped typing
                io.to(`conversation:${conversationId}`).emit('typing:status', {
                    conversationId,
                    userId,
                    isTyping: false
                });
            }
        });
    }
}

export const typingHandler = new TypingHandler();
export default typingHandler;
