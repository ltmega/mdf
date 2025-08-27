const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const db = require('./config/db.js');
const productRoutes = require('./routes/productsRoute.js');
const recipeRoutes = require('./routes/recipesRoute.js');
const orderRoutes = require('./routes/ordersRoute.js');
const profileRoutes = require('./routes/profileRoute.js');
const usersRoute = require('./routes/usersRoute.js');

const app = express();

// Middleware
const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

// Serve uploads from outside backend
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend/public')));

// API routes
app.use('/api/products', productRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoute);

// Root endpoint
app.get('/', (req, res) => {
  res.send('MDF Chicken Market API is running');
});

// DB connection test
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log(`✅ Connected to MySQL as thread ID ${connection.threadId}`);
    connection.release();
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});