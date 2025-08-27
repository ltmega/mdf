const db = require('../config/db');

// ✅ Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY product_id DESC');
    res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Failed to retrieve products' });
  }
};

// ✅ Get products by seller ID
exports.getProductsBySeller = async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT * FROM products WHERE seller_id = ? ORDER BY product_id DESC',
      [req.params.sellerId]
    );
    res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching seller products:', err);
    res.status(500).json({ message: 'Failed to retrieve seller products' });
  }
};

// ✅ Create a product
exports.createProduct = async (req, res) => {
  if (req.user.user_role !== 'admin' && req.user.user_role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Admins and sellers only.' });
  }

  const { product_name, description, price_per_unit, unit, available_quantity } = req.body;
  const product_image_url = req.file?.filename;

  if (!product_name || !price_per_unit || !unit || !available_quantity || !product_image_url) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const sql = `
      INSERT INTO products 
      (seller_id, product_name, description, price_per_unit, unit, available_quantity, product_image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
      req.user.user_id,
      product_name,
      description || '',
      price_per_unit,
      unit,
      available_quantity,
      product_image_url,
    ]);
    res.status(201).json({ message: 'Product created successfully' });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Failed to add product' });
  }
};

// ✅ Update a product
exports.updateProduct = async (req, res) => {
  if (req.user.user_role !== 'admin' && req.user.user_role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Admins and sellers only.' });
  }

  const productId = req.params.id;
  const { product_name, description, price_per_unit, unit, available_quantity } = req.body;
  const product_image_url = req.file?.filename;

  try {
    const [products] = await db.query('SELECT seller_id FROM products WHERE product_id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];
    if (req.user.user_role !== 'admin' && product.seller_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied. You can only update your own products.' });
    }

    let sql, values;
    if (product_image_url) {
      sql = `
        UPDATE products 
        SET product_name = ?, description = ?, price_per_unit = ?, unit = ?, available_quantity = ?, product_image_url = ? 
        WHERE product_id = ?
      `;
      values = [product_name, description || '', price_per_unit, unit, available_quantity, product_image_url, productId];
    } else {
      sql = `
        UPDATE products 
        SET product_name = ?, description = ?, price_per_unit = ?, unit = ?, available_quantity = ? 
        WHERE product_id = ?
      `;
      values = [product_name, description || '', price_per_unit, unit, available_quantity, productId];
    }

    await db.query(sql, values);
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// ✅ Delete a product
exports.deleteProduct = async (req, res) => {
  if (req.user.user_role !== 'admin' && req.user.user_role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Admins and sellers only.' });
  }

  const productId = req.params.id;

  try {
    const [products] = await db.query('SELECT seller_id FROM products WHERE product_id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];
    if (req.user.user_role !== 'admin' && product.seller_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own products.' });
    }

    await db.query('DELETE FROM products WHERE product_id = ?', [productId]);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};