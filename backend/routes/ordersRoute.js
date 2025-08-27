const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const ordersController = require('../controllers/ordersController');

// Buyer: Place an order
router.post(
  '/',
  (req, _res, next) => { console.log('📥 Incoming POST /api/orders'); next(); },
  verifyToken,
  ordersController.createOrder
);

// Buyer: Get user's orders
router.get('/user', verifyToken, ordersController.getOrdersByUser);

// Seller: Get seller's orders
router.get('/seller', verifyToken, ordersController.getOrdersBySeller);

// Admin: Get all orders
router.get('/admin', verifyToken, ordersController.getAllOrders);

// Admin: Update order status
router.put('/:orderId/status', verifyToken, ordersController.updateOrderStatus);

module.exports = router;
