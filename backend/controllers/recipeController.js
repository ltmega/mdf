const db = require('../config/db');

// GET all recipes
exports.getAllRecipes = async (req, res) => {
  try {
    const [recipes] = await db.promise().query('SELECT * FROM recipes ORDER BY id DESC');
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving recipes' });
  }
};

// CREATE recipe
exports.createRecipe = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

  const { title, description } = req.body;
  const image = req.file?.filename;

  if (!title || !description || !image) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    await db.promise().query(
      'INSERT INTO recipes (title, description, image) VALUES (?, ?, ?)',
      [title, description, image]
    );
    res.status(201).json({ message: 'Recipe created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving recipe', error: err });
  }
};

// DELETE recipe
exports.deleteRecipe = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

  try {
    await db.promise().query('DELETE FROM recipes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete recipe' });
  }
};
