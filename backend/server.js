// backend/server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Import database connection
const db = require('./config/db.js');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productsRoute.js');
const recipeRoutes = require('./routes/recipesRoute.js'); // Ensure this matches your recent edits
const orderRoutes = require('./routes/ordersRoute.js');
const profileRoutes = require('./routes/profileRoute.js');
const usersRoute = require('./routes/usersRoute.js'); // Ensure this matches your recent edits

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500']
})); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded images

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoute); // Ensure this matches your recent edits

// Root endpoint
app.get('/', (req, res) => {
  res.send('MDF Chicken Market API is running');
});

// Test DB connection at server startup
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log(`Connected to MySQL as thread ID ${connection.threadId}`);
    connection.release(); // Return connection to pool
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
