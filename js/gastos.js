document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formGasto');
  const tabla = document.getElementById('tablaGastos');
  const btnBorrarTodo = document.getElementById('btnBorrarTodo');

  // 🟩 Cargar gastos al iniciar
  const gastosGuardados = JSON.parse(localStorage.getItem('gastosAgricolas')) || [];
  gastosGuardados.forEach(gasto => agregarFila(gasto));

  // 🟨 Guardar nuevo gasto
  form.addEventListener('submit', e => {
    e.preventDefault();

    const concepto = document.getElementById('concepto').value.trim();
    const monto = parseFloat(document.getElementById('monto').value);
    const categoria = document.getElementById('categoria').value;
    const fecha = new Date().toLocaleDateString();

    if (!concepto || isNaN(monto)) {
      alert("Por favor completa todos los campos correctamente.");
      return;
    }

    const nuevoGasto = { concepto, monto, categoria, fecha };
    gastosGuardados.push(nuevoGasto);
    localStorage.setItem('gastosAgricolas', JSON.stringify(gastosGuardados));

    agregarFila(nuevoGasto);
    form.reset();
  });

  // 🟧 Agregar fila a la tabla
  function agregarFila(gasto) {
    if (tabla.querySelector('td[colspan]')) tabla.innerHTML = '';

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${gasto.concepto}</td>
      <td>$${gasto.monto.toFixed(2)}</td>
      <td>${gasto.categoria}</td>
      <td>${gasto.fecha}</td>
    `;
    tabla.appendChild(fila);
  }

  // 🟥 Borrar todos los registros
  btnBorrarTodo.addEventListener('click', () => {
    const confirmar = confirm("¿Seguro que deseas eliminar todos los gastos?");
    if (confirmar) {
      localStorage.removeItem('gastosAgricolas');
      tabla.innerHTML = `<tr><td colspan="4">Aún no hay registros</td></tr>`;
    }
  });
});
