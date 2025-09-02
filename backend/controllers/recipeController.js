const db = require('../config/db');

// Get all recipes with creator's username
exports.getAllRecipes = async (req, res) => {
  try {
    const [recipes] = await db.query(`
      SELECT r.*, u.username
      FROM recipes r
      LEFT JOIN users u ON r.user_id = u.user_id
      ORDER BY r.recipe_id DESC
    `);
    res.status(200).json(recipes);
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ message: 'Failed to retrieve recipes' });
  }
};


// Create a recipe
exports.createRecipe = async (req, res) => {
  if (req.user.user_role !== 'admin' && req.user.user_role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Admins and sellers only.' });
  }

  const { recipe_name, ingredients, instructions } = req.body;
  const recipe_image_url = req.file ? `/uploads/${req.file.filename}` : undefined;

  if (!recipe_name || !ingredients || !instructions || !recipe_image_url) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    await db.query(
      'INSERT INTO recipes (user_id, recipe_name, ingredients, instructions, recipe_image_url) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, recipe_name, ingredients, instructions, recipe_image_url]
    );
    res.status(201).json({ message: 'Recipe created successfully' });
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).json({ message: 'Failed to create recipe' });
  }
};

// Delete a recipe
exports.deleteRecipe = async (req, res) => {
  if (req.user.user_role !== 'admin' && req.user.user_role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Admins and sellers only.' });
  }

  const recipeId = req.params.id;

  try {
    const [recipes] = await db.query('SELECT user_id FROM recipes WHERE recipe_id = ?', [recipeId]);
    if (recipes.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const recipe = recipes[0];
    if (req.user.user_role !== 'admin' && recipe.user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own recipes.' });
    }

    await db.query('DELETE FROM recipes WHERE recipe_id = ?', [recipeId]);
    res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ message: 'Failed to delete recipe' });
  }
};

exports.getRecipeIngredients = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT ingredients FROM recipes WHERE recipe_id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json({ ingredients: rows[0].ingredients });
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ message: 'Failed to fetch ingredients' });
  }
};

