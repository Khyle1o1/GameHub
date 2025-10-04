import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Daily report
router.get('/daily/:date', async (req, res) => {
  const { date } = req.params;

  try {
    // Get transactions for the day
    const transactionsResult = await pool.query(`
      SELECT 
        t.*,
        tb.name as table_name
      FROM transactions t
      JOIN tables tb ON t.table_id = tb.id
      WHERE DATE(t.date) = $1
      ORDER BY t.date DESC
    `, [date]);

    // Get time sessions for the day
    const sessionsResult = await pool.query(`
      SELECT 
        ts.*,
        tb.name as table_name
      FROM time_sessions ts
      JOIN tables tb ON ts.table_id = tb.id
      WHERE DATE(ts.start_time) = $1
      ORDER BY ts.start_time DESC
    `, [date]);

    // Calculate totals
    const totalRevenue = transactionsResult.rows.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
    const totalTimeRevenue = transactionsResult.rows.reduce((sum, t) => sum + parseFloat(t.time_cost || 0), 0);
    const totalProductRevenue = transactionsResult.rows.reduce((sum, t) => sum + parseFloat(t.product_cost || 0), 0);
    const totalTransactions = transactionsResult.rows.length;

    res.json({
      date,
      summary: {
        totalRevenue,
        totalTimeRevenue,
        totalProductRevenue,
        totalTransactions
      },
      transactions: transactionsResult.rows,
      timeSessions: sessionsResult.rows
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// Weekly report
router.get('/weekly/:startDate', async (req, res) => {
  const { startDate } = req.params;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  try {
    const result = await pool.query(`
      SELECT 
        DATE(t.date) as date,
        COUNT(*) as transaction_count,
        SUM(t.total_amount) as total_revenue,
        SUM(t.time_cost) as time_revenue,
        SUM(t.product_cost) as product_revenue
      FROM transactions t
      WHERE DATE(t.date) >= $1 AND DATE(t.date) <= $2
      GROUP BY DATE(t.date)
      ORDER BY DATE(t.date)
    `, [startDate, endDate.toISOString().split('T')[0]]);

    const weeklyData = result.rows.map(row => ({
      date: row.date,
      transactionCount: parseInt(row.transaction_count),
      totalRevenue: parseFloat(row.total_revenue || 0),
      timeRevenue: parseFloat(row.time_revenue || 0),
      productRevenue: parseFloat(row.product_revenue || 0)
    }));

    const totalRevenue = weeklyData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalTransactions = weeklyData.reduce((sum, day) => sum + day.transactionCount, 0);

    res.json({
      startDate,
      endDate: endDate.toISOString().split('T')[0],
      summary: {
        totalRevenue,
        totalTransactions,
        averageDailyRevenue: totalRevenue / 7
      },
      dailyData: weeklyData
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

// Monthly report
router.get('/monthly/:year/:month', async (req, res) => {
  const { year, month } = req.params;

  try {
    // Get daily data for the month
    const dailyResult = await pool.query(`
      SELECT 
        DATE(t.date) as date,
        COUNT(*) as transaction_count,
        SUM(t.total_amount) as total_revenue,
        SUM(t.time_cost) as time_revenue,
        SUM(t.product_cost) as product_revenue
      FROM transactions t
      WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2
      GROUP BY DATE(t.date)
      ORDER BY DATE(t.date)
    `, [year, month]);

    // Get weekly summaries
    const weeklyResult = await pool.query(`
      SELECT 
        EXTRACT(WEEK FROM t.date) as week_number,
        COUNT(*) as transaction_count,
        SUM(t.total_amount) as total_revenue,
        SUM(t.time_cost) as time_revenue,
        SUM(t.product_cost) as product_revenue
      FROM transactions t
      WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2
      GROUP BY EXTRACT(WEEK FROM t.date)
      ORDER BY EXTRACT(WEEK FROM t.date)
    `, [year, month]);

    const dailyData = dailyResult.rows.map(row => ({
      date: row.date,
      transactionCount: parseInt(row.transaction_count),
      totalRevenue: parseFloat(row.total_revenue || 0),
      timeRevenue: parseFloat(row.time_revenue || 0),
      productRevenue: parseFloat(row.product_revenue || 0)
    }));

    const weeklyData = weeklyResult.rows.map(row => ({
      weekNumber: parseInt(row.week_number),
      transactionCount: parseInt(row.transaction_count),
      totalRevenue: parseFloat(row.total_revenue || 0),
      timeRevenue: parseFloat(row.time_revenue || 0),
      productRevenue: parseFloat(row.product_revenue || 0)
    }));

    const totalRevenue = dailyData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalTransactions = dailyData.reduce((sum, day) => sum + day.transactionCount, 0);

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      summary: {
        totalRevenue,
        totalTransactions,
        averageDailyRevenue: totalRevenue / dailyData.length
      },
      dailyData,
      weeklyData
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// Product sales report
router.get('/products/:startDate/:endDate', async (req, res) => {
  const { startDate, endDate } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        o.product_name,
        o.product_id,
        SUM(o.quantity) as total_quantity,
        SUM(o.price * o.quantity) as total_revenue,
        COUNT(DISTINCT o.table_id) as tables_served
      FROM orders o
      JOIN transactions t ON o.table_id = t.table_id
      WHERE DATE(t.date) >= $1 AND DATE(t.date) <= $2
      GROUP BY o.product_name, o.product_id
      ORDER BY total_revenue DESC
    `, [startDate, endDate]);

    const productData = result.rows.map(row => ({
      productName: row.product_name,
      productId: row.product_id,
      totalQuantity: parseInt(row.total_quantity),
      totalRevenue: parseFloat(row.total_revenue),
      tablesServed: parseInt(row.tables_served)
    }));

    res.json({
      startDate,
      endDate,
      productData
    });
  } catch (error) {
    console.error('Error generating product sales report:', error);
    res.status(500).json({ error: 'Failed to generate product sales report' });
  }
});

export default router;
