const db = require('../config/db');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await db.promise().query('SELECT * FROM products ORDER BY id DESC');
    res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Failed to retrieve products' });
  }
};

// Create a product (admin only)
exports.createProduct = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const { name, description, price } = req.body;
  const image = req.file?.filename;

  if (!name || !price || !image) {
    return res.status(400).json({ message: 'Name, price, and image are required' });
  }

  try {
    const sql = 'INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)';
    await db.promise().query(sql, [name, description || '', price, image]);
    res.status(201).json({ message: 'Product created successfully' });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Failed to add product' });
  }
};

// Delete a product (admin only)
exports.deleteProduct = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const productId = req.params.id;

  try {
    const sql = 'DELETE FROM products WHERE id = ?';
    await db.promise().query(sql, [productId]);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};
