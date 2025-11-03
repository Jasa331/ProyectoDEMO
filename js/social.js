const publicarBtn = document.getElementById("publicarBtn");
const feed = document.getElementById("feed");

document.addEventListener("DOMContentLoaded", mostrarPublicaciones);

publicarBtn.addEventListener("click", () => {
  const nombre = document.getElementById("nombre").value.trim();
  const mensaje = document.getElementById("mensaje").value.trim();
  const imagenInput = document.getElementById("imagen");
  const archivo = imagenInput.files[0];

  if (!nombre || !mensaje) {
    alert("Por favor, completa todos los campos antes de publicar.");
    return;
  }

  if (archivo) {
    const lector = new FileReader();
    lector.onload = (e) => guardarPublicacion(nombre, mensaje, e.target.result);
    lector.readAsDataURL(archivo);
  } else {
    guardarPublicacion(nombre, mensaje, null);
  }

  document.getElementById("nombre").value = "";
  document.getElementById("mensaje").value = "";
  imagenInput.value = "";
});

function guardarPublicacion(nombre, mensaje, imagen) {
  const publicaciones = JSON.parse(localStorage.getItem("publicaciones")) || [];
  const nueva = {
    id: Date.now(),
    nombre,
    mensaje,
    imagen,
    fecha: new Date().toLocaleString(),
    comentarios: [],
  };
  publicaciones.unshift(nueva);
  localStorage.setItem("publicaciones", JSON.stringify(publicaciones));
  mostrarPublicaciones();
}

function mostrarPublicaciones() {
  feed.innerHTML = "";
  const publicaciones = JSON.parse(localStorage.getItem("publicaciones")) || [];

  publicaciones.forEach((pub) => {
    const div = document.createElement("div");
    div.classList.add("publicacion");

    div.innerHTML = `
      <strong>${pub.nombre}</strong><br>
      <small>${pub.fecha}</small>
      <p>${pub.mensaje}</p>
      ${pub.imagen ? `<img src="${pub.imagen}" alt="Imagen publicada">` : ""}
      <div class="comentarios" id="comentarios-${pub.id}">
        ${pub.comentarios
          .map(
            (c) =>
              `<div class="comentario"><strong>${c.nombre}</strong>: ${c.texto}</div>`
          )
          .join("")}
      </div>
      <div class="responder">
        <input type="text" id="nombre-com-${pub.id}" placeholder="Tu nombre">
        <input type="text" id="comentario-${pub.id}" placeholder="Escribe un comentario">
        <button onclick="agregarComentario(${pub.id})">Responder</button>
      </div>
    `;

    feed.appendChild(div);
  });
}

function agregarComentario(idPublicacion) {
  const publicaciones = JSON.parse(localStorage.getItem("publicaciones")) || [];
  const publicacion = publicaciones.find((p) => p.id === idPublicacion);

  const nombre = document.getElementById(`nombre-com-${idPublicacion}`).value.trim();
  const texto = document.getElementById(`comentario-${idPublicacion}`).value.trim();

  if (!nombre || !texto) {
    alert("Completa ambos campos para comentar.");
    return;
  }

  publicacion.comentarios.push({ nombre, texto });
  localStorage.setItem("publicaciones", JSON.stringify(publicaciones));
  mostrarPublicaciones();
}
