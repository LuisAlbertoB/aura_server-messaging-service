'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('messages', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            conversation_id: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'ID of the conversation this message belongs to',
                references: {
                    model: 'conversations',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            sender_id: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'ID of the user who sent the message'
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Text content of the message'
            },
            message_type: {
                type: Sequelize.ENUM('text', 'image', 'video', 'audio', 'file', 'system'),
                allowNull: false,
                defaultValue: 'text',
                comment: 'Type of message content'
            },
            media_reference: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Reference to media files (from Social service media table or URLs)'
            },
            reply_to: {
                type: Sequelize.UUID,
                allowNull: true,
                comment: 'ID of the message this is replying to',
                references: {
                    model: 'messages',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Additional metadata (mentions, links, etc.)'
            },
            is_edited: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Whether the message has been edited'
            },
            is_deleted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Whether the message has been deleted'
            },
            edited_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'When the message was last edited'
            },
            sent_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
                comment: 'When the message was sent'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Indexes for messages
        await queryInterface.addIndex('messages', ['conversation_id'], {
            name: 'idx_messages_conversation_id'
        });
        await queryInterface.addIndex('messages', ['sender_id'], {
            name: 'idx_messages_sender_id'
        });
        await queryInterface.addIndex('messages', ['message_type'], {
            name: 'idx_messages_message_type'
        });
        await queryInterface.addIndex('messages', ['sent_at'], {
            name: 'idx_messages_sent_at'
        });
        await queryInterface.addIndex('messages', ['conversation_id', 'sent_at'], {
            name: 'idx_messages_conversation_sent_at'
        });
        await queryInterface.addIndex('messages', ['is_deleted'], {
            name: 'idx_messages_is_deleted'
        });
        await queryInterface.addIndex('messages', ['reply_to'], {
            name: 'idx_messages_reply_to'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('messages');
    }
};
