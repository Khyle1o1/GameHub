import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const checkRLS = async () => {
  try {
    console.log('🔍 Checking Row Level Security (RLS) status...\n');

    // List of tables that should have RLS enabled
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

    // Check RLS status for all tables
    const result = await pool.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (${tables.map(t => `'${t}'`).join(', ')})
      ORDER BY tablename;
    `);

    console.log('📊 RLS Status Report:');
    console.log('='.repeat(50));
    
    let allEnabled = true;
    result.rows.forEach(row => {
      const status = row.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`  ${row.tablename.padEnd(20)} ${status}`);
      if (!row.rowsecurity) allEnabled = false;
    });

    console.log('='.repeat(50));
    
    if (allEnabled) {
      console.log('🎉 All tables have RLS enabled!');
      console.log('✅ Security compliance: PASSED');
    } else {
      console.log('⚠️  Some tables are missing RLS!');
      console.log('❌ Security compliance: FAILED');
      console.log('\nTo fix this, run: npm run enable-rls');
    }

    // Check for policies
    console.log('\n🔒 Checking RLS Policies...');
    const policyResult = await pool.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    if (policyResult.rows.length > 0) {
      console.log('📋 Active Policies:');
      policyResult.rows.forEach(policy => {
        console.log(`  ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('⚠️  No RLS policies found!');
    }

  } catch (error) {
    console.error('❌ Error checking RLS status:', error);
  } finally {
    await pool.end();
  }
};

checkRLS();
