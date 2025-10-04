import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all inventory records
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.name as product_name 
      FROM inventory i 
      LEFT JOIN products p ON i.product_id = p.id 
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get inventory by product ID
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      'SELECT * FROM inventory WHERE product_id = $1 ORDER BY created_at DESC',
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({ error: 'Failed to fetch product inventory' });
  }
});

// Get current inventory summary (products with current quantities)
router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.cost,
        p.quantity,
        p.category,
        p.created_at,
        CASE 
          WHEN p.quantity <= 0 THEN 'out_of_stock'
          WHEN p.quantity <= 10 THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p 
      ORDER BY p.category, p.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({ error: 'Failed to fetch inventory summary' });
  }
});

// Update product quantity (for sales or adjustments)
router.post('/adjust/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, changeType = 'adjustment', reason } = req.body;

    // Get current product data
    const currentProduct = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentQuantity = currentProduct.rows[0].quantity;
    const newQuantity = Math.max(0, currentQuantity + quantity); // Ensure quantity doesn't go below 0

    // Update product quantity
    const result = await pool.query(
      'UPDATE products SET quantity = $1 WHERE id = $2 RETURNING *',
      [newQuantity, productId]
    );

    // Add to inventory tracking
    await pool.query(
      'INSERT INTO inventory (product_id, product_name, price, cost, quantity, category, change_type, change_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        productId, 
        currentProduct.rows[0].name, 
        currentProduct.rows[0].price, 
        currentProduct.rows[0].cost, 
        newQuantity, 
        currentProduct.rows[0].category, 
        changeType, 
        quantity
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    res.status(500).json({ error: 'Failed to adjust inventory' });
  }
});

export default router;
