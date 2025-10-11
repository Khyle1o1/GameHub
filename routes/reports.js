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
      WHERE DATE(t.created_at) = $1
      ORDER BY t.created_at DESC
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

    // Get payment method breakdown
    const paymentResult = await pool.query(`
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_amount
      FROM transactions
      WHERE DATE(created_at) = $1
      GROUP BY payment_method
    `, [date]);

    // Get top products for the day from inventory sales
    const topProductsResult = await pool.query(`
      SELECT 
        i.product_name,
        i.product_id,
        SUM(ABS(i.change_quantity)) as total_quantity,
        SUM(i.price * ABS(i.change_quantity)) as total_revenue
      FROM inventory i
      WHERE DATE(i.created_at) = $1 
        AND i.change_type = 'sale'
        AND i.change_quantity < 0
      GROUP BY i.product_name, i.product_id
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [date]);

    // Calculate totals
    const totalRevenue = transactionsResult.rows.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
    const totalTimeRevenue = transactionsResult.rows.reduce((sum, t) => sum + parseFloat(t.time_cost || 0), 0);
    const totalProductRevenue = transactionsResult.rows.reduce((sum, t) => sum + parseFloat(t.product_cost || 0), 0);
    const totalTransactions = transactionsResult.rows.length;

    // Calculate COGS (Cost of Goods Sold) from inventory sales
    const cogsResult = await pool.query(`
      SELECT 
        SUM(ABS(i.change_quantity) * p.cost) as total_cogs
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE DATE(i.created_at) = $1 
        AND i.change_type = 'sale'
        AND i.change_quantity < 0
    `, [date]);

    const totalCOGS = parseFloat(cogsResult.rows[0]?.total_cogs || 0);
    const grossIncome = totalRevenue;
    const netIncome = grossIncome - totalCOGS;
    const profitMargin = grossIncome > 0 ? ((netIncome / grossIncome) * 100) : 0;

    // Process payment methods
    const paymentMethods = {
      cash: 0,
      gcash: 0
    };
    paymentResult.rows.forEach(row => {
      if (row.payment_method === 'cash') {
        paymentMethods.cash = parseFloat(row.total_amount || 0);
      } else if (row.payment_method === 'gcash') {
        paymentMethods.gcash = parseFloat(row.total_amount || 0);
      }
    });

    // Get table-specific income data
    const tableIncomeResult = await pool.query(`
      SELECT 
        t.table_id,
        tb.name as table_name,
        COUNT(*) as session_count,
        SUM(t.time_cost) as total_time_revenue,
        SUM(t.product_cost) as total_product_revenue,
        SUM(t.total_amount) as total_revenue
      FROM transactions t
      JOIN tables tb ON t.table_id = tb.id
      WHERE DATE(t.created_at) = $1
      GROUP BY t.table_id, tb.name
      ORDER BY t.table_id
    `, [date]);

    // Process table income data
    const tableIncome = tableIncomeResult.rows.map(row => ({
      tableId: row.table_id,
      tableName: row.table_name,
      sessionCount: parseInt(row.session_count),
      timeRevenue: parseFloat(row.total_time_revenue || 0),
      productRevenue: parseFloat(row.total_product_revenue || 0),
      totalRevenue: parseFloat(row.total_revenue || 0)
    }));

    // Process top products
    const topProducts = topProductsResult.rows.map(row => ({
      name: row.product_name,
      quantity: parseInt(row.total_quantity),
      revenue: parseFloat(row.total_revenue)
    }));

    res.json({
      date,
      summary: {
        totalRevenue,
        totalTimeRevenue,
        totalProductRevenue,
        totalTransactions,
        cashPayments: paymentMethods.cash,
        gcashPayments: paymentMethods.gcash,
        grossIncome,
        totalCOGS,
        netIncome,
        profitMargin
      },
      transactions: transactionsResult.rows,
      timeSessions: sessionsResult.rows,
      tableIncome,
      topProducts
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
        DATE(t.created_at) as date,
        COUNT(*) as transaction_count,
        SUM(t.total_amount) as total_revenue,
        SUM(t.time_cost) as time_revenue,
        SUM(t.product_cost) as product_revenue
      FROM transactions t
      WHERE DATE(t.created_at) >= $1 AND DATE(t.created_at) <= $2
      GROUP BY DATE(t.created_at)
      ORDER BY DATE(t.created_at)
    `, [startDate, endDate.toISOString().split('T')[0]]);

    // Get payment method breakdown for the week
    const paymentResult = await pool.query(`
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_amount
      FROM transactions
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      GROUP BY payment_method
    `, [startDate, endDate.toISOString().split('T')[0]]);

    // Get top products for the week from inventory sales
    const topProductsResult = await pool.query(`
      SELECT 
        i.product_name,
        i.product_id,
        SUM(ABS(i.change_quantity)) as total_quantity,
        SUM(i.price * ABS(i.change_quantity)) as total_revenue
      FROM inventory i
      WHERE DATE(i.created_at) >= $1 
        AND DATE(i.created_at) <= $2
        AND i.change_type = 'sale'
        AND i.change_quantity < 0
      GROUP BY i.product_name, i.product_id
      ORDER BY total_revenue DESC
      LIMIT 10
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

    // Calculate COGS for the week
    const cogsResult = await pool.query(`
      SELECT 
        SUM(ABS(i.change_quantity) * p.cost) as total_cogs
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE DATE(i.created_at) >= $1 
        AND DATE(i.created_at) <= $2
        AND i.change_type = 'sale'
        AND i.change_quantity < 0
    `, [startDate, endDate.toISOString().split('T')[0]]);

    const totalCOGS = parseFloat(cogsResult.rows[0]?.total_cogs || 0);
    const grossIncome = totalRevenue;
    const netIncome = grossIncome - totalCOGS;
    const profitMargin = grossIncome > 0 ? ((netIncome / grossIncome) * 100) : 0;

    // Process payment methods
    const paymentMethods = {
      cash: 0,
      gcash: 0
    };
    paymentResult.rows.forEach(row => {
      if (row.payment_method === 'cash') {
        paymentMethods.cash = parseFloat(row.total_amount || 0);
      } else if (row.payment_method === 'gcash') {
        paymentMethods.gcash = parseFloat(row.total_amount || 0);
      }
    });

    // Get table-specific income data for the week
    const tableIncomeResult = await pool.query(`
      SELECT 
        t.table_id,
        tb.name as table_name,
        COUNT(*) as session_count,
        SUM(t.time_cost) as total_time_revenue,
        SUM(t.product_cost) as total_product_revenue,
        SUM(t.total_amount) as total_revenue
      FROM transactions t
      JOIN tables tb ON t.table_id = tb.id
      WHERE DATE(t.created_at) >= $1 AND DATE(t.created_at) <= $2
      GROUP BY t.table_id, tb.name
      ORDER BY t.table_id
    `, [startDate, endDate.toISOString().split('T')[0]]);

    // Process table income data
    const tableIncome = tableIncomeResult.rows.map(row => ({
      tableId: row.table_id,
      tableName: row.table_name,
      sessionCount: parseInt(row.session_count),
      timeRevenue: parseFloat(row.total_time_revenue || 0),
      productRevenue: parseFloat(row.total_product_revenue || 0),
      totalRevenue: parseFloat(row.total_revenue || 0)
    }));

    // Process top products
    const topProducts = topProductsResult.rows.map(row => ({
      name: row.product_name,
      quantity: parseInt(row.total_quantity),
      revenue: parseFloat(row.total_revenue)
    }));

    res.json({
      startDate,
      endDate: endDate.toISOString().split('T')[0],
      summary: {
        totalRevenue,
        totalTransactions,
        averageDailyRevenue: totalRevenue / 7,
        cashPayments: paymentMethods.cash,
        gcashPayments: paymentMethods.gcash,
        grossIncome,
        totalCOGS,
        netIncome,
        profitMargin
      },
      dailyData: weeklyData,
      tableIncome,
      topProducts
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
        DATE(t.created_at) as date,
        COUNT(*) as transaction_count,
        SUM(t.total_amount) as total_revenue,
        SUM(t.time_cost) as time_revenue,
        SUM(t.product_cost) as product_revenue
      FROM transactions t
      WHERE EXTRACT(YEAR FROM t.created_at) = $1 AND EXTRACT(MONTH FROM t.created_at) = $2
      GROUP BY DATE(t.created_at)
      ORDER BY DATE(t.created_at)
    `, [year, month]);

    // Get weekly summaries
    const weeklyResult = await pool.query(`
      SELECT 
        EXTRACT(WEEK FROM t.created_at) as week_number,
        COUNT(*) as transaction_count,
        SUM(t.total_amount) as total_revenue,
        SUM(t.time_cost) as time_revenue,
        SUM(t.product_cost) as product_revenue
      FROM transactions t
      WHERE EXTRACT(YEAR FROM t.created_at) = $1 AND EXTRACT(MONTH FROM t.created_at) = $2
      GROUP BY EXTRACT(WEEK FROM t.created_at)
      ORDER BY EXTRACT(WEEK FROM t.created_at)
    `, [year, month]);

    // Get payment method breakdown for the month
    const paymentResult = await pool.query(`
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_amount
      FROM transactions
      WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
      GROUP BY payment_method
    `, [year, month]);

    // Get top products for the month from inventory sales
    const topProductsResult = await pool.query(`
      SELECT 
        i.product_name,
        i.product_id,
        SUM(ABS(i.change_quantity)) as total_quantity,
        SUM(i.price * ABS(i.change_quantity)) as total_revenue
      FROM inventory i
      WHERE EXTRACT(YEAR FROM i.created_at) = $1 
        AND EXTRACT(MONTH FROM i.created_at) = $2
        AND i.change_type = 'sale'
        AND i.change_quantity < 0
      GROUP BY i.product_name, i.product_id
      ORDER BY total_revenue DESC
      LIMIT 10
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

    // Calculate COGS for the month
    const cogsResult = await pool.query(`
      SELECT 
        SUM(ABS(i.change_quantity) * p.cost) as total_cogs
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE EXTRACT(YEAR FROM i.created_at) = $1 
        AND EXTRACT(MONTH FROM i.created_at) = $2
        AND i.change_type = 'sale'
        AND i.change_quantity < 0
    `, [year, month]);

    const totalCOGS = parseFloat(cogsResult.rows[0]?.total_cogs || 0);
    const grossIncome = totalRevenue;
    const netIncome = grossIncome - totalCOGS;
    const profitMargin = grossIncome > 0 ? ((netIncome / grossIncome) * 100) : 0;

    // Process payment methods
    const paymentMethods = {
      cash: 0,
      gcash: 0
    };
    paymentResult.rows.forEach(row => {
      if (row.payment_method === 'cash') {
        paymentMethods.cash = parseFloat(row.total_amount || 0);
      } else if (row.payment_method === 'gcash') {
        paymentMethods.gcash = parseFloat(row.total_amount || 0);
      }
    });

    // Get table-specific income data for the month
    const tableIncomeResult = await pool.query(`
      SELECT 
        t.table_id,
        tb.name as table_name,
        COUNT(*) as session_count,
        SUM(t.time_cost) as total_time_revenue,
        SUM(t.product_cost) as total_product_revenue,
        SUM(t.total_amount) as total_revenue
      FROM transactions t
      JOIN tables tb ON t.table_id = tb.id
      WHERE EXTRACT(YEAR FROM t.created_at) = $1 AND EXTRACT(MONTH FROM t.created_at) = $2
      GROUP BY t.table_id, tb.name
      ORDER BY t.table_id
    `, [year, month]);

    // Process table income data
    const tableIncome = tableIncomeResult.rows.map(row => ({
      tableId: row.table_id,
      tableName: row.table_name,
      sessionCount: parseInt(row.session_count),
      timeRevenue: parseFloat(row.total_time_revenue || 0),
      productRevenue: parseFloat(row.total_product_revenue || 0),
      totalRevenue: parseFloat(row.total_revenue || 0)
    }));

    // Process top products
    const topProducts = topProductsResult.rows.map(row => ({
      name: row.product_name,
      quantity: parseInt(row.total_quantity),
      revenue: parseFloat(row.total_revenue)
    }));

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      summary: {
        totalRevenue,
        totalTransactions,
        averageDailyRevenue: totalRevenue / dailyData.length,
        cashPayments: paymentMethods.cash,
        gcashPayments: paymentMethods.gcash,
        grossIncome,
        totalCOGS,
        netIncome,
        profitMargin
      },
      dailyData,
      weeklyData,
      tableIncome,
      topProducts
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
        i.product_name,
        i.product_id,
        SUM(ABS(i.change_quantity)) as total_quantity,
        SUM(i.price * ABS(i.change_quantity)) as total_revenue,
        COUNT(DISTINCT i.created_at::date) as days_sold
      FROM inventory i
      WHERE DATE(i.created_at) >= $1 
        AND DATE(i.created_at) <= $2
        AND i.change_type = 'sale'
        AND i.change_quantity < 0
      GROUP BY i.product_name, i.product_id
      ORDER BY total_revenue DESC
    `, [startDate, endDate]);

    const productData = result.rows.map(row => ({
      productName: row.product_name,
      productId: row.product_id,
      totalQuantity: parseInt(row.total_quantity),
      totalRevenue: parseFloat(row.total_revenue),
      daysSold: parseInt(row.days_sold)
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
