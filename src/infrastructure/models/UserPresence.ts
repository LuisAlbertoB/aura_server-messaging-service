import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface UserPresenceAttributes {
    id: string;
    user_id: string;
    status: 'online' | 'offline' | 'away';
    socket_id?: string;
    last_seen?: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface UserPresenceCreationAttributes extends Optional<UserPresenceAttributes, 'id' | 'socket_id' | 'last_seen' | 'created_at' | 'updated_at'> { }

class UserPresence extends Model<UserPresenceAttributes, UserPresenceCreationAttributes> implements UserPresenceAttributes {
    declare id: string;
    declare user_id: string;
    declare status: 'online' | 'offline' | 'away';
    declare socket_id?: string;
    declare last_seen?: Date;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

UserPresence.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        },
        status: {
            type: DataTypes.ENUM('online', 'offline', 'away'),
            allowNull: false,
            defaultValue: 'offline'
        },
        socket_id: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        last_seen: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'user_presence',
        underscored: true,
        timestamps: true
    }
);

export default UserPresence;
