const pool = require('./config/db');

(async () => {
    try {
        console.log("--- Users ---");
        const [users] = await pool.query("SELECT ID_Usuario, Usuario_Nombre, Rol FROM Usuario");
        console.table(users);

        console.log("\n--- Products ---");
        const [products] = await pool.query("SELECT ID_Producto, Nombre FROM Producto");
        console.table(products);

        console.log("\n--- Calendario Siembra ---");
        const [calendario] = await pool.query("SELECT ID_Calendario, ID_Usuario, ID_Producto, Ubicacion, Estado FROM Calendario_Siembra");
        console.table(calendario);

        console.log("\n--- Insumos ---");
        const [insumos] = await pool.query("SELECT ID_Insumo, ID_Usuario, Nombre FROM Insumo");
        console.table(insumos);

        console.log("\n--- Check JOIN for Calendario ---");
        const [joinCheck] = await pool.query(`
      SELECT cs.ID_Calendario, cs.ID_Usuario, cs.ID_Producto, p.Nombre as ProductoNombre
      FROM Calendario_Siembra cs
      LEFT JOIN Producto p ON cs.ID_Producto = p.ID_Producto
    `);
        console.table(joinCheck);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
})();
