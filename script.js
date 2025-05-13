// === CONFIGURACIÓN DE FIREBASE ===
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
const db   = firebase.firestore();

// === FORMATEADORES DE MONEDA ===
const formatear    = v => new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(v);
const formatearUSD = v => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

// === PROTECCIÓN DE SESIÓN ===
auth.onAuthStateChanged(user => {
  if (!user) {
    alert("❗ Debes iniciar sesión para usar la calculadora.");
    return window.location.href = 'login.html';
  }
  // Si está autenticado, mostramos el contenido y cargamos datos
  document.getElementById("content").style.display = "block";
  obtenerTipoCambioAutomatico();
  obtenerContador();
  initMotorHandlers();
});

// === INICIALIZACIÓN DEL SELECT MOTOR ===
function initMotorHandlers() {
  const grupoMotor = document.getElementById("grupoMotor");
  const vinSelect  = document.getElementById("vin");
  vinSelect.addEventListener("change", bloquearMotorPorVin);
  bloquearMotorPorVin();
  const hibrido = document.getElementById("hibrido");
  hibrido.addEventListener("change", () => {
    grupoMotor.style.display = hibrido.value === "si" ? "none" : "block";
  });
}

// === MENÚ MÓVIL ===
function toggleMenu() {
  document.getElementById("mobile-menu-links").classList.toggle("open");
}

// === BLOQUEAR/OCULTAR CILINDRAJE SEGÚN VIN ===
function bloquearMotorPorVin() {
  const vin   = document.getElementById("vin").value;
  const grupo = document.getElementById("grupoMotor");
  const moto  = document.getElementById("motor");
  if (vin === "otros") {
    grupo.style.display = "block";
    moto.disabled       = false;
  } else {
    grupo.style.display = "none";
    moto.value          = "";
    moto.disabled       = true;
  }
}

function logout() {
  firebase.auth().signOut().then(() => location.reload());
}

// === OBTENER TIPO DE CAMBIO AUTOMÁTICO ===
async function obtenerTipoCambioAutomatico() {
  console.log("Fetch tipo de cambio...");
  try {
    const res       = await fetch("https://subastacar-bch-api.onrender.com/api/tipo-cambio-bch");
    const data      = await res.json();
    const valor     = data.valor ?? data.value;  // en caso cambie la propiedad
    if (!valor) throw new Error("El API no devolvió 'valor'");
    const e2 = document.getElementById("e2");
    e2.value    = valor;
    e2.readOnly = true;
    console.log("Tipo de cambio actualizado:", valor);
  } catch (e) {
    console.error("Error al obtener tipo de cambio:", e);
    // Si falla, dejamos el valor por defecto
  }
}

// === CONTADOR DE CLICS ===
const endpointContador = "https://contador-clics-backend.onrender.com/contador";
async function obtenerContador() {
  try {
    const res       = await fetch(endpointContador);
    const { clics } = await res.json();
    document.getElementById("contadorClics").textContent = `Cálculos: ${clics}`;
  } catch (e) {
    console.error("Error al obtener contador:", e);
  }
}
async function registrarClic() {
  try {
    const res       = await fetch(endpointContador, { method: "POST" });
    const { clics } = await res.json();
    document.getElementById("contadorClics").textContent = `Cálculos: ${clics}`;
  } catch (e) {
    console.error("Error al registrar clic:", e);
  }
}

// === TABLAS DE FEES ===
const buyerFees = [
  [50,1],[100,25],[200,60],[300,85],[350,100],[400,125],[450,135],[500,145],
  [550,155],[600,170],[700,195],[800,215],[900,230],[1000,250],[1200,270],
  [1300,285],[1400,300],[1500,315],[1600,330],[1700,350],[1800,370],[2000,390],
  [2400,425],[2500,460],[3000,505],[3500,555],[4000,600],[4500,625],[5000,650],
  [5500,675],[6000,700],[7000,755],[7500,775],[8000,800],[8500,820],[9000,820],
  [10000,850],[11000,850],[11500,860],[12000,875],[12500,890],[13000,890],
  [14000,900],[15000,900]
];
const virtualBidFees = [
  [100,50],[500,65],[1000,85],[1500,95],[2000,110],[4000,125],
  [6000,145],[8000,160],[9000,160],[10000,160],[200000,160]
];
function buscarValor(tabla, valor) {
  for (let i = tabla.length - 1; i >= 0; i--) {
    if (valor >= tabla[i][0]) return tabla[i][1];
  }
  return 0;
}
const buscarBuyerFee      = m => m > 15000 ? +(m * 0.06).toFixed(2)       : buscarValor(buyerFees, m);
const buscarVirtualBidFee = m => m > 8000  ? 160                          : buscarValor(virtualBidFees, m);

