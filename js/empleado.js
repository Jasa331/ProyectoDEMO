
const form = document.getElementById("reporteForm");
const list = document.getElementById("reporteList");

// Cargar reportes guardados en LocalStorage
document.addEventListener("DOMContentLoaded", () => {
  const reportes = JSON.parse(localStorage.getItem("reportes")) || [];
  reportes.forEach(r => renderReporte(r));
});

// Enviar nuevo reporte
form.addEventListener("submit", e => {
  e.preventDefault();

  const texto = document.getElementById("texto").value;
  const fotoInput = document.getElementById("foto");
  const fecha = new Date().toLocaleString();

  let fotoURL = "";
  if (fotoInput.files.length > 0) {
    fotoURL = URL.createObjectURL(fotoInput.files[0]);
  }

  const reporte = { texto, fotoURL, fecha };

  // Guardar en localStorage
  const reportes = JSON.parse(localStorage.getItem("reportes")) || [];
  reportes.push(reporte);
  localStorage.setItem("reportes", JSON.stringify(reportes));

  // Pintar en pantalla
  renderReporte(reporte);

  // Limpiar formulario
  form.reset();
});

// Renderizar reporte en la lista
function renderReporte({ texto, fotoURL, fecha }) {
  const card = document.createElement("div");
  card.classList.add("reporte-card");

  card.innerHTML = `
    <p>${texto}</p>
    ${fotoURL ? `<img src="${fotoURL}" alt="Foto del reporte">` : ""}
    <small>📅 ${fecha}</small>
  `;

  list.prepend(card); // Lo más reciente primero
}

window.addEventListener('DOMContentLoaded', () => {
  const tabla = document.getElementById('farmerTableBody'); // tbody donde se mostrarán empleados
  const empleados = JSON.parse(localStorage.getItem('empleados')) || [];

  tabla.innerHTML = ''; // limpiar tabla

  empleados.forEach(emp => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${emp.name}</td>
      <td>${emp.phone}</td>
      <td>${emp.crop}</td>
      <td>✔️</td>
    `;
    tabla.appendChild(row);
  });
});