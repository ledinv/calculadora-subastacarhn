// === script.js ===

// Inicializa Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA5BuOwgEUYK1JMwJD0PL0k0rcAST_Koms",
  authDomain: "subastacarhn-40554.firebaseapp.com",
  projectId: "subastacarhn-40554",
  storageBucket: "subastacarhn-40554.appspot.com",
  messagingSenderId: "536785797974",
  appId: "1:536785797974:web=e3eabb4dcd898c2ffe8cf7",
  measurementId: "G-QM5N60K8C0"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Menú desplegable móvil
function toggleMenu() {
  const menu = document.getElementById("mobile-menu-links");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

// Habilita o bloquea selección de motor
function bloquearMotorPorVin() {
  const vin = document.getElementById("c13").value;
  const motorSelect = document.getElementById("motor");
  motorSelect.disabled = vin !== "OTROS";
  if (motorSelect.disabled) motorSelect.value = "";
}

// Formato monetario
const formatear = v =>
  new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(v);
const formatearUSD = v =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

// Obtener tipo de cambio automático
async function obtenerTipoCambioAutomatico() {
  const url = "https://subastacar-bch-api.onrender.com/api/tipo-cambio-bch";
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.valor) {
      document.getElementById("e2").value = data.valor;
      document.getElementById("e2").readOnly = true;
    }
  } catch (error) {
    console.error("Error al conectar con el backend:", error);
  }
}

// Buyer fees y virtual bid fees
const buyerFees = [
  [50,1],[100,25],[200,60],[300,85],[350,100],[400,125],[450,135],[500,145],[550,155],[600,170],
  [700,195],[800,215],[900,230],[1000,250],[1200,270],[1300,285],[1400,300],[1500,315],[1600,330],
  [1700,350],[1800,370],[2000,390],[2400,425],[2500,460],[3000,505],[3500,555],[4000,600],[4500,625],
  [5000,650],[5500,675],[6000,700],[7000,755],[7500,775],[8000,800],[8500,820],[9000,820],
  [10000,850],[11000,850],[11500,860],[12000,875],[12500,890],[13000,890],[14000,900],[15000,900]
];
const virtualBidFees = [
  [100,50],[500,65],[1000,85],[1500,95],[2000,110],[4000,125],
  [6000,145],[8000,160],[9000,160],[10000,160],[200000,160]
];
const buscarValor = (tabla, valor) => {
  for (let i = tabla.length - 1; i >= 0; i--) {
    if (valor >= tabla[i][0]) return tabla[i][1];
  }
  return 0;
};
const buscarBuyerFee = c1 =>
  c1 > 15000 ? +(c1 * 0.06).toFixed(2) : buscarValor(buyerFees, c1);
const buscarVirtualBidFee = c1 =>
  c1 > 8000 ? 160 : buscarValor(virtualBidFees, c1);

