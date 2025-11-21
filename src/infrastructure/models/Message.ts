import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface MessageAttributes {
    id: string;
    conversation_id: string;
    sender_id: string;
    content?: string;
    message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
    media_reference?: any;
    reply_to?: string;
    metadata?: any;
    is_edited: boolean;
    is_deleted: boolean;
    edited_at?: Date;
    sent_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'content' | 'media_reference' | 'reply_to' | 'metadata' | 'edited_at' | 'created_at' | 'updated_at'> { }

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    declare id: string;
    declare conversation_id: string;
    declare sender_id: string;
    declare content?: string;
    declare message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
    declare media_reference?: any;
    declare reply_to?: string;
    declare metadata?: any;
    declare is_edited: boolean;
    declare is_deleted: boolean;
    declare edited_at?: Date;
    declare sent_at: Date;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

Message.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        conversation_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'conversations',
                key: 'id'
            }
        },
        sender_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        message_type: {
            type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'file', 'system'),
            allowNull: false,
            defaultValue: 'text'
        },
        media_reference: {
            type: DataTypes.JSON,
            allowNull: true
        },
        reply_to: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'messages',
                key: 'id'
            }
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true
        },
        is_edited: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        edited_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        sent_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'messages',
        underscored: true,
        timestamps: true
    }
);

export default Message;
