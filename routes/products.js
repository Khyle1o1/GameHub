import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY category, name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE category = $1 ORDER BY name',
      [category]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  const { name, price, cost, quantity, category } = req.body;

  try {
    // Check if product with same name already exists
    const existingProduct = await pool.query(
      'SELECT * FROM products WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (existingProduct.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Product with this name already exists',
        existingProduct: existingProduct.rows[0]
      });
    }

    const result = await pool.query(
      'INSERT INTO products (name, price, cost, quantity, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, price, cost, quantity, category]
    );

    // Add to inventory tracking
    await pool.query(
      'INSERT INTO inventory (product_id, product_name, price, cost, quantity, category, change_type, change_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [result.rows[0].id, name, price, cost, quantity, category, 'add', quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, cost, quantity, category } = req.body;

  try {
    // Get current product data
    const currentProduct = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, cost = $3, quantity = $4, category = $5 WHERE id = $6 RETURNING *',
      [name, price, cost, quantity, category, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add to inventory tracking
    const quantityChange = quantity - currentProduct.rows[0].quantity;
    await pool.query(
      'INSERT INTO inventory (product_id, product_name, price, cost, quantity, category, change_type, change_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, name, price, cost, quantity, category, 'update', quantityChange]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
