import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface ConversationAttributes {
    id: string;
    type: 'individual' | 'group';
    name?: string;
    avatar_url?: string;
    created_by?: string;
    last_message_at?: Date;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'name' | 'avatar_url' | 'created_by' | 'last_message_at' | 'created_at' | 'updated_at'> { }

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
    declare id: string;
    declare type: 'individual' | 'group';
    declare name?: string;
    declare avatar_url?: string;
    declare created_by?: string;
    declare last_message_at?: Date;
    declare is_active: boolean;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

Conversation.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('individual', 'group'),
            allowNull: false,
            defaultValue: 'individual'
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        avatar_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: true
        },
        last_message_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        sequelize,
        tableName: 'conversations',
        underscored: true,
        timestamps: true
    }
);

export default Conversation;
