require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./config/db');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Middlewares
app.use(cors({ origin: "http://127.0.0.1:5500" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "HTML")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));

// Test de conexión DB
(async () => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    console.log('✅ Conexión a BD OK:', r[0]);
  } catch (err) {
    console.error('❌ Error al conectar BD:', err.message);
  }
})();

// GET usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT ID_Usuario, Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Estado FROM Usuario');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST usuario
app.post('/usuarios', async (req, res) => {
  try {
    const { Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Contrasena } = req.body;
    if (!Usuario_Nombre || !Usuario_Apellido || !Direccion || !Telefono || !Rol || !Correo || !Contrasena) {
      return res.status(400).json({ ok: false, error: "Faltan campos" });
    }

    const [exist] = await pool.query("SELECT ID_Usuario FROM Usuario WHERE Correo = ?", [Correo]);
    if (exist.length > 0) return res.status(400).json({ ok: false, error: "Correo ya registrado" });

    const hashedPassword = await bcrypt.hash(Contrasena, saltRounds);
    const sql = `INSERT INTO Usuario (Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Contrasena, Estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 1)`;
    const [result] = await pool.query(sql, [Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, hashedPassword]);
    res.json({ ok: true, message: "Usuario creado", id: result.insertId });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT usuario
app.put('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Contrasena } = req.body;

    let sql, params;
    if (Contrasena) {
      const hashedPassword = await bcrypt.hash(Contrasena, saltRounds);
      sql = `UPDATE Usuario SET Usuario_Nombre=?, Usuario_Apellido=?, Direccion=?, Telefono=?, Rol=?, Correo=?, Contrasena=? WHERE ID_Usuario=?`;
      params = [Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, hashedPassword, id];
    } else {
      sql = `UPDATE Usuario SET Usuario_Nombre=?, Usuario_Apellido=?, Direccion=?, Telefono=?, Rol=?, Correo=? WHERE ID_Usuario=?`;
      params = [Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, id];
    }

    await pool.query(sql, params);
    res.json({ ok: true, message: "Usuario actualizado" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE usuario
app.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM Usuario WHERE ID_Usuario=?", [id]);
    res.json({ ok: true, message: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { Correo, Contrasena } = req.body;
    if (!Correo || !Contrasena)
      return res.status(400).json({ ok: false, error: "Faltan credenciales" });

    const [rows] = await pool.query(
      "SELECT ID_Usuario, Usuario_Nombre, Rol, Contrasena FROM Usuario WHERE Correo=?",
      [Correo]
    );

    if (rows.length === 0)
      return res.status(401).json({ ok: false, error: "Correo o contraseña incorrectos" });

    const user = rows[0];
    const match = await bcrypt.compare(Contrasena, user.Contrasena);

    if (!match)
      return res.status(401).json({ ok: false, error: "Correo o contraseña incorrectos" });

    delete user.Contrasena;
    
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"Seguridad del Sistema" <${process.env.EMAIL_USER}>`,
        to: Correo,
        subject: "🔐 Nuevo inicio de sesión detectado",
        html: `
          <h2>Inicio de sesión exitoso</h2>
          <p>Hola <b>${user.Usuario_Nombre}</b>,</p>
          <p>Se detectó un inicio de sesión en tu cuenta el <b>${new Date().toLocaleString()}</b>.</p>
          <p>Si fuiste tú, no es necesario hacer nada.</p>
          <p>Si no reconoces esta actividad, cambia tu contraseña de inmediato.</p>
          <hr/>
          <p>Atentamente,<br>Equipo de Seguridad</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Correo enviado a ${Correo}`);
    } catch (error) {
      console.error("❌ Error al enviar correo:", error.message);
    }

    res.json({ ok: true, user });

  } catch (err) {
    console.error("❌ Error en /login:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// Cambiar contraseña
app.post("/api/cambiar-contrasena", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación
    if (!email || !password) {
      return res.status(400).json({ message: "Faltan datos" });
    }
    
    const hashed = await bcrypt.hash(password, 10);

    const sql = "UPDATE Usuario SET Contrasena = ? WHERE Correo = ?";
    const [result] = await pool.query(sql, [hashed, email]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log("✅ Contraseña actualizada para:", email);
    res.status(200).json({ message: "✅ Contraseña actualizada correctamente" });

  } catch (error) {
    console.error("❌ Error en /api/cambiar-contrasena:", error);
    res.status(500).json({ message: "Error interno del servidor", detail: error.message });
  }
});

app.post("/proveedor", async (req, res) => {
  try {
    const {
      Ciudad,
      Telefono,
      Direccion,
      Nombre_Empresa,
      Nombre_Contacto,
      Region,
      Cod_Postal,
      ID_Ingreso_Insumo,
    } = req.body;

    await pool.query(
      `INSERT INTO Proveedor_Insumo 
      (Ciudad, Telefono, Direccion, Nombre_Empresa, Nombre_Contacto, Region, Cod_Postal, ID_Ingreso_Insumo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Ciudad,
        Telefono,
        Direccion,
        Nombre_Empresa,
        Nombre_Contacto,
        Region,
        Cod_Postal,
        ID_Ingreso_Insumo,
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error al registrar proveedor:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

  












app.listen(port, () => console.log(`✅ Servidor corriendo en http://localhost:${port}`));
