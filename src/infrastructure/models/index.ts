import Conversation from './Conversation';
import ConversationParticipant from './ConversationParticipant';
import Message from './Message';
import MessageStatus from './MessageStatus';
import UserPresence from './UserPresence';

// Define associations
Conversation.hasMany(ConversationParticipant, {
    foreignKey: 'conversation_id',
    as: 'participants'
});

ConversationParticipant.belongsTo(Conversation, {
    foreignKey: 'conversation_id',
    as: 'conversation'
});

Conversation.hasMany(Message, {
    foreignKey: 'conversation_id',
    as: 'messages'
});

Message.belongsTo(Conversation, {
    foreignKey: 'conversation_id',
    as: 'conversation'
});

Message.hasMany(MessageStatus, {
    foreignKey: 'message_id',
    as: 'statuses'
});

MessageStatus.belongsTo(Message, {
    foreignKey: 'message_id',
    as: 'message'
});

// Self-referential association for message replies
Message.hasMany(Message, {
    foreignKey: 'reply_to',
    as: 'replies'
});

Message.belongsTo(Message, {
    foreignKey: 'reply_to',
    as: 'repliedMessage'
});

export {
    Conversation,
    ConversationParticipant,
    Message,
    MessageStatus,
    UserPresence
};

export default {
    Conversation,
    ConversationParticipant,
    Message,
    MessageStatus,
    UserPresence
};
