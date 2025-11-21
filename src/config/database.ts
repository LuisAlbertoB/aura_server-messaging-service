import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
    database: process.env.DB_NAME || 'messaging_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: process.env.NODE_ENV === 'production' ? 20 : 10,
        min: process.env.NODE_ENV === 'production' ? 5 : 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: process.env.NODE_ENV === 'production' && process.env.DB_SSL === 'true' ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {}
});

export const testConnection = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connection established successfully');
    } catch (error) {
        console.error('✗ Unable to connect to the database:', error);
        throw error;
    }
};

export default sequelize;
