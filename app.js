// =============================================================
// APP.JS — lógica del negocio
// Se divide en: Helpers, Storage, Pestañas, Productos, Ventas, Salarios
// =============================================================

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function mxn(numero) {
  return "$" + numero.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// *** Ojo: NO uso new Date().toISOString() para la fecha, porque esa
// función convierte a hora UTC y te puede regresar el día equivocado
// según la hora del día en que estés vendiendo. Armo la fecha con las
// piezas locales (año, mes, día) para que siempre sea TU día real.
function fechaISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fechaBonita(d = new Date()) {
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function calcularGanancia(costo, precio) {
  return precio - costo;
}

function buscarTamano(categoriaId, tamanoNombre) {
  const categoria = MENU.find(c => c.id === categoriaId);
  return categoria.tamanos.find(t => t.tamano === tamanoNombre);
}

// ---------------------------------------------------------
// STORAGE (localStorage)
// Todo lo del día vive bajo la llave "ventas_<fecha>".
// Cuando cierras el corte, se archiva en "historialCortes"
// y se borra la llave del día.
// ---------------------------------------------------------

function getVentasHoy() {
  const raw = localStorage.getItem("ventas_" + fechaISO());
  return raw ? JSON.parse(raw) : [];
}

function guardarVentasHoy(ventas) {
  localStorage.setItem("ventas_" + fechaISO(), JSON.stringify(ventas));
}

function agregarVenta(venta) {
  const ventas = getVentasHoy();
  ventas.push(venta);
  guardarVentasHoy(ventas);
}

function eliminarVenta(id) {
  const ventas = getVentasHoy().filter(v => v.id !== id);
  guardarVentasHoy(ventas);
}

function getHistorial() {
  const raw = localStorage.getItem("historialCortes");
  return raw ? JSON.parse(raw) : [];
}

function guardarEnHistorial(registro) {
  const historial = getHistorial();
  historial.push(registro);
  localStorage.setItem("historialCortes", JSON.stringify(historial));
}

// ---------------------------------------------------------
// TOTALES DEL DÍA (se usan en Ventas y en Salarios)
// ---------------------------------------------------------

function calcularTotalesDia(ventas) {
  return ventas.reduce(
    (acc, v) => {
      acc.ingreso += v.ingreso;
      acc.costo += v.costoTotal;
      acc.ganancia += v.ganancia;
      return acc;
    },
    { ingreso: 0, costo: 0, ganancia: 0 }
  );
}

function calcularReparto(gananciaNeta, pct) {
  return {
    resurtido: gananciaNeta * (pct.resurtido / 100),
    nicole: gananciaNeta * (pct.nicole / 100),
    avril: gananciaNeta * (pct.avril / 100),
  };
}

// ---------------------------------------------------------
// PESTAÑAS
// ---------------------------------------------------------

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });
}

// ---------------------------------------------------------
// PRODUCTOS
// ---------------------------------------------------------

let chartGanancias, chartInsumosPie;

function renderInsumos() {
  const tbody = document.getElementById("tabla-insumos-body");
  tbody.innerHTML = INSUMOS.map(i => `
    <tr>
      <td>${i.ingrediente}</td>
      <td>${i.presentacion}</td>
      <td>${i.precioComercial !== null ? mxn(i.precioComercial) : "—"}</td>
      <td>${i.medidaReceta}</td>
      <td>${mxn(i.costoProrrateado)}</td>
    </tr>
  `).join("");
}

