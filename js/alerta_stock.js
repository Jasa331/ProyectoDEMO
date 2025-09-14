let insumos = [
  { id:1, name:'Fertilizante NPK', stock:25, min:15 },
  { id:2, name:'Semillas de maíz', stock:8,  min:10 },
  { id:3, name:'Herbicida', stock:3,  min:5 },
  { id:4, name:'Plaguicida', stock:0,  min:4 },
  { id:5, name:'Semillas de arroz', stock:12, min:10 },
  { id:6, name:'Fertilizante orgánico', stock:5, min:8 }
];

const tbody = document.getElementById('tbody');
const toast = document.getElementById('toast');

// Renderizar tabla
function render(){
  tbody.innerHTML = '';
  insumos.forEach(i=>{
    const tr = document.createElement('tr');
    let estado = '<span class="status ok">Bien</span>';
    if(i.stock <= i.min && i.stock > 0){
      estado = '<span class="status warn">Bajo</span>';
    } else if(i.stock === 0){
      estado = '<span class="status danger">Sin stock</span>';
    }
    tr.innerHTML = `
      <td>${i.name}</td>
      <td>${i.stock}</td>
      <td>${i.min}</td>
      <td>${estado}</td>
      <td>
        <button class="btn" onclick="editInsumo(${i.id})">Editar</button>
        <button class="btn" style="background:#ef4444" onclick="deleteInsumo(${i.id})">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// Revisar stock
function check(){
  const bajos = insumos.filter(i=>i.stock <= i.min);
  if(bajos.length > 0){
    showToast(`⚠️ ${bajos.length} insumo(s) con stock bajo`);
  } else {
    showToast('✅ Todos los insumos están en buen nivel');
  }
  render();
}

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'), 3000);
}

document.getElementById('checkBtn').addEventListener('click', check);

// Crear
document.getElementById('formAdd').addEventListener('submit', e=>{
  e.preventDefault();
  const name = document.getElementById('name').value;
  const stock = parseInt(document.getElementById('stock').value);
  const min = parseInt(document.getElementById('min').value);

  if(!name || isNaN(stock) || isNaN(min)){
    showToast('❌ Datos inválidos');
    return;
  }

  insumos.push({ id:Date.now(), name, stock, min });
  render();
  showToast('✅ Insumo agregado');
  e.target.reset();
});

// Editar
window.editInsumo = function(id){
  const insumo = insumos.find(i=>i.id===id);
  const nuevoStock = prompt('Nuevo stock para '+insumo.name, insumo.stock);
  if(nuevoStock!==null && !isNaN(nuevoStock)){
    insumo.stock = parseInt(nuevoStock);
    render();
    showToast('✏️ Insumo actualizado');
  }
}

// Eliminar
window.deleteInsumo = function(id){
  if(confirm('¿Eliminar este insumo?')){
    insumos = insumos.filter(i=>i.id!==id);
    render();
    showToast('🗑️ Insumo eliminado');
  }
}

render();
