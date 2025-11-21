import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from './middleware/auth.middleware.js';
import { validate } from './middleware/validation.middleware.js';
import ConversationController from './controllers/conversation.controller.js';
import MessageController from './controllers/message.controller.js';
import PresenceController from './controllers/presence.controller.js';

const router = Router();

// ========== Conversation Routes ==========
router.post(
    '/conversations',
    authenticateToken,
    validate([
        body('type').isIn(['individual', 'group']).withMessage('Type must be individual or group'),
        body('participantIds').isArray({ min: 1 }).withMessage('participantIds must be a non-empty array'),
        body('name').optional().isString().withMessage('Name must be a string')
    ]),
    ConversationController.create
);

router.get(
    '/conversations',
    authenticateToken,
    ConversationController.list
);

router.get(
    '/conversations/:id',
    authenticateToken,
    ConversationController.getById
);

router.put(
    '/conversations/:id',
    authenticateToken,
    validate([
        body('name').optional().isString(),
        body('avatar_url').optional().isString()
    ]),
    ConversationController.update
);

router.post(
    '/conversations/:id/participants',
    authenticateToken,
    validate([
        body('user_id').isUUID().withMessage('user_id must be a valid UUID'),
        body('role').optional().isIn(['admin', 'member'])
    ]),
    ConversationController.addParticipant
);

router.delete(
    '/conversations/:id/participants/:userId',
    authenticateToken,
    ConversationController.removeParticipant
);

// ========== Message Routes ==========
router.post(
    '/conversations/:conversationId/messages',
    authenticateToken,
    validate([
        body('content').optional().isString(),
        body('message_type').optional().isIn(['text', 'image', 'video', 'audio', 'file', 'system']),
        body('reply_to').optional().isUUID()
    ]),
    MessageController.send
);

router.get(
    '/conversations/:conversationId/messages',
    authenticateToken,
    MessageController.getHistory
);

router.put(
    '/conversations/:conversationId/read',
    authenticateToken,
    MessageController.markConversationAsRead
);

router.get(
    '/conversations/:conversationId/unread',
    authenticateToken,
    MessageController.getUnreadCount
);

router.put(
    '/messages/:messageId/read',
    authenticateToken,
    MessageController.markAsRead
);

router.put(
    '/messages/:messageId',
    authenticateToken,
    validate([
        body('content').isString().notEmpty()
    ]),
    MessageController.edit
);

router.delete(
    '/messages/:messageId',
    authenticateToken,
    MessageController.delete
);

// ========== Presence Routes ==========
router.get(
    '/presence/:userId',
    authenticateToken,
    PresenceController.getPresence
);

router.post(
    '/presence/batch',
    authenticateToken,
    validate([
        body('userIds').isArray()
    ]),
    PresenceController.getBatchPresence
);

export default router;
