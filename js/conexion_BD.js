const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Agrega tu contraseña si es necesario
    database: 'AgricordDB',
};

app.post('/api/register', async (req, res) => {
    const { Usuario_Nombre, Usuario_Apellido, Correo, Telefono, Rol, Direccion, Contraseña } = req.body;

    if (!Usuario_Nombre || !Usuario_Apellido || !Correo || !Contraseña || !Rol || !Direccion) {
        return res.status(400).json({ success: false, message: 'Faltan datos de registro.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute('SELECT Correo FROM Usuario WHERE Correo = ?', [Correo]);

        if (rows.length > 0) {
            connection.end();
            return res.status(409).json({ success: false, message: 'El correo ya está registrado.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(Contraseña, saltRounds);

        const sql = 'INSERT INTO Usuario (Usuario_Nombre, Usuario_Apellido, Correo, Telefono, Rol, Direccion, Contraseña, Estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        
        await connection.execute(sql, [Usuario_Nombre, Usuario_Apellido, Correo, Telefono, Rol, Direccion, hashedPassword, true]);
        connection.end();

        res.status(201).json({ success: true, message: 'Usuario registrado con éxito.' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
