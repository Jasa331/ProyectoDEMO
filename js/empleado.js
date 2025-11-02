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

const form = document.getElementById("reporteForm");
const fotoInput = document.getElementById("foto");
const preview = document.getElementById("preview");
const reporteList = document.getElementById("reporteList");

let fotos = [];

fotoInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      fotos.push(event.target.result);
      renderPreview();
    };
    reader.readAsDataURL(file);
  });
});

function renderPreview() {
  preview.innerHTML = "";
  fotos.forEach((src, index) => {
    const div = document.createElement("div");
    div.style.position = "relative";

    const img = document.createElement("img");
    img.src = src;

    const btn = document.createElement("button");
    btn.textContent = "✖";
    btn.onclick = () => {
      fotos.splice(index, 1);
      renderPreview();
    };

    div.appendChild(img);
    div.appendChild(btn);
    preview.appendChild(div);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = document.getElementById("texto").value.trim();
  if (!texto && fotos.length === 0) return alert("Debe escribir un reporte o subir fotos.");

  const nuevoReporte = {
    texto,
    fotos,
    fecha: new Date().toLocaleString()
  };

  const reportes = JSON.parse(localStorage.getItem("reportes")) || [];
  reportes.push(nuevoReporte);
  localStorage.setItem("reportes", JSON.stringify(reportes));

  mostrarReportes();
  form.reset();
  fotos = [];
  preview.innerHTML = "";
  alert("Reporte enviado correctamente ✅");
});

function mostrarReportes() {
  const reportes = JSON.parse(localStorage.getItem("reportes")) || [];
  reporteList.innerHTML = reportes.map(r => `
    <div class="reporte-item">
      <p><strong>📅 ${r.fecha}</strong></p>
      <p>${r.texto}</p>
      <div class="fotos">
        ${r.fotos.map(f => `<img src="${f}" alt="foto reporte">`).join("")}
      </div>
    </div>
  `).join("");
}

mostrarReportes();
