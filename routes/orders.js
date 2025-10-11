import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get orders for a table
router.get('/table/:tableId', async (req, res) => {
  const { tableId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE table_id = $1 ORDER BY created_at DESC',
      [tableId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get standalone orders (orders without a table)
router.get('/standalone', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE table_id IS NULL ORDER BY created_at DESC',
      []
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching standalone orders:', error);
    res.status(500).json({ error: 'Failed to fetch standalone orders' });
  }
});

// Add order item
router.post('/', async (req, res) => {
  const { tableId, productId, productName, price, quantity } = req.body;

  try {
    // Check if the same product already exists for this table (or standalone if no table)
    const existingOrder = await pool.query(
      'SELECT * FROM orders WHERE table_id = $1 AND product_id = $2',
      [tableId || null, productId]
    );

    let result;
    if (existingOrder.rows.length > 0) {
      // Update existing order quantity
      const newQuantity = existingOrder.rows[0].quantity + quantity;
      result = await pool.query(
        'UPDATE orders SET quantity = $1 WHERE id = $2 RETURNING *',
        [newQuantity, existingOrder.rows[0].id]
      );
    } else {
      // Create new order
      result = await pool.query(
        'INSERT INTO orders (table_id, product_id, product_name, price, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [tableId || null, productId, productName, price, quantity]
      );
    }

    const io = req.app.get('io');
    io.emit('orderAdded', { tableId, order: result.rows[0] });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({ error: 'Failed to add order' });
  }
});

// Update order quantity
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const result = await pool.query(
      'UPDATE orders SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const io = req.app.get('io');
    io.emit('orderUpdated', { order: result.rows[0] });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const io = req.app.get('io');
    io.emit('orderDeleted', { orderId: id, tableId: result.rows[0].table_id });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Clear all orders for a table
router.delete('/table/:tableId/clear', async (req, res) => {
  const { tableId } = req.params;

  try {
    await pool.query('DELETE FROM orders WHERE table_id = $1', [tableId]);

    const io = req.app.get('io');
    io.emit('ordersCleared', { tableId });

    res.json({ message: 'All orders cleared for table' });
  } catch (error) {
    console.error('Error clearing orders:', error);
    res.status(500).json({ error: 'Failed to clear orders' });
  }
});

// Clear all standalone orders
router.delete('/standalone/clear', async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE table_id IS NULL', []);

    const io = req.app.get('io');
    io.emit('standaloneOrdersCleared', {});

    res.json({ message: 'All standalone orders cleared' });
  } catch (error) {
    console.error('Error clearing standalone orders:', error);
    res.status(500).json({ error: 'Failed to clear standalone orders' });
  }
});

export default router;
