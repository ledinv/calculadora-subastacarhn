async function obtenerTipoCambioAutomatico() {
  const url = "https://subastacar-bch-api.onrender.com/api/tipo-cambio-bch";
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.valor) {
      document.getElementById("e2").value = data.valor;
      document.getElementById("e2").readOnly = true;
    } else {
      console.warn("No se encontró el tipo de cambio de venta.");
    }
  } catch (error) {
    console.error("Error al conectar con el backend:", error);
  }
}

function toggleMenu() {
  const menu = document.getElementById("menu-links");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function bloquearMotorPorVin() {
  const vin = document.getElementById("c13").value;
  const motorSelect = document.getElementById("motor");
  motorSelect.disabled = vin !== "OTROS";
  if (motorSelect.disabled) motorSelect.value = "";
}

const formatear = v => new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(v);
const formatearUSD = v => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const buyerFees = [
  [50,1],[100,25],[200,60],[350,90],[400,125],[450,135],[500,145],[550,155],[600,170],[700,195],
  [800,215],[900,215],[1000,250],[1200,270],[1300,285],[1400,300],[1500,315],[1600,330],[1700,350],[1800,370],[2000,390],
  [2400,425],[2500,460],[3000,505],[3500,555],[4000,600],[4500,625],[5000,650],[6000,700],[7000,755],[8000,800],
  [9000,820],[10000,850],[11000,850],[12000,875],[13000,890],[14000,900],[15000,900]
];

const virtualBidFees = [
  [100,50],[500,65],[1000,85],[1500,95],[2000,110],[4000,125],[6000,145],[8000,160],
  [9000,160],[10000,160],[200000,160]
];

const buscarValor = (tabla, valor) => {
  for (let i = tabla.length - 1; i >= 0; i--) {
    if (valor >= tabla[i][0]) return tabla[i][1];
  }
  return 0;
};

const buscarBuyerFee = c1 => c1 > 15000 ? +(c1 * 0.06).toFixed(2) : buscarValor(buyerFees, c1);
const buscarVirtualBidFee = c1 => c1 > 8000 ? 160 : buscarValor(virtualBidFees, c1);

function calcular() {
  registrarClic();

  const c1 = parseFloat(document.getElementById('c1').value.trim());
  const c7 = parseFloat(document.getElementById('c7').value.trim());
  const c8 = parseFloat(document.getElementById('c8').value.trim());
  const e2 = parseFloat(document.getElementById('e2').value.trim());
  const c13 = document.getElementById('c13').value;
  const c14 = document.getElementById('c14').value;
  const motor = document.getElementById('motor').value;

  if (!c1 || !c7 || !c8 || !e2 || !c13 || !c14 || (c13 === "OTROS" && !motor)) {
    alert("Por favor completa todos los campos. El campo 'Tipo de Motor' solo aplica si el VIN es OTROS.");
    return;
  }

  const c2 = 15;
  const c3 = buscarVirtualBidFee(c1);
  const c4 = buscarBuyerFee(c1);
  const c5 = 115;
  const c6 = c1 + c2 + c3 + c4 + c5;
  const c9 = c7 + c8;
  const c10 = c6 + c9;
  const c11 = c10 * e2;
  const o3 = 50 * e2;
  const o4 = c6 * 0.015 * e2;

  let c15 = 0;
  if (motor === "1.5 Inferior") {
    c15 = (c11 + o3 + o4 + c5) * 0.05;
  } else if (c13 === "OTROS" && c14 === "PICK UP") {
    c15 = (c11 + o3 + o4 + c5) * 0.10;
  } else if (c13 === "OTROS") {
    c15 = (c11 + o3 + o4 + c5) * 0.15;
  }

  let isc = 0;
  if (c10 <= 7000) isc = 0.10;
  else if (c10 <= 10000) isc = 0.15;
  else if (c10 <= 20000) isc = 0.20;
  else if (c10 <= 30000) isc = 0.30;
  else isc = 0.45;

  const c16 = (c14 === "OTROS") ? (c11 + o3 + o4 + c15) * isc : 0;
  const c17 = (c11 + c15 + c16 + o3 + o4) * 0.15;
  const c18 = c15 + c16 + c17;
  let c20 = 5000;
  if (c1 > 15000 && c1 <= 25000) c20 = 7000;
  else if (c1 > 25000) c20 = 10000;

  const c21 = 4000, c22 = 7500, c23 = 4000, c24 = 55 * e2;
  const c25 = c20 + c21 + c22 + c23 + c24;
  const c26 = c11 + c18 + c25 + o4 + o3;

  const detalles = [
    ['MONTO DE OFERTA', c1, 'usd'],
    ['ENVIRONMENTAL FEE', c2, 'usd'],
    ['VIRTUAL BID FEE', c3, 'usd'],
    ['BUYER FEE', c4, 'usd'],
    ['GATE Y TITLE PICK FEE', c5, 'usd'],
    ['TOTAL PRECIO SUBASTA', c6, 'usd'],
    ['VALOR DE BARCO', c7, 'usd'],
    ['PRECIO DE GRÚA', c8, 'usd'],
    ['TOTAL DE ENVÍO MARÍTIMO', c9, 'usd'],
    ['TOTAL CIF EN DÓLARES', c10, 'usd'],
    ['TOTAL CIF EN LEMPIRAS', c11, 'hnl'],
    ['DAI', c15, 'hnl'],
    ['ISC', c16, 'hnl'],
    ['ISV', c17, 'hnl'],
    ['TOTAL DE IMPUESTOS HONDURAS', c18, 'hnl'],
    ['ECOTASA', c20, 'hnl'],
    ['ADUANERO', c21, 'hnl'],
    ['VOTAINER - CONSOLIDADOS HN', c22, 'hnl'],
    ['MATRÍCULA Y PLACAS', c23, 'hnl'],
    ['TRANSFERENCIA INTERNACIONAL', c24, 'hnl'],
    ['TOTAL DE GASTOS FIJOS', c25, 'hnl'],
    ['TOTAL FINAL', c26, 'hnl']
  ];

  document.getElementById('results').innerHTML = `
    <div style="text-align:center;">
      <p><strong>Total Final:</strong> ${formatear(c26)}</p>
      <div class="botones-detalle">
        <button onclick="mostrarDetalles()" id="toggleBtn" class="styled-btn">Ver detalles</button>
        <button onclick="descargarPDF()" class="styled-btn">Descargar en PDF</button>
        <button onclick="compartirWhatsApp()" class="styled-btn">Compartir por WhatsApp</button>
      </div>
      <div id="detalleResultados" style="display:none;">
        <table class="tabla-detalles">
          <tr><th>Concepto</th><th>Valor</th></tr>
          ${detalles.map(([titulo, valor, tipo]) =>
            `<tr>
              <td>${titulo}</td>
              <td>${tipo === 'usd' ? formatearUSD(valor) : formatear(valor)}</td>
            </tr>`
          ).join('')}
        </table>
      </div>
    </div>
  `;
}

function mostrarDetalles() {
  const tabla = document.getElementById("detalleResultados");
  const btn = document.getElementById("toggleBtn");
  tabla.style.display = tabla.style.display === "none" ? "block" : "none";
  btn.textContent = tabla.style.display === "block" ? "Ocultar detalles" : "Ver detalles";
}

function descargarPDF() {
  const detalleDiv = document.getElementById("detalleResultados");
  if (detalleDiv.style.display === "none") {
    mostrarDetalles();
  }
  const contenido = document.getElementById("results").innerHTML;
  const ventanaPrint = window.open('', '_blank', 'width=800,height=600');
  ventanaPrint.document.open();
  ventanaPrint.document.write(`
    <html>
      <head>
        <title>Descargar en PDF</title>
        <style>
          body { font-family: Helvetica, sans-serif; margin: 20px; }
          .tabla-detalles {
            margin: 20px auto;
            border-collapse: collapse;
            width: auto;
            max-width: 600px;
          }
          .tabla-detalles th, .tabla-detalles td {
            padding: 8px 12px;
            border: 1px solid #ddd;
          }
          .tabla-detalles th {
            background-color: #f2f2f2;
          }
          .tabla-detalles th:first-child, .tabla-detalles td:first-child {
            text-align: left;
          }
          .tabla-detalles th:nth-child(2), .tabla-detalles td:nth-child(2) {
            text-align: right;
          }
        </style>
      </head>
      <body>${contenido}</body>
    </html>
  `);
  ventanaPrint.document.close();
  setTimeout(function() { ventanaPrint.print(); }, 500);
}

function compartirWhatsApp() {
  let texto = "¡Hola! Aquí tienes el cálculo de importación de tu vehículo:\n\n";
  const filas = document.querySelectorAll("#detalleResultados table tr");
  filas.forEach((fila) => {
    const cols = fila.querySelectorAll("td, th");
    if (cols.length === 2) {
      const concepto = cols[0].innerText.trim();
      const valor = cols[1].innerText.trim();
      texto += `${concepto}: ${valor}\n`;
    }
  });
  texto += "\nCalculado con SUBASTACARHN 👉 https://ledinv.github.io/calculadora-subastacarhn/";
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
}

function reiniciar() {
  document.getElementById('c1').value = "";
  document.getElementById('c7').value = "";
  document.getElementById('c8').value = "";
  document.getElementById('e2').value = "25.90";
  document.getElementById('c13').value = "OTROS";
  document.getElementById('c14').value = "OTROS";
  document.getElementById('motor').value = "";
  document.getElementById('results').innerHTML = '';
  bloquearMotorPorVin();
}

document.getElementById('calculateBtn').addEventListener('click', calcular);
document.getElementById('resetBtn').addEventListener('click', reiniciar);

const endpoint = "https://contador-clics-backend.onrender.com/contador";
async function obtenerContador() {
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    document.getElementById('contadorClics').textContent = `Cálculos: ${data.clics}`;
  } catch (e) {
    console.error("Error al obtener el contador:", e);
  }
}
async function registrarClic() {
  try {
    const res = await fetch(endpoint, { method: "POST" });
    const data = await res.json();
    document.getElementById('contadorClics').textContent = `Cotizaciones realizadas: ${data.clics}`;
  } catch (e) {
    console.error("Error al registrar clic:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("c13").value = "OTROS";
  bloquearMotorPorVin();
  obtenerContador();
  obtenerTipoCambioAutomatico();
});//hola
