const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController.js'); // <-- ✅ Include this
//const verifyToken = require('../middleware/authMiddlewareMiddleware.js'); // ✅ This matches your working middleware
const upload = require('../middleware/uploadMiddleware.js'); // upload.js file
const verifyToken = require('../middleware/authMiddleware.js');
const requireRole = require('../middleware/roleMiddleware');

// Get all recipes
router.get('/', recipeController.getAllRecipes); 

// Get ingredients for a recipe
router.get('/:id/ingredients', recipeController.getRecipeIngredients);


// Add a new recipe (uses controller)
router.post('/', verifyToken, requireRole(['admin','seller']), upload.single('image'), recipeController.createRecipe);

// Delete recipe
router.delete('/:id', verifyToken, requireRole(['admin','seller']), recipeController.deleteRecipe); 

module.exports = router;
