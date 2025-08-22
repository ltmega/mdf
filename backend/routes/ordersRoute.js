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

module.exports = router;
