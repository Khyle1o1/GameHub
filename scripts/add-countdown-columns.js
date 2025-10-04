import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const addCountdownColumns = async () => {
  try {
    console.log('🔄 Adding countdown columns to existing database...');
    
    // Add countdown_duration column to sessions table
    await pool.query(`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS countdown_duration INTEGER
    `);
    console.log('✅ Added countdown_duration column to sessions table');
    
    // Update the mode constraint to include 'countdown'
    await pool.query(`
      ALTER TABLE sessions 
      DROP CONSTRAINT IF EXISTS sessions_mode_check
    `);
    
    await pool.query(`
      ALTER TABLE sessions 
      ADD CONSTRAINT sessions_mode_check 
      CHECK (mode IN ('open', 'hour', 'countdown'))
    `);
    console.log('✅ Updated sessions mode constraint to include countdown');
    
    // Create time_extensions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_extensions (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id),
        added_duration INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cost DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created time_extensions table');
    
    console.log('🎉 Successfully added countdown columns to database!');
    
  } catch (error) {
    console.error('❌ Error adding countdown columns:', error);
  } finally {
    await pool.end();
  }
};

addCountdownColumns();
