import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all tables
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        s.start_time,
        s.end_time,
        s.mode,
        s.countdown_duration,
        s.id as session_id,
        EXTRACT(EPOCH FROM s.start_time) * 1000 as start_time_ms,
        EXTRACT(EPOCH FROM s.end_time) * 1000 as end_time_ms,
        COALESCE(
          json_agg(
            json_build_object(
              'id', te.id,
              'addedDuration', te.added_duration,
              'addedAt', EXTRACT(EPOCH FROM te.added_at) * 1000,
              'cost', te.cost
            )
          ) FILTER (WHERE te.id IS NOT NULL),
          '[]'::json
        ) as time_extensions
      FROM tables t
      LEFT JOIN LATERAL (
        SELECT * FROM sessions 
        WHERE table_id = t.id 
        ORDER BY id DESC 
        LIMIT 1
      ) s ON true
      LEFT JOIN time_extensions te ON te.session_id = s.id
      WHERE t.status != 'inactive'
      GROUP BY t.id, t.name, t.status, t.is_active, t.start_time, t.mode, t.created_at,
               s.start_time, s.end_time, s.mode, s.countdown_duration, s.id
      ORDER BY t.id
    `);
    
    const tables = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      isActive: row.start_time !== null && row.end_time === null,
      startTime: row.start_time_ms ? Math.floor(row.start_time_ms) : null,
      endTime: row.end_time_ms ? Math.floor(row.end_time_ms) : null,
      mode: row.mode,
      sessionId: row.session_id,
      countdownDuration: row.countdown_duration,
      timeExtensions: row.time_extensions || []
    }));

    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Update table count
router.post('/count', async (req, res) => {
  const { count } = req.body;
  
  if (!count || count < 1 || count > 20) {
    return res.status(400).json({ error: 'Table count must be between 1 and 20' });
  }

  try {
    // Get current tables
    const currentResult = await pool.query('SELECT id FROM tables ORDER BY id');
    const currentTables = currentResult.rows.map(row => row.id);
    
    // Add new tables if count increased
    for (let i = 1; i <= count; i++) {
      if (!currentTables.includes(i)) {
        await pool.query(
          'INSERT INTO tables (name, status) VALUES ($1, $2)',
          [`Table ${i}`, 'available']
        );
      }
    }
    
    // Remove extra tables if count decreased (only if they have no sessions at all)
    for (const tableId of currentTables) {
      if (tableId > count) {
        // Check if table has any sessions (active or completed)
        const anySession = await pool.query(
          'SELECT id FROM time_sessions WHERE table_id = $1',
          [tableId]
        );
        
        if (anySession.rows.length === 0) {
          // Safe to delete - no sessions at all
          await pool.query('DELETE FROM tables WHERE id = $1', [tableId]);
        } else {
          // Table has sessions, just mark as inactive instead of deleting
          await pool.query(
            'UPDATE tables SET status = $1 WHERE id = $2',
            ['inactive', tableId]
          );
        }
      }
    }

    // Get updated tables list (only active tables)
    const updatedResult = await pool.query(`
      SELECT 
        t.*,
        s.start_time,
        s.end_time,
        s.mode,
        s.id as session_id,
        EXTRACT(EPOCH FROM s.start_time) * 1000 as start_time_ms,
        EXTRACT(EPOCH FROM s.end_time) * 1000 as end_time_ms
      FROM tables t
      LEFT JOIN LATERAL (
        SELECT * FROM sessions 
        WHERE table_id = t.id 
        ORDER BY id DESC 
        LIMIT 1
      ) s ON true
      WHERE t.status != 'inactive'
      ORDER BY t.id
    `);
    
    const tables = updatedResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      isActive: row.start_time !== null && row.end_time === null,
      startTime: row.start_time_ms ? Math.floor(row.start_time_ms) : null,
      endTime: row.end_time_ms ? Math.floor(row.end_time_ms) : null,
      mode: row.mode,
      sessionId: row.session_id
    }));

    const io = req.app.get('io');
    io.emit('tablesUpdated', { tables });

    res.json({
      success: true,
      tables,
      message: `Table count updated to ${count}`
    });
  } catch (error) {
    console.error('Error updating table count:', error);
    res.status(500).json({ error: 'Failed to update table count' });
  }
});

// Start table session
router.post('/:id/start', async (req, res) => {
  const { id } = req.params;
  const { mode, duration } = req.body; // 'open', 'hour', or 'countdown' with optional duration

  try {
    // Check if table is already active
    const activeSession = await pool.query(
      'SELECT id FROM sessions WHERE table_id = $1 AND end_time IS NULL',
      [id]
    );

    if (activeSession.rows.length > 0) {
      return res.status(400).json({ error: 'Table is already active' });
    }

    // Start new session
    const result = await pool.query(
      'INSERT INTO sessions (table_id, start_time, mode, countdown_duration) VALUES ($1, NOW(), $2, $3) RETURNING *',
      [id, mode, mode === 'countdown' ? duration : null]
    );

    // Update table status
    await pool.query(
      'UPDATE tables SET status = $1 WHERE id = $2',
      ['occupied', id]
    );

    const io = req.app.get('io');
    io.emit('tableUpdated', { tableId: id, action: 'started', mode, duration });

    res.json({
      success: true,
      session: result.rows[0],
      message: `Table ${id} session started in ${mode} mode`
    });
  } catch (error) {
    console.error('Error starting table session:', error);
    res.status(500).json({ error: 'Failed to start table session' });
  }
});

// Stop table session
router.post('/:id/stop', async (req, res) => {
  const { id } = req.params;

  try {
    // Get active session
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE table_id = $1 AND end_time IS NULL',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({ error: 'No active session found' });
    }

    const session = sessionResult.rows[0];
    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const totalMinutes = Math.ceil((endTime - startTime) / (1000 * 60));
    const hourlyRate = parseFloat(process.env.HOURLY_RATE) || 15;
    const cost = (totalMinutes / 60) * hourlyRate;

    // Update session with end_time (don't calculate cost yet - will be done at checkout)
    await pool.query(
      'UPDATE sessions SET end_time = NOW(), duration_minutes = $1 WHERE id = $2',
      [totalMinutes, session.id]
    );

    // Update table status based on mode
    let newStatus = 'stopped';
    if (session.mode === 'countdown') {
      // Check if countdown time has expired
      const totalExtensions = await pool.query(
        'SELECT COALESCE(SUM(added_duration), 0) as total_extensions FROM time_extensions WHERE session_id = $1',
        [session.id]
      );
      const totalDuration = (session.countdown_duration || 0) + (totalExtensions.rows[0].total_extensions || 0);
      const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
      
      if (elapsedSeconds >= totalDuration) {
        newStatus = 'needs_checkout'; // Time's up
      }
    }
    
    await pool.query(
      'UPDATE tables SET status = $1 WHERE id = $2',
      [newStatus, id]
    );

    const io = req.app.get('io');
    io.emit('tableUpdated', { tableId: id, action: 'stopped', totalMinutes });

    res.json({
      success: true,
      totalMinutes,
      cost,
      message: `Table ${id} session stopped`
    });
  } catch (error) {
    console.error('Error stopping table session:', error);
    res.status(500).json({ error: 'Failed to stop table session' });
  }
});

// Add time extension to active session
router.post('/:id/extend', async (req, res) => {
  const { id } = req.params;
  const { duration } = req.body;

  try {
    // Get active session
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE table_id = $1 AND end_time IS NULL',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({ error: 'No active session found' });
    }

    const session = sessionResult.rows[0];

    // Only allow extensions for countdown mode
    if (session.mode !== 'countdown') {
      return res.status(400).json({ error: 'Time extensions only allowed for countdown mode' });
    }

    // Create time extension record
    const extensionResult = await pool.query(
      'INSERT INTO time_extensions (session_id, added_duration, added_at, cost) VALUES ($1, $2, NOW(), $3) RETURNING *',
      [session.id, duration, 0] // Cost will be calculated at checkout
    );

    const io = req.app.get('io');
    io.emit('tableUpdated', { tableId: id, action: 'extended', duration });

    res.json({
      success: true,
      extension: extensionResult.rows[0],
      message: `Added ${duration} seconds to table ${id}`
    });
  } catch (error) {
    console.error('Error adding time extension:', error);
    res.status(500).json({ error: 'Failed to add time extension' });
  }
});

// Reset table
router.post('/:id/reset', async (req, res) => {
  const { id } = req.params;

  try {
    // Stop any active session
    await pool.query(
      'UPDATE sessions SET end_time = NOW() WHERE table_id = $1 AND end_time IS NULL',
      [id]
    );

    // Update table status
    await pool.query(
      'UPDATE tables SET status = $1 WHERE id = $2',
      ['available', id]
    );

    const io = req.app.get('io');
    io.emit('tableUpdated', { tableId: id, action: 'reset' });

    res.json({
      success: true,
      message: `Table ${id} reset successfully`
    });
  } catch (error) {
    console.error('Error resetting table:', error);
    res.status(500).json({ error: 'Failed to reset table' });
  }
});

// Get table details with orders
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get table info
    const tableResult = await pool.query('SELECT * FROM tables WHERE id = $1', [id]);
    if (tableResult.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Get most recent session (active or stopped)
    const sessionResult = await pool.query(
      'SELECT *, EXTRACT(EPOCH FROM start_time) * 1000 as start_time_ms, EXTRACT(EPOCH FROM end_time) * 1000 as end_time_ms FROM sessions WHERE table_id = $1 ORDER BY id DESC LIMIT 1',
      [id]
    );

    // Get orders for this table
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE table_id = $1 ORDER BY created_at DESC',
      [id]
    );

    const table = tableResult.rows[0];
    const session = sessionResult.rows[0];
    const orders = ordersResult.rows;

    res.json({
      ...table,
      session,
      orders,
      isActive: session !== undefined && session.end_time === null,
      startTime: session ? Math.floor(session.start_time_ms) : null,
      endTime: session && session.end_time_ms ? Math.floor(session.end_time_ms) : null,
      mode: session ? session.mode : null
    });
  } catch (error) {
    console.error('Error fetching table details:', error);
    res.status(500).json({ error: 'Failed to fetch table details' });
  }
});

export default router;
