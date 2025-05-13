// === CONFIGURACIÓN DE FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyA5BuOwgEUYK1JMwJD0PL0k0rcAST_Koms",
  authDomain: "subastacarhn-40554.firebaseapp.com",
  projectId: "subastacarhn-40554",
  storageBucket: "subastacarhn-40554.appspot.com",
  messagingSenderId: "536785797974",
  appId: "1:536785797974:web:e3eabb4dcd898c2ffe8cf7",
  measurementId: "G-QM5N60K8C0"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// === FORMATEADORES DE MONEDA ===
const formatear = v => new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL"
}).format(v);

const formatearUSD = v => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
}).format(v);

// === PROTECCIÓN DE SESIÓN Y CONFIGURACIÓN INICIAL ===
auth.onAuthStateChanged(user => {
  if (!user) {
    alert("❗ Debes iniciar sesión para usar la calculadora.");
    window.location.href = 'login.html';
  } else {
    document.getElementById("content").style.display = "block";
    obtenerTipoCambioAutomatico();
    obtenerContador();

    // Mostrar u ocultar motor si es híbrido
    const hibrido = document.getElementById("hibrido");
    const grupoMotor = document.getElementById("grupoMotor");
    if (hibrido && grupoMotor) {
      const actualizarMotor = () => {
        grupoMotor.style.display = hibrido.value === "si" ? "none" : "block";
      };
      hibrido.addEventListener("change", actualizarMotor);
      actualizarMotor();
    }
  }
});

// === MENÚ MÓVIL ===
function toggleMenu() {
  document.getElementById("mobile-menu-links").classList.toggle("open");
}

function logout() {
  firebase.auth().signOut().then(() => location.reload());
}
// === OBTENER TIPO DE CAMBIO AUTOMÁTICO (BCH desde backend) ===
async function obtenerTipoCambioAutomatico() {
  try {
    const res = await fetch("https://subastacar-bch-api.onrender.com/api/tipo-cambio-bch");
    const json = await res.json();
    if (json.valor) {
      const e2 = document.getElementById("e2");
      e2.value = json.valor;
      e2.readOnly = true;
    }
  } catch (e) {
    console.error("Error al obtener tipo de cambio:", e);
  }
}

// === CONTADOR DE CLICS (Cálculos realizados) ===
const endpointContador = "https://contador-clics-backend.onrender.com/contador";

async function obtenerContador() {
  try {
    const res = await fetch(endpointContador);
    const { clics } = await res.json();
    document.getElementById("contadorClics").textContent = `Cálculos: ${clics}`;
  } catch (e) {
    console.error("Error al obtener contador:", e);
  }
}

async function registrarClic() {
  try {
    const res = await fetch(endpointContador, { method: "POST" });
    const { clics } = await res.json();
    document.getElementById("contadorClics").textContent = `Cálculos: ${clics}`;
  } catch (e) {
    console.error("Error al registrar clic:", e);
  }
}

// === TABLAS DE FEES COPART ===
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

// === FUNCIONES PARA ENCONTRAR FEES ===
function buscarValor(tabla, valor) {
  for (let i = tabla.length - 1; i >= 0; i--) {
    if (valor >= tabla[i][0]) return tabla[i][1];
  }
  return 0;
}
const buscarBuyerFee = c1 =>
  c1 > 15000 ? +(c1 * 0.06).toFixed(2) : buscarValor(buyerFees, c1);
const buscarVirtualBidFee = c1 =>
  c1 > 8000 ? 160 : buscarValor(virtualBidFees, c1);
