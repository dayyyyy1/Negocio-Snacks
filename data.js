// =============================================
// DATOS DEL NEGOCIO
// Todo esto sale directo de tu "Plan Financiero y
// Estructura Estratégica". Si algún precio cambia,
// se edita AQUÍ y ya, se actualiza en toda la app.
// =============================================

// --- Insumos y materia prima (Tabla 1) ---
const INSUMOS = [
  { ingrediente: "Harina",              presentacion: "Paquete (rinde 4 tazas)",   precioComercial: 25.00, medidaReceta: "1 Taza",        costoProrrateado: 6.25 },
  { ingrediente: "Huevo",                presentacion: "Medio Kilo (8 piezas)",    precioComercial: 25.00, medidaReceta: "1 Pieza",       costoProrrateado: 3.12 },
  { ingrediente: "Mantequilla",          presentacion: "Barra (rinde 6 cdas)",     precioComercial: 15.00, medidaReceta: "1 Cucharada",   costoProrrateado: 2.50 },
  { ingrediente: "Leche",                presentacion: "Envase 2L (8 tazas)",      precioComercial: 15.00, medidaReceta: "3/4 Taza",      costoProrrateado: 1.41 },
  { ingrediente: "Extracto de Vainilla", presentacion: "Botella Grande (~60 tapas)", precioComercial: 60.00, medidaReceta: "2 Tapas",     costoProrrateado: 2.00 },
  { ingrediente: "Fruta",                presentacion: "Estimado por mezcla",      precioComercial: 50.00, medidaReceta: "Fijo por tanda", costoProrrateado: 3.00 },
];

// --- Menú de productos (Tabla 2) ---
// OJO: "ganancia" NO se guarda como número fijo.
// Se calcula siempre como precio - costo (ver app.js -> calcularGanancia()).
// Así, si cambias un costo aquí, la ganancia se recalcula sola en toda la app.
const MENU = [
  {
    id: "bolitas",
    nombre: "Bolitas de Hot Cake",
    tamanos: [
      { tamano: "Chica",    piezas: 8,  costo: 9.64,  precio: 20.00 },
      { tamano: "Mediana",  piezas: 12, costo: 13.94, precio: 28.00 },
      { tamano: "Familiar", piezas: 24, costo: 27.88, precio: 60.00 },
    ],
  },
  {
    id: "waffles",
    nombre: "Waffles Premium",
    tamanos: [
      { tamano: "Chica",    piezas: 3, costo: 8.37,  precio: 20.00 },
      { tamano: "Mediana",  piezas: 5, costo: 12.40, precio: 28.00 },
      { tamano: "Familiar", piezas: 9, costo: 22.53, precio: 55.00 },
    ],
  },
  {
    id: "donitas",
    nombre: "Mini Donitas",
    tamanos: [
      { tamano: "Chica",    piezas: 7,  costo: 9.64,  precio: 20.00 },
      { tamano: "Mediana",  piezas: 11, costo: 13.55, precio: 28.00 },
      { tamano: "Familiar", piezas: 21, costo: 26.38, precio: 55.00 },
    ],
  },
];

// --- Barra de toppings ---
const TOPPINGS_INCLUIDOS = [
  "Nutella original", "Lechera condensada", "Crema de cacahuate",
  "Cajeta tradicional", "Chocolate líquido Hershey's",
  "Mermelada de fresa", "Miel sabor Maple",
  "Chispitas de colores", "Chispitas de chocolate",
];

const FRUTAS_EXTRA = ["Durazno en almíbar", "Fresas", "Surtido de frutas tropicales"];

// Cargo extra por fruta: $5 en Chica/Mediana, $10 en Familiar
function cargoFruta(tamano) {
  return tamano === "Familiar" ? 10.00 : 5.00;
}

// Porcentajes de reparto — FIJOS. Si algún día cambian, se edita aquí.
const PORCENTAJES = {
  resurtido: 40,
  nicole: 30,
  avril: 30,
};
