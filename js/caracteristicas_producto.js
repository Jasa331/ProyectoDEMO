const API = "http://localhost:3000/caracteristicas";

const form = document.getElementById("formCarac");
const tbody = document.querySelector("#tablaCarac tbody");
const msg = document.getElementById("mensaje");
let editId = null;

/* ============================
   CARGAR LISTA
============================ */
async function cargarCarac() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    tbody.innerHTML = "";

    data.forEach(c => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${c.ID_Caracteristica}</td>
        <td>${c.Unidad_Medida}</td>
        <td>${c.Nombre}</td>
        <td>${c.Cantidad_Maxima}</td>
        <td>${c.Cantidad_Minima}</td>
        <td>${c.Tiempo_Produccion}</td>
        <td>${c.Temperatura}</td>
        <td>${c.Humedad}</td>
        <td>${c.Lluvias}</td>
        <td>${c.Velocidad_Viento}</td>
        <td>${c.ID_Producto}</td>
        <td>
          <button onclick="editar(${c.ID_Caracteristica})">✏</button>
          <button onclick="eliminar(${c.ID_Caracteristica})">🗑</button>
        </td>
      `;
      tbody.appendChild(fila);
    });
  } catch (err) {
    console.error("Error cargando:", err);
  }
}

/* ============================
   GUARDAR (CREAR / EDITAR)
============================ */
form.addEventListener("submit", async e => {
  e.preventDefault();

  const data = {
    Unidad_Medida: Unidad_Medida.value,
    Nombre: Nombre.value,
    Cantidad_Maxima: Cantidad_Maxima.value,
    Cantidad_Minima: Cantidad_Minima.value,
    Tiempo_Produccion: Tiempo_Produccion.value,
    Temperatura: Temperatura.value,
    Humedad: Humedad.value,
    Lluvias: Lluvias.value,
    Velocidad_Viento: Velocidad_Viento.value,
    ID_Producto: ID_Producto.value
  };

  const url = editId ? `${API}/${editId}` : API;
  const method = editId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const respuesta = await res.json();
  msg.textContent = respuesta.message;

  form.reset();
  editId = null;
  cargarCarac();
  cerrarFormulario();
});

/* ============================
   EDITAR
============================ */
window.editar = async id => {
  editId = id;

  const res = await fetch(`${API}/${id}`);
  const c = await res.json();

  ID_Caracteristica.value = c.ID_Caracteristica;
  Unidad_Medida.value = c.Unidad_Medida;
  Nombre.value = c.Nombre;
  Cantidad_Maxima.value = c.Cantidad_Maxima;
  Cantidad_Minima.value = c.Cantidad_Minima;
  Tiempo_Produccion.value = c.Tiempo_Produccion;
  Temperatura.value = c.Temperatura;
  Humedad.value = c.Humedad;
  Lluvias.value = c.Lluvias;
  Velocidad_Viento.value = c.Velocidad_Viento;
  ID_Producto.value = c.ID_Producto;

  abrirFormulario();
};

/* ============================
   ELIMINAR
============================ */
window.eliminar = async id => {
  if (!confirm("¿Eliminar característica?")) return;

  await fetch(`${API}/${id}`, { method: "DELETE" });
  cargarCarac();
};

/* ============================
   FORMULARIO FLOTANTE
============================ */
const overlay = document.getElementById("formOverlay");
const openBtn = document.getElementById("toggleFormBtn");
const closeBtn = document.getElementById("closeFormBtn");

function abrirFormulario() {
  overlay.style.display = "flex";
}
function cerrarFormulario() {
  overlay.style.display = "none";
}

openBtn.addEventListener("click", abrirFormulario);
closeBtn.addEventListener("click", cerrarFormulario);

/* ============================
   MODO OSCURO
============================ */
document.getElementById("themeToggle").onclick = () =>
  document.body.classList.toggle("dark");

/* ============================
   VOLVER
============================ */
document.getElementById("btnBack").onclick = () => history.back();

/* ============================
   INICIO
============================ */
window.onload = cargarCarac;
