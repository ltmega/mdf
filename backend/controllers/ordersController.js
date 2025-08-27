const db = require('../config/db');

// -------------------------
// Get orders for logged-in buyer
// -------------------------
exports.getOrdersByUser = async (req, res) => {
  try {
    console.log('👤 getOrdersByUser for buyer_id:', req.user.user_id);

    const [rows] = await db.query(
      'SELECT * FROM orders WHERE buyer_id = ? ORDER BY order_date DESC',
      [req.user.user_id]
    );

    console.log('✅ Orders found for user:', rows.length);
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error fetching user orders:', err);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
};

// -------------------------
// Get orders for logged-in seller (if you store seller_id in orders)
// -------------------------
exports.getOrdersBySeller = async (req, res) => {
  try {
    console.log('👤 getOrdersBySeller for seller_id:', req.user.user_id);

    const [rows] = await db.query(
      `SELECT o.*, u.username AS buyer_name
       FROM orders o
       JOIN users u ON o.buyer_id = u.user_id
       WHERE o.seller_id = ?
       ORDER BY o.order_date DESC`,
      [req.user.user_id]
    );

    console.log('✅ Orders found for seller:', rows.length);
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error fetching seller orders:', err);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
};

// -------------------------
// Create order
// Body: { items:[{product_id, quantity, price}], total_amount, delivery_address }
// -------------------------
exports.createOrder = async (req, res) => {
  console.log('📦 createOrder body:', req.body);
  console.log('🔐 user in req.user:', req.user);

  const { items, total_amount, delivery_address } = req.body;

  // Validate request body
  if (!Array.isArray(items) || items.length === 0) {
    console.warn('⚠️ Validation failed: Items are required.');
    return res.status(400).json({ message: 'Items are required.' });
  }
  if (typeof total_amount === 'undefined' || total_amount === null) {
    console.warn('⚠️ Validation failed: total_amount is required.');
    return res.status(400).json({ message: 'total_amount is required.' });
  }
  if (!delivery_address || !delivery_address.trim()) {
    console.warn('⚠️ Validation failed: delivery_address is required.');
    return res.status(400).json({ message: 'delivery_address is required.' });
  }

  try {
    console.log('🔄 BEGIN TRANSACTION');
    await db.query('START TRANSACTION');

    // Insert order into the `orders` table
    const [orderResult] = await db.query(
      'INSERT INTO orders (buyer_id, total_amount, delivery_address, status) VALUES (?, ?, ?, ?)',
      [req.user.user_id, total_amount, delivery_address, 'pending']
    );

    const orderId = orderResult.insertId;
    console.log('🆔 New order_id:', orderId);

    // Insert order items into the `order_items` table
    for (const it of items) {
      const pid = Number(it.product_id);
      const qty = Number(it.quantity);
      const price = Number(it.price);

      if (!pid || !qty || Number.isNaN(price)) {
        console.warn('⚠️ Skipping invalid item:', it);
        continue;
      }

      console.log(`   ↳ Adding item to order: product ${pid}, qty ${qty}, price ${price}`);
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time_of_order) VALUES (?, ?, ?, ?)',
        [orderId, pid, qty, price]
      );
    }

    // Commit the transaction
    await db.query('COMMIT');
    console.log('✅ COMMIT: order created:', orderId);
    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (err) {
    console.error('❌ Error creating order:', err);

    // Rollback the transaction in case of an error
    try {
      await db.query('ROLLBACK');
      console.log('↩️ ROLLBACK done');
    } catch (rollbackErr) {
      console.error('❌ Error during ROLLBACK:', rollbackErr);
    }

    res.status(500).json({ message: 'Failed to create order' });
  }
};
// -------------------------
// Admin: list all orders
// -------------------------
exports.getAllOrders = async (_req, res) => {
  try {
    console.log('🗂️ Admin getAllOrders');
    const [rows] = await db.query(
      `SELECT o.*,
              u.username AS buyer_name,
              s.username AS seller_name
       FROM orders o
       JOIN users u ON o.buyer_id = u.user_id
       LEFT JOIN users s ON o.seller_id = s.user_id
       ORDER BY o.order_date DESC`
    );
    console.log('✅ Orders total:', rows.length);
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error fetching all orders:', err);
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

  console.log(`✏️ Update order ${orderId} -> ${status}`);

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const [r] = await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, orderId]
    );

    if (r.affectedRows === 0) {
      console.warn('⚠️ Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('✅ Status updated for order:', orderId);
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error('❌ Error updating order status:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};
