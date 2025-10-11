import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Create transaction (checkout)
router.post('/', async (req, res) => {
  const { tableId, timeCost, productCost, totalAmount, paymentMethod = 'cash', referenceNumber } = req.body;

  try {
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create transaction record
      const transactionResult = await client.query(
        'INSERT INTO transactions (table_id, total_amount, time_cost, product_cost, payment_method, reference_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [tableId || null, totalAmount, timeCost, productCost, paymentMethod, referenceNumber || null]
      );

      if (tableId) {
        // End any active or stopped session (only for table-based transactions)
        await client.query(
          'UPDATE sessions SET end_time = NOW() WHERE table_id = $1 AND end_time IS NULL',
          [tableId]
        );

        // Clear orders for this table
        await client.query('DELETE FROM orders WHERE table_id = $1', [tableId]);

        // Reset table status to available
        await client.query(
          'UPDATE tables SET status = $1 WHERE id = $2',
          ['available', tableId]
        );
      } else {
        // Clear standalone orders
        await client.query('DELETE FROM orders WHERE table_id IS NULL', []);
      }

      await client.query('COMMIT');

      const io = req.app.get('io');
      io.emit('transactionCompleted', { 
        tableId, 
        transaction: transactionResult.rows[0] 
      });

      res.status(201).json({
        success: true,
        transaction: transactionResult.rows[0],
        message: 'Checkout completed successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to complete checkout' });
  }
});

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        tb.name as table_name
      FROM transactions t
      LEFT JOIN tables tb ON t.table_id = tb.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transactions by date range
router.get('/range', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        tb.name as table_name
      FROM transactions t
      LEFT JOIN tables tb ON t.table_id = tb.id
      WHERE t.created_at >= $1 AND t.created_at <= $2
      ORDER BY t.created_at DESC
    `, [startDate, endDate]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions by range:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction details
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        tb.name as table_name
      FROM transactions t
      LEFT JOIN tables tb ON t.table_id = tb.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

export default router;
