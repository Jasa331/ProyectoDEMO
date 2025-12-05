const API_BASE = "http://localhost:3000";
const form = document.getElementById("formSiembra");
const tbody = document.querySelector("#tablaCultivos tbody");
const msg = document.getElementById("mensaje");

let editId = null;

// =============================
// 🔐 OBTENER EL USUARIO LOGUEADO (COMPATIBLE)
// =============================
const user = JSON.parse(localStorage.getItem("user"));

const ID_Usuario =
  user?.ID_Usuario ||    // Agricultor
  user?.id ||            // Empleado
  user?.ID_Empleado || 
  user?.ID_Agricultor ||
  null;

console.log("Usuario detectado:", user);
console.log("ID_Usuario REAL:", ID_Usuario);

// =============================
// 🔄 CARGAR REGISTROS (CON TOKEN)
// =============================
async function cargarCalendario() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/calendario`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await res.json();
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No hay cultivos registrados</td></tr>`;
      return;
    }

    data.forEach((c) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${c.Producto || c.ID_Producto}</td>
        <td>${c.Fecha_Inicio_Siembra}</td>
        <td>${c.Fecha_Cosecha}</td>
        <td>${c.Estado || "Sin estado"}</td>
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
// ➕ CREAR / ACTUALIZAR (CON TOKEN)
// =============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idProducto = document.getElementById("cultivo").value;
  const fechaSiembra = document.getElementById("fechaSiembra").value;
  const duracion = parseInt(document.getElementById("duracion").value || 90);

  const ubicacion = document.getElementById("ubicacion").value;
  const estado = document.getElementById("estado").value;
  const notas = document.getElementById("notas").value;

  const cultivo = {
    ID_Producto: idProducto,
    Fecha_Inicio_Siembra: fechaSiembra,
    Fecha_Fin_Siembra: fechaSiembra,
    Fecha_Cosecha: calcularCosecha(fechaSiembra, duracion),
    Estado: estado,
    Ubicacion: ubicacion,
    Notas: notas
  };

  try {
    const token = localStorage.getItem("token");

    const url = editId
      ? `${API_BASE}/calendario/${editId}`
      : `${API_BASE}/calendario`;

    const method = editId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(cultivo),
    });

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
// ✏️ EDITAR REGISTRO (CON TOKEN)
// =============================
window.editar = async function (id) {
  editId = id;

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/calendario/${id}`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await res.json();

    document.getElementById("cultivo").value = data.ID_Producto;
    document.getElementById("fechaSiembra").value = data.Fecha_Inicio_Siembra;
    document.getElementById("ubicacion").value = data.Ubicacion || "";
    document.getElementById("estado").value = data.Estado || "Programado";
    document.getElementById("notas").value = data.Notas || "";

  } catch (err) {
    console.error("❌ Error cargando registro para edición:", err);
  }
};

// =============================
// 🗑️ ELIMINAR REGISTRO (CON TOKEN)
// =============================
window.eliminar = async function (id) {
  if (!confirm("¿Eliminar este registro?")) return;

  try {
    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/calendario/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    cargarCalendario();
  } catch (err) {
    console.error("❌ Error eliminando:", err);
  }
};

// =============================
// 🚀 INICIO
// =============================
window.addEventListener("DOMContentLoaded", cargarCalendario);
