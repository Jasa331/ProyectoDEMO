// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'AgricordDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// opcional: comprobar conexión al crear
(async () => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    console.log('🔁 pool DB ready:', r[0]);
  } catch (err) {
    console.error('❌ Error creando pool DB:', err.message);
  }
})();

module.exports = pool;
