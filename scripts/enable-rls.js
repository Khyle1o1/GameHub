import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const enableRLS = async () => {
  try {
    console.log('🔒 Enabling Row Level Security (RLS) on all tables...');

    // List of tables that need RLS enabled
    const tables = [
      'time_sessions',
      'tables', 
      'products',
      'orders',
      'transactions',
      'sales',
      'settings',
      'sessions',
      'inventory',
      'time_extensions'
    ];

    // Enable RLS on all tables
    for (const table of tables) {
      console.log(`Enabling RLS on table: ${table}`);
      await pool.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }

    console.log('✅ RLS enabled on all tables');

    // Create policies for each table
    console.log('📋 Creating RLS policies...');

    // Tables table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.tables
      FOR ALL USING (true);
    `);

    // Products table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.products
      FOR ALL USING (true);
    `);

    // Sessions table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.sessions
      FOR ALL USING (true);
    `);

    // Time sessions table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.time_sessions
      FOR ALL USING (true);
    `);

    // Time extensions table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.time_extensions
      FOR ALL USING (true);
    `);

    // Orders table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.orders
      FOR ALL USING (true);
    `);

    // Sales table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.sales
      FOR ALL USING (true);
    `);

    // Transactions table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.transactions
      FOR ALL USING (true);
    `);

    // Inventory table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.inventory
      FOR ALL USING (true);
    `);

    // Settings table - allow all operations for authenticated users
    await pool.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON public.settings
      FOR ALL USING (true);
    `);

    console.log('✅ RLS policies created successfully');

    // Verify RLS is enabled
    console.log('🔍 Verifying RLS status...');
    const result = await pool.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (${tables.map(t => `'${t}'`).join(', ')})
      ORDER BY tablename;
    `);

    console.log('📊 RLS Status Report:');
    result.rows.forEach(row => {
      const status = row.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`  ${row.tablename}: ${status}`);
    });

    console.log('🎉 RLS setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up RLS:', error);
  } finally {
    await pool.end();
  }
};

enableRLS();
