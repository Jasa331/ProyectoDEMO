require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./config/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Middlewares
app.use(cors({ origin: "*" }));
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

// PUT: actualizar un insumo existente
app.put("/insumo/:id", async (req, res) => {
  const { id } = req.params;
  const {
    Nombre,
    Tipo,
    Descripcion,
    Unidad_Medida,
    Cantidad,
    Fecha_Caducidad,
    Fecha_Registro,
    ID_Ingreso_Insumo,
    ID_Usuario,
  } = req.body;

  try {
    await pool.query(
      `UPDATE Insumo 
       SET Nombre = ?, Tipo = ?, Descripcion = ?, Unidad_Medida = ?, Cantidad = ?, 
           Fecha_Caducidad = ?, Fecha_Registro = ?, ID_Ingreso_Insumo = ?, ID_Usuario = ?
       WHERE ID_Insumo = ?`,
      [
        Nombre,
        Tipo,
        Descripcion,
        Unidad_Medida,
        Cantidad,
        Fecha_Caducidad,
        Fecha_Registro,
        ID_Ingreso_Insumo,
        ID_Usuario,
        id,
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error al actualizar insumo:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// DELETE: eliminar insumo
app.delete("/insumo/:id", async (req, res) => {
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
app.get("/insumos", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Insumo");
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener insumos:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// =============================
// RUTAS DEL CALENDARIO AGRÍCOLA
// =============================

// Obtener todos los registros
app.get("/calendario", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cs.ID_Calendario, cs.ID_Producto, p.Nombre AS Producto,
             cs.Fecha_Inicio_Siembra, cs.Fecha_Fin_Siembra, cs.Fecha_Cosecha
      FROM Calendario_Siembra cs
      LEFT JOIN Producto p ON cs.ID_Producto = p.ID_Producto
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener calendario:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// Insertar un nuevo registro
app.post("/calendario", async (req, res) => {
  try {
    const { ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha } = req.body;
    await pool.query(
      `INSERT INTO Calendario_Siembra (ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha)
       VALUES (?, ?, ?, ?)`,
      [ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha]
    );
    res.json({ ok: true, message: "Registro agregado correctamente" });
  } catch (err) {
    console.error("Error al insertar:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Actualizar un registro
app.put("/calendario/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha } = req.body;
    await pool.query(
      `UPDATE Calendario_Siembra
       SET ID_Producto=?, Fecha_Inicio_Siembra=?, Fecha_Fin_Siembra=?, Fecha_Cosecha=?
       WHERE ID_Calendario=?`,
      [ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha, id]
    );
    res.json({ ok: true, message: "Registro actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Eliminar un registro
app.delete("/calendario/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM Calendario_Siembra WHERE ID_Calendario=?", [id]);
    res.json({ ok: true, message: "Registro eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar:", err.message);
    res.status(500).json({ ok: false, error: err.message });
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
      SELECT cs.ID_Calendario, cs.ID_Producto, p.Nombre AS Producto,
             cs.Fecha_Inicio_Siembra, cs.Fecha_Fin_Siembra, cs.Fecha_Cosecha
      FROM Calendario_Siembra cs
      LEFT JOIN Producto p ON cs.ID_Producto = p.ID_Producto
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error GET /calendario:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Obtener siembra por ID
app.get("/calendario/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Calendario_Siembra WHERE ID_Calendario = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error GET /calendario/:id:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Crear siembra
app.post("/calendario", async (req, res) => {
  try {
    const { ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha } = req.body;

    // Verificar foreign key
    const [exist] = await pool.query(
      "SELECT ID_Producto FROM Producto WHERE ID_Producto=?",
      [ID_Producto]
    );
    if (exist.length === 0) {
      return res.status(400).json({ ok: false, error: "El ID_Producto no existe." });
    }

    await pool.query(
      `INSERT INTO Calendario_Siembra (ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha)
       VALUES (?, ?, ?, ?)`,
      [ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha]
    );

    res.json({ ok: true, message: "Registro creado correctamente" });
  } catch (err) {
    console.error("Error POST /calendario:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Actualizar siembra
app.put("/calendario/:id", async (req, res) => {
  try {
    const { ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha } = req.body;

    await pool.query(
      `UPDATE Calendario_Siembra 
       SET ID_Producto=?, Fecha_Inicio_Siembra=?, Fecha_Fin_Siembra=?, Fecha_Cosecha=?
       WHERE ID_Calendario=?`,
      [ID_Producto, Fecha_Inicio_Siembra, Fecha_Fin_Siembra, Fecha_Cosecha, req.params.id]
    );

    res.json({ ok: true, message: "Registro actualizado correctamente" });

  } catch (err) {
    console.error("Error PUT /calendario/:id:", err.message);
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


app.listen(port, () => console.log(`✅ Servidor corriendo en http://localhost:${port}`));