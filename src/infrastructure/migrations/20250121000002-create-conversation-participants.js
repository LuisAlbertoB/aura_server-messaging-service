'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('conversation_participants', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            conversation_id: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'ID of the conversation',
                references: {
                    model: 'conversations',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'ID of the user participating in the conversation'
            },
            role: {
                type: Sequelize.ENUM('admin', 'member'),
                allowNull: false,
                defaultValue: 'member',
                comment: 'Role of the user in the conversation'
            },
            nickname: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Custom nickname in this conversation'
            },
            muted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Whether notifications are muted for this conversation'
            },
            last_read_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Last time the user read messages in this conversation'
            },
            joined_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
                comment: 'When the user joined the conversation'
            },
            left_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'When the user left the conversation (null if still active)'
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

        // Indexes for conversation_participants
        await queryInterface.addIndex('conversation_participants', ['conversation_id'], {
            name: 'idx_participants_conversation_id'
        });
        await queryInterface.addIndex('conversation_participants', ['user_id'], {
            name: 'idx_participants_user_id'
        });
        await queryInterface.addIndex('conversation_participants', ['conversation_id', 'user_id'], {
            unique: true,
            name: 'idx_participants_conversation_user_unique'
        });
        await queryInterface.addIndex('conversation_participants', ['role'], {
            name: 'idx_participants_role'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('conversation_participants');
    }
};
