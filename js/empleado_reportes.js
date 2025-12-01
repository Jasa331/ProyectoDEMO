// Código combinado: carga agricultores, muestra tarjeta, envía reportes y renderiza reportes del agricultor.
// Funciona con:
//  - GET  /api/agricultores          -> lista agricultores
//  - POST /reportes                   -> crear reporte (FormData: ID_Agricultor, Texto, fotos)
//  - GET  /reportes?destinatario=ID   -> listar reportes para destinatario

(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // 🔥 BACKEND FIJO EN PUERTO 3000
  const apiBase = 'http://localhost:3000';

  let listaAgricultores = [];


  // -----------------------
  // CARGAR AGRICULTORES (solo Agricultor)
  // -----------------------
  async function cargarAgricultores() {
    try {
      const res = await fetch(`${apiBase}/api/agricultores`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const todos = Array.isArray(json.agricultores) ? json.agricultores : [];

      // filtrar por rol (por si el endpoint no lo hace)
      const agricultores = todos.filter(u => String(u.Rol || u.rol || '').toLowerCase().includes('agricultor'));

      listaAgricultores = agricultores;

      const select = qs('#id_agricultor');
      if (!select) return;

      // limpiar opciones salvo la primera
      qsa("#id_agricultor option:not([value=''])").forEach(o => o.remove());

      if (agricultores.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No hay agricultores disponibles';
        select.appendChild(opt);
        return;
      }

      agricultores.forEach(ag => {
        const id = ag.ID_Usuario ?? ag.id ?? '';
        const nombre = (ag.Usuario_Nombre ?? ag.Nombre ?? '').trim();
        const apellido = (ag.Usuario_Apellido ?? ag.Apellido ?? '').trim();
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${id} - ${nombre} ${apellido}`.trim();
        select.appendChild(option);
      });
    } catch (err) {
      console.error('cargarAgricultores:', err);
    }
  }

  // -----------------------
  // MOSTRAR TARJETA AGRICULTOR SELECCIONADO
  // -----------------------
  function mostrarInfoAgricultor() {
    const sel = qs('#id_agricultor');
    const id = sel ? sel.value : '';
    const card = qs('#infoAgricultor');
    if (!card) return;

    if (!id) {
      card.style.display = 'none';
      return;
    }

    const ag = listaAgricultores.find(a => String(a.ID_Usuario ?? a.id) === String(id));
    if (!ag) {
      card.style.display = 'none';
      return;
    }

    qs('#agri_id') && (qs('#agri_id').textContent = ag.ID_Usuario ?? ag.id ?? '—');
    qs('#agri_nombre') && (qs('#agri_nombre').textContent = `${ag.Usuario_Nombre ?? ag.Nombre ?? ''} ${ag.Usuario_Apellido ?? ag.Apellido ?? ''}`.trim() || '—');
    qs('#agri_correo') && (qs('#agri_correo').textContent = ag.Correo || ag.email || '—');
    qs('#agri_telefono') && (qs('#agri_telefono').textContent = ag.Telefono || ag.telefono || '—');
    qs('#agri_direccion') && (qs('#agri_direccion').textContent = ag.Direccion || ag.address || '—');

    card.style.display = 'block';
  }

  // -----------------------
  // PREVIEW IMÁGENES (opcional)
  // -----------------------
  function renderPreview(files) {
    const preview = qs('#preview');
    if (!preview) return;
    preview.innerHTML = '';
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.src = url;
      img.style.maxWidth = '120px';
      img.style.margin = '6px';
      img.style.borderRadius = '6px';
      preview.appendChild(img);
      img.onload = () => URL.revokeObjectURL(url);
    });
  }

  // -----------------------
  // ENVIAR REPORTE (POST /reportes)
  // -----------------------
  async function enviarReporte(e) {
    if (e && e.preventDefault) e.preventDefault();

    const form = qs('#reporteForm');
    if (!form) return console.warn('Formulario reporte no encontrado');

    const idAgr = qs('#id_agricultor')?.value;
    const texto = qs('#texto')?.value || '';
    const files = qs('#foto')?.files || [];

    if (!idAgr) { alert('Selecciona un agricultor destinatario.'); return; }

    const fd = new FormData();
    fd.append('ID_Agricultor', idAgr);
    fd.append('Texto', texto);
    if (files && files.length) Array.from(files).forEach(f => fd.append('fotos', f));

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
      const res = await fetch(`${apiBase}/reportes`, {
        method: 'POST',
        headers,
        body: fd
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        alert('Reporte enviado correctamente.');
        form.reset();
        renderPreview(null);
        // notificar dashboards en otras pestañas
        localStorage.setItem('reportes_updated', Date.now().toString());
        // recargar lista local si existe
        if (typeof renderReportes === 'function') renderReportes();
      } else {
        console.error('Error crear reporte:', json);
        alert(json.error || 'Error al enviar reporte.');
      }
    } catch (err) {
      console.error('enviarReporte:', err);
      alert('No se pudo conectar al servidor.');
    }
  }

  // -----------------------
  // RENDERIZAR REPORTES (GET /reportes?destinatario=ID)
  // -----------------------
  async function renderReportes() {
    const cont = qs('#reportes');
    if (!cont) return;
    let listWrap = cont.querySelector('.reportes-list');
    if (!listWrap) {
      listWrap = document.createElement('div');
      listWrap.className = 'reportes-list';
      cont.appendChild(listWrap);
    }
    listWrap.innerHTML = '<p>Cargando reportes...</p>';

    // obtener ID agricultor desde localStorage (user o usuarioActivo)
    let idAgr = null;
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('usuarioActivo');
      const u = raw ? JSON.parse(raw) : null;
      idAgr = u?.ID_Usuario || u?.id || null;
    } catch (e) { idAgr = null; }

    const q = idAgr ? `?destinatario=${encodeURIComponent(idAgr)}` : '';
    try {
      const res = await fetch(`${apiBase}/reportes${q}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const arr = (json.ok && Array.isArray(json.reportes)) ? json.reportes : [];
      if (!arr.length) {
        listWrap.innerHTML = '<p>No hay reportes recientes.</p>';
        return;
      }
      listWrap.innerHTML = arr.map(r => {
        const fecha = new Date(r.createdAt || r.CreatedAt || r.created_at).toLocaleString();
        const imgs = (r.imagenes || []).slice(0,3).map(i => {
          const url = i.Url ?? i.url ?? i.Url ?? i.Url; // varios nombres posibles
          return `<img src="${url}" style="max-width:120px;margin:6px;border-radius:6px">`;
        }).join('');
        const empleadoLabel = r.empleadoId ?? r.ID_Empleado ?? r.ID_Usuario ?? '—';
        return `
          <article class="reporte-card card" style="margin-bottom:12px;padding:12px">
            <header style="display:flex;justify-content:space-between;align-items:center">
              <strong style="color:var(--primary)">Empleado #${empleadoLabel}</strong>
              <small style="color:var(--text-muted)">${fecha}</small>
            </header>
            <p style="margin:8px 0;color:var(--text-light)">${(r.texto||r.Texto||'').toString().replaceAll('\n','<br>')}</p>
            <div class="reporte-thumbs">${imgs}</div>
          </article>
        `;
      }).join('');
    } catch (err) {
      console.error('renderReportes:', err);
      listWrap.innerHTML = '<p>Error al cargar reportes.</p>';
    }
  }

  // -----------------------
  // INIT: enlazar eventos DOM
  // -----------------------
  function initDOM() {
    // Select agricultor change -> mostrar tarjeta
    const select = qs('#id_agricultor');
    if (select && !select._listener_registered) {
      select.addEventListener('change', mostrarInfoAgricultor);
      select._listener_registered = true;
    }

    // preview imagen input
    const foto = qs('#foto');
    if (foto && !foto._listener_registered) {
      foto.addEventListener('change', (e) => renderPreview(e.target.files));
      foto._listener_registered = true;
    }

    // submit form
    const form = qs('#reporteForm');
    if (form && !form._listener_registered) {
      form.addEventListener('submit', enviarReporte);
      form._listener_registered = true;
    }

    // escuchar notificaciones de otras pestañas
    window.addEventListener('storage', (e) => {
      if (e.key === 'reportes_updated') renderReportes();
    });

    // si existe sección reportes y se carga con hash o visible, renderizar
    if (qs('#reportes')) {
      if (window.location.hash.replace('#','') === 'reportes') renderReportes();
    }
  }

  // -----------------------
  // Exponer funciones a window por si se necesitan desde HTML
  // -----------------------
  window.cargarAgricultores = cargarAgricultores;
  window.mostrarInfoAgricultor = mostrarInfoAgricultor;
  window.enviarReporte = enviarReporte;
  window.renderReportes = renderReportes;

  // -----------------------
  // AUTO INIT
  // -----------------------
  document.addEventListener('DOMContentLoaded', async () => {
    await cargarAgricultores();
    initDOM();
    // si estamos en dashboard agricultor, cargar reportes
    if (qs('#reportes')) renderReportes();
  });
})();