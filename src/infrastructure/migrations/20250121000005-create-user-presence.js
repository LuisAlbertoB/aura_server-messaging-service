'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_presence', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
                comment: 'ID of the user'
            },
            status: {
                type: Sequelize.ENUM('online', 'offline', 'away'),
                allowNull: false,
                defaultValue: 'offline',
                comment: 'Current presence status of the user'
            },
            socket_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Current WebSocket connection ID'
            },
            last_seen: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Last time the user was seen online'
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

        // Indexes for user_presence
        await queryInterface.addIndex('user_presence', ['user_id'], {
            unique: true,
            name: 'idx_user_presence_user_id_unique'
        });
        await queryInterface.addIndex('user_presence', ['status'], {
            name: 'idx_user_presence_status'
        });
        await queryInterface.addIndex('user_presence', ['socket_id'], {
            name: 'idx_user_presence_socket_id'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('user_presence');
    }
};
