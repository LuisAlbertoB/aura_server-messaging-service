import { Server as SocketIOServer } from 'socket.io';
import { AuthSocket } from '../socket.server';
import { MessageService } from '../../application/services/message.service';
import { ConversationParticipant } from '../../infrastructure/models';

export class MessageHandler {
    /**
     * Handle real-time message sending via WebSocket
     */
    async handleSendMessage(io: SocketIOServer, socket: AuthSocket, data: any) {
        try {
            const userId = socket.user!.user_id;
            const { conversationId, content, messageType, mediaReference, replyTo, metadata } = data;

            if (!conversationId) {
                socket.emit('error', { message: 'conversationId is required' });
                return;
            }

            // Send message
            const message = await MessageService.sendMessage(
                conversationId,
                userId,
                content,
                messageType || 'text',
                mediaReference,
                replyTo,
                metadata
            );

            // Get all participants
            const participants = await ConversationParticipant.findAll({
                where: {
                    conversation_id: conversationId,
                    left_at: null
                }
            });

            // Emit message to all participants
            participants.forEach(participant => {
                io.to(`user:${participant.user_id}`).emit('message:new', {
                    message,
                    conversationId
                });
            });

            // Send confirmation to sender
            socket.emit('message:sent', {
                tempId: data.tempId, // Client-side temporary ID for optimistic updates
                message
            });
        } catch (error: any) {
            console.error('Send message error:', error);
            socket.emit('error', {
                message: error.message || 'Failed to send message',
                tempId: data.tempId
            });
        }
    }

    /**
     * Handle message delivered acknowledgment
     */
    async handleMessageDelivered(io: SocketIOServer, socket: AuthSocket, data: any) {
        try {
            const userId = socket.user!.user_id;
            const { messageId } = data;

            if (!messageId) {
                return;
            }

            const status = await MessageService.markAsDelivered(messageId, userId);

            if (status) {
                // Get message to find sender
                const { Message } = await import('../../infrastructure/models');
                const message = await Message.findByPk(messageId);

                if (message) {
                    // Notify sender about delivery
                    io.to(`user:${message.sender_id}`).emit('message:status', {
                        messageId,
                        userId,
                        status: 'delivered',
                        timestamp: status.timestamp
                    });
                }
            }
        } catch (error) {
            console.error('Mark as delivered error:', error);
        }
    }

    /**
     * Handle message read acknowledgment
     */
    async handleMessageRead(io: SocketIOServer, socket: AuthSocket, data: any) {
        try {
            const userId = socket.user!.user_id;
            const { messageId, conversationId } = data;

            if (conversationId) {
                // Mark entire conversation as read
                await MessageService.markConversationAsRead(conversationId, userId);

                // Get all messages in conversation to notify sender
                const { Message } = await import('../../infrastructure/models');
                const { Op } = await import('sequelize');
                const messages = await Message.findAll({
                    where: {
                        conversation_id: conversationId,
                        sender_id: { [Op.ne]: userId }
                    }
                });

                // Notify all senders
                const senderIds = new Set(messages.map(m => m.sender_id));
                senderIds.forEach(senderId => {
                    io.to(`user:${senderId}`).emit('message:status', {
                        conversationId,
                        userId,
                        status: 'read',
                        timestamp: new Date()
                    });
                });
            } else if (messageId) {
                // Mark single message as read
                const status = await MessageService.markAsRead(messageId, userId);

                if (status) {
                    // Get message to find sender
                    const { Message } = await import('../../infrastructure/models');
                    const message = await Message.findByPk(messageId);

                    if (message) {
                        // Notify sender about read status
                        io.to(`user:${message.sender_id}`).emit('message:status', {
                            messageId,
                            userId,
                            status: 'read',
                            timestamp: status.timestamp
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    }
}

export const messageHandler = new MessageHandler();
export default messageHandler;
