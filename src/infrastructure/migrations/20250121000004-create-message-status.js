'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('message_status', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            message_id: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'ID of the message',
                references: {
                    model: 'messages',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'ID of the user this status is for'
            },
            status: {
                type: Sequelize.ENUM('sent', 'delivered', 'read'),
                allowNull: false,
                defaultValue: 'sent',
                comment: 'Delivery status of the message for this user'
            },
            timestamp: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
                comment: 'When this status was recorded'
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

        // Indexes for message_status
        await queryInterface.addIndex('message_status', ['message_id'], {
            name: 'idx_message_status_message_id'
        });
        await queryInterface.addIndex('message_status', ['user_id'], {
            name: 'idx_message_status_user_id'
        });
        await queryInterface.addIndex('message_status', ['message_id', 'user_id'], {
            unique: true,
            name: 'idx_message_status_message_user_unique'
        });
        await queryInterface.addIndex('message_status', ['status'], {
            name: 'idx_message_status_status'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('message_status');
    }
};
