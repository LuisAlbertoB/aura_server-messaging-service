'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('conversations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            type: {
                type: Sequelize.ENUM('individual', 'group'),
                allowNull: false,
                defaultValue: 'individual',
                comment: 'Type of conversation: individual (1-on-1) or group'
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Name of the conversation (mainly for groups)'
            },
            avatar_url: {
                type: Sequelize.STRING(500),
                allowNull: true,
                comment: 'Group conversation avatar URL'
            },
            created_by: {
                type: Sequelize.UUID,
                allowNull: true,
                comment: 'User ID who created the conversation'
            },
            last_message_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp of the last message in this conversation'
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Whether the conversation is active'
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

        // Indexes for conversations
        await queryInterface.addIndex('conversations', ['type'], {
            name: 'idx_conversations_type'
        });
        await queryInterface.addIndex('conversations', ['is_active'], {
            name: 'idx_conversations_is_active'
        });
        await queryInterface.addIndex('conversations', ['created_by'], {
            name: 'idx_conversations_created_by'
        });
        await queryInterface.addIndex('conversations', ['last_message_at'], {
            name: 'idx_conversations_last_message_at'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('conversations');
    }
};
