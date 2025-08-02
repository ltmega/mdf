const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController.js'); // <-- ✅ Include this
//const verifyToken = require('../middleware/authMiddlewareMiddleware.js'); // ✅ This matches your working middleware
const upload = require('../middleware/uploadMiddleware.js'); // ✅ This should be your upload.js file
const verifyToken = require('../middleware/authMiddleware.js');

// Get all recipes
router.get('/', recipeController.getAllRecipes); // Make sure this exists in the controller

// Add a new recipe (uses controller)
router.post('/', verifyToken, upload.single('image'), recipeController.createRecipe);

// Delete recipe
router.delete('/:id', verifyToken, recipeController.deleteRecipe); // Make sure this also exists in the controller

module.exports = router;
