// ============================
// Datos en memoria
// ============================
let cultivos = [];
let inventario = [];
let reportes = [];

// ============================
// Mostrar secciones
// ============================
function mostrarSeccion(id) {
  const secciones = document.querySelectorAll(".seccion");
  secciones.forEach(sec => sec.style.display = "none");

  document.getElementById(id).style.display = "block";

  // Cada vez que muestro una sección, actualizo sus datos
  if (id === "cultivos") renderCultivos();
  if (id === "inventario") renderInventario();
  if (id === "reportes") renderReportes();
}

// ============================
// Agregar elementos
// ============================
document.addEventListener("DOMContentLoaded", () => {
  // Simulamos agregar Cultivo
  document.getElementById("btnAgregarCultivo").addEventListener("click", (e) => {
    e.preventDefault();
    const nuevo = {
      nombre: "Tomate",
      tipo: "Hortaliza",
      contacto: "3001234567"
    };
    cultivos.push(nuevo);
    alert("✅ Cultivo agregado!");
  });

  // Simulamos agregar Insumo
  document.getElementById("btnAgregarInsumo").addEventListener("click", (e) => {
    e.preventDefault();
    const nuevo = {
      nombre: "Fertilizante X",
      cantidad: "20 kg",
      proveedor: "AgroFert"
    };
    inventario.push(nuevo);
    alert("✅ Insumo agregado!");
  });

  // Simulamos agregar Reporte
  document.getElementById("btnAgregarEmpleado").addEventListener("click", (e) => {
    e.preventDefault();
    const nuevo = {
      empleado: "Juan Pérez",
      actividad: "Riego de maíz",
      fecha: new Date().toLocaleDateString()
    };
    reportes.push(nuevo);
    alert("✅ Reporte agregado!");
  });
});

// ============================
// Renderizar datos en tablas
// ============================
function renderCultivos() {
  const tabla = document.querySelector("#cultivos table");
  tabla.innerHTML = `
    <tr>
      <th>Nombre</th>
      <th>Tipo</th>
      <th>Contacto</th>
    </tr>
  `;
  cultivos.forEach(c => {
    tabla.innerHTML += `
      <tr>
        <td>${c.nombre}</td>
        <td>${c.tipo}</td>
        <td>${c.contacto}</td>
      </tr>
    `;
  });
}

function renderInventario() {
  const seccion = document.getElementById("inventario");
  seccion.innerHTML = `
    <h1>Inventario</h1>
    <table>
      <tr>
        <th>Nombre</th>
        <th>Cantidad</th>
        <th>Proveedor</th>
      </tr>
      ${inventario.map(i => `
        <tr>
          <td>${i.nombre}</td>
          <td>${i.cantidad}</td>
          <td>${i.proveedor}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function renderReportes() {
  const seccion = document.getElementById("reportes");
  seccion.innerHTML = `
    <h1>Reportes</h1>
    <ul>
      ${reportes.map(r => `
        <li><b>${r.empleado}</b> - ${r.actividad} (${r.fecha})</li>
      `).join("")}
    </ul>
  `;
}