// Función principal de cálculo
function calcular() {
  registrarClic();

  const c1  = parseFloat(document.getElementById('c1').value.trim());
  const c7  = parseFloat(document.getElementById('c7').value.trim());
  const c8  = parseFloat(document.getElementById('c8').value.trim());
  const e2  = parseFloat(document.getElementById('e2').value.trim());
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

  const o3usd = 50;
  const o4usd = c6 * 0.015;
  const o3 = o3usd * e2;
  const o4 = o4usd * e2;

  const tieneCafta = c13 === "1,4,5";

  // === LÓGICA DE AMNISTÍA COMENTADA ===
  // const anio = parseInt(document.getElementById("anio").value);
  // if (anio <= 2005) {
  //   const totalAmnistia = c11 + 20000;
  //   document.getElementById('results').innerHTML = `
  //     <div style="text-align:center;">
  //       <p><strong>Este vehículo aplica para amnistía.</strong></p>
  //       <p><strong>Total Final:</strong> ${formatear(totalAmnistia)}</p>
  //     </div>`;
  //   guardarHistorial([{ titulo: "Vehículo con amnistía", valor: formatear(totalAmnistia) }], formatear(totalAmnistia));
  //   return;
  // }

  let c15 = 0;
  if (!tieneCafta) {
    const baseDAI = c11 + o3 + o4;
    if      (c14 === "MAQUINARIA")              c15 = baseDAI * 0.05;
    else if (c14 === "HIBRIDO")                 c15 = baseDAI * 0.10;
    else if (["PICK UP","CAMION","BUS","MOTO"].includes(c14)) c15 = baseDAI * 0.10;
    else if (motor === "1.5 Inferior")          c15 = baseDAI * 0.05;
    else                                        c15 = baseDAI * 0.15;
  }

  let c16 = 0;
  if (c14 === "PICK UP")           c16 = 0;
  else if (c14 === "MOTO")         c16 = (c11 + o3 + o4 + c15) * 0.10;
  else if (c14 === "HIBRIDO")      c16 = (c11 + o3 + o4 + c15) * 0.05;
  else if (["CAMION","BUS","MAQUINARIA"].includes(c14)) c16 = 0;
  else {
    const baseISCusd = c10 + o3usd + o4usd;
    let tasaISC = 0;
    if      (baseISCusd <= 7000)   tasaISC = 0.10;
    else if (baseISCusd <= 10000)  tasaISC = 0.15;
    else if (baseISCusd <= 20000)  tasaISC = 0.20;
    else if (baseISCusd <= 50000)  tasaISC = 0.30;
    else                            tasaISC = 0.45;
    c16 = (c11 + o3 + o4 + c15) * tasaISC;
  }

  let c17 = 0;
  if (c14 !== "MAQUINARIA") c17 = (c11 + c15 + c16 + o3 + o4) * 0.15;

  const c18 = c15 + c16 + c17;
  let c20 = 5000;
  if      (c10 > 15000 && c10 <= 25000) c20 = 7000;
  else if (c10 > 25000)                 c20 = 10000;
  if (c14 === "MAQUINARIA")             c20 = 0;

  const c21 = 4000;
  const c22 = 7500;
  const c23 = 4000;
  const c24 = 55 * e2;
  const c25 = c20 + c21 + c22 + c23 + c24;
  const c26 = c11 + c18 + c25;

  // Preparamos detalles para la cotización
  window._cotizacionDetalles = [
    ['MONTO DE OFERTA',       c1,  'usd'],
    ['ENVIRONMENTAL FEE',     c2,  'usd'],
    ['VIRTUAL BID FEE',       c3,  'usd'],
    ['BUYER FEE',             c4,  'usd'],
    ['GATE Y TITLE PICK FEE', c5,  'usd'],
    ['TOTAL PRECIO SUBASTA',  c6,  'usd'],
    ['VALOR DE BARCO',        c7,  'usd'],
    ['PRECIO DE GRÚA',        c8,  'usd'],
    ['TOTAL DE ENVÍO MARÍTIMO',c9,  'usd'],
    ['TOTAL CIF EN DÓLARES',   c10, 'usd'],
    ['TOTAL CIF EN LEMPIRAS',  c11, 'hnl'],
    ['DAI',                    c15, 'hnl'],
    ['ISC',                    c16, 'hnl'],
    ['ISV',                    c17, 'hnl'],
    ['TOTAL DE IMPUESTOS HONDURAS', c18, 'hnl'],
    ['ECOTASA',                c20, 'hnl'],
    ['ADUANERO',               c21, 'hnl'],
    ['VOTAINER - CONSOLIDADOS HN', c22,'hnl'],
    ['MATRÍCULA Y PLACAS',     c23, 'hnl'],
    ['TRANSFERENCIA INTERNACIONAL', c24,'hnl'],
    ['TOTAL DE GASTOS FIJOS',  c25, 'hnl'],
    ['TOTAL FINAL',            c26, 'hnl']
  ];
  window._cotizacionTotal = c26;

  // Guardar historial en Firebase
  const detallesFormateados = window._cotizacionDetalles.map(([t, v, tipo]) => ({
    titulo: t,
    valor: tipo === 'usd' ? formatearUSD(v) : formatear(v)
  }));
  guardarHistorial(detallesFormateados, formatear(c26));

  // Mostramos la cotización en pantalla
  mostrarDetalles();
}

// Función para mostrar/ocultar detalles
function toggleDetalles() {
  const container = document.getElementById("detalleResultados");
  const btn       = document.getElementById("toggleBtn");
  if (container.style.display === "none") {
    container.style.display = "block";
    btn.textContent = "Ocultar detalles";
  } else {
    container.style.display = "none";
    btn.textContent = "Ver detalles";
  }
}

