const loginSection = document.getElementById("loginSection");
const sistemaSection = document.getElementById("sistemaSection");
const loginForm = document.getElementById("loginForm");
const cerrarSesion = document.getElementById("cerrarSesion");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const usuario = document.getElementById("usuario").value.trim();
  const clave = document.getElementById("clave").value.trim();

  if (usuario === "empleado" && clave === "1234") {
    localStorage.setItem("usuarioActivo", usuario);
    mostrarSistema();
  } else {
    alert("Credenciales incorrectas ❌");
  }
});

function mostrarSistema() {
  loginSection.classList.add("hidden");
  sistemaSection.classList.remove("hidden");
}

function verificarSesion() {
  const activo = localStorage.getItem("usuarioActivo");
  if (activo) mostrarSistema();
}

cerrarSesion.addEventListener("click", () => {
  localStorage.removeItem("usuarioActivo");
  location.reload();
});

verificarSesion();

// Manejo de envío de reportes (guarda en localStorage bajo 'reportes')
const reporteForm = document.getElementById('reporteForm');
const fotoInput = document.getElementById('foto');
const preview = document.getElementById('preview');
const reporteList = document.getElementById('reporteList');

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function renderPreview(files) {
  if (!preview) return;
  preview.innerHTML = '';
  Array.from(files).forEach(file => {
    const url = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '120px';
    img.style.margin = '6px';
    img.style.borderRadius = '6px';
    preview.appendChild(img);
    // liberar url cuando ya no se use (opcional)
    img.onload = () => URL.revokeObjectURL(url);
  });
}

if (fotoInput) {
  fotoInput.addEventListener('change', (e) => {
    renderPreview(e.target.files);
  });
}

async function guardarReporte({ texto, files }) {
  const authorRaw = localStorage.getItem('user') || localStorage.getItem('usuarioActivo');
  let author = 'Anonimo';
  try { author = JSON.parse(authorRaw)?.Usuario_Nombre || JSON.parse(authorRaw)?.Nombre || JSON.parse(authorRaw)?.nombre || author; } catch (e) {}

  const imagenes = [];
  if (files && files.length) {
    for (const f of Array.from(files)) {
      try {
        const b64 = await fileToBase64(f);
        imagenes.push({ name: f.name, data: b64 });
      } catch (e) {
        console.error('Error convirtiendo imagen:', e);
      }
    }
  }

  const nuevo = {
    id: Date.now(),
    author,
    texto: texto || '',
    imagenes,
    createdAt: new Date().toISOString()
  };

  const existentes = JSON.parse(localStorage.getItem('reportes') || '[]');
  existentes.unshift(nuevo); // añadir al inicio
  localStorage.setItem('reportes', JSON.stringify(existentes));
  return nuevo;
}

function renderReportesLocal() {
  if (!reporteList) return;
  const arr = JSON.parse(localStorage.getItem('reportes') || '[]');
  reporteList.innerHTML = '';
  if (!arr.length) {
    reporteList.innerHTML = '<p>No hay reportes aún.</p>';
    return;
  }
  arr.forEach(r => {
    const div = document.createElement('div');
    div.className = 'reporte-item card';
    div.innerHTML = `
      <h4>${r.author} <small style="color:var(--text-muted);font-weight:600;margin-left:8px">${(new Date(r.createdAt)).toLocaleString()}</small></h4>
      <p>${r.texto ? r.texto.replaceAll('\n','<br>') : ''}</p>
      <div class="thumbs"></div>
    `;
    const thumbs = div.querySelector('.thumbs');
    (r.imagenes || []).forEach(img => {
      const i = document.createElement('img');
      i.src = img.data;
      i.style.maxWidth = '140px';
      i.style.margin = '6px';
      i.style.borderRadius = '6px';
      thumbs.appendChild(i);
    });
    reporteList.appendChild(div);
  });
}

async function cargarAgricultores() {
  try {
    const res = await fetch('http://localhost:3000/agricultores'); // ruta que devuelve lista
    if (!res.ok) return;
    const json = await res.json();
    const sel = document.getElementById('id_agricultor');
    if (!sel) return;
    (json.agricultores || []).forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.ID_Usuario || a.id;
      opt.textContent = `${a.Usuario_Nombre || a.Nombre} (${a.ID_Usuario || a.id})`;
      sel.appendChild(opt);
    });
  } catch (e) { console.error('cargarAgricultores:', e); }
}

if (reporteForm) {
  reporteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = document.getElementById('texto')?.value || '';
    const files = document.getElementById('foto')?.files || [];
    const idAgr = document.getElementById('id_agricultor')?.value;
    if (!idAgr) { alert('Selecciona el agricultor destinatario'); return; }

    const fd = new FormData();
    fd.append('Texto', texto);
    fd.append('ID_Agricultor', idAgr);
    for (const f of Array.from(files)) fd.append('fotos', f);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/reportes', {
        method: 'POST',
        headers: token ? { 'Authorization': 'Bearer ' + token } : {},
        body: fd
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        alert('Reporte enviado.');
        reporteForm.reset();
        if (preview) preview.innerHTML = '';
        localStorage.setItem('reportes_updated', Date.now().toString());
      } else {
        alert(json.error || 'Error al enviar reporte.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    renderReportesLocal();
    cargarAgricultores();
  });
}
