# Kwawala Holdings Management System

A comprehensive management system for Kwawala Holdings, designed to handle projects, expenses, and user management with an intuitive interface.

## Why Choose Our System Over Manual Excel Tracking?

Our system offers significant advantages over traditional Excel-based tracking:

### Real-time Data Access & Collaboration
- **Instant Updates**: All changes are immediately visible to authorized users, eliminating the need to wait for file sharing or email updates
- **Single Source of Truth**: No more version conflicts or confusion from multiple Excel files circulating with different data
- **Simultaneous Access**: Multiple team members can work on different aspects simultaneously without file locking issues

### Enhanced Data Integrity & Security
- **Role-based Access Control**: Restrict sensitive data access based on user roles and permissions
- **Audit Trails**: Track all changes with timestamps and user identification
- **Data Validation**: Built-in validation prevents data entry errors common in spreadsheets

### Advanced Reporting & Analytics
- **Real-time Dashboards**: Get instant visual insights instead of manual chart creation
- **Custom Reports**: Generate dynamic reports without complex Excel formulas
- **Historical Data Analysis**: Easily track trends and patterns over time

### Operational Efficiency
- **Automated Workflows**: Reduce manual data entry and processing time
- **Mobile Access**: Access the system from anywhere, on any device
- **Integration Ready**: Connect with other business systems (accounting, CRM, etc.) without manual data transfers

### Cost & Time Savings
- **Reduced Administrative Work**: Eliminate time spent on consolidating multiple Excel files
- **Lower Error Rates**: Minimize costly mistakes from manual data handling
- **Scalability**: Handle growing data volumes without performance issues

## Features

### Project Management
- Create and manage multiple projects
- Track project status and progress
- Assign team members to projects
- Monitor project budgets and expenses

### Expense Tracking
- Record and categorize expenses
- Track expenses by project
- Generate expense reports
- Set budget limits and monitor spending

### User Management
- Role-based access control (Admin, Manager, User)
- User authentication and authorization
- Profile management
- Activity logging

### Dashboard
- Overview of key metrics
- Visual representation of data
- Quick access to important functions

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB database

### Installation

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Update the environment variables as needed
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## Default Admin Credentials

For first-time setup, use the following credentials to log in as an administrator:

- **Email**: admin@kwawalaholdings.com
- **Password**: Admin@123

**Important**: Change the default password immediately after your first login.

## Environment Variables

### Backend (`.env`)
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## API Documentation

API documentation is available at `/api-docs` when running the development server.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact the development team at support@kwawalaholdings.com