function renderMenu() {
  const contenedor = document.getElementById("tabla-menu");
  contenedor.innerHTML = MENU.map(categoria => `
    <h3 class="menu-linea-titulo">${categoria.nombre}</h3>
    <div class="tabla-wrap">
      <table class="tabla-datos">
        <thead><tr><th>Tamaño</th><th>Piezas</th><th>Costo</th><th>Precio</th><th>Ganancia</th><th>Margen</th></tr></thead>
        <tbody>
          ${categoria.tamanos.map(t => {
            const ganancia = calcularGanancia(t.costo, t.precio);
            const margen = ((ganancia / t.precio) * 100).toFixed(0);
            return `<tr>
              <td>${t.tamano}</td>
              <td>${t.piezas}</td>
              <td>${mxn(t.costo)}</td>
              <td>${mxn(t.precio)}</td>
              <td class="ganancia-positiva">${mxn(ganancia)}</td>
              <td class="ganancia-positiva">${margen}%</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `).join("");
}

function renderChartGanancias() {
  const ctx = document.getElementById("chart-ganancias");
  const tamanos = ["Chica", "Mediana", "Familiar"];
  const datasets = MENU.map((categoria, i) => ({
    label: categoria.nombre,
    data: tamanos.map(t => {
      const obj = categoria.tamanos.find(x => x.tamano === t);
      return calcularGanancia(obj.costo, obj.precio);
    }),
    backgroundColor: [ "#C17817", "#D6486B", "#5B7B4F" ][i],
    borderRadius: 6,
  }));

  if (chartGanancias) chartGanancias.destroy();
  chartGanancias = new Chart(ctx, {
    type: "bar",
    data: { labels: tamanos, datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => "$" + v } } },
    },
  });
}

function renderChartInsumos() {
  const ctx = document.getElementById("chart-insumos");
  const conCosto = INSUMOS.filter(i => i.costoProrrateado > 0);

  if (chartInsumosPie) chartInsumosPie.destroy();
  chartInsumosPie = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: conCosto.map(i => i.ingrediente),
      datasets: [{
        data: conCosto.map(i => i.costoProrrateado),
        backgroundColor: ["#C17817", "#D6486B", "#5B7B4F", "#F5B942", "#6B4F3F", "#3D2B1F"],
      }],
    },
    options: { responsive: true, plugins: { legend: { position: "right" } } },
  });
}

function initProductos() {
  renderInsumos();
  renderMenu();
  renderChartGanancias();
  renderChartInsumos();
}

// ---------------------------------------------------------
// VENTAS
// ---------------------------------------------------------

let chartVentasHoy;

function initFormVenta() {
  const selectLinea = document.getElementById("select-linea");
  selectLinea.innerHTML = MENU.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("");

  const selectFruta = document.getElementById("select-fruta");
  selectFruta.innerHTML = FRUTAS_EXTRA.map(f => `<option value="${f}">${f}</option>`).join("");

  document.getElementById("check-fruta").addEventListener("change", e => {
    document.getElementById("wrap-select-fruta").classList.toggle("oculto", !e.target.checked);
  });

  document.getElementById("form-venta").addEventListener("submit", e => {
    e.preventDefault();

    const categoriaId = selectLinea.value;
    const categoria = MENU.find(c => c.id === categoriaId);
    const tamanoNombre = document.getElementById("select-tamano").value;
    const tamanoObj = buscarTamano(categoriaId, tamanoNombre);
    const cantidad = parseInt(document.getElementById("input-cantidad").value, 10);
    const tieneFruta = document.getElementById("check-fruta").checked;
    const tipoFruta = tieneFruta ? selectFruta.value : null;
    const cargoExtraUnit = tieneFruta ? cargoFruta(tamanoNombre) : 0;

    const precioUnit = tamanoObj.precio;
    const costoUnit = tamanoObj.costo;
    const ingreso = (precioUnit + cargoExtraUnit) * cantidad;
    const costoTotal = costoUnit * cantidad; // *** la fruta extra no tiene costo registrado en tu documento, así que se suma como ganancia pura. Si algún día le pones costo a la fruta, aquí es donde se restaría.
    const ganancia = ingreso - costoTotal;

    agregarVenta({
      id: Date.now(),
      hora: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      categoriaId, categoriaNombre: categoria.nombre, tamano: tamanoNombre,
      cantidad, tieneFruta, tipoFruta,
      precioUnit, costoUnit, cargoExtraUnit,
      ingreso, costoTotal, ganancia,
    });

    e.target.reset();
    document.getElementById("wrap-select-fruta").classList.add("oculto");
    renderVentas();
    renderSalarios(); // *** este faltaba: el reparto en vivo también depende de la ganancia de hoy
  });
}

function renderVentas() {
  const ventas = getVentasHoy();
  document.getElementById("fecha-hoy").textContent = fechaBonita();

  const lista = document.getElementById("ticket-lista");
  lista.innerHTML = ventas.length === 0
    ? `<li class="vacio">Aún no registras ventas hoy</li>`
    : ventas.map(v => `
      <li>
        <span class="venta-desc">${v.hora} · ${v.cantidad}× ${v.categoriaNombre} (${v.tamano})${v.tieneFruta ? " +" + v.tipoFruta : ""}</span>
        <span class="venta-monto">${mxn(v.ingreso)}
          <button class="btn-borrar" onclick="borrarVentaYRenderizar(${v.id})">✕</button>
        </span>
      </li>
    `).join("");

  const totales = calcularTotalesDia(ventas);
  document.getElementById("ticket-ingreso").textContent = mxn(totales.ingreso);
  document.getElementById("ticket-costo").textContent = mxn(totales.costo);
  document.getElementById("ticket-ganancia").textContent = mxn(totales.ganancia);

  renderChartVentasHoy(ventas);
}

function borrarVentaYRenderizar(id) {
  eliminarVenta(id);
  renderVentas();
  renderSalarios(); // el reparto en vivo depende de la ganancia de hoy
}

function renderChartVentasHoy(ventas) {
  const ctx = document.getElementById("chart-ventas-hoy");
  const porCategoria = MENU.map(c => ({
    nombre: c.nombre,
    total: ventas.filter(v => v.categoriaId === c.id).reduce((s, v) => s + v.ingreso, 0),
  }));

  if (chartVentasHoy) chartVentasHoy.destroy();
  chartVentasHoy = new Chart(ctx, {
    type: "pie",
    data: {
      labels: porCategoria.map(c => c.nombre),
      datasets: [{ data: porCategoria.map(c => c.total), backgroundColor: ["#C17817", "#D6486B", "#5B7B4F"] }],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });
}

function initCerrarCorte() {
  document.getElementById("btn-cerrar-corte").addEventListener("click", () => {
    const ventas = getVentasHoy();
    if (ventas.length === 0) {
      alert("No hay ventas registradas hoy todavía.");
      return;
    }
    const confirmar = confirm("¿Cerrar el corte de hoy? Se descargará el PDF y se reiniciará el registro para mañana.");
    if (!confirmar) return;

    const totales = calcularTotalesDia(ventas);
    const pct = PORCENTAJES;
    const reparto = calcularReparto(totales.ganancia, pct);
    const fecha = fechaISO();

    generarPDFCorte(ventas, totales, reparto, pct, fecha);

    guardarEnHistorial({
      fecha, ingreso: totales.ingreso, costo: totales.costo, ganancia: totales.ganancia,
      resurtido: reparto.resurtido, nicole: reparto.nicole, avril: reparto.avril,
    });

    guardarVentasHoy([]); // se reinicia el día
    renderVentas();
    renderSalarios();
  });
}

function generarPDFCorte(ventas, totales, reparto, pct, fecha) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Corte del día", 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, 14, 26);

  doc.autoTable({
    startY: 32,
    head: [["Producto", "Tamaño", "Cant.", "Extra", "Precio unit.", "Ingreso", "Costo", "Ganancia"]],
    body: ventas.map(v => [
      v.categoriaNombre, v.tamano, v.cantidad,
      v.tieneFruta ? v.tipoFruta : "—",
      mxn(v.precioUnit + v.cargoExtraUnit),
      mxn(v.ingreso), mxn(v.costoTotal), mxn(v.ganancia),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [193, 120, 23] },
  });

  let y = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Totales del día", 14, y); y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Ingresos totales: ${mxn(totales.ingreso)}`, 14, y); y += 6;
  doc.text(`Costo total: ${mxn(totales.costo)}`, 14, y); y += 6;
  doc.text(`Ganancia neta: ${mxn(totales.ganancia)}`, 14, y); y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Reparto", 14, y); y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Fondo de resurtido (${pct.resurtido}%): ${mxn(reparto.resurtido)}`, 14, y); y += 6;
  doc.text(`Nicole (${pct.nicole}%): ${mxn(reparto.nicole)}`, 14, y); y += 6;
  doc.text(`Avril (${pct.avril}%): ${mxn(reparto.avril)}`, 14, y);

  doc.save(`corte_${fecha}.pdf`);
}