// Genera y muestra la cotización formal
function mostrarDetalles() {
  const detallesHtml = window._cotizacionDetalles.map(([t, v, tipo]) => `
    <tr>
      <td>${t}</td>
      <td>${tipo==='usd'?formatearUSD(v):formatear(v)}</td>
    </tr>`).join('');

  const plantillaCotizacion = `
    <div class="cotizacion-container">
      <header class="cotizacion-header">
        <img src="logo.png" alt="SubastaCarHN" class="logo" />
        <div class="empresa-info">
          <h1>COTIZACIÓN</h1>
          <p>SubastaCarHN</p>
          <p>Tel: +504 97330137 | info@subastacarhn.com</p>
          <p>www.comocomprarcarros.com</p>
        </div>
      </header>
      <hr />
      <div class="total-final">
        <strong>Total Final:</strong> ${formatear(window._cotizacionTotal)}
      </div>
      <div class="botones-detalle">
        <button id="toggleBtn" class="styled-btn" onclick="toggleDetalles()">Ver detalles</button>
        <button onclick="descargarPDF()" class="styled-btn">Descargar Cotización</button>
        <button onclick="compartirWhatsApp()" class="styled-btn">Compartir por WhatsApp</button>
      </div>
      <div id="detalleResultados" style="display: none; margin-top: 1rem;">
        <table class="tabla-cotizacion">
          <thead><tr><th>Concepto</th><th>Valor</th></tr></thead>
          <tbody>${detallesHtml}</tbody>
        </table>
        <footer class="disclaimer">
          <p><em>Esta cotización es solo un estimado y no constituye un compromiso de SubastaCarHN. SubastaCarHN se libera de toda responsabilidad por el uso de estos datos.</em></p>
        </footer>
      </div>
    </div>`;

  document.getElementById('results').innerHTML = plantillaCotizacion;
}

// Descarga la cotización usando tu CSS externo
function descargarPDF() {
  const detalles = document.getElementById("detalleResultados");
  if (detalles.style.display === "none") {
    detalles.style.display = "block";
    document.getElementById("toggleBtn").textContent = "Ocultar detalles";
  }
  const contenido = document.getElementById("results").innerHTML;
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.open();
  w.document.write(`
    <html>
      <head>
        <title>Cotización SubastaCarHN</title>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>${contenido}</body>
    </html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

// Compartir por WhatsApp
function compartirWhatsApp() {
  let texto = "¡Hola! Aquí tienes la cotización de tu vehículo:\n\n";
  window._cotizacionDetalles.forEach(([t, v, tipo]) => {
    texto += `${t}: ${tipo==='usd'?formatearUSD(v):formatear(v)}\n`;
  });
  texto += `\nTotal Final: ${formatear(window._cotizacionTotal)}\n\nCalculado con SUBASTACARHN 👉 https://comocomprarcarros.com`;
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
}

// Historial en Firestore
async function guardarHistorial(detallesFormateados, totalFinalFormateado) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const historialRef = db.collection("clients").doc(user.uid).collection("historial");
    const snapshot = await historialRef.orderBy("fecha", "desc").get();
    if (snapshot.size >= 100) {
      const ultimo = snapshot.docs[snapshot.size - 1];
      await historialRef.doc(ultimo.id).delete();
    }
    await historialRef.add({
      nombre: "Sin título",
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      detalles: detallesFormateados,
      total: totalFinalFormateado
    });
  } catch (error) {
    console.error("❌ Error al guardar historial:", error);
  }
}

// Contador de usos
const endpoint = "https://contador-clics-backend.onrender.com/contador";
async function obtenerContador() {
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    const el = document.getElementById('contadorClics');
    if (el) el.textContent = `Cálculos: ${data.clics}`;
  } catch (e) {
    console.error("Error al obtener el contador:", e);
  }
}
async function registrarClic() {
  try {
    const res = await fetch(endpoint, { method: "POST" });
    const data = await res.json();
    const el = document.getElementById('contadorClics');
    if (el) el.textContent = `Cálculos: ${data.clics}`;
  } catch (e) {
    console.error("Error al registrar clic:", e);
  }
}

// Reiniciar formulario
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

// Logout
function logout() {
  firebase.auth().signOut().then(() => location.reload());
}

// Al iniciar
firebase.auth().onAuthStateChanged(user => {
  const desktop = document.getElementById('userGreeting');
  const mobile  = document.getElementById('mobileGreeting');
  if (user) {
    const name = (user.displayName||user.email.split('@')[0]).replace(/^./,c=>c.toUpperCase());
    if (desktop) desktop.innerHTML = `<a href="perfil.html">Hola, ${name}</a> | <a href="#" onclick="logout()">Cerrar sesión</a>`;
    if (mobile)  mobile.innerHTML = desktop.innerHTML;
  } else {
    if (desktop) desktop.innerHTML = `<a href="login.html">Iniciar sesión</a> | <a href="register.html">Registrarse</a>`;
    if (mobile)  mobile.innerHTML = desktop.innerHTML;
  }
});

// Carga inicial al DOM
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("c13").value = "OTROS";
  bloquearMotorPorVin();
  obtenerContador();
  obtenerTipoCambioAutomatico();
});
