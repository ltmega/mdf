const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const db = require('./config/db.js');
const productRoutes = require('./routes/productsRoute.js');
const recipeRoutes = require('./routes/recipesRoute.js');
const orderRoutes = require('./routes/ordersRoute.js');
const profileRoutes = require('./routes/profileRoute.js');
const usersRoute = require('./routes/usersRoute.js');
const ingredientsRoute = require('./routes/ingredientsRoute.js');

const app = express();

// Middleware
const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false,
};
app.use(cors(corsOptions));
// Handle preflight requests safely in Express 5 (no wildcard patterns)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '');
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.sendStatus(204);
  }
  next();
});
app.use(helmet({ crossOriginResourcePolicy: false }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);
app.use(express.json());

// Serve uploads from outside backend
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// API routes
app.use('/api/products', productRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoute);
app.use('/api/ingredients', ingredientsRoute);

// Root endpoint
app.get('/', (req, res) => {
  res.send('MDF Chicken Market API is running');
});

// DB connection test
(async () => {
  try {
    const connection = await db.getConnection();
    connection.release();
    console.log('✅ Database connection OK');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  }
})();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});