// ---------------------------------------------------------
// RESPALDO DEL HISTORIAL
// Por si el navegador borra localStorage (config de privacidad,
// limpieza de caché, etc.), esto guarda una copia real en disco.
// ---------------------------------------------------------

function exportarHistorial() {
  const historial = getHistorial();
  if (historial.length === 0) {
    alert("Todavía no hay ningún corte cerrado que respaldar.");
    return;
  }
  const blob = new Blob([JSON.stringify(historial, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `respaldo_historial_${fechaISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarHistorial(archivo) {
  const lector = new FileReader();
  lector.onload = () => {
    let datos;
    try {
      datos = JSON.parse(lector.result);
      if (!Array.isArray(datos)) throw new Error("no es un arreglo");
    } catch (err) {
      alert("Ese archivo no es un respaldo válido.");
      return;
    }
    const actual = getHistorial();
    const confirmar = confirm(
      `Esto va a REEMPLAZAR tu historial actual (${actual.length} corte(s)) por el del archivo (${datos.length} corte(s)). ¿Continuar?`
    );
    if (!confirmar) return;
    localStorage.setItem("historialCortes", JSON.stringify(datos));
    renderSalarios();
    alert("Historial restaurado.");
  };
  lector.readAsText(archivo);
}

function borrarHistorial() {
  const historial = getHistorial();
  if (historial.length === 0) {
    alert("Ya no hay ningún historial guardado.");
    return;
  }
  const confirmar = confirm(
    `Esto va a BORRAR permanentemente tus ${historial.length} corte(s) guardados de este celular. ` +
    `Si no tienes un respaldo descargado, no se puede recuperar. ¿Seguro que quieres continuar?`
  );
  if (!confirmar) return;

  localStorage.removeItem("historialCortes");
  renderSalarios();
  alert("Historial borrado.");
}

function initRespaldo() {
  const btnRespaldar = document.getElementById("btn-respaldar");
  const inputRestaurar = document.getElementById("input-restaurar");
  const btnBorrar = document.getElementById("btn-borrar-respaldo");

  // *** Antes esto tronaba si los botones no existían en el HTML, y como
  // era el último init() antes de renderVentas()/renderSalarios(), esos dos
  // nunca se ejecutaban al cargar la página. Por eso las ventas guardadas
  // en localStorage no se veían al recargar (parecía que se borraban).
  if (btnRespaldar) btnRespaldar.addEventListener("click", exportarHistorial);
  if (inputRestaurar) {
    inputRestaurar.addEventListener("change", e => {
      if (e.target.files[0]) importarHistorial(e.target.files[0]);
      e.target.value = ""; // permite volver a elegir el mismo archivo después
    });
  }
  if (btnBorrar) btnBorrar.addEventListener("click", borrarHistorial);
}

// ---------------------------------------------------------
// SALARIOS
// ---------------------------------------------------------

let chartHistorial;

function renderSalarios() {
  const ventas = getVentasHoy();
  const totales = calcularTotalesDia(ventas);
  const pct = PORCENTAJES;
  const reparto = calcularReparto(totales.ingreso, pct);

  document.getElementById("salario-resurtido").textContent = mxn(reparto.resurtido);
  document.getElementById("salario-nicole").textContent = mxn(reparto.nicole);
  document.getElementById("salario-avril").textContent = mxn(reparto.avril);

  const historial = getHistorial();
  const tbody = document.getElementById("tabla-historial-body");
  tbody.innerHTML = historial.length === 0
    ? `<tr><td colspan="7" style="text-align:center; font-family: var(--font-body);">Todavía no cierras ningún corte</td></tr>`
    : [...historial].reverse().map(h => `
      <tr>
        <td>${h.fecha}</td>
        <td>${mxn(h.ingreso)}</td>
        <td>${mxn(h.costo)}</td>
        <td class="ganancia-positiva">${mxn(h.ganancia)}</td>
        <td>${mxn(h.resurtido)}</td>
        <td>${mxn(h.nicole)}</td>
        <td>${mxn(h.avril)}</td>
      </tr>
    `).join("");

  renderChartHistorial(historial);
}

function renderChartHistorial(historial) {
  const ctx = document.getElementById("chart-historial");
  const ultimos = historial.slice(-14); // últimos 14 cortes

  if (chartHistorial) chartHistorial.destroy();
  chartHistorial = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ultimos.map(h => h.fecha),
      datasets: [{ label: "Ganancia neta", data: ultimos.map(h => h.ganancia), backgroundColor: "#5B7B4F", borderRadius: 6 }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => "$" + v } } },
    },
  });
}

// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // *** Cada init() va en su propio try/catch: si algo llegara a fallar en
  // una sección, las demás (sobre todo renderVentas/renderSalarios, que son
  // las que muestran tus ventas guardadas) igual se ejecutan.
  const pasos = [initTabs, initProductos, initFormVenta, initCerrarCorte, initRespaldo, renderVentas, renderSalarios];
  pasos.forEach(paso => {
    try {
      paso();
    } catch (err) {
      console.error(`Error en ${paso.name}:`, err);
    }
  });

  // Registro del Service Worker para que la app funcione instalada y sin internet
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(err => console.error("Error registrando SW:", err));
  }
});
