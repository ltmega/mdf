const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken= require('../middleware/authMiddleware');

// Place an order
router.post('/', verifyToken, async (req, res) => {
  const { items, deliveryLocation } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await db.promise().query(
      'INSERT INTO orders (user_id, delivery_location, status) VALUES (?, ?, ?)',
      [userId, deliveryLocation, 'pending']
    );

    const orderId = result.insertId;

    for (let item of items) {
      await db.promise().query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)',
        [orderId, item.productId, item.quantity]
      );
    }

    res.status(201).json({ message: 'Order placed', orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's orders
router.get('/', verifyToken, async (req, res) => {
  try {
    const [orders] = await db.promise().query(
      'SELECT * FROM orders WHERE user_id = ?',
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
});

// Admin: get all orders
router.get('/all', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

  try {
    const [orders] = await db.promise().query(
      'SELECT o.*, u.name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.id DESC'
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: update order status
router.put('/:orderId/status', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

  const { status } = req.body;

  try {
    await db.promise().query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.orderId]
    );
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

module.exports = router;
