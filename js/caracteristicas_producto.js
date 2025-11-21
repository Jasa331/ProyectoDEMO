// ===============================================
// VARIABLES
// ===============================================
const form = document.getElementById("formCarac");
const tabla = document.getElementById("tablaCarac").querySelector("tbody");
const mensaje = document.getElementById("mensaje");

const btnBack = document.getElementById("btnBack");
const btnTheme = document.getElementById("themeToggle");

const toggleFormBtn = document.getElementById("toggleFormBtn");
const formOverlay = document.getElementById("formOverlay");
const closeFormBtn = document.getElementById("closeFormBtn");

let data = [];
let editId = null;

// ===============================================
// MODO CLARO / OSCURO
// ===============================================
function aplicarTemaGuardado() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    btnTheme.textContent = "🌞";
  } else {
    document.body.classList.remove("dark");
    btnTheme.textContent = "🌗";
  }
}

// Cargar tema al iniciar
aplicarTemaGuardado();

// Evento del botón de tema
btnTheme.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  btnTheme.textContent = isDark ? "🌞" : "🌗";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});


// ===============================================
// BOTÓN REGRESAR
// ===============================================
btnBack.addEventListener("click", () => {
  window.history.back();
});

// ===============================================
// MOSTRAR MENSAJE
// ===============================================
function showMessage(text, type = "success") {
  mensaje.textContent = text;
  mensaje.style.color = type === "error" ? "red" : "green";
  setTimeout(() => (mensaje.textContent = ""), 3000);
}

// ===============================================
// FORMULARIO FLOTANTE
// ===============================================
toggleFormBtn.addEventListener("click", () => {
  formOverlay.classList.add("active");
});

closeFormBtn.addEventListener("click", () => {
  formOverlay.classList.remove("active");
  form.reset();
  editId = null;
});

// ===============================================
// GUARDAR / EDITAR
// ===============================================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nuevaCarac = {
    id: editId || Date.now(),
    unidad: Unidad_Medida.value,
    nombre: Nombre.value,
    max: Cantidad_Maxima.value,
    min: Cantidad_Minima.value,
    tiempo: Tiempo_Produccion.value,
    temp: Temperatura.value,
    humedad: Humedad.value,
    lluvia: Lluvias.value,
    viento: Velocidad_Viento.value,
    producto: ID_Producto.value
  };

  if (editId) {
    data = data.map(c => c.id === editId ? nuevaCarac : c);
    showMessage("✔ Característica actualizada");
  } else {
    data.push(nuevaCarac);
    showMessage("✔ Característica guardada");
  }

  form.reset();
  editId = null;
  renderTabla();
  formOverlay.classList.remove("active"); // cerrar formulario
});

// ===============================================
// RENDER TABLA
// ===============================================
function renderTabla() {
  tabla.innerHTML = "";

  if (data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="12">No hay características registradas.</td></tr>`;
    return;
  }

  data.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.unidad}</td>
      <td>${c.nombre}</td>
      <td>${c.max}</td>
      <td>${c.min}</td>
      <td>${c.tiempo}</td>
      <td>${c.temp}</td>
      <td>${c.humedad}</td>
      <td>${c.lluvia}</td>
      <td>${c.viento}</td>
      <td>${c.producto}</td>
      <td>
        <button class="btn-edit" onclick="editar(${c.id})">✏️</button>
        <button class="btn-delete" onclick="eliminar(${c.id})">🗑️</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
}

// ===============================================
// EDITAR
// ===============================================
window.editar = function (id) {
  const c = data.find(x => x.id === id);
  editId = id;

  Unidad_Medida.value = c.unidad;
  Nombre.value = c.nombre;
  Cantidad_Maxima.value = c.max;
  Cantidad_Minima.value = c.min;
  Tiempo_Produccion.value = c.tiempo;
  Temperatura.value = c.temp;
  Humedad.value = c.humedad;
  Lluvias.value = c.lluvia;
  Velocidad_Viento.value = c.viento;
  ID_Producto.value = c.producto;

  formOverlay.classList.add("active");
  showMessage("✏️ Editando registro…");
};

// ===============================================
// ELIMINAR
// ===============================================
window.eliminar = function (id) {
  if (!confirm("¿Seguro que deseas eliminar esta característica?")) return;

  data = data.filter(c => c.id !== id);
  renderTabla();
  showMessage("🗑️ Registro eliminado");
};


