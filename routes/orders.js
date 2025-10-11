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
  const { tableId, productId, productName, price, quantity, comboId } = req.body;

  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // If this is a combo order, check stock availability and deduct inventory
      if (comboId) {
        // Check if combo can be sold
        const stockCheck = await client.query(`
          SELECT 
            cc.product_id,
            cc.quantity as required_quantity,
            p.name as product_name,
            p.quantity as available_quantity,
            (p.quantity >= (cc.quantity * $1)) as in_stock
          FROM combo_components cc
          JOIN products p ON cc.product_id = p.id
          WHERE cc.combo_id = $2
        `, [quantity, comboId]);

        const outOfStockItems = stockCheck.rows.filter(row => !row.in_stock);
        if (outOfStockItems.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: 'Insufficient stock for combo items',
            outOfStockItems: outOfStockItems.map(item => ({
              product_name: item.product_name,
              required: item.required_quantity * quantity,
              available: item.available_quantity
            }))
          });
        }

        // Deduct inventory for each component
        for (const component of stockCheck.rows) {
          const deductQuantity = component.required_quantity * quantity;
          await client.query(
            'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
            [deductQuantity, component.product_id]
          );

          // Add to inventory tracking
          const productResult = await client.query('SELECT * FROM products WHERE id = $1', [component.product_id]);
          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];
            await client.query(
              'INSERT INTO inventory (product_id, product_name, price, cost, quantity, category, change_type, change_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
              [
                component.product_id,
                product.name,
                product.price,
                product.cost,
                product.quantity,
                product.category,
                'sale',
                -deductQuantity
              ]
            );
          }
        }
      } else {
        // For regular products, check stock and deduct inventory
        const productResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
        if (productResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Product not found' });
        }

        const product = productResult.rows[0];
        if (product.quantity < quantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: 'Insufficient stock',
            available: product.quantity,
            requested: quantity
          });
        }

        // Deduct inventory
        await client.query(
          'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
          [quantity, productId]
        );

        // Add to inventory tracking
        await client.query(
          'INSERT INTO inventory (product_id, product_name, price, cost, quantity, category, change_type, change_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [
            productId,
            product.name,
            product.price,
            product.cost,
            product.quantity - quantity,
            product.category,
            'sale',
            -quantity
          ]
        );
      }

      // Check if the same product/combo already exists for this table (or standalone if no table)
      const existingOrder = await client.query(
        'SELECT * FROM orders WHERE table_id = $1 AND product_id = $2 AND combo_id = $3',
        [tableId || null, comboId ? null : productId, comboId || null]
      );

      let result;
      if (existingOrder.rows.length > 0) {
        // Update existing order quantity
        const newQuantity = existingOrder.rows[0].quantity + quantity;
        result = await client.query(
          'UPDATE orders SET quantity = $1 WHERE id = $2 RETURNING *',
          [newQuantity, existingOrder.rows[0].id]
        );
      } else {
        // Create new order - set product_id to NULL for combo orders
        result = await client.query(
          'INSERT INTO orders (table_id, product_id, product_name, price, quantity, combo_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [tableId || null, comboId ? null : productId, productName, price, quantity, comboId || null]
        );
      }

      await client.query('COMMIT');

      const io = req.app.get('io');
      io.emit('orderAdded', { tableId, order: result.rows[0] });

      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current order details
      const currentOrder = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (currentOrder.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = currentOrder.rows[0];
      const quantityDifference = quantity - order.quantity;

      if (quantityDifference !== 0) {
        // If this is a combo order, adjust inventory for components
        if (order.combo_id) {
          const components = await client.query(`
            SELECT cc.product_id, cc.quantity as required_quantity, p.name as product_name, p.quantity as available_quantity
            FROM combo_components cc
            JOIN products p ON cc.product_id = p.id
            WHERE cc.combo_id = $1
          `, [order.combo_id]);

          // Check if we can increase quantity (have enough stock)
          if (quantityDifference > 0) {
            for (const component of components.rows) {
              const requiredIncrease = component.required_quantity * quantityDifference;
              if (component.available_quantity < requiredIncrease) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                  error: 'Insufficient stock to increase quantity',
                  product_name: component.product_name,
                  available: component.available_quantity,
                  required: requiredIncrease
                });
              }
            }
          }

          // Adjust inventory for each component
          for (const component of components.rows) {
            const adjustQuantity = component.required_quantity * quantityDifference;
            await client.query(
              'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
              [adjustQuantity, component.product_id]
            );

            // Add to inventory tracking
            const productResult = await client.query('SELECT * FROM products WHERE id = $1', [component.product_id]);
            if (productResult.rows.length > 0) {
              const product = productResult.rows[0];
              await client.query(
                'INSERT INTO inventory (product_id, product_name, price, cost, quantity, category, change_type, change_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [
                  component.product_id,
                  product.name,
                  product.price,
                  product.cost,
                  product.quantity,
                  product.category,
                  'adjustment',
                  -adjustQuantity
                ]
              );
            }
          }
        } else if (order.product_id) {
          // For regular products, adjust inventory
          const productResult = await client.query('SELECT * FROM products WHERE id = $1', [order.product_id]);
          if (productResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
          }

          const product = productResult.rows[0];
          
          // Check if we can increase quantity (have enough stock)
          if (quantityDifference > 0 && product.quantity < quantityDifference) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
              error: 'Insufficient stock to increase quantity',
              available: product.quantity,
              required: quantityDifference
            });
          }

          // Adjust inventory
          await client.query(
            'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
            [quantityDifference, order.product_id]
          );

          // Add to inventory tracking
          await client.query(
            'INSERT INTO inventory (product_id, product_name, price, cost, quantity, category, change_type, change_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [
              order.product_id,
              product.name,
              product.price,
              product.cost,
              product.quantity - quantityDifference,
              product.category,
              'adjustment',
              -quantityDifference
            ]
          );
        }
      }

      // Update order quantity
      const result = await client.query(
        'UPDATE orders SET quantity = $1 WHERE id = $2 RETURNING *',
        [quantity, id]
      );

      await client.query('COMMIT');

      const io = req.app.get('io');
      io.emit('orderUpdated', { order: result.rows[0] });

      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get order details before deleting
      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult.rows[0];

      // Restore inventory
      if (order.combo_id) {
        // For combo orders, restore inventory for each component
        const components = await client.query(`
          SELECT cc.product_id, cc.quantity as required_quantity, p.name as product_name
          FROM combo_components cc
          JOIN products p ON cc.product_id = p.id
          WHERE cc.combo_id = $1
        `, [order.combo_id]);

        for (const component of components.rows) {
          const restoreQuantity = component.required_quantity * order.quantity;
          await client.query(
            'UPDATE products SET quantity = quantity + $1 WHERE id = $2',
            [restoreQuantity, component.product_id]
          );

          // Add to inventory tracking
          const productResult = await client.query('SELECT * FROM products WHERE id = $1', [component.product_id]);
          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];
            await client.query(
              'INSERT INTO inventory (product_id, product_name, price, cost, quantity, category, change_type, change_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
              [
                component.product_id,
                product.name,
                product.price,
                product.cost,
                product.quantity,
                product.category,
                'adjustment',
                restoreQuantity
              ]
            );
          }
        }
      } else if (order.product_id) {
        // For regular products, restore inventory
        const productResult = await client.query('SELECT * FROM products WHERE id = $1', [order.product_id]);
        if (productResult.rows.length > 0) {
          const product = productResult.rows[0];
          await client.query(
            'UPDATE products SET quantity = quantity + $1 WHERE id = $2',
            [order.quantity, order.product_id]
          );

          // Add to inventory tracking
          await client.query(
            'INSERT INTO inventory (product_id, product_name, price, cost, quantity, category, change_type, change_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [
              order.product_id,
              product.name,
              product.price,
              product.cost,
              product.quantity + order.quantity,
              product.category,
              'adjustment',
              order.quantity
            ]
          );
        }
      }

      // Delete the order
      const result = await client.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

      await client.query('COMMIT');

      const io = req.app.get('io');
      io.emit('orderDeleted', { orderId: id, tableId: result.rows[0].table_id });

      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
