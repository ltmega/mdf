const db = require('../config/db');

// Get orders by seller ID
exports.getOrdersBySeller = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.order_id, o.order_date, o.total_amount, o.status, u.username as customer_name
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN users u ON o.buyer_id = u.user_id
      WHERE p.seller_id = ?
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `, [req.user.id]);
    
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
};

// Get orders by user ID
exports.getOrdersByUser = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.order_id, o.order_date, o.total_amount, o.status, o.delivery_address
      FROM orders o
      WHERE o.buyer_id = ?
      ORDER BY o.order_date DESC
    `, [req.user.id]);
    
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
};

// Get order items by order ID
exports.getOrderItems = async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT oi.quantity, oi.price_at_time_of_order, p.product_name, p.product_image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [req.params.orderId]);
    
    res.status(200).json(items);
  } catch (err) {
    console.error('Error fetching order items:', err);
    res.status(500).json({ message: 'Failed to retrieve order items' });
  }
};

// Create a new order
exports.createOrder = async (req, res) => {
  const { items, totalAmount, deliveryAddress } = req.body;
  
  if (!items || !totalAmount || !deliveryAddress) {
    return res.status(400).json({ message: 'Items, total amount, and delivery address are required' });
  }
  
  try {
    // Start transaction
    await db.query('START TRANSACTION');
    
    // Create order
    const [orderResult] = await db.query(
      'INSERT INTO orders (buyer_id, total_amount, delivery_address) VALUES (?, ?, ?)',
      [req.user.id, totalAmount, deliveryAddress]
    );
    
    const orderId = orderResult.insertId;
    
    // Create order items
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time_of_order) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (err) {
    // Rollback transaction
    await db.query('ROLLBACK');
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.orderId;
  
  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }
  
  try {
    await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};