const API_BASE = "http://localhost:3000";
const form = document.getElementById("formSiembra");
const tbody = document.querySelector("#tablaCultivos tbody");
const msg = document.getElementById("mensaje");

let editId = null;

// =============================
// 🔄 CARGAR REGISTROS
// =============================
async function cargarCalendario() {
  try {
    const res = await fetch(`${API_BASE}/calendario`);
    const data = await res.json();

    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No hay cultivos registrados</td></tr>`;
      return;
    }

    data.forEach((c) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${c.Producto || c.ID_Producto}</td>
        <td>${c.Fecha_Inicio_Siembra}</td>
        <td>${c.Fecha_Cosecha}</td>
        <td>
          <button onclick="editar(${c.ID_Calendario})">✏️</button>
          <button onclick="eliminar(${c.ID_Calendario})">🗑️</button>
        </td>
      `;
      tbody.appendChild(fila);
    });

  } catch (err) {
    console.error("❌ Error cargando calendario:", err);
  }
}

// =============================
// ➕ CREAR / ACTUALIZAR
// =============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idProducto = document.getElementById("cultivo").value;
  const fechaSiembra = document.getElementById("fechaSiembra").value;
  const duracion = parseInt(document.getElementById("duracion").value || 90);

  const cultivo = {
    ID_Producto: idProducto,
    Fecha_Inicio_Siembra: fechaSiembra,
    Fecha_Fin_Siembra: fechaSiembra, 
    Fecha_Cosecha: calcularCosecha(fechaSiembra, duracion),
  };

  try {
    const url = editId
      ? `${API_BASE}/calendario/${editId}`
      : `${API_BASE}/calendario`;

    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cultivo),
    });

    const data = await res.json();

    form.reset();
    editId = null;
    cargarCalendario();

  } catch (err) {
    console.error("❌ Error al guardar:", err);
  }
});

// =============================
// 🧮 CALCULAR COSECHA
// =============================
function calcularCosecha(fechaInicio, dias = 90) {
  const d = new Date(fechaInicio);
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

// =============================
// ✏️ EDITAR (FALTA HACER GET /calendario/:id)
// =============================
window.editar = function (id) {
  editId = id;
  alert("Modo edición activado, pero falta implementar GET /calendario/:id");
};

// =============================
// 🗑️ ELIMINAR
// =============================
window.eliminar = async function (id) {
  if (!confirm("¿Eliminar este registro?")) return;

  try {
    await fetch(`${API_BASE}/calendario/${id}`, { method: "DELETE" });
    cargarCalendario();
  } catch (err) {
    console.error("❌ Error eliminando:", err);
  }
};

// =============================
// 🚀 INICIO
// =============================
window.addEventListener("DOMContentLoaded", cargarCalendario);
