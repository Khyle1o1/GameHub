import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const addComboSystem = async () => {
  try {
    // Create combo_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS combo_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(20) NOT NULL CHECK (category IN ('drink', 'food', 'accessory', 'other', 'combo')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create combo_components table (junction table for combo items and their components)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS combo_components (
        id SERIAL PRIMARY KEY,
        combo_id INTEGER REFERENCES combo_items(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(combo_id, product_id)
      )
    `);

    // Add combo_id column to products table to identify combo items
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_combo BOOLEAN DEFAULT FALSE
    `);

    // Add combo_id column to orders table to track combo sales
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS combo_id INTEGER REFERENCES combo_items(id) ON DELETE SET NULL
    `);

    // Create index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_combo_components_combo_id ON combo_components(combo_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_combo_components_product_id ON combo_components(product_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_combo_id ON orders(combo_id)
    `);

    console.log('✅ Combo system tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating combo system tables:', error);
  } finally {
    await pool.end();
  }
};

addComboSystem();
