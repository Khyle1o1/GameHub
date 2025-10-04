import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Save settings
router.post('/', async (req, res) => {
  try {
    const { hourlyRate, halfHourRate, tableCount } = req.body;
    
    // Update or insert settings
    const settings = [
      { key: 'hourly_rate', value: hourlyRate.toString() },
      { key: 'half_hour_rate', value: halfHourRate.toString() },
      { key: 'table_count', value: tableCount.toString() }
    ];

    for (const setting of settings) {
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        [setting.key, setting.value]
      );
    }

    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
