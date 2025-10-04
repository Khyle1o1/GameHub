import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Create a new session
router.post('/', async (req, res) => {
  try {
    const { tableId, startTime, mode } = req.body;
    
    const result = await pool.query(
      'INSERT INTO sessions (table_id, start_time, mode) VALUES ($1, $2, $3) RETURNING *',
      [tableId, startTime, mode]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session (end session)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { endTime, durationMinutes, totalCost } = req.body;
    
    const result = await pool.query(
      'UPDATE sessions SET end_time = $1, duration_minutes = $2, total_cost = $3 WHERE id = $4 RETURNING *',
      [endTime, durationMinutes, totalCost, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Get sessions by table
router.get('/table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const result = await pool.query(
      'SELECT * FROM sessions WHERE table_id = $1 ORDER BY created_at DESC',
      [tableId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching table sessions:', error);
    res.status(500).json({ error: 'Failed to fetch table sessions' });
  }
});

// Get all sessions with filters
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, tableId } = req.query;
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      query += ` AND start_time >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND start_time <= $${paramCount}`;
      params.push(endDate);
    }

    if (tableId) {
      paramCount++;
      query += ` AND table_id = $${paramCount}`;
      params.push(tableId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;
