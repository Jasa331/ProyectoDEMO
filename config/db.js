const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',     
  user: 'root',          
  password: '',          // pon tu clave si tienes
  database: 'AgricordDB',   // pon el nombre de tu BD
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
