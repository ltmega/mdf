const express = require('express');
const router = express.Router();
const ingredientsController = require('../controllers/ingredientsController');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Get all ingredients
router.get('/', ingredientsController.getAllIngredients);

// Get ingredients for a specific recipe
router.get('/recipe/:recipeId', ingredientsController.getRecipeIngredients);

// Create ingredient (admin only)
router.post('/', verifyToken, requireRole(['admin']), ingredientsController.createIngredient);

// Update ingredient (admin only)
router.put('/:id', verifyToken, requireRole(['admin']), ingredientsController.updateIngredient);

// Delete ingredient (admin only)
router.delete('/:id', verifyToken, requireRole(['admin']), ingredientsController.deleteIngredient);

module.exports = router;