// ==================== VARIABLES GLOBALES ====================
const tablaBody = document.querySelector("#tablaCultivos tbody");
const acordeonDiv = document.getElementById('acordeonCultivos');
const tablaPasadosBody = document.querySelector("#tablaCultivosPasados tbody");

let cultivos = [];
let cultivosPasados = [];
let editIndex = -1;

const año = new Date().getFullYear();
const mesesNombres = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

// ==================== FUNCIONES DE CALENDARIO ====================
function generarCalendarioCultivo(cultivo){
  const contenedor = document.createElement("div");
  contenedor.classList.add("calendario");

  for (let m = 0; m < 12; m++){
    const mesDiv = document.createElement('div');
    mesDiv.classList.add('mes');
    mesDiv.innerHTML = `<h3>${mesesNombres[m]}</h3>`;
    const diasDiv = document.createElement('div');
    diasDiv.classList.add('dias');

    let primerDia = new Date(año, m, 1).getDay();
    if (primerDia === 0) primerDia = 7;
    let diasMes = new Date(año, m + 1, 0).getDate();

    for (let i = 1; i < primerDia; i++){
      diasDiv.innerHTML += `<div class="dia vacio"></div>`;
    }

    for (let d = 1; d <= diasMes; d++){
      const diaDiv = document.createElement('div');
      diaDiv.classList.add('dia');
      diaDiv.dataset.fecha = `${año}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      diaDiv.textContent = d;
      diasDiv.appendChild(diaDiv);
    }

    mesDiv.appendChild(diasDiv);
    contenedor.appendChild(mesDiv);
  }
  return contenedor;
}

function pintarCultivo(c, calendario){
  const fSiembra = new Date(c.siembra);
  const fCosecha = new Date(c.cosecha);
  calendario.querySelectorAll('.dia').forEach(d=>{
    const f = new Date(d.dataset.fecha);
    if (isNaN(f.getTime())) return;
    if (f.toDateString() === fSiembra.toDateString()){
      d.classList.add('siembra');
      d.title = `${c.cultivo} - Siembra`;
    } else if (f > fSiembra && f < fCosecha){
      d.classList.add('crecimiento');
      d.title = `${c.cultivo} - Crecimiento`;
    } else if (f.toDateString() === fCosecha.toDateString()){
      d.classList.add('cosecha');
      d.title = `${c.cultivo} - Cosecha`;
    }
  });
}

// ==================== FUNCIONES DE TABLAS ====================
function actualizarTablas() {
  // Cultivos activos
  tablaBody.innerHTML = "";
  acordeonDiv.innerHTML = "";

  cultivos.forEach((c, i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.cultivo}</td>
      <td>${c.siembra}</td>
      <td>${c.cosecha}</td>
      <td class="acciones">
        <button class="btn" onclick="editarCultivo(${i})">Editar</button>
        <button class="btn" onclick="eliminarCultivo(${i})">Eliminar</button>
      </td>`;
    tablaBody.appendChild(tr);

    // Calendario individual
    const btn = document.createElement("button");
    btn.textContent = `📅 Ver calendario de ${c.cultivo}`;
    const panel = document.createElement("div");
    panel.classList.add("panel");
    const cal = generarCalendarioCultivo(c.cultivo);
    pintarCultivo(c, cal);
    panel.appendChild(cal);

    btn.addEventListener("click", ()=>{
      panel.style.display = (panel.style.display === "block") ? "none" : "block";
    });

    acordeonDiv.appendChild(btn);
    acordeonDiv.appendChild(panel);
  });

  // Cultivos pasados
  tablaPasadosBody.innerHTML = "";
  cultivosPasados.forEach((c)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.cultivo}</td>
      <td>${c.siembra}</td>
      <td>${c.cosecha}</td>`;
    tablaPasadosBody.appendChild(tr);
  });

  guardarEnStorage();
}

// ==================== ALMACENAMIENTO ====================
function guardarEnStorage(){
  localStorage.setItem("cultivos", JSON.stringify(cultivos));
  localStorage.setItem("cultivosPasados", JSON.stringify(cultivosPasados));
}

function cargarDeStorage(){
  const data = localStorage.getItem("cultivos");
  const dataPasados = localStorage.getItem("cultivosPasados");
  if (data) cultivos = JSON.parse(data);
  if (dataPasados) cultivosPasados = JSON.parse(dataPasados);
}

// ==================== FORMULARIO ====================
document.getElementById('formSiembra').addEventListener('submit', e=>{
  e.preventDefault();
  const fechaSiembra = document.getElementById('fechaSiembra').value;
  const cultivoTexto = document.getElementById('cultivo').value.trim();
  const duracionManual = parseInt(document.getElementById('duracion').value.trim()) || 0;

  if (!fechaSiembra || !cultivoTexto) return;

  // Detectar duración en el nombre (por ejemplo "Maíz (120 días)")
  const match = cultivoTexto.match(/\((\d+)\s*d[ií]as?\)/i);
  let dias = match ? parseInt(match[1]) : duracionManual;

  if (!dias) {
    alert("Por favor ingresa una duración en días (ej. Maíz (120 días) o en el campo de duración).");
    return;
  }

  const fSiembra = new Date(fechaSiembra);
  const fCosecha = new Date(fSiembra);
  fCosecha.setDate(fSiembra.getDate() + dias);

  const obj = { 
    cultivo: cultivoTexto, 
    siembra: fechaSiembra, 
    cosecha: fCosecha.toISOString().split('T')[0] 
  };

  if (editIndex >= 0){
    cultivos[editIndex] = obj;
    editIndex = -1;
  } else {
    cultivos.push(obj);
  }

  document.getElementById('formSiembra').reset();
  actualizarTablas();
});

// ==================== BOTONES ====================
window.editarCultivo = function(i){
  const c = cultivos[i];
  document.getElementById('fechaSiembra').value = c.siembra;
  document.getElementById('cultivo').value = c.cultivo;
  editIndex = i;
}

window.eliminarCultivo = function(i){
  const eliminado = cultivos.splice(i, 1)[0];
  cultivosPasados.push(eliminado);
  actualizarTablas();
}

// ==================== INICIALIZACIÓN ====================
cargarDeStorage();
actualizarTablas();

