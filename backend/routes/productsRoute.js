const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const verifyToken = require('../middleware/authMiddleware');
const productController = require('../controllers/productsController');
const requireRole = require('../middleware/roleMiddleware');

// Public: Get all products
router.get('/', productController.getAllProducts);

// Public: Get products by seller ID
router.get('/seller/:sellerId', productController.getProductsBySeller);

// Seller/Admin: Add a new product (with image)
router.post('/', verifyToken, requireRole(['admin','seller']), upload.single('image'), productController.createProduct);

// Seller/Admin: Update a product by ID (with optional image)
router.put('/:id', verifyToken, requireRole(['admin','seller']), upload.single('image'), productController.updateProduct);

// Seller/Admin: Delete a product by ID
router.delete('/:id', verifyToken, requireRole(['admin','seller']), productController.deleteProduct);

module.exports = router;