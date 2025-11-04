// ================================
// 🔔 TOAST MENSAJES
// ================================
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}


// ================================
// 🔗 CONFIGURACIÓN DE API
// ================================
const API_URL = "http://localhost:3000/insumo"; // Puerto del backend Express

// ================================
// 📋 MANEJO DEL FORMULARIO
// ================================
document.getElementById("formAdd").addEventListener("submit", async (e) => {
  e.preventDefault();

  const insumo = {
    Nombre: document.getElementById("nombre").value,
    Tipo: document.getElementById("tipo").value,
    Descripcion: document.getElementById("descripcion").value,
    Unidad_Medida: document.getElementById("unidad_medida").value,
    Cantidad: document.getElementById("cantidad").value,
    Fecha_Caducidad: document.getElementById("fecha_caducidad").value || null,
    Fecha_Registro: new Date().toISOString().slice(0, 19).replace("T", " "),
    ID_Ingreso_Insumo: null,
    ID_Usuario: null,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(insumo),
    });

    const result = await response.json();
    if (result.ok) {
      showToast("✅ Insumo agregado correctamente");
      document.getElementById("formAdd").reset();
      obtenerInsumos();
    } else {
      showToast("⚠️ Error al agregar insumo: " + result.error);
    }
  } catch (error) {
    console.error("Error al enviar insumo:", error);
    showToast("❌ Error de conexión con el servidor");
  }
});

// ================================
// 📦 OBTENER LISTA DE INSUMOS
// ================================
async function obtenerInsumos() {
  try {
    const res = await fetch("http://localhost:3000/insumos"); // También puerto 5000
    const data = await res.json();

    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${item.Nombre}</td>`;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error al obtener insumos:", err);
  }
}


