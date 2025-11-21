const API = "http://localhost:3000/producto";
const tbody = document.querySelector("#tablaProductos tbody");
const form = document.getElementById("formProducto");
const msg = document.getElementById("mensaje");

let editId = null;

// =============================
// 🔄 Cargar productos
// =============================
async function cargarProductos() {
  const res = await fetch(API);
  const data = await res.json();

  tbody.innerHTML = "";

  data.forEach(p => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${p.ID_Producto}</td>
      <td>${p.Nombre}</td>
      <td>${p.Stock}</td>
      <td>${p.Precio}</td>
      <td>
        <button onclick="editar(${p.ID_Producto})">✏️</button>
        <button onclick="eliminar(${p.ID_Producto})">🗑️</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

// =============================
// ➕ Crear / Actualizar
// =============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const producto = {
    Nombre: document.getElementById("Nombre").value,
    Stock: document.getElementById("Stock").value,
    Precio: document.getElementById("Precio").value,
    ID_Usuario: localStorage.getItem("ID_Usuario") || 1, // Ajusta según tu login
  };

  const url = editId ? `${API}/${editId}` : API;
  const method = editId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto)
  });

  const data = await res.json();
  msg.textContent = data.message;

  form.reset();
  editId = null;
  cargarProductos();
});

// =============================
// ✏️ Editar
// =============================
window.editar = async function (id) {
  editId = id;

  const res = await fetch(`${API}/${id}`);
  const p = await res.json();

  document.getElementById("ID_Producto").value = p.ID_Producto;
  document.getElementById("Nombre").value = p.Nombre;
  document.getElementById("Stock").value = p.Stock;
  document.getElementById("Precio").value = p.Precio;
};

// =============================
// 🗑️ Eliminar
// =============================
window.eliminar = async function (id) {
  if (!confirm("¿Eliminar producto?")) return;

  const res = await fetch(`${API}/${id}`, { method: "DELETE" });

  cargarProductos();
};

// =============================
// 🚀 Inicio
// =============================
window.addEventListener("DOMContentLoaded", cargarProductos);
