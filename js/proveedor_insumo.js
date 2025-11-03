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

async function cargarProveedores() {
  try {
    const res = await fetch("http://localhost:3000/proveedor");
    if (!res.ok) throw new Error("No se pudo obtener la lista");
    const data = await res.json();

    const tbody = document.querySelector("#tablaProveedores tbody");
    tbody.innerHTML = ""; // Limpiar tabla antes de llenar

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No hay proveedores registrados</td></tr>`;
      return;
    }

    data.forEach((p) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${p.ID_Proveedor}</td>
        <td>${p.Nombre_Empresa}</td>
        <td>${p.Nombre_Contacto}</td>
        <td>${p.Ciudad}</td>
        <td>${p.Telefono}</td>
        <td>${p.Region}</td>
        <td>${p.Cod_Postal}</td>
      `;
      tbody.appendChild(fila);
    });
  } catch (err) {
    console.error("Error cargando proveedores:", err);
  }
}

window.addEventListener("DOMContentLoaded", cargarProveedores);