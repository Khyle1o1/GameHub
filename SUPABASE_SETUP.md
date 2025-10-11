# 🚀 Supabase Setup Guide

This guide will help you set up Supabase for the Billiard Hall POS System.

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your project cloned and dependencies installed

## 🎯 Step-by-Step Setup

### 1. Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `billiard-hall-pos` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project"

### 2. Get Your Connection Details

Once your project is created, you'll need to collect these details:

#### Database Connection String
1. Go to **Settings** → **Database**
2. Scroll down to "Connection string"
3. Select "URI" tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

#### API Keys
1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **anon public key**: The long string under "Project API keys"

### 3. Configure Your Environment

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your Supabase details:
   ```env
   # Backend Environment Variables
   PORT=3001
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   HOURLY_RATE=15
   
   # Frontend Environment Variables (for Vite)
   VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   ```

### 4. Set Up the Database Schema

Run the setup script to create all necessary tables and enable security:

```bash
npm run setup
```

This will:
- Create all database tables
- Enable Row Level Security (RLS) on all tables
- Set up appropriate security policies

Tables created:
- `tables` - Billiard table information
- `products` - Available drinks and food
- `time_sessions` - Table usage sessions
- `orders` - Product orders per table
- `transactions` - Completed checkouts
- `sales` - Detailed product sales tracking
- `sessions` - Table usage sessions
- `inventory` - Inventory tracking
- `time_extensions` - Time extension records
- `settings` - Application settings

### 5. Verify Setup

1. Start your application:
   ```bash
   npm run dev:full
   ```

2. Check the console for:
   ```
   ✅ Connected to Supabase database
   ✅ Supabase database tables created successfully
   ```

3. Visit your application at http://localhost:5173

## 🔧 Optional: Enable Real-time Features

The application includes optional real-time subscriptions. To enable them:

1. In your Supabase dashboard, go to **Database** → **Replication**
2. Enable replication for the tables you want to sync in real-time:
   - `tables`
   - `orders`
   - `time_sessions`

## 🛡️ Security Considerations

### Row Level Security (RLS)
✅ **RLS is automatically enabled** when you run `npm run setup`

All tables have RLS enabled with policies that allow authenticated users to perform all operations. This provides a secure foundation for your application.

### For Development
- The current setup uses the anon key, which is fine for development
- All database operations go through your Express.js backend
- RLS policies are in place for security

### For Production
1. **RLS is already enabled** - no additional setup needed
2. **Review Policies**: Consider customizing RLS policies based on your specific security requirements
3. **Use Service Role Key**: For production, consider using the service role key instead of anon key for backend operations
4. **Monitor Access**: Use Supabase dashboard to monitor database access and queries

### Manual RLS Management
If you need to manage RLS manually:

```bash
# Enable RLS on all tables
npm run enable-rls

# Or run individual commands
npm run migrate    # Create tables only
npm run enable-rls # Enable RLS only
```

## 📊 Monitoring Your Database

- **Dashboard**: Use the Supabase dashboard to monitor queries, usage, and performance
- **Logs**: Check the Logs section for any errors or issues
- **Metrics**: Monitor your database size and query performance

## 🆘 Troubleshooting

### Connection Issues
- Verify your `DATABASE_URL` is correct
- Check that your database password is properly URL-encoded
- Ensure your IP is not blocked (check Supabase dashboard)

### Migration Issues
- Make sure you have the correct permissions
- Check that the database exists and is accessible
- Verify your connection string format

### Real-time Issues
- Ensure replication is enabled for the tables you're subscribing to
- Check that your Supabase URL and anon key are correct

## 🎉 You're Ready!

Your Supabase database is now set up and ready to power your Billiard Hall POS System. The application will automatically create the necessary tables and populate them with sample data.

For more information about Supabase features, visit the [official documentation](https://supabase.com/docs).
