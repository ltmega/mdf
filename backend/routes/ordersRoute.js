const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const ordersController = require('../controllers/ordersController');

// Place an order
router.post('/', verifyToken, ordersController.createOrder);

// Get user's orders
router.get('/user', verifyToken, ordersController.getOrdersByUser);

// Get seller's orders
router.get('/seller', verifyToken, ordersController.getOrdersBySeller);

// Get order items
router.get('/:orderId/items', verifyToken, ordersController.getOrderItems);

// Update order status (admin only)
router.put('/:orderId/status', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  ordersController.updateOrderStatus(req, res);
});

// Get all orders (admin only)
router.get('/admin', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  
  try {
    const [orders] = await db.query(`
      SELECT o.order_id, o.order_date, o.total_amount, o.status, u.username as customer_name
      FROM orders o
      JOIN users u ON o.buyer_id = u.user_id
      ORDER BY o.order_date DESC
    `);
    
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
});

module.exports = router;
