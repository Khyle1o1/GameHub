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
  const { name, price, category } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
      [name, price, category]
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
  const { name, price, category } = req.body;

  try {
    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, category = $3 WHERE id = $4 RETURNING *',
      [name, price, category, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
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