// === FUNCIÓN CALCULAR ===
function calcular() {
  registrarClic();

  const getEl       = id => document.getElementById(id);
  const montoOferta = parseFloat(getEl("c1").value) || 0;
  const precioBarco = parseFloat(getEl("c7").value) || 0;
  const precioGrua  = parseFloat(getEl("c8").value) || 0;
  const tipoCambio  = parseFloat(getEl("e2").value) || 0;
  const vin         = getEl("vin").value;
  const tipo        = getEl("tipoVehiculo").value;
  const anio        = parseInt(getEl("año").value, 10);
  const motor       = getEl("motor").value;
  const esHibrido   = getEl("hibrido").value === "si";
  const usaAmnistia = anio <= 2005;

  // 1) Validación básica
  if (!montoOferta || !tipoCambio || !vin || !tipo) {
    alert("Por favor completa todos los campos requeridos.");
    return;
  }
  // 2) Solo exigir motor cuando VIN sea "otros"
  if (vin === "otros" && tipo === "TURISMO" && !esHibrido && !motor) {
    alert("Por favor selecciona el cilindraje del motor.");
    return;
  }

  // --- cálculos base en USD ---
  const environmentalFee = 15;
  const gateFee          = 115;
  const virtualFee       = buscarVirtualBidFee(montoOferta);
  const buyerFee         = buscarBuyerFee(montoOferta);
  const totalSubastaUSD  = montoOferta + environmentalFee + virtualFee + buyerFee + gateFee;
  const totalEnvioUSD    = precioBarco + precioGrua;
  const totalCIFUSD      = totalSubastaUSD + totalEnvioUSD;

  // --- conversión a Lempiras ---
  const totalCIFHNL = totalCIFUSD * tipoCambio;
  const o3          = 50 * tipoCambio;
  const o4          = totalSubastaUSD * tipoCambio * 0.015; // primero USD→LPS, luego 1.5%
  const baseImp     = totalCIFHNL + o3 + o4 + gateFee * tipoCambio;

  // --- impuestos DAI / ISC / ISV ---
  let dai = 0, isc = 0, isv = 0;
  if (!usaAmnistia && !esHibrido) {
    if (vin === "otros") {
      dai = tipo === "TURISMO"
        ? baseImp * (motor === "1.5 Inferior" ? 0.05 : 0.15)
        : ["PICKUP","MOTO","CAMION"].includes(tipo)
          ? baseImp * 0.10
          : 0;
    }
    if (!["PICKUP","CAMION","AGRICOLA"].includes(tipo)) {
      if      (totalCIFUSD <=  7000) isc = baseImp * 0.10;
      else if (totalCIFUSD <= 10000) isc = baseImp * 0.15;
      else if (totalCIFUSD <= 20000) isc = baseImp * 0.20;
      else if (totalCIFUSD <= 50000) isc = baseImp * 0.30;
      else                            isc = baseImp * 0.45;
    }
  }
  if (!esHibrido && tipo !== "AGRICOLA") {
    isv = (totalCIFHNL + dai + isc + o3 + o4) * 0.15;
  }

  // --- ecotasa + gastos fijos ---
  const ecotasa = (!usaAmnistia && !esHibrido)
    ? (montoOferta <= 15000 ? 5000 : montoOferta <= 25000 ? 7000 : 10000)
    : 0;
  const aduanero        = 4000;
  const votainer        = 7500;
  const transferencia   = 55 * tipoCambio;
  const matricula       = (!usaAmnistia && anio >= 2006) ? 4000 : 0;
  const paqueteAmnistia = usaAmnistia ? 10000 : 0;
  const gastosFijos     = ecotasa + aduanero + votainer + transferencia + matricula + paqueteAmnistia;

  const totalImportacion = totalCIFHNL + dai + isc + isv + gastosFijos;

  // --- preparar detalles y mostrar ---
  const detalles = [
    ["MONTO DE OFERTA",     montoOferta,      "usd"],
    ["ENVIRONMENTAL FEE",   environmentalFee, "usd"],
    ["VIRTUAL BID FEE",     virtualFee,       "usd"],
    ["BUYER FEE",           buyerFee,         "usd"],
    ["GATE FEE",            gateFee,          "usd"],
    ["TOTAL PRECIO SUBASTA",totalSubastaUSD,  "usd"],
    ["VALOR DE BARCO",      precioBarco,      "usd"],
    ["PRECIO DE GRÚA",      precioGrua,       "usd"],
    ["TOTAL ENVÍO MARÍTIMO",totalEnvioUSD,    "usd"],
    ["TOTAL CIF EN USD",    totalCIFUSD,      "usd"],
    ["TOTAL CIF EN HNL",    totalCIFHNL,      "hnl"],
    ["DAI",                 dai,              "hnl"],
    ["ISC",                 isc,              "hnl"],
    ["ISV",                 isv,              "hnl"],
    ["ECOTASA",             ecotasa,          "hnl"],
    ["ADUANERO",            aduanero,         "hnl"],
    ["VOTAINER",            votainer,         "hnl"],
    ["TRANSFERENCIA INT.",  transferencia,    "hnl"],
    ["MATRÍCULA",           matricula,        "hnl"],
    ["PAQUETE AMNISTÍA",    paqueteAmnistia,  "hnl"],
    ["TOTAL GASTOS FIJOS",  gastosFijos,      "hnl"],
    ["TOTAL FINAL",         totalImportacion, "hnl"]
  ];

  mostrarResultados(detalles);
  guardarHistorial(
    detalles.map(([t,v,u]) => ({ titulo: t, valor: u==="usd"?formatearUSD(v):formatear(v) })),
    formatear(totalImportacion)
  );
}

