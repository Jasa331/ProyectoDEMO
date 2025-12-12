require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./config/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const multer = require('multer');
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");


const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "HTML")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/uploads", express.static("uploads"));

// Configurar almacenamiento de imágenes
const uploadsDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e6);
    const safe = file.originalname.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_\.\-]/g,'');
    cb(null, `${unique}-${safe}`);
  }
});
const upload = multer({ storage });


// Test de conexión DB
(async () => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    console.log('✅ Conexión a BD OK:', r[0]);
  } catch (err) {
    console.error('❌ Error al conectar BD:', err.message);
  }
})();

app.get('/usuarios/mis-creados', authenticateToken, async (req, res) => {
  try {
    const ID_Creador = req.user?.ID_Usuario;
    if (!ID_Creador) {
      return res.status(401).json({ ok: false, error: "No autorizado (ID_Creador no encontrado)" });
    }
    const [rows] = await pool.query('SELECT ID_Usuario, Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Estado FROM Usuario WHERE ID_Creador = ?', [ID_Creador]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT ID_Usuario, Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Estado FROM Usuario');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST usuario (requiere token para capturar ID_Creador)
app.post('/usuarios', authenticateToken, async (req, res) => {
  try {
    const { Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Contrasena } = req.body;

    // ID del usuario que crea (ADMIN)
    const ID_Creador = req.user?.ID_Usuario;

    if (!ID_Creador) {
      return res.status(401).json({ ok: false, error: "No autorizado (ID_Creador no encontrado)" });
    }

    if (!Usuario_Nombre || !Usuario_Apellido || !Direccion || !Telefono || !Rol || !Correo || !Contrasena) {
      return res.status(400).json({ ok: false, error: "Faltan campos" });
    }

    const [exist] = await pool.query(
      "SELECT ID_Usuario FROM Usuario WHERE Correo = ?",
      [Correo]
    );

    if (exist.length > 0) {
      return res.status(400).json({ ok: false, error: "Correo ya registrado" });
    }

    const hashedPassword = await bcrypt.hash(Contrasena, saltRounds);

    const sql = `
      INSERT INTO Usuario 
      (ID_Creador, Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Contrasena, Estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const [result] = await pool.query(sql, [
      ID_Creador,
      Usuario_Nombre,
      Usuario_Apellido,
      Direccion,
      Telefono,
      Rol,
      Correo,
      hashedPassword
    ]);

    res.json({
      ok: true,
      message: "Usuario creado",
      ID_Usuario: result.insertId,
      ID_Creador
    });

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

// Middleware para verificar token
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      console.warn('authenticateToken: falta Authorization header');
      return res.status(401).json({ ok: false, error: 'Token requerido' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.warn('authenticateToken: header mal formado:', authHeader);
      return res.status(401).json({ ok: false, error: 'Formato Authorization inválido' });
    }

    const token = parts[1];
    // log temporal para depuración
    console.log('authenticateToken: token recibido (primeros 20 chars):', token?.slice(0,20));

    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err) {
        console.warn('authenticateToken: verificación falló:', err.message);
        return res.status(403).json({ ok: false, error: 'Token inválido' });
      }
      req.user = payload;
      next();
    });
  } catch (ex) {
    console.error('authenticateToken excepción:', ex);
    res.status(500).json({ ok: false, error: 'Error en autenticación' });
  }
}

// Modificar /login: firmar token y devolverlo
app.post('/login', async (req, res) => {
  try {
    const { Correo, Contrasena } = req.body;
    if (!Correo || !Contrasena) return res.status(400).json({ ok: false, error: 'Faltan credenciales' });

    const [rows] = await pool.query("SELECT ID_Usuario, Usuario_Nombre, Rol, Contrasena FROM usuario WHERE Correo = ?", [Correo]);
    if (!rows || rows.length === 0) return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos' });

    const user = rows[0];
    const match = await bcrypt.compare(Contrasena, user.Contrasena);
    if (!match) return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos' });

    const payload = { ID_Usuario: user.ID_Usuario, Usuario_Nombre: user.Usuario_Nombre, Rol: user.Rol };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({ ok: true, user: payload, token });
  } catch (err) {
    console.error("Error /login:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/perfil/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Usar 'pool' (el connection pool) y la tabla correcta 'Usuario'
    const [rows] = await pool.query(
      `SELECT 
          ID_Usuario,
          Usuario_Nombre,
          Usuario_Apellido,
          Telefono,
          Direccion,
          Correo,
          Rol,
          Estado,
          Fecha_Registro,
          Ultimo_Acceso
       FROM Usuario 
       WHERE ID_Usuario = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    res.json({ ok: true, usuario: rows[0] });

  } catch (error) {
    console.error("ERROR PERFIL:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
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

// Ingresar proveedor de insumo
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

// mirar los proiveedores de insumo
app.get("/proveedor", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Proveedor_Insumo");
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener proveedores:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: eliminar insumo
app.delete("/insumo/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM Insumo WHERE ID_Insumo = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/insumo", authenticateToken, async (req, res) => {
  try {
    const {
      Nombre, Tipo, Descripcion, Unidad_Medida,
      Cantidad, Fecha_Caducidad, Fecha_Registro, ID_Ingreso_Insumo
    } = req.body;

    const ID_Usuario = req.user?.ID_Usuario;
    if (!Nombre || typeof Cantidad === 'undefined' || !ID_Usuario) {
      return res.status(400).json({ ok: false, error: "Faltan campos requeridos (Nombre, Cantidad, ID_Usuario)" });
    }

    await pool.query(
      `INSERT INTO Insumo 
        (Nombre, Tipo, Descripcion, Unidad_Medida, Cantidad, Fecha_Caducidad, Fecha_Registro, ID_Ingreso_Insumo, ID_Usuario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Nombre, Tipo, Descripcion, Unidad_Medida, Cantidad, Fecha_Caducidad, Fecha_Registro, ID_Ingreso_Insumo, ID_Usuario]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error al insertar insumo:", err);
    // detectar FK para mensaje más claro
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ ok: false, error: "ID_Usuario no existe en la tabla usuario" });
    }
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT: actualizar insumo (también tomar ID_Usuario desde token)
app.put("/insumo/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Nombre, Tipo, Descripcion, Unidad_Medida,
      Cantidad, Fecha_Caducidad, Fecha_Registro, ID_Ingreso_Insumo
    } = req.body;

    const ID_Usuario = req.user?.ID_Usuario;
    if (!ID_Usuario) {
      return res.status(401).json({ ok: false, error: "Usuario no autenticado en token." });
    }
    await pool.query(
      `UPDATE Insumo SET Nombre=?, Tipo=?, Descripcion=?, Unidad_Medida=?, Cantidad=?,
       Fecha_Caducidad=?, Fecha_Registro=?, ID_Ingreso_Insumo=?, ID_Usuario=? WHERE ID_Insumo=?`,
      [Nombre, Tipo, Descripcion, Unidad_Medida, Cantidad, Fecha_Caducidad, Fecha_Registro, ID_Ingreso_Insumo, ID_Usuario, id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error al actualizar insumo:", err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ ok: false, error: "ID_Usuario no existe en la tabla usuario" });
    }
    res.status(500).json({ ok: false, error: err.message });
  }
});


// GET: listar todos los insumos
app.get("/insumos", authenticateToken, async (req, res) => {
  try {
    const ID_Usuario = req.user.ID_Usuario;

    const [rows] = await pool.query(
      "SELECT * FROM Insumo WHERE ID_Usuario = ?",
      [ID_Usuario]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error al obtener insumos:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});



// =============================
// RUTAS DEL CALENDARIO AGRÍCOLA
// =============================
// =============================
// OBTENER TODO EL CALENDARIO
// =============================
app.get("/calendario", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cs.ID_Calendario, cs.ID_Producto, cs.ID_Usuario,
             p.Nombre AS Producto,
             cs.Fecha_Inicio_Siembra, cs.Fecha_Fin_Siembra, cs.Fecha_Cosecha,
             cs.Estado, cs.Ubicacion, cs.Notas
      FROM Calendario_Siembra cs
      LEFT JOIN Producto p ON cs.ID_Producto = p.ID_Producto
      ORDER BY cs.ID_Calendario DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error("Error al obtener calendario:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});
// =============================
app.get("/calendario/cultivos", authenticateToken, async (req, res) => {
  try {
    const ID_Usuario = req.user?.ID_Usuario;

    if (!ID_Usuario) {
      return res.status(400).json({ ok: false, message: "ID_Usuario no encontrado" });
    }

    const [rows] = await pool.query(
      `SELECT p.Nombre AS Producto, cs.Ubicacion, cs.Estado
       FROM Calendario_Siembra cs
       JOIN Producto p ON cs.ID_Producto = p.ID_Producto
       WHERE cs.ID_Usuario = ?`,
      [ID_Usuario]
    );

    res.json({ ok: true, cultivos: rows });

  } catch (err) {
    res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
});


// =============================
// INSERTAR UN REGISTRO
// =============================
app.post("/calendario", authenticateToken, async (req, res) => {
  try {
    const ID_Usuario = req.user.ID_Usuario || req.user.id;

    const {
      ID_Producto,
      Fecha_Inicio_Siembra,
      Fecha_Fin_Siembra,
      Fecha_Cosecha,
      Estado,
      Ubicacion,
      Notas
    } = req.body;

    await pool.query(
      `INSERT INTO Calendario_Siembra
      (ID_Producto, ID_Usuario, Fecha_Inicio_Siembra, Fecha_Fin_Siembra,
       Fecha_Cosecha, Estado, Ubicacion, Notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_Producto,
        ID_Usuario,
        Fecha_Inicio_Siembra,
        Fecha_Fin_Siembra,
        Fecha_Cosecha,
        Estado,
        Ubicacion,
        Notas
      ]
    );

    res.json({ ok: true, message: "Registro agregado correctamente" });

  } catch (err) {
    console.error("Error POST /calendario:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// =============================
// ACTUALIZAR REGISTRO
// =============================
app.put("/calendario/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const ID_Usuario = req.user.ID_Usuario || req.user.id;

    const {
      ID_Producto,
      Fecha_Inicio_Siembra,
      Fecha_Fin_Siembra,
      Fecha_Cosecha,
      Estado,
      Ubicacion,
      Notas
    } = req.body;

    await pool.query(
      `UPDATE Calendario_Siembra SET
        ID_Producto = ?,
        ID_Usuario = ?,
        Fecha_Inicio_Siembra = ?,
        Fecha_Fin_Siembra = ?,
        Fecha_Cosecha = ?,
        Estado = ?,
        Ubicacion = ?,
        Notas = ?
      WHERE ID_Calendario = ?`,
      [
        ID_Producto,
        ID_Usuario,
        Fecha_Inicio_Siembra,
        Fecha_Fin_Siembra,
        Fecha_Cosecha,
        Estado,
        Ubicacion,
        Notas,
        id
      ]
    );

    res.json({ ok: true, message: "Registro actualizado correctamente" });

  } catch (err) {
    console.error("Error PUT /calendario/:id:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// =============================
// ELIMINAR REGISTRO
// =============================
app.delete("/calendario/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM Calendario_Siembra WHERE ID_Calendario = ?",
      [req.params.id]
    );

    res.json({ ok: true, message: "Registro eliminado correctamente" });

  } catch (err) {
    console.error("Error DELETE /calendario/:id:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});
// =============================
// OBTENER CULTIVOS SOLO DEL USUARIO LOGUEADO
// =============================
app.get("/calendario-Cultivos", authenticateToken, async (req, res) => {
  try {
    const ID_Usuario = req.user?.ID_Usuario || req.user?.id;

    if (!ID_Usuario) {
      return res.status(400).json({
        ok: false,
        message: "ID_Usuario no encontrado"
      });
    }

    const [rows] = await pool.query(
      `SELECT Producto, Ubicacion, Estado
       FROM Calendario_Siembra
       WHERE ID_Usuario = ?`,
      [ID_Usuario]
    );

    return res.json({
      ok: true,
      cultivos: rows
    });

  } catch (err) {
    console.error("Error en /calendario/mis-cultivos:", err);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});




// =============================
// RUTAS DE PRODUCTO
// =============================

// Obtener todos los productos
app.get("/producto", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Producto");
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /producto:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Obtener un producto por ID
app.get("/producto/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Producto WHERE ID_Producto = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en GET /producto/:id:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Crear producto
app.post("/producto", async (req, res) => {
  try {
    const { Nombre, Stock, Precio, ID_Usuario } = req.body;

    await pool.query(
      `INSERT INTO Producto (Nombre, Stock, Precio, ID_Usuario)
       VALUES (?, ?, ?, ?)`,
      [Nombre, Stock, Precio, ID_Usuario]
    );

    res.json({ ok: true, message: "Producto creado correctamente" });
  } catch (err) {
    console.error("Error en POST /producto:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar producto
app.put("/producto/:id", async (req, res) => {
  try {
    const { Nombre, Stock, Precio } = req.body;

    await pool.query(
      `UPDATE Producto 
       SET Nombre=?, Stock=?, Precio=? 
       WHERE ID_Producto=?`,
      [Nombre, Stock, Precio, req.params.id]
    );

    res.json({ ok: true, message: "Producto actualizado correctamente" });
  } catch (err) {
    console.error("Error en PUT /producto/:id:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar producto
app.delete("/producto/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM Producto WHERE ID_Producto = ?",
      [req.params.id]
    );

    res.json({ ok: true, message: "Producto eliminado" });
  } catch (err) {
    console.error("Error en DELETE /producto/:id:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// CRUD CALENDARIO AGRÍCOLA
// =============================


// Obtener todas las siembras
app.get("/calendario", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cs.ID_Calendario, cs.ID_Producto, cs.ID_Usuario,
             p.Nombre AS Producto,
             u.Nombre AS Usuario,
             cs.Fecha_Inicio_Siembra, cs.Fecha_Fin_Siembra, cs.Fecha_Cosecha,
             cs.Estado, cs.Ubicacion, cs.Notas
      FROM Calendario_Siembra cs
      LEFT JOIN Producto p ON cs.ID_Producto = p.ID_Producto
      LEFT JOIN Usuario u ON cs.ID_Usuario = u.ID_Usuario
      ORDER BY cs.ID_Calendario DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error al obtener calendario:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// Obtener siembra por ID
app.get("/calendario/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM Calendario_Siembra WHERE ID_Calendario = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ ok: false, message: "Registro no encontrado" });

    res.json(rows[0]);

  } catch (err) {
    console.error("Error al obtener registro:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// Crear siembra
app.post("/calendario",authenticateToken, async (req, res) => {
  try {
    const {
      ID_Producto,
      ID_Usuario,
      Fecha_Inicio_Siembra,
      Fecha_Fin_Siembra,
      Fecha_Cosecha,
      Estado,
      Ubicacion,
      Notas
    } = req.body;

    await pool.query(
      `INSERT INTO Calendario_Siembra
      (ID_Producto, ID_Usuario, Fecha_Inicio_Siembra, Fecha_Fin_Siembra,
       Fecha_Cosecha, Estado, Ubicacion, Notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_Producto,
        ID_Usuario,
        Fecha_Inicio_Siembra,
        Fecha_Fin_Siembra,
        Fecha_Cosecha,
        Estado,
        Ubicacion,
        Notas
      ]
    );

    res.json({ ok: true, message: "Registro agregado correctamente" });

  } catch (err) {
    console.error("Error al insertar:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// Actualizar siembra
app.put("/calendario/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      ID_Producto,
      ID_Usuario,
      Fecha_Inicio_Siembra,
      Fecha_Fin_Siembra,
      Fecha_Cosecha,
      Estado,
      Ubicacion,
      Notas
    } = req.body;

    await pool.query(
      `UPDATE Calendario_Siembra SET
        ID_Producto = ?,
        ID_Usuario = ?,
        Fecha_Inicio_Siembra = ?,
        Fecha_Fin_Siembra = ?,
        Fecha_Cosecha = ?,
        Estado = ?,
        Ubicacion = ?,
        Notas = ?
      WHERE ID_Calendario = ?`,
      [
        ID_Producto,
        ID_Usuario,
        Fecha_Inicio_Siembra,
        Fecha_Fin_Siembra,
        Fecha_Cosecha,
        Estado,
        Ubicacion,
        Notas,
        id
      ]
    );

    res.json({ ok: true, message: "Registro actualizado correctamente" });

  } catch (err) {
    console.error("Error al actualizar:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// Eliminar siembra
app.delete("/calendario/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM Calendario_Siembra WHERE ID_Calendario=?", [
      req.params.id,
    ]);
    res.json({ ok: true, message: "Registro eliminado correctamente" });
  } catch (err) {
    console.error("Error DELETE /calendario/:id:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// =============================
// RUTAS PARA CARACTERÍSTICAS
// =============================

// Obtener todas las características
app.get("/caracteristicas", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Caracteristicas");
    res.json(rows);
  } catch (err) {
    console.error("Error GET /caracteristicas:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Obtener una característica por ID
app.get("/caracteristicas/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Caracteristicas WHERE ID_Caracteristica = ?",
      [req.params.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "No encontrada" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Error GET /caracteristicas/:id:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Crear característica
app.post("/caracteristicas", async (req, res) => {
  try {
    const {
      Unidad_Medida,
      Nombre,
      Cantidad_Maxima,
      Cantidad_Minima,
      Tiempo_Produccion,
      Temperatura,
      Humedad,
      Lluvias,
      Velocidad_Viento,
      ID_Producto
    } = req.body;

    await pool.query(
      `INSERT INTO Caracteristicas 
      (Unidad_Medida, Nombre, Cantidad_Maxima, Cantidad_Minima, Tiempo_Produccion,
      Temperatura, Humedad, Lluvias, Velocidad_Viento, ID_Producto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Unidad_Medida,
        Nombre,
        Cantidad_Maxima,
        Cantidad_Minima,
        Tiempo_Produccion,
        Temperatura,
        Humedad,
        Lluvias,
        Velocidad_Viento,
        ID_Producto
      ]
    );

    res.json({ ok: true, message: "Característica agregada" });
  } catch (err) {
    console.error("Error POST /caracteristicas:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar característica
app.put("/caracteristicas/:id", async (req, res) => {
  try {
    const {
      Unidad_Medida,
      Nombre,
      Cantidad_Maxima,
      Cantidad_Minima,
      Tiempo_Produccion,
      Temperatura,
      Humedad,
      Lluvias,
      Velocidad_Viento,
      ID_Producto
    } = req.body;

    await pool.query(
      `UPDATE Caracteristicas SET 
        Unidad_Medida=?, Nombre=?, Cantidad_Maxima=?, Cantidad_Minima=?, 
        Tiempo_Produccion=?, Temperatura=?, Humedad=?, Lluvias=?, 
        Velocidad_Viento=?, ID_Producto=?
       WHERE ID_Caracteristica=?`,
      [
        Unidad_Medida,
        Nombre,
        Cantidad_Maxima,
        Cantidad_Minima,
        Tiempo_Produccion,
        Temperatura,
        Humedad,
        Lluvias,
        Velocidad_Viento,
        ID_Producto,
        req.params.id
      ]
    );

    res.json({ ok: true, message: "Actualizada correctamente" });
  } catch (err) {
    console.error("Error PUT /caracteristicas:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar característica
app.delete("/caracteristicas/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM Caracteristicas WHERE ID_Caracteristica=?",
      [req.params.id]
    );

    res.json({ ok: true, message: "Eliminada correctamente" });
  } catch (err) {
    console.error("Error DELETE /caracteristicas:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ruta para crear reportes (requiere token; si quieres permitir envío sin token elimina `authenticateToken`)
app.post('/reportes', authenticateToken, upload.array('fotos', 8), async (req, res) => {
  try {
    const { Texto, ID_Agricultor } = req.body;

    // ID del empleado que envía el reporte (desde el token)
    const ID_Usuario = req.user?.ID_Usuario ?? null;

    if (!ID_Agricultor)
      return res.status(400).json({ ok: false, error: 'Falta ID_Agricultor' });

    if (!ID_Usuario)
      return res.status(401).json({ ok: false, error: 'Empleado no identificado (token inválido)' });

    // Validar que el destinatario exista y sea agricultor
    const [rowsAg] = await pool.query(
      'SELECT ID_Usuario, Rol FROM Usuario WHERE ID_Usuario = ?',
      [ID_Agricultor]
    );

    if (!rowsAg || rowsAg.length === 0)
      return res.status(400).json({ ok: false, error: 'El agricultor no existe' });

    if (String(rowsAg[0].Rol).toLowerCase() !== 'agricultor')
      return res.status(400).json({ ok: false, error: 'El usuario no es agricultor' });

    // INSERT usando la columna correcta: ID_Usuario
    const [result] = await pool.query(
      `INSERT INTO Reporte (ID_Usuario, ID_Destinatario, Texto)
       VALUES (?, ?, ?)`,
      [ID_Usuario, ID_Agricultor, Texto || null]
    );

    const reportId = result.insertId;

    // Guardar imágenes
    const files = req.files || [];
    for (const f of files) {
      const url = `/uploads/${f.filename}`;
      await pool.query(
        `INSERT INTO ReporteImagen (ReporteID, Filename, Url)
         VALUES (?, ?, ?)`,
        [reportId, f.filename, url]
      );
    }

    console.log(`Reporte creado id=${reportId} por empleado=${ID_Usuario} -> agricultor=${ID_Agricultor}`);

    return res.json({ ok: true, id: reportId });

  } catch (err) {
    console.error('Error POST /reportes:', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});


// Ruta para listar reportes (opcionalmente filtrados por destinatario)
// GET /reportes

app.get('/reportes/mis-reportes', authenticateToken, async (req, res) => {
  try {
    const ID_Usuario = req.user?.ID_Usuario;
    if (!ID_Usuario) {
      return res.status(401).json({ ok: false, error: 'No autorizado (ID_Usuario no encontrado en token)' });
    }
    // Traer los reportes y el nombre del agricultor destinatario
    const [rows] = await pool.query(`
      SELECT r.*, COALESCE(u.Usuario_Nombre, '') AS Usuario_Nombre, COALESCE(u.Usuario_Apellido, '') AS Usuario_Apellido
      FROM Reporte r
      LEFT JOIN Usuario u ON r.ID_Destinatario = u.ID_Usuario
      WHERE r.ID_Usuario = ?
    `, [ID_Usuario]);
    res.json({ ok: true, reportes: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/reportes', async (req, res) => {
  try {
    const destinatario = req.query.destinatario ? Number(req.query.destinatario) : null;

    let sql = `
      SELECT ID_Reporte, ID_Usuario, ID_Destinatario, Texto, CreatedAt
      FROM Reporte
    `;

    const params = [];
    if (destinatario) {
      sql += ' WHERE ID_Destinatario = ?';
      params.push(destinatario);
    }

    sql += ' ORDER BY CreatedAt DESC';

    const [reportes] = await pool.query(sql, params);

    const ids = reportes.map(r => r.ID_Reporte);
    let imagenes = [];

    if (ids.length > 0) {
      const [rowsImgs] = await pool.query(
        'SELECT ReporteID, Filename, Url FROM ReporteImagen WHERE ReporteID IN (?)',
        [ids]
      );
      imagenes = rowsImgs;
    }

    const mapaImgs = {};
    imagenes.forEach(img => {
      (mapaImgs[img.ReporteID] = mapaImgs[img.ReporteID] || []).push(img);
    });

    const salida = reportes.map(r => ({
      id: r.ID_Reporte,
      empleadoId: r.ID_Usuario,      // ← CORRECTO
      destinatarioId: r.ID_Destinatario,
      texto: r.Texto,
      createdAt: r.CreatedAt,
      imagenes: mapaImgs[r.ID_Reporte] || []
    }));

    res.json({ ok: true, reportes: salida });
  } catch (err) {
    console.error('Error GET /reportes:', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});


app.get("/api/agricultores", async (req, res) => {
  try {
    console.log("[GET /api/agricultores] buscando usuarios con rol 'agricultor' (case-insensitive)");

    const [rows] = await pool.query(
      "SELECT ID_Usuario, Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Estado FROM Usuario WHERE LOWER(COALESCE(Rol, '')) LIKE ?",
      ['%agricultor%']
    );

    if (!rows || rows.length === 0) {
      // fallback: devolver todos los usuarios si no se encontraron agricultores
      const [all] = await pool.query(
        "SELECT ID_Usuario, Usuario_Nombre, Usuario_Apellido, Direccion, Telefono, Rol, Correo, Estado FROM Usuario"
      );
      return res.json({ ok: true, agricultores: all, fallback: true });
    }

    res.json({ ok: true, agricultores: rows });
  } catch (error) {
    console.error("[GET /api/agricultores] error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// RUTAS DE GASTOS
app.post("/gastos", async (req, res) => {
  try {
    const { concepto, monto, categoria, fecha, ID_Usuario } = req.body;

    if (!concepto || !monto || !fecha || !ID_Usuario) {
      return res.status(400).json({ ok: false, error: "Faltan datos obligatorios" });
    }

    await pool.query(
      `INSERT INTO gastos (concepto, monto, categoria, fecha, ID_Usuario)
       VALUES (?, ?, ?, ?, ?)`,
      [concepto, monto, categoria, fecha, ID_Usuario]
    );

    res.json({ ok: true, msg: "Gasto registrado correctamente" });

  } catch (err) {
    res.status(500).json({ ok: false, error: "Error en el servidor", detalle: err });
  }
});

app.get("/gastos/usuario/:id", async (req, res) => {
  try {
    const ID_Usuario = req.params.id;

    const [rows] = await pool.query(
      "SELECT * FROM gastos WHERE ID_Usuario = ? ORDER BY fecha DESC",
      [ID_Usuario]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: "Error al obtener los gastos" });
  }
});

app.delete("/gastos/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM gastos WHERE id = ?", [id]);

    res.json({ ok: true, msg: "Gasto eliminado" });

  } catch (err) {
    res.status(500).json({ ok: false, error: "Error al eliminar el gasto" });
  }
});

app.put("/gastos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { concepto, monto, categoria, fecha } = req.body;

    await pool.query(
      `UPDATE gastos SET concepto = ?, monto = ?, categoria = ?, fecha = ?
       WHERE id = ?`,
      [concepto, monto, categoria, fecha, id]
    );

    res.json({ ok: true, msg: "Gasto actualizado" });

  } catch (err) {
    res.status(500).json({ ok: false, error: "Error al actualizar gasto" });
  }
});


// Ruta para exportar datos a PDF
app.get("/export/pdf", async (req, res) => {
  try {
    const { usuarios, gastos, proveedores } = req.query;

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reporte_agricord.pdf"'
    );

    doc.pipe(res);

    // Título
    doc.fontSize(18).text("Reporte Agricord", { align: "center" });
    doc.moveDown();

    // ================== USUARIOS ==================
    if (usuarios === "1") {
      const [rowsUsuarios] = await pool.query(
        "SELECT Usuario_Nombre, Usuario_Apellido, Correo, Rol FROM Usuario"
      );

      doc.fontSize(14).text("Usuarios", { underline: true });
      doc.moveDown(0.5);

      rowsUsuarios.forEach(u => {
        doc.fontSize(10).text(
          `- ${u.Usuario_Nombre} ${u.Usuario_Apellido} | ${u.Correo} | ${u.Rol}`
        );
      });

      doc.moveDown();
    }

    // ================== GASTOS ==================
    if (gastos === "1") {
      const [rowsGastos] = await pool.query(
        `SELECT g.concepto, g.monto, g.categoria, g.fecha, u.Usuario_Nombre
         FROM gastos g
         LEFT JOIN Usuario u ON g.ID_Usuario = u.ID_Usuario
         ORDER BY g.fecha DESC`
      );

      doc.addPage();
      doc.fontSize(14).text("Gastos", { underline: true });
      doc.moveDown(0.5);

      rowsGastos.forEach(g => {
        doc.fontSize(10).text(
          `- ${g.fecha} | ${g.concepto} | $${g.monto} | ${g.categoria} | ${g.Usuario_Nombre || "Sin usuario"}`
        );
      });

      doc.moveDown();
    }

    // ================== PROVEEDORES ==================
    if (proveedores === "1") {
      const [rowsProv] = await pool.query(
        "SELECT Nombre_Empresa, Nombre_Contacto, Ciudad, Telefono FROM proveedor"
      );

      doc.addPage();
      doc.fontSize(14).text("Proveedores", { underline: true });
      doc.moveDown(0.5);

      rowsProv.forEach(p => {
        doc.fontSize(10).text(
          `- ${p.Nombre_Empresa} | ${p.Nombre_Contacto} | ${p.Ciudad} | ${p.Telefono}`
        );
      });

      doc.moveDown();
    }

    doc.end();
  } catch (err) {
    console.error("Error generando PDF:", err);
    res.status(500).send("Error al generar PDF");
  }
});

// Ruta para exportar datos a Excel
app.get("/export/excel", async (req, res) => {
  try {
    const { usuarios, gastos, proveedores } = req.query;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Agricord";
    workbook.created = new Date();

    // ================== HOJA USUARIOS ==================
    if (usuarios === "1") {
      const [rowsUsuarios] = await pool.query(
        "SELECT Usuario_Nombre, Usuario_Apellido, Correo, Rol FROM Usuario"
      );

      const wsU = workbook.addWorksheet("Usuarios");
      wsU.addRow(["Nombre", "Apellido", "Correo", "Rol"]);

      rowsUsuarios.forEach(u => {
        wsU.addRow([
          u.Usuario_Nombre,
          u.Usuario_Apellido,
          u.Correo,
          u.Rol
        ]);
      });
    }

    // ================== HOJA GASTOS ==================
    if (gastos === "1") {
      const [rowsGastos] = await pool.query(
        `SELECT g.concepto, g.monto, g.categoria, g.fecha, u.Usuario_Nombre
         FROM gastos g
         LEFT JOIN Usuario u ON g.ID_Usuario = u.ID_Usuario
         ORDER BY g.fecha DESC`
      );

      const wsG = workbook.addWorksheet("Gastos");
      wsG.addRow(["Fecha", "Concepto", "Monto", "Categoría", "Usuario"]);

      rowsGastos.forEach(g => {
        wsG.addRow([
          g.fecha,
          g.concepto,
          g.monto,
          g.categoria,
          g.Usuario_Nombre || "Sin usuario"
        ]);
      });
    }

    // ================== HOJA PROVEEDORES ==================
    if (proveedores === "1") {
      const [rowsProv] = await pool.query(
        "SELECT Nombre_Empresa, Nombre_Contacto, Ciudad, Telefono FROM proveedor"
      );

      const wsP = workbook.addWorksheet("Proveedores");
      wsP.addRow(["Empresa", "Contacto", "Ciudad", "Teléfono"]);

      rowsProv.forEach(p => {
        wsP.addRow([
          p.Nombre_Empresa,
          p.Nombre_Contacto,
          p.Ciudad,
          p.Telefono
        ]);
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reporte_agricord.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error generando Excel:", err);
    res.status(500).send("Error al generar Excel");
  }
});


app.listen(port, () => console.log(`✅ Servidor corriendo en http://localhost:${port}`));