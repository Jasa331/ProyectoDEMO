
// server.js
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const app = express();
const port = 3000;

// Middleware para analizar el cuerpo de las solicitudes
app.use(express.json());

app.use(cors());
app.use(express.json());

// Ruta de prueba para verificar conexión
app.get('/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS fecha');
    res.json({ ok: true, fecha: rows[0].fecha });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Ejemplo: obtener todos los registros de una tabla llamada "usuarios"
app.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
