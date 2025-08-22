const db = require('../config/db');

// GET all recipes
exports.getAllRecipes = async (req, res) => {
  try {
    const [recipes] = await db.query('SELECT * FROM recipes ORDER BY recipe_id DESC');
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving recipes' });
  }
};

// CREATE recipe
exports.createRecipe = async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Admins and sellers only.' });
  }

  const { recipe_name, ingredients, instructions } = req.body;
  const image = req.file?.filename;

  if (!recipe_name || !ingredients || !instructions || !image) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    await db.query(
      'INSERT INTO recipes (user_id, recipe_name, ingredients, instructions, recipe_image_url) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, recipe_name, ingredients, instructions, image]
    );
    res.status(201).json({ message: 'Recipe created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving recipe', error: err });
  }
};

// DELETE recipe
exports.deleteRecipe = async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Admins and sellers only.' });
  }

  const recipeId = req.params.id;

  // Check if recipe belongs to user or user is admin
  try {
    const [recipes] = await db.query('SELECT user_id FROM recipes WHERE recipe_id = ?', [recipeId]);
    if (recipes.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    const recipe = recipes[0];
    if (req.user.role !== 'admin' && recipe.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own recipes.' });
    }

    await db.query('DELETE FROM recipes WHERE recipe_id = ?', [recipeId]);
    res.json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete recipe' });
  }
};
