const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { sequelize, connectDB } = require('./config/db');
const models = require('./models');

// Make sequelize available globally for use in controllers
// This is a quick fix - in a larger app, consider dependency injection
const { sequelize: db } = sequelize;

// Connect to database and sync models
const syncDatabase = async () => {
  try {
    await connectDB();
    console.log('Database connected');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synced');
    
    // Create default admin user if not exists
    await createDefaultAdmin();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Create default admin user if not exists
const createDefaultAdmin = async () => {
  try {
    const { User } = models;
    const adminEmail = 'admin@kwahala.com';
    const adminPassword = 'admin123';
    
    const admin = await User.findOne({ where: { email: adminEmail } });
    
    if (!admin) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

const startServer = async () => {
  try {
    // Initialize database connection and sync models
    await syncDatabase();

    const app = express();

    // CORS configuration
    const corsOptions = {
      origin: 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      optionsSuccessStatus: 204
    };

    // Middleware
    app.use(express.json());
    app.use(cors(corsOptions));

    // Route files
    const authRoutes = require('./routes/authRoutes');
    const projectRoutes = require('./routes/projectRoutes');
    const expenseRoutes = require('./routes/expenseRoutes');
    const dashboardRoutes = require('./routes/dashboardRoutes');

    // Mount routers
    app.use('/api/auth', authRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/expenses', expenseRoutes);
    app.use('/api/dashboard', dashboardRoutes);

    // Set static folder
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../frontend/build')));
      
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
      });
    } else {
      app.get('/', (req, res) => {
        res.send('API is running...');
      });
    }

    // Error handling middleware
    app.use(notFound);
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
