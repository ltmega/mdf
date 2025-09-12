const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

// SQL to create tables
const createTablesSQL = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  address TEXT,
  location VARCHAR(100),
  user_role ENUM('customer', 'seller', 'admin') DEFAULT 'customer',
  profile_picture_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT,
  product_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20),
  available_quantity INT DEFAULT 0,
  product_image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(user_id)
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  recipe_name VARCHAR(100) NOT NULL,
  ingredients TEXT,
  instructions TEXT,
  recipe_image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2) NOT NULL,
  delivery_address TEXT,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  FOREIGN KEY (buyer_id) REFERENCES users(user_id)
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
  ingredient_name VARCHAR(100) NOT NULL,
  description TEXT,
  unit VARCHAR(20) DEFAULT 'piece',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recipe_ingredients table (junction table)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT,
  ingredient_id INT,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20),
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT NULL,
  ingredient_id INT NULL,
  quantity INT NOT NULL,
  price_at_time_of_order DECIMAL(10, 2) NOT NULL,
  item_type ENUM('product', 'ingredient') DEFAULT 'product',
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
);

-- Insert default admin user
INSERT IGNORE INTO users (username, email, password, user_role)
VALUES ('admin', 'admin@example.com', '$2a$10$8K1p/a0dURXAm7QiTRWuvec29q4uT5IfG/6YfK8CA0M3rrv1h6Khe', 'admin');

-- Insert common ingredients
INSERT IGNORE INTO ingredients (ingredient_name, description, unit) VALUES
('Chicken Breast', 'Fresh chicken breast meat', 'kg'),
('Chicken Thighs', 'Fresh chicken thigh meat', 'kg'),
('Chicken Wings', 'Fresh chicken wings', 'kg'),
('Salt', 'Table salt for seasoning', 'g'),
('Black Pepper', 'Ground black pepper', 'g'),
('Garlic', 'Fresh garlic cloves', 'piece'),
('Onion', 'Fresh onions', 'piece'),
('Ginger', 'Fresh ginger root', 'g'),
('Cooking Oil', 'Vegetable cooking oil', 'ml'),
('Flour', 'All-purpose flour', 'g'),
('Eggs', 'Fresh chicken eggs', 'piece'),
('Breadcrumbs', 'Bread crumbs for coating', 'g'),
('Soy Sauce', 'Dark soy sauce', 'ml'),
('Honey', 'Natural honey', 'ml'),
('Lemon', 'Fresh lemons', 'piece'),
('Tomatoes', 'Fresh tomatoes', 'piece'),
('Bell Peppers', 'Fresh bell peppers', 'piece'),
('Carrots', 'Fresh carrots', 'piece'),
('Potatoes', 'Fresh potatoes', 'piece'),
('Rice', 'White rice', 'g');
`;

async function setupDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Connected to MySQL database.');
    
    // Execute table creation SQL
    await connection.query(createTablesSQL);
    
    console.log('Database tables created successfully.');
    
    // Close connection
    await connection.end();
    
    console.log('Database setup completed.');
  } catch (error) {
    console.error('Error setting up database:', error);
    
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupDatabase();