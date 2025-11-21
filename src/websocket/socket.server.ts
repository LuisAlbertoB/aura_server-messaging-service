import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PresenceService } from '../application/services/presence.service';
import { messageHandler } from './handlers/message.handler';
import { typingHandler } from './handlers/typing.handler';
import { presenceHandler } from './handlers/presence.handler';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

export interface AuthSocket extends Socket {
    user?: {
        user_id: string;
        username: string;
        email: string;
    };
}

export class SocketServer {
    private io: SocketIOServer;

    constructor(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: ALLOWED_ORIGINS,
                credentials: true
            },
            pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000'),
            pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '60000')
        });

        this.setupMiddleware();
        this.setupHandlers();
    }

    private setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket: AuthSocket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const decoded = jwt.verify(token, JWT_SECRET) as any;
                socket.user = {
                    user_id: decoded.user_id || decoded.id,
                    username: decoded.username,
                    email: decoded.email
                };

                next();
            } catch (error) {
                next(new Error('Invalid token'));
            }
        });
    }

    private setupHandlers() {
        this.io.on('connection', async (socket: AuthSocket) => {
            const userId = socket.user!.user_id;
            console.log(`✓ User connected: ${userId} (${socket.id})`);

            // Update user presence to online
            await PresenceService.setOnline(userId, socket.id);

            // Join user to their own room for direct messaging
            socket.join(`user:${userId}`);

            // Notify contacts about online status
            await presenceHandler.handleUserOnline(this.io, socket);

            // Handle message events
            socket.on('message:send', (data) => messageHandler.handleSendMessage(this.io, socket, data));
            socket.on('message:delivered', (data) => messageHandler.handleMessageDelivered(this.io, socket, data));
            socket.on('message:read', (data) => messageHandler.handleMessageRead(this.io, socket, data));

            // Handle typing indicators
            socket.on('typing:start', (data) => typingHandler.handleTypingStart(this.io, socket, data));
            socket.on('typing:stop', (data) => typingHandler.handleTypingStop(this.io, socket, data));

            // Handle presence changes
            socket.on('presence:away', () => presenceHandler.handleUserAway(this.io, socket));

            // Handle disconnection
            socket.on('disconnect', async () => {
                console.log(`✗ User disconnected: ${userId} (${socket.id})`);
                await presenceHandler.handleUserOffline(this.io, socket);
            });

            // Error handling
            socket.on('error', (error) => {
                console.error(`Socket error for user ${userId}:`, error);
            });
        });
    }

    getIO(): SocketIOServer {
        return this.io;
    }

    /**
     * Emit event to specific user
     */
    emitToUser(userId: string, event: string, data: any) {
        this.io.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Emit event to multiple users
     */
    emitToUsers(userIds: string[], event: string, data: any) {
        userIds.forEach(userId => {
            this.io.to(`user:${userId}`).emit(event, data);
        });
    }

    /**
     * Emit event to conversation participants
     */
    emitToConversation(conversationId: string, event: string, data: any) {
        this.io.to(`conversation:${conversationId}`).emit(event, data);
    }
}

export default SocketServer;
