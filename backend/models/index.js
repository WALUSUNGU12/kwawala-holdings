const { sequelize } = require('../config/db');
const User = require('./User');
const Project = require('./Project');
const Expense = require('./Expense');

// Define associations
User.hasMany(Project, {
  foreignKey: 'createdBy',
  as: 'projects'
});

Project.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

Project.hasMany(Expense, {
  foreignKey: 'projectId',
  as: 'expenses'
});

Expense.belongsTo(Project, {
  foreignKey: 'projectId',
  onDelete: 'CASCADE'
});

User.hasMany(Expense, {
  foreignKey: 'addedBy',
  as: 'expenses'
});

Expense.belongsTo(User, {
  foreignKey: 'addedBy',
  as: 'addedByUser'
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Project,
  Expense
};
