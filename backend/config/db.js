const { Sequelize } = require('sequelize');
require('dotenv').config();

// MySQL configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'kwahala_holdings',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');
    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ force: true }); // This will drop and recreate tables
    console.log('Database synced');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
