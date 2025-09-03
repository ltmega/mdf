const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const ordersController = require('../controllers/ordersController');
const requireRole = require('../middleware/roleMiddleware');

// Buyer: Place an order
router.post('/', verifyToken, requireRole(['customer','admin','seller']), ordersController.createOrder);

// Buyer: Get user's orders
router.get('/user', verifyToken, ordersController.getOrdersByUser);

// Seller: Get seller's orders
router.get('/seller', verifyToken, requireRole(['seller','admin']), ordersController.getOrdersBySeller);

// Admin: Get all orders
router.get('/admin', verifyToken, requireRole(['admin']), ordersController.getAllOrders);

// Admin: Update order status
router.put('/:orderId/status', verifyToken, requireRole(['admin']), ordersController.updateOrderStatus);

// Get order items
router.get('/:orderId/items', verifyToken, ordersController.getOrderItems);

module.exports = router;
