const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  totalBudget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'on_hold', 'cancelled'),
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['createdAt', 'updatedAt'] }
  }
});

// Add associations
Project.associate = (models) => {
  Project.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  
  Project.hasMany(models.Expense, {
    foreignKey: 'projectId',
    as: 'expenses'
  });
};

module.exports = Project;
