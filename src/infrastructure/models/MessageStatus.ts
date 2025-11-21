import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface MessageStatusAttributes {
    id: string;
    message_id: string;
    user_id: string;
    status: 'sent' | 'delivered' | 'read';
    timestamp: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface MessageStatusCreationAttributes extends Optional<MessageStatusAttributes, 'id' | 'created_at' | 'updated_at'> { }

class MessageStatus extends Model<MessageStatusAttributes, MessageStatusCreationAttributes> implements MessageStatusAttributes {
    declare id: string;
    declare message_id: string;
    declare user_id: string;
    declare status: 'sent' | 'delivered' | 'read';
    declare timestamp: Date;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

MessageStatus.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        message_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'messages',
                key: 'id'
            }
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('sent', 'delivered', 'read'),
            allowNull: false,
            defaultValue: 'sent'
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'message_status',
        underscored: true,
        timestamps: true
    }
);

export default MessageStatus;
