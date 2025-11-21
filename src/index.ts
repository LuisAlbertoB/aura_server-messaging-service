import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sequelize, { testConnection } from './config/database';
import routes from './application/routes';
import { errorHandler, notFound } from './application/middleware/error.middleware';
import SocketServer from './websocket/socket.server';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3003;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const socketServer = new SocketServer(httpServer);

// Middleware
app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'messaging-service',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Sync models (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.log('⚙ Syncing database models...');
            await sequelize.sync({ alter: false });
            console.log('✓ Database models synced');
        }

        // Start server
        httpServer.listen(PORT, () => {
            console.log('═══════════════════════════════════════');
            console.log('  🚀 Messaging Service Started');
            console.log('═══════════════════════════════════════');
            console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`  HTTP Server: http://localhost:${PORT}`);
            console.log(`  WebSocket: ws://localhost:${PORT}`);
            console.log(`  Database: ${process.env.DB_NAME || 'messaging_db'}`);
            console.log('═══════════════════════════════════════');
            console.log('  REST API Endpoints:');
            console.log('    POST   /api/conversations');
            console.log('    GET    /api/conversations');
            console.log('    GET    /api/conversations/:id');
            console.log('    POST   /api/conversations/:id/messages');
            console.log('    GET    /api/conversations/:id/messages');
            console.log('  WebSocket Events:');
            console.log('    message:send, message:new');
            console.log('    typing:start, typing:stop');
            console.log('    presence:update');
            console.log('═══════════════════════════════════════');
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(async () => {
        await sequelize.close();
        console.log('✓ Server and database connections closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    httpServer.close(async () => {
        await sequelize.close();
        console.log('✓ Server and database connections closed');
        process.exit(0);
    });
});

// Start the server
startServer();

export { app, httpServer, socketServer };
