const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const verifyToken = require('../middleware/authMiddleware');
const productController = require('../controllers/productsController');

// Public: Get all products
router.get('/', productController.getAllProducts);

// Admin: Add a new product (with image)
router.post('/', verifyToken, upload.single('image'), productController.createProduct);

// Admin: Delete a product by ID
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;