function calcular() {
  registrarClic();

  const getEl = (...ids) => ids.map(id => document.getElementById(id)).find(el => el != null);

  const montoOferta = parseFloat(document.getElementById("c1").value) || 0;
  const precioBarco = parseFloat(document.getElementById("c7").value) || 0;
  const precioGrua = parseFloat(document.getElementById("c8").value) || 0;
  const tipoCambio = parseFloat(document.getElementById("e2").value) || 0;

  const vinEl = getEl("vin", "c13");
  const tipoEl = getEl("tipoVehiculo", "c14");
  const anioEl = getEl("año", "anio");
  const hibridoEl = document.getElementById("hibrido");
  const motorEl = document.getElementById("motor");

  if (!vinEl || !tipoEl || !anioEl) {
    return alert("No se encontraron algunos campos en el formulario.");
  }

  const vin = vinEl.value;
  const tipo = tipoEl.value;
  const anio = parseInt(anioEl.value, 10);
  const motor = motorEl ? motorEl.value : "";
  const esHibrido = hibridoEl ? (hibridoEl.value === "si") : false;
  const usaAmnistia = anio <= 2005;

  if (
    montoOferta <= 0 || precioBarco < 0 || precioGrua < 0 || tipoCambio <= 0 ||
    !vin || !tipo || (tipo === "TURISMO" && !esHibrido && !motor)
  ) {
    return alert("Por favor completa todos los campos requeridos.");
  }

  // Cálculos base
  const environmentalFee = 15;
  const gateFee = 115;
  const virtualFee = buscarVirtualBidFee(montoOferta);
  const buyerFee = buscarBuyerFee(montoOferta);
  const totalSubastaUSD = montoOferta + environmentalFee + virtualFee + buyerFee + gateFee;
  const totalEnvioUSD = precioBarco + precioGrua;
  const totalCIFUSD = totalSubastaUSD + totalEnvioUSD;
  const totalCIFHNL = totalCIFUSD * tipoCambio;

  const o3 = Number((50 * tipoCambio).toFixed(2));
  const o4 = Number((baseSubastaHNL * 0.015).toFixed(2));
  const baseImponible = totalCIFHNL + o3 + o4 + gateFee * tipoCambio;

  // Impuestos
  let dai = 0, isc = 0, isv = 0;

  if (!usaAmnistia && !esHibrido) {
    if (vin === "otros") {
      if (tipo === "TURISMO") {
        dai = baseImponible * (motor === "1.5 Inferior" ? 0.05 : 0.15);
      } else if (["PICKUP", "MOTO", "CAMION"].includes(tipo)) {
        dai = baseImponible * 0.10;
      } else if (tipo === "AGRICOLA") {
        dai = baseImponible * 0.05;
      }
    }

    if (!["PICKUP", "CAMION", "AGRICOLA"].includes(tipo)) {
      if (tipo === "MOTO") isc = baseImponible * 0.10;
      else if (totalCIFUSD <= 7000) isc = baseImponible * 0.10;
      else if (totalCIFUSD <= 10000) isc = baseImponible * 0.15;
      else if (totalCIFUSD <= 20000) isc = baseImponible * 0.20;
      else if (totalCIFUSD <= 30000) isc = baseImponible * 0.30;
      else isc = baseImponible * 0.45;
    }
  }

  if (!esHibrido && tipo !== "AGRICOLA") {
    isv = (totalCIFHNL + dai + isc + o3 + o4) * 0.15;
  }

  // Ecotasa
  let ecotasa = 0;
  if (!usaAmnistia && !esHibrido) {
    ecotasa = montoOferta <= 15000 ? 5000 : montoOferta <= 25000 ? 7000 : 10000;
  }

  // Gastos fijos
  const aduanero = 4000;
  const votainer = 7500;
  const transferencia = 55 * tipoCambio;
  const matricula = (!usaAmnistia && anio >= 2006) ? 4000 : 0;
  const paqueteAmnistia = usaAmnistia ? 10000 : 0;
  const gastosFijos = ecotasa + aduanero + votainer + transferencia + matricula + paqueteAmnistia;

  const totalImportacion = totalCIFHNL + dai + isc + isv + gastosFijos;

  const detalles = [
    ["MONTO DE OFERTA", montoOferta, "usd"],
    ["ENVIRONMENTAL FEE", environmentalFee, "usd"],
    ["VIRTUAL BID FEE", virtualFee, "usd"],
    ["BUYER FEE", buyerFee, "usd"],
    ["GATE FEE", gateFee, "usd"],
    ["TOTAL PRECIO SUBASTA", totalSubastaUSD, "usd"],
    ["VALOR DE BARCO", precioBarco, "usd"],
    ["PRECIO DE GRÚA", precioGrua, "usd"],
    ["TOTAL ENVÍO MARÍTIMO", totalEnvioUSD, "usd"],
    ["TOTAL CIF EN USD", totalCIFUSD, "usd"],
    ["TOTAL CIF EN HNL", totalCIFHNL, "hnl"],
    ["DAI", dai, "hnl"],
    ["ISC", isc, "hnl"],
    ["ISV", isv, "hnl"],
    ["ECOTASA", ecotasa, "hnl"],
    ["ADUANERO", aduanero, "hnl"],
    ["VOTAINER", votainer, "hnl"],
    ["TRANSFERENCIA INT.", transferencia, "hnl"],
    ["MATRÍCULA", matricula, "hnl"],
    ["PAQUETE AMNISTÍA", paqueteAmnistia, "hnl"],
    ["TOTAL GASTOS FIJOS", gastosFijos, "hnl"],
    ["TOTAL FINAL", totalImportacion, "hnl"]
  ];

  mostrarResultados(detalles);
  guardarHistorial(
    detalles.map(([t, v, u]) => ({
      titulo: t,
      valor: u === "usd" ? formatearUSD(v) : formatear(v)
    })),
    formatear(totalImportacion)
  );
}
function mostrarResultados(detalles) {
  const filas = detalles.map(([t, v, u]) =>
    `<tr><td>${t}</td><td>${u === "usd" ? formatearUSD(v) : formatear(v)}</td></tr>`
  ).join("");

  const totalFinal = formatear(detalles[detalles.length - 1][1]);

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
    </div>
  `;
}

function mostrarDetalles() {
  const tabla = document.getElementById("detalleResultados");
  const btn = document.getElementById("toggleBtn");
  const visible = tabla.style.display === "block";
  tabla.style.display = visible ? "none" : "block";
  btn.textContent = visible ? "Ver detalles" : "Ocultar detalles";
}

function descargarPDF() {
  mostrarDetalles();
  const contenido = document.getElementById("results").innerHTML;
  const ventana = window.open("", "_blank", "width=800,height=600");
  ventana.document.write(`
    <html><head><title>PDF</title>
    <style>
      body { font-family: Helvetica, sans-serif; margin: 20px; }
      .tabla-detalles {
        margin: 20px auto;
        border-collapse: collapse;
        width: 100%;
        max-width: 600px;
      }
      .tabla-detalles th, .tabla-detalles td {
        padding: 8px 12px;
        border: 1px solid #ddd;
      }
      .tabla-detalles th { background: #f2f2f2; }
    </style></head><body>${contenido}</body></html>
  `);
  ventana.document.close();
  setTimeout(() => ventana.print(), 500);
}

function compartirWhatsApp() {
  let texto = "¡Hola! Este es tu cálculo de importación:\n\n";
  document.querySelectorAll("#detalleResultados table tr").forEach(row => {
    const cols = row.querySelectorAll("td, th");
    if (cols.length === 2) {
      texto += `${cols[0].innerText}: ${cols[1].innerText}\n`;
    }
  });
  texto += "\nCalculado en https://comocomprarcarros.com";
  const link = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(link, "_blank");
}

function reiniciar() {
  ["c1", "c7", "c8"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("e2").value = "25.90";

  const selects = ["vin", "c13", "tipoVehiculo", "c14", "año", "anio"];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.tagName === "SELECT") el.selectedIndex = 0;
  });

  const hibrido = document.getElementById("hibrido");
  if (hibrido) hibrido.selectedIndex = 0;

  const motor = document.getElementById("motor");
  if (motor) motor.value = "";

  const grupoMotor = document.getElementById("grupoMotor");
  if (grupoMotor) grupoMotor.style.display = "block";

  document.getElementById("results").innerHTML = "";
}

async function guardarHistorial(detalles, totalFormateado) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const ref = db.collection("clients").doc(user.uid).collection("historial");
    const snap = await ref.orderBy("fecha", "desc").get();

    if (snap.size >= 100) {
      await ref.doc(snap.docs[snap.size - 1].id).delete();
    }

    await ref.add({
      nombre: "Sin título",
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      detalles,
      total: totalFormateado
    });
  } catch (e) {
    console.error("❌ Error guardando historial:", e);
  }
}
