import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const createTables = async () => {
  try {
    // Create tables table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        is_active BOOLEAN DEFAULT FALSE,
        start_time TIMESTAMP,
        mode VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        quantity INTEGER NOT NULL DEFAULT 0,
        category VARCHAR(20) NOT NULL CHECK (category IN ('drink', 'food', 'accessory', 'other')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table (enhanced)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        table_id INTEGER REFERENCES tables(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_minutes INTEGER,
        total_cost DECIMAL(10,2),
        mode VARCHAR(10) NOT NULL CHECK (mode IN ('open', 'hour', 'countdown')),
        countdown_duration INTEGER, -- Duration in seconds for countdown mode
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create time_extensions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_extensions (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id),
        added_duration INTEGER NOT NULL, -- Duration added in seconds
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cost DECIMAL(10,2) DEFAULT 0, -- Cost of this extension
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        table_id INTEGER REFERENCES tables(id),
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sales table (for detailed product sales tracking)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id),
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transactions table (enhanced with payment methods)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id),
        table_id INTEGER REFERENCES tables(id),
        total_amount DECIMAL(10,2) NOT NULL,
        time_cost DECIMAL(10,2) DEFAULT 0,
        product_cost DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(10) NOT NULL CHECK (payment_method IN ('cash', 'gcash')),
        reference_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inventory table (for tracking inventory changes)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL,
        change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('add', 'update', 'sale', 'adjustment')),
        change_quantity INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Enhanced database tables created successfully');

    // Insert default data
    await insertDefaultData();
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.end();
  }
};

const insertDefaultData = async () => {
  try {
    // Insert default tables
    const tablesResult = await pool.query('SELECT COUNT(*) FROM tables');
    if (parseInt(tablesResult.rows[0].count) === 0) {
      for (let i = 1; i <= 8; i++) {
        await pool.query('INSERT INTO tables (name) VALUES ($1)', [`Table ${i}`]);
      }
      console.log('✅ Default tables inserted');
    }

    // Insert default products
    const productsResult = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productsResult.rows[0].count) === 0) {
      const defaultProducts = [
        { name: 'Coca Cola', price: 2.50, cost: 1.50, quantity: 50, category: 'drink' },
        { name: 'Pepsi', price: 2.50, cost: 1.50, quantity: 50, category: 'drink' },
        { name: 'Sprite', price: 2.50, cost: 1.50, quantity: 50, category: 'drink' },
        { name: 'Beer', price: 4.00, cost: 2.50, quantity: 30, category: 'drink' },
        { name: 'Water', price: 1.50, cost: 0.75, quantity: 100, category: 'drink' },
        { name: 'Chips', price: 3.00, cost: 1.80, quantity: 40, category: 'food' },
        { name: 'Noodles', price: 5.00, cost: 2.50, quantity: 25, category: 'food' },
        { name: 'Sandwich', price: 6.00, cost: 3.00, quantity: 20, category: 'food' },
        { name: 'Pizza Slice', price: 4.50, cost: 2.25, quantity: 30, category: 'food' },
        { name: 'Hot Dog', price: 3.50, cost: 1.75, quantity: 35, category: 'food' }
      ];

      for (const product of defaultProducts) {
        await pool.query(
          'INSERT INTO products (name, price, cost, quantity, category) VALUES ($1, $2, $3, $4, $5)',
          [product.name, product.price, product.cost, product.quantity, product.category]
        );
      }
      console.log('✅ Default products inserted');
    }

    // Insert default settings
    const settingsResult = await pool.query('SELECT COUNT(*) FROM settings');
    if (parseInt(settingsResult.rows[0].count) === 0) {
      const defaultSettings = [
        { key: 'hourly_rate', value: '150' },
        { key: 'half_hour_rate', value: '100' },
        { key: 'table_count', value: '8' }
      ];

      for (const setting of defaultSettings) {
        await pool.query(
          'INSERT INTO settings (key, value) VALUES ($1, $2)',
          [setting.key, setting.value]
        );
      }
      console.log('✅ Default settings inserted');
    }
  } catch (error) {
    console.error('❌ Error inserting default data:', error);
  }
};

createTables();