// === Funciones auxiliares ===
function mostrarResultados(detalles) {
  const filas = detalles.map(([t,v,u]) =>
    `<tr><td>${t}</td><td>${u==="usd"?formatearUSD(v):formatear(v)}</td></tr>`
  ).join("");
  const totalFinal = formatear(detalles[detalles.length-1][1]);
  document.getElementById("results").innerHTML = `
    <div style="text-align:center;">
      <p><strong>Total Final:</strong> ${totalFinal}</p>
      <div class="botones-detalle">
        <button onclick="mostrarDetalles()" id="toggleBtn" class="styled-btn">Ver detalles</button>
        <button onclick="descargarPDF()" class="styled-btn">Descargar en PDF</button>
        <button onclick="compartirWhatsApp()" class="styled-btn">Compartir por WhatsApp</button>
      </div>
      <div id="detalleResultados" style="display:none;">
        <table class="tabla-detalles">
          <tr><th>Concepto</th><th>Valor</th></tr>
          ${filas}
        </table>
      </div>
    </div>`;
}

function mostrarDetalles() {
  const tabla = document.getElementById("detalleResultados");
  const btn   = document.getElementById("toggleBtn");
  const show  = tabla.style.display !== "block";
  tabla.style.display = show ? "block" : "none";
  btn.textContent     = show ? "Ocultar detalles" : "Ver detalles";
}

function descargarPDF() {
  mostrarDetalles();
  const contenido = document.getElementById("results").innerHTML;
  const w = window.open("", "_blank", "width=800,height=600");
  w.document.write(`
    <html><head><title>PDF</title>
    <style>
      body{font-family:Helvetica;margin:20px}
      .tabla-detalles{margin:20px auto;border-collapse:collapse;width:100%;max-width:600px}
      .tabla-detalles th,.tabla-detalles td{padding:8px 12px;border:1px solid #ddd}
      .tabla-detalles th{background:#f2f2f2}
    </style></head><body>${contenido}</body></html>`);
  w.document.close();
  setTimeout(()=>w.print(),500);
}

function compartirWhatsApp() {
  let txt = "¡Hola! Este es tu cálculo de importación:\n\n";
  document.querySelectorAll("#detalleResultados table tr").forEach(r => {
    const c = r.querySelectorAll("td,th");
    if(c.length===2) txt += `${c[0].innerText}: ${c[1].innerText}\n`;
  });
  window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
}

function reiniciar() {
  ["c1","c7","c8"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("e2").value = "25.90";
  ["vin","tipoVehiculo","año","hibrido"].forEach(id => {
    const el = document.getElementById(id);
    if(el.tagName==="SELECT") el.selectedIndex = 0;
  });
  const m = document.getElementById("motor");
  if(m) m.value = "";
  const g = document.getElementById("grupoMotor");
  if(g) g.style.display = "block";
  document.getElementById("results").innerHTML = "";
}

async function guardarHistorial(detalles, total) {
  const user = auth.currentUser;
  if(!user) return;
  try {
    const ref  = db.collection("clients").doc(user.uid).collection("historial");
    const snap = await ref.orderBy("fecha","desc").get();
    if(snap.size>=100) await ref.doc(snap.docs[snap.size-1].id).delete();
    await ref.add({
      nombre: "Sin título",
      fecha:  firebase.firestore.FieldValue.serverTimestamp(),
      detalles,
      total
    });
  } catch(e) {
    console.error("❌ Error guardando historial:", e);
  }
}

// === FIN DEL SCRIPT ===
