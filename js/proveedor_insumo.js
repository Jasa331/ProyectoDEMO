document.getElementById("formProveedor").addEventListener("submit", async (e) => {
  e.preventDefault();

  const proveedor = {
    Ciudad: document.getElementById("ciudad").value,
    Telefono: document.getElementById("telefono").value,
    Direccion: document.getElementById("direccion").value,
    Nombre_Empresa: document.getElementById("empresa").value,
    Nombre_Contacto: document.getElementById("contacto").value,
    Region: document.getElementById("region").value,
    Cod_Postal: document.getElementById("codPostal").value,
  };

  try {
    const res = await fetch("http://localhost:3000/proveedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proveedor),
    });

    const data = await res.json();
    document.getElementById("mensaje").textContent = data.ok
      ? "✅ Proveedor registrado correctamente"
      : "❌ Error al registrar proveedor";
  } catch (err) {
    document.getElementById("mensaje").textContent = "❌ Error de conexión con el servidor";
    console.error(err);
  }
});
