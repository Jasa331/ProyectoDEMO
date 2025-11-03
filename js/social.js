const publicarBtn = document.getElementById("publicarBtn");
const feed = document.getElementById("feed");

// 🔹 Cargar publicaciones guardadas al iniciar
document.addEventListener("DOMContentLoaded", mostrarPublicaciones);

publicarBtn.addEventListener("click", () => {
    const nombre = document.getElementById("nombre").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();
    const imagenInput = document.getElementById("imagen");
    const archivo = imagenInput.files[0];

    if (nombre === "" || mensaje === "") {
        alert("Por favor, completa todos los campos antes de publicar.");
        return;
    }

    if (archivo) {
        const lector = new FileReader();
        lector.onload = function(e) {
            guardarPublicacion(nombre, mensaje, e.target.result);
        };
        lector.readAsDataURL(archivo);
    } else {
        guardarPublicacion(nombre, mensaje, null);
    }

    // Limpiar campos
    document.getElementById("nombre").value = "";
    document.getElementById("mensaje").value = "";
    imagenInput.value = "";
});

function guardarPublicacion(nombre, mensaje, imagen) {
    const publicaciones = JSON.parse(localStorage.getItem("publicaciones")) || [];
    const nueva = { nombre, mensaje, imagen, fecha: new Date().toLocaleString() };
    publicaciones.unshift(nueva);
    localStorage.setItem("publicaciones", JSON.stringify(publicaciones));
    mostrarPublicaciones();
}

function mostrarPublicaciones() {
    feed.innerHTML = "";
    const publicaciones = JSON.parse(localStorage.getItem("publicaciones")) || [];

    publicaciones.forEach(pub => {
        const div = document.createElement("div");
        div.classList.add("publicacion");
        div.innerHTML = `
            <strong>${pub.nombre}</strong> <br>
            <small>${pub.fecha}</small>
            <p>${pub.mensaje}</p>
            ${pub.imagen ? `<img src="${pub.imagen}" alt="Imagen publicada">` : ""}
        `;
        feed.appendChild(div);
    });
}
