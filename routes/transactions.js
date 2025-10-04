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
      let transactionResult;
      try {
        // Try to insert with payment method and reference number
        transactionResult = await client.query(
          'INSERT INTO transactions (table_id, total_amount, time_cost, product_cost, payment_method, reference_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [tableId, totalAmount, timeCost, productCost, paymentMethod, referenceNumber || null]
        );
      } catch (err) {
        // If payment_method column doesn't exist, insert without it
        if (err.code === '42703') {
          transactionResult = await client.query(
            'INSERT INTO transactions (table_id, total_amount, time_cost, product_cost) VALUES ($1, $2, $3, $4) RETURNING *',
            [tableId, totalAmount, timeCost, productCost]
          );
        } else {
          throw err;
        }
      }

      // End any active or stopped session
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
      JOIN tables tb ON t.table_id = tb.id
      ORDER BY t.date DESC
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
      JOIN tables tb ON t.table_id = tb.id
      WHERE t.date >= $1 AND t.date <= $2
      ORDER BY t.date DESC
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
      JOIN tables tb ON t.table_id = tb.id
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
