// ===============================
// BUSCADOR DE AUTOS
// ===============================

function ponerFechaActual() {
  const fechaInput = document.getElementById("fecha");
  if (!fechaInput) return;

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  fechaInput.value = `${anio}-${mes}-${dia}`;
}

function extraerNumero(valor) {
  if (valor === null || valor === undefined || valor === "") return null;

  const limpio = String(valor).replace(/,/g, "").match(/[\d.]+/);
  if (!limpio) return null;

  const numero = parseFloat(limpio[0]);
  return isNaN(numero) ? null : numero;
}

function formatearDolares(valor) {
  const numero = extraerNumero(valor);
  if (numero === null) return "No disponible";

  return `$${numero.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

function formatearMillas(valor) {
  const numero = extraerNumero(valor);
  if (numero === null) return "No disponible";

  return `${numero.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} mi`;
}

async function buscarAutos() {
  const autos = document.getElementById("autos");
  const fechaFiltro = document.getElementById("fecha").value;

  const filtros = {
    marca: document.getElementById("marca").value.trim(),
    modelo: document.getElementById("modelo").value.trim(),
    anio_min: document.getElementById("anio_min").value.trim(),
    anio_max: document.getElementById("anio_max").value.trim(),
    fecha: fechaFiltro
  };

  autos.innerHTML = `<div class="autos-empty">Buscando vehículos...</div>`;

  try {
    const res = await fetch("/buscar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(filtros)
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

    const data = await res.json();
    autos.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      autos.innerHTML = `<div class="autos-empty">No se encontraron vehículos.</div>`;
      return;
    }

    let resultadosFiltrados = data;

    if (fechaFiltro) {
      resultadosFiltrados = data.filter(auto => auto.fecha_subasta === fechaFiltro);
    }

    if (resultadosFiltrados.length === 0) {
      autos.innerHTML = `<div class="autos-empty">No se encontraron vehículos con esa fecha.</div>`;
      return;
    }

    resultadosFiltrados.forEach(auto => {
      const nombreVehiculo =
        auto.titulo ||
        auto.nombre ||
        `${auto.anio || ""} ${auto.marca || ""} ${auto.modelo || ""}`.trim() ||
        "Vehículo sin nombre";

      const imagen = auto.imagen || "https://via.placeholder.com/400x250?text=Sin+imagen";
      const odometro = formatearMillas(auto.odometro);
      const precio = formatearDolares(auto.precio);
      const buyNow = formatearDolares(auto.buy_now);
      const danio = auto.danio || "No disponible";
      const tituloLegal = auto.codigo_titulo || auto.titulo_legal || "No disponible";
      const linkCopart = auto.link || "#";

      autos.innerHTML += `
        <div class="auto-card">
          <img
            src="${imagen}"
            alt="${nombreVehiculo}"
            onclick="window.open('${linkCopart}', '_blank')"
          >

          <div class="auto-body">
            <h4 class="auto-title">${nombreVehiculo}</h4>

            <div class="auto-meta">
              <div class="auto-line">
                <span class="label">Odómetro</span>
                <span class="value">${odometro}</span>
              </div>

              <div class="auto-line precio-line">
                <span class="label">Precio</span>
                <span class="value">${precio}</span>
              </div>

              <div class="auto-line buynow-line">
                <span class="label">Buy Now</span>
                <span class="value">${buyNow}</span>
              </div>

              <div class="auto-line">
                <span class="label">Daño</span>
                <span class="value">${danio}</span>
              </div>

              <div class="auto-line">
                <span class="label">Título</span>
                <span class="value">${tituloLegal}</span>
              </div>
            </div>

            <a href="${linkCopart}" target="_blank" class="btn-copart">
              Ver en Copart
            </a>
          </div>
        </div>
      `;
    });

  } catch (error) {
    console.error("Error al buscar autos:", error);
    autos.innerHTML = `<div class="autos-empty">Ocurrió un error al buscar vehículos.</div>`;
  }
}

window.buscarAutos = buscarAutos;

document.addEventListener("DOMContentLoaded", () => {
  ponerFechaActual();
});