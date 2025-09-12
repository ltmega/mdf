const db = require('../config/db');

// -------------------------
// Get orders for logged-in buyer
// -------------------------
exports.getOrdersByUser = async (req, res) => {
  try {
    //console.log('getOrdersByUser for buyer_id:', req.user.user_id);

    const [rows] = await db.query(
      'SELECT * FROM orders WHERE buyer_id = ? ORDER BY order_date DESC',
      [req.user.user_id]
    );

    console.log(' Orders found for user:', rows.length);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
};

// -------------------------
// Get orders for logged-in seller (if you store seller_id in orders)
// -------------------------
exports.getOrdersBySeller = async (req, res) => {
  try {
    //console.log('👤 getOrdersBySeller for seller_id:', req.user.user_id);

    const [rows] = await db.query(
      `SELECT DISTINCT o.*, u.username AS buyer_name
       FROM orders o
       JOIN users u ON o.buyer_id = u.user_id
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN products p ON p.product_id = oi.product_id
       WHERE p.seller_id = ?
       ORDER BY o.order_date DESC`,
      [req.user.user_id]
    );

    //console.log('Orders found for seller:', rows.length);
    res.status(200).json(rows);
  } catch (err) {
    console.error(' Error fetching seller orders:', err);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
};

// -------------------------
// Create order
// Body: { items:[{product_id, quantity, price}], total_amount, delivery_address }
// -------------------------
exports.createOrder = async (req, res) => {
  console.log(' Request body:', req.body);
  console.log('createOrder body:', req.body);
  console.log('user in req.user:', req.user);

  const { items, total_amount, delivery_address } = req.body;

  // Validate request body
  if (!Array.isArray(items) || items.length === 0) {
    console.warn('Validation failed: Items are required.');
    return res.status(400).json({ message: 'Items are required.' });
  }
  if (typeof total_amount === 'undefined' || total_amount === null) {
    console.warn(' Validation failed: total_amount is required.');
    return res.status(400).json({ message: 'total_amount is required.' });
  }
  if (!delivery_address || !delivery_address.trim()) {
    console.warn(' Validation failed: delivery_address is required.');
    return res.status(400).json({ message: 'delivery_address is required.' });
  }

  try {
    console.log(' BEGIN TRANSACTION');
    await db.query('START TRANSACTION');

    // Insert order into the `orders` table
    const [orderResult] = await db.query(
      'INSERT INTO orders (buyer_id, total_amount, delivery_address, status) VALUES (?, ?, ?, ?)',
      [req.user.user_id, total_amount, delivery_address, 'pending']
    );

    const orderId = orderResult.insertId;
    console.log(' New order_id:', orderId);

    // Insert order items into the `order_items` table and reduce product quantities
    for (const it of items) {
      const qty = Number(it.quantity);
      const price = Number(it.price);

      // Validate basic item properties
      if (!qty || Number.isNaN(price) || qty <= 0) {
        console.warn('Skipping invalid item:', it);
        continue;
      }

      // Check if this is an ingredient or product
      if (it.product_id && it.product_id.toString().startsWith('ingredient-')) {
        // Handle ingredient orders - for now, skip ingredients until database is updated
        console.log(`Skipping ingredient order (database schema needs update): ingredient ${it.product_id}`);
        continue;
      } else {
        // Handle product orders
        const pid = Number(it.product_id);
        
        if (!pid) {
          console.warn('Skipping invalid product:', it);
          continue;
        }

        // Check if sufficient quantity is available
        const [productRows] = await db.query('SELECT available_quantity FROM products WHERE product_id = ?', [pid]);
        if (productRows.length === 0) {
          console.warn('Product not found:', pid);
          continue;
        }

        const availableQty = productRows[0].available_quantity;
        if (availableQty < qty) {
          console.warn(`Insufficient quantity for product ${pid}. Available: ${availableQty}, Requested: ${qty}`);
          continue;
        }

        console.log(`Adding product to order: product ${pid}, qty ${qty}, price ${price}`);
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_time_of_order) VALUES (?, ?, ?, ?)',
          [orderId, pid, qty, price]
        );

        // Reduce product quantity
        await db.query(
          'UPDATE products SET available_quantity = available_quantity - ? WHERE product_id = ?',
          [qty, pid]
        );
        console.log(`Reduced quantity for product ${pid} by ${qty}`);
      }
    }

    // Commit the transaction
    await db.query('COMMIT');
    console.log(' COMMIT: order created:', orderId);
    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (err) {
    console.error(' Error creating order:', err);

    // Rollback the transaction in case of an error
    try {
      await db.query('ROLLBACK');
      console.log('ROLLBACK done');
    } catch (rollbackErr) {
      console.error(' Error during ROLLBACK:', rollbackErr);
    }

    res.status(500).json({ message: 'Failed to create order' });
  }
};

// -------------------------
// Admin: list all orders
// -------------------------
exports.getAllOrders = async (_req, res) => {
  try {
    console.log(' Admin getAllOrders');
    const [rows] = await db.query(
      `SELECT o.*,
              u.username AS buyer_name
       FROM orders o
       JOIN users u ON o.buyer_id = u.user_id
       ORDER BY o.order_date DESC`
    );
    console.log(' Orders total:', rows.length);
    res.status(200).json(rows);
  } catch (err) {
    console.error(' Error fetching all orders:', err);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
};

// -------------------------
// Admin: update order status
// Body: { status: 'pending' | 'confirmed' | 'delivered' | 'cancelled' }
// -------------------------
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  console.log(` Update order ${orderId} -> ${status}`);

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    // If status is being changed to cancelled, restore product quantities
    if (status === 'cancelled') {
      console.log('Restoring quantities for cancelled order:', orderId);

      // Get all order items for this order
      const [orderItems] = await db.query(`
        SELECT oi.product_id, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = ?
      `, [orderId]);

      // Restore quantities for each product
      for (const item of orderItems) {
        await db.query(
          'UPDATE products SET available_quantity = available_quantity + ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
        console.log(`Restored ${item.quantity} units for product ${item.product_id}`);
      }
    }

    const [r] = await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, orderId]
    );

    if (r.affectedRows === 0) {
      console.warn('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(' Status updated for order:', orderId);
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error(' Error updating order status:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};

// -------------------------
// Get order items
// -------------------------
exports.getOrderItems = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    const [items] = await db.query(`
      SELECT oi.*, p.product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [orderId]);
    
    res.status(200).json(items);
  } catch (err) {
    console.error('Error fetching order items:', err);
    res.status(500).json({ message: 'Failed to retrieve order items' });
  }
};
