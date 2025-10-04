# 🎱 Billiard Hall POS System

A comprehensive Point of Sale system designed specifically for billiard halls, featuring table management, order tracking, real-time timers, and detailed reporting.

## ✨ Features

### 🎯 Core Functionality
- **Table Management**: Start/stop timers for billiard tables with open time or 1-hour modes
- **Real-time Timers**: Live countdown timers with automatic cost calculation
- **Order Management**: Add drinks and food items to table orders
- **Checkout System**: Complete transactions with time fees and product costs
- **Display Screen**: Separate screen showing live table status for customers

### 📊 Reports & Analytics
- **Daily Reports**: Revenue breakdown by time and products
- **Weekly Reports**: 7-day trends with charts
- **Monthly Reports**: Comprehensive monthly analytics
- **Export Functionality**: CSV export for all reports
- **Interactive Charts**: Visual representation of sales data

### 🎨 Modern UI
- **Custom Color Palette**: Sophisticated earth-tone design
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live synchronization across screens
- **Intuitive Interface**: Easy-to-use for staff and management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account (free tier available)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GameHub
   ```

2. **Set up Supabase Database**
   
   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Go to Settings → Database and copy your connection string
   
   c. Go to Settings → API and copy your Project URL and anon key

3. **Install all dependencies and set up the database**
   ```bash
   npm run setup
   ```

4. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```
   # Backend Environment Variables
   PORT=3001
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   HOURLY_RATE=15
   
   # Frontend Environment Variables (for Vite)
   VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   ```

5. **Start the full application (both frontend and backend)**
   ```bash
   npm run dev:full
   ```

   Or start them separately:
   ```bash
   # Terminal 1 - Backend server
   npm run server:dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

6. **Access the application**
   - POS System: http://localhost:5173
   - Display Screen: http://localhost:5173/display
   - Reports: http://localhost:5173/reports

## 🗄️ Database Schema

The system uses Supabase (PostgreSQL) with the following tables:

- **tables**: Billiard table information and status
- **products**: Available drinks and food items
- **time_sessions**: Table usage sessions with timing data
- **orders**: Individual product orders per table
- **transactions**: Completed checkouts with totals

### 🚀 Supabase Benefits
- **Hosted PostgreSQL**: No local database setup required
- **Real-time Subscriptions**: Live updates across all connected clients
- **Built-in API**: Automatic REST and GraphQL APIs
- **Dashboard**: Easy database management and monitoring
- **Free Tier**: Generous free tier for development and small projects
- **Scalability**: Easy to scale as your business grows

## 🎮 Usage Guide

### Starting a Table Session
1. Click on any available table card
2. Choose "Start Open" for unlimited time or "1 Hour" for fixed duration
3. The timer will start counting and calculating costs

### Adding Orders
1. Select an active table
2. Browse the product list (drinks/food)
3. Click the "+" button to add items
4. Adjust quantities in the order summary

### Checkout Process
1. Review the order summary showing time fees and product costs
2. Click "Checkout" to complete the transaction
3. The table will be reset and available for new customers

### Viewing Reports
1. Navigate to the Reports section
2. Choose Daily, Weekly, or Monthly view
3. Use date selectors to view specific periods
4. Export data as CSV for external analysis

## 🎨 Color Palette

The system uses a sophisticated earth-tone color scheme:
- **Primary Dark**: `#2C3035` - Headers and primary text
- **Secondary Dark**: `#414A52` - Secondary elements and borders
- **Accent**: `#9B9182` - Highlights and active states
- **Background**: `#E8E0D2` - Main background and cards

## 🔧 Configuration

### Hourly Rate
Set the hourly rate for table usage in the backend `.env` file:
```
HOURLY_RATE=15
```

### Default Products
The system comes with pre-configured products:
- **Drinks**: Coca Cola, Pepsi, Sprite, Beer, Water
- **Food**: Chips, Noodles, Sandwich, Pizza Slice, Hot Dog

### Table Count
Default setup includes 8 tables (Table 1-8). Modify the migration script to change this.

## 📱 Display Screen

The display screen is designed for customer-facing monitors:
- Shows only active tables with live timers
- Large, easy-to-read format
- Real-time updates every 5 seconds
- Accessible at `/display` route

## 🛠️ Development

### Project Structure
```
GameHub/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Main application pages
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript type definitions
├── routes/                 # Express.js API route handlers
├── db/                     # Database connection
├── scripts/                # Database migration scripts
├── server.js               # Main Express server
├── env.example             # Environment variables template
└── public/                 # Static assets
```

### API Endpoints

#### Tables
- `GET /api/tables` - Get all tables
- `POST /api/tables/:id/start` - Start table session
- `POST /api/tables/:id/stop` - Stop table session
- `POST /api/tables/:id/reset` - Reset table

#### Orders
- `GET /api/orders/table/:tableId` - Get table orders
- `POST /api/orders` - Add order item
- `PUT /api/orders/:id` - Update order quantity
- `DELETE /api/orders/:id` - Remove order item

#### Transactions
- `POST /api/transactions` - Create transaction (checkout)
- `GET /api/transactions` - Get all transactions

#### Reports
- `GET /api/reports/daily/:date` - Daily report
- `GET /api/reports/weekly/:startDate` - Weekly report
- `GET /api/reports/monthly/:year/:month` - Monthly report

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Environment Variables for Production
Ensure all environment variables are properly set in production:
- `DATABASE_URL`: Your Supabase connection string
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `PORT`: Server port (default: 3001)
- `HOURLY_RATE`: Hourly rate for table usage

### Supabase Setup Tips
1. **Enable Row Level Security (RLS)**: For production, enable RLS on your tables
2. **Set up Policies**: Create appropriate policies for your application
3. **Monitor Usage**: Use Supabase dashboard to monitor database usage
4. **Backup**: Supabase provides automatic backups
5. **Scaling**: Upgrade your plan as your business grows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Examine the database schema
- Test with the provided sample data

---

**Built with ❤️ for billiard hall owners and staff**