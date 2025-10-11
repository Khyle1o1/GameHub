import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// Get all combo items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ci.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', cc.id,
              'product_id', cc.product_id,
              'quantity', cc.quantity,
              'product', json_build_object(
                'id', p.id,
                'name', p.name,
                'price', p.price,
                'cost', p.cost,
                'quantity', p.quantity,
                'category', p.category
              )
            )
          ) FILTER (WHERE cc.id IS NOT NULL), 
          '[]'::json
        ) as components
      FROM combo_items ci
      LEFT JOIN combo_components cc ON ci.id = cc.combo_id
      LEFT JOIN products p ON cc.product_id = p.id
      WHERE ci.is_active = true
      GROUP BY ci.id
      ORDER BY ci.name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching combo items:', error);
    res.status(500).json({ error: 'Failed to fetch combo items' });
  }
});

// Get combo item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        ci.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', cc.id,
              'product_id', cc.product_id,
              'quantity', cc.quantity,
              'product', json_build_object(
                'id', p.id,
                'name', p.name,
                'price', p.price,
                'cost', p.cost,
                'quantity', p.quantity,
                'category', p.category
              )
            )
          ) FILTER (WHERE cc.id IS NOT NULL), 
          '[]'::json
        ) as components
      FROM combo_items ci
      LEFT JOIN combo_components cc ON ci.id = cc.combo_id
      LEFT JOIN products p ON cc.product_id = p.id
      WHERE ci.id = $1
      GROUP BY ci.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Combo item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching combo item:', error);
    res.status(500).json({ error: 'Failed to fetch combo item' });
  }
});

// Create new combo item
router.post('/', async (req, res) => {
  const { name, description, price, category, components } = req.body;

  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create combo item
      const comboResult = await client.query(
        'INSERT INTO combo_items (name, description, price, category) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, price, category]
      );

      const comboId = comboResult.rows[0].id;

      // Add components
      if (components && components.length > 0) {
        for (const component of components) {
          await client.query(
            'INSERT INTO combo_components (combo_id, product_id, quantity) VALUES ($1, $2, $3)',
            [comboId, component.product_id, component.quantity]
          );
        }
      }

      await client.query('COMMIT');

      // Fetch the complete combo item with components
      const completeResult = await pool.query(`
        SELECT 
          ci.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', cc.id,
                'product_id', cc.product_id,
                'quantity', cc.quantity,
                'product', json_build_object(
                  'id', p.id,
                  'name', p.name,
                  'price', p.price,
                  'cost', p.cost,
                  'quantity', p.quantity,
                  'category', p.category
                )
              )
            ) FILTER (WHERE cc.id IS NOT NULL), 
            '[]'::json
          ) as components
        FROM combo_items ci
        LEFT JOIN combo_components cc ON ci.id = cc.combo_id
        LEFT JOIN products p ON cc.product_id = p.id
        WHERE ci.id = $1
        GROUP BY ci.id
      `, [comboId]);

      res.status(201).json(completeResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating combo item:', error);
    res.status(500).json({ error: 'Failed to create combo item' });
  }
});

// Update combo item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, components } = req.body;

  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update combo item
      const comboResult = await client.query(
        'UPDATE combo_items SET name = $1, description = $2, price = $3, category = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [name, description, price, category, id]
      );

      if (comboResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Combo item not found' });
      }

      // Remove existing components
      await client.query('DELETE FROM combo_components WHERE combo_id = $1', [id]);

      // Add new components
      if (components && components.length > 0) {
        for (const component of components) {
          await client.query(
            'INSERT INTO combo_components (combo_id, product_id, quantity) VALUES ($1, $2, $3)',
            [id, component.product_id, component.quantity]
          );
        }
      }

      await client.query('COMMIT');

      // Fetch the complete combo item with components
      const completeResult = await pool.query(`
        SELECT 
          ci.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', cc.id,
                'product_id', cc.product_id,
                'quantity', cc.quantity,
                'product', json_build_object(
                  'id', p.id,
                  'name', p.name,
                  'price', p.price,
                  'cost', p.cost,
                  'quantity', p.quantity,
                  'category', p.category
                )
              )
            ) FILTER (WHERE cc.id IS NOT NULL), 
            '[]'::json
          ) as components
        FROM combo_items ci
        LEFT JOIN combo_components cc ON ci.id = cc.combo_id
        LEFT JOIN products p ON cc.product_id = p.id
        WHERE ci.id = $1
        GROUP BY ci.id
      `, [id]);

      res.json(completeResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating combo item:', error);
    res.status(500).json({ error: 'Failed to update combo item' });
  }
});

// Delete combo item (soft delete by setting is_active to false)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE combo_items SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Combo item not found' });
    }
    
    res.json({ message: 'Combo item deleted successfully' });
  } catch (error) {
    console.error('Error deleting combo item:', error);
    res.status(500).json({ error: 'Failed to delete combo item' });
  }
});

// Check if combo can be sold (validate stock availability)
router.post('/:id/check-stock', async (req, res) => {
  const { id } = req.params;
  const { quantity = 1 } = req.body;

  try {
    const result = await pool.query(`
      SELECT 
        cc.product_id,
        cc.quantity as required_quantity,
        p.name as product_name,
        p.quantity as available_quantity,
        (p.quantity >= (cc.quantity * $2)) as in_stock
      FROM combo_components cc
      JOIN products p ON cc.product_id = p.id
      WHERE cc.combo_id = $1
    `, [id, quantity]);

    const stockCheck = result.rows.map(row => ({
      product_id: row.product_id,
      product_name: row.product_name,
      required_quantity: row.required_quantity * quantity,
      available_quantity: row.available_quantity,
      in_stock: row.in_stock
    }));

    const allInStock = stockCheck.every(item => item.in_stock);
    const outOfStockItems = stockCheck.filter(item => !item.in_stock);

    res.json({
      can_sell: allInStock,
      stock_check: stockCheck,
      out_of_stock_items: outOfStockItems
    });
  } catch (error) {
    console.error('Error checking combo stock:', error);
    res.status(500).json({ error: 'Failed to check combo stock' });
  }
});

export default router;
