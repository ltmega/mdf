const mysql = require('mysql2/promise'); // ✅ Use promise-based version

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,
});

module.exports = pool; // ✅ Now pool.query(...) returns a promise