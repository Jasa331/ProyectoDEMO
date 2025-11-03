document.getElementById('guardarPerfil').addEventListener('click', () => {
  const nombre = document.getElementById('nombreAdmin').value;
  const correo = document.getElementById('correoAdmin').value;

  if (!nombre || !correo) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  localStorage.setItem('adminNombre', nombre);
  localStorage.setItem('adminCorreo', correo);
  alert('Perfil actualizado correctamente.');
});

document.getElementById('guardarPreferencias').addEventListener('click', () => {
  const tema = document.getElementById('temaColor').value;
  const idioma = document.getElementById('idioma').value;

  localStorage.setItem('temaColor', tema);
  localStorage.setItem('idioma', idioma);

  alert('Preferencias guardadas correctamente.');
  aplicarTema(tema);
});

document.getElementById('limpiarDatos').addEventListener('click', () => {
  if (confirm('¿Seguro que deseas eliminar todos los datos del sistema? Esta acción no se puede deshacer.')) {
    localStorage.clear();
    alert('Todos los datos han sido eliminados.');
    location.reload();
  }
});

function aplicarTema(tema) {
  if (tema === 'oscuro') {
    document.body.style.background = '#1e1e1e';
    document.body.style.color = '#fff';
  } else if (tema === 'claro') {
    document.body.style.background = '#ffffff';
    document.body.style.color = '#000';
  } else {
    document.body.style.background = '#f4f7f3';
    document.body.style.color = '#000';
  }
}

// Cargar valores guardados
window.addEventListener('DOMContentLoaded', () => {
  const nombre = localStorage.getItem('adminNombre');
  const correo = localStorage.getItem('adminCorreo');
  const tema = localStorage.getItem('temaColor') || 'verde';
  const idioma = localStorage.getItem('idioma') || 'es';

  if (nombre) document.getElementById('nombreAdmin').value = nombre;
  if (correo) document.getElementById('correoAdmin').value = correo;
  document.getElementById('temaColor').value = tema;
  document.getElementById('idioma').value = idioma;

  aplicarTema(tema);
});
