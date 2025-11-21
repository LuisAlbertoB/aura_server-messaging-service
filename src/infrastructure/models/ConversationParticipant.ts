import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface ConversationParticipantAttributes {
    id: string;
    conversation_id: string;
    user_id: string;
    role: 'admin' | 'member';
    nickname?: string;
    muted: boolean;
    last_read_at?: Date;
    joined_at: Date;
    left_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface ConversationParticipantCreationAttributes extends Optional<ConversationParticipantAttributes, 'id' | 'nickname' | 'muted' | 'joined_at' | 'last_read_at' | 'left_at' | 'created_at' | 'updated_at'> { }

class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes> implements ConversationParticipantAttributes {
    declare id: string;
    declare conversation_id: string;
    declare user_id: string;
    declare role: 'admin' | 'member';
    declare nickname?: string;
    declare muted: boolean;
    declare last_read_at?: Date;
    declare joined_at: Date;
    declare left_at?: Date;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

ConversationParticipant.init(
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
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'member'),
            allowNull: false,
            defaultValue: 'member'
        },
        nickname: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        muted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        last_read_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        joined_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        left_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'conversation_participants',
        underscored: true,
        timestamps: true
    }
);

export default ConversationParticipant;
