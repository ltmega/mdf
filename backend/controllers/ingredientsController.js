const db = require('../config/db');

// Get all ingredients
exports.getAllIngredients = async (req, res) => {
  try {
    const [ingredients] = await db.query('SELECT * FROM ingredients ORDER BY ingredient_name ASC');
    res.status(200).json(ingredients);
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ message: 'Failed to retrieve ingredients' });
  }
};

// Get ingredients for a specific recipe
exports.getRecipeIngredients = async (req, res) => {
  try {
    const recipeId = req.params.recipeId;
    
    const [ingredients] = await db.query(`
      SELECT i.*, ri.quantity, ri.unit as recipe_unit
      FROM ingredients i
      JOIN recipe_ingredients ri ON i.ingredient_id = ri.ingredient_id
      WHERE ri.recipe_id = ?
      ORDER BY i.ingredient_name ASC
    `, [recipeId]);
    
    res.status(200).json(ingredients);
  } catch (err) {
    console.error('Error fetching recipe ingredients:', err);
    res.status(500).json({ message: 'Failed to retrieve recipe ingredients' });
  }
};

// Create a new ingredient (admin only)
exports.createIngredient = async (req, res) => {
  if (req.user.user_role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const { ingredient_name, description, unit } = req.body;

  if (!ingredient_name) {
    return res.status(400).json({ message: 'Ingredient name is required.' });
  }

  try {
    await db.query(
      'INSERT INTO ingredients (ingredient_name, description, unit) VALUES (?, ?, ?)',
      [ingredient_name, description || '', unit || 'piece']
    );
    res.status(201).json({ message: 'Ingredient created successfully' });
  } catch (err) {
    console.error('Error creating ingredient:', err);
    res.status(500).json({ message: 'Failed to create ingredient' });
  }
};

// Update ingredient (admin only)
exports.updateIngredient = async (req, res) => {
  if (req.user.user_role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const ingredientId = req.params.id;
  const { ingredient_name, description, unit } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE ingredients SET ingredient_name = ?, description = ?, unit = ? WHERE ingredient_id = ?',
      [ingredient_name, description || '', unit || 'piece', ingredientId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.status(200).json({ message: 'Ingredient updated successfully' });
  } catch (err) {
    console.error('Error updating ingredient:', err);
    res.status(500).json({ message: 'Failed to update ingredient' });
  }
};

// Delete ingredient (admin only)
exports.deleteIngredient = async (req, res) => {
  if (req.user.user_role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const ingredientId = req.params.id;

  try {
    const [result] = await db.query('DELETE FROM ingredients WHERE ingredient_id = ?', [ingredientId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.status(200).json({ message: 'Ingredient deleted successfully' });
  } catch (err) {
    console.error('Error deleting ingredient:', err);
    res.status(500).json({ message: 'Failed to delete ingredient' });
  }
};