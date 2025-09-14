const farmerForm = document.getElementById("farmerForm");
const farmerTableBody = document.getElementById("farmerTableBody");
const modal = document.getElementById("modal");
const btnAdd = document.getElementById("btnAdd");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const toast = document.getElementById("toast");

let farmers = [];
let editingIndex = null;

// Mostrar modal
btnAdd.addEventListener("click", () => {
  modal.style.display = "flex";
  modalTitle.textContent = "Agregar Agricultor";
  farmerForm.reset();
  editingIndex = null;
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

// Guardar agricultor
farmerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const crop = document.getElementById("crop").value;

  const farmer = { name, phone, crop };

  if (editingIndex !== null) {
    farmers[editingIndex] = farmer;
    showToast("✅ Agricultor actualizado");
  } else {
    farmers.push(farmer);
    showToast("✅ Agricultor agregado");
  }

  modal.style.display = "none";
  renderTable();
});

// Renderizar tabla
function renderTable() {
  farmerTableBody.innerHTML = "";
  farmers.forEach((farmer, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${farmer.name}</td>
      <td>${farmer.phone}</td>
      <td>${farmer.crop}</td>
      <td>
        <button class="btn btn-wa">📲 WhatsApp</button>
        <button class="btn">✏️ Editar</button>
        <button class="btn">🗑️ Eliminar</button>
      </td>
    `;

    // Asignar eventos a cada botón
    const [waBtn, editBtn, delBtn] = row.querySelectorAll("button");

    waBtn.addEventListener("click", () => sendWhatsApp(farmer.phone));
    editBtn.addEventListener("click", () => editFarmer(index));
    delBtn.addEventListener("click", () => deleteFarmer(index));

    farmerTableBody.appendChild(row);
  });
}

// Editar
function editFarmer(index) {
  const farmer = farmers[index];
  document.getElementById("name").value = farmer.name;
  document.getElementById("phone").value = farmer.phone;
  document.getElementById("crop").value = farmer.crop;

  modal.style.display = "flex";
  modalTitle.textContent = "Editar Agricultor";
  editingIndex = index;
}

// Eliminar
function deleteFarmer(index) {
  farmers.splice(index, 1);
  renderTable();
  showToast("❌ Agricultor eliminado");
}

// Enviar WhatsApp
function sendWhatsApp(phone) {
  if (!phone.startsWith("57")) {
    showToast("⚠️ Usa el formato: 573001112233");
    return;
  }
  window.open(`https://wa.me/${phone}`, "_blank");
}

// Toast
function showToast(message) {
  toast.textContent = message;
  toast.className = "toast show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

// Botón de regresar
document.addEventListener("DOMContentLoaded", () => {
  const backArrow = document.getElementById("backArrow");
  if (backArrow) {
    backArrow.addEventListener("click", () => {
      window.history.back();
    });
  }
});
