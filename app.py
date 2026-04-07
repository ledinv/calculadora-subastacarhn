from flask import Flask, request, jsonify
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify
app = Flask(__name__)
CORS(app)


def safe_int(value):
    try:
        return int(value)
    except:
        return None



app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")
    from flask import send_from_directory
import os

@app.route("/login.html")
def login_html():
    return send_from_directory(os.getcwd(), "login.html")
@app.route("/buscar", methods=["POST"])
def buscar():

    filtros = request.json or {}

    marca = filtros.get("marca", "TOYOTA")
    modelo = filtros.get("modelo", "camry")

    anio_min = safe_int(filtros.get("anio_min"))
    anio_max = safe_int(filtros.get("anio_max"))
    fecha_filtro = filtros.get("fecha")

    print("\n================= NUEVA BUSQUEDA =================")
    print("MARCA:", marca)
    print("MODELO:", modelo)
    print("AÑO MIN:", anio_min)
    print("AÑO MAX:", anio_max)
    print("FECHA FILTRO:", fecha_filtro)

    # 🔥 modo oculto
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

    driver.get("https://www.copart.com")

    payload = {
    "query": ["*"],
    "filter": {
        "MAKE": [f'lot_make_desc:"{marca}"'],
        "MISC": [f'#LotModel:"{modelo}"'],

        # 🔥 FILTRO REAL DE COPART
        "YEAR": [
            f'lot_year:[{anio_min} TO {anio_max}]'
        ] if anio_min and anio_max else []
    },
    "page": 0,
    "size": 1000
}

    script = f"""
    return fetch("https://www.copart.com/public/lots/vehicle-finder-search-results", {{
        method: "POST",
        headers: {{
            "Content-Type": "application/json"
        }},
        body: JSON.stringify({json.dumps(payload)})
    }})
    .then(res => res.json())
    """

    data = driver.execute_script(script)
    driver.quit()

    resultados = data.get("data", {}).get("results", {}).get("content", [])

    if not resultados:
        resultados = data.get("data", {}).get("content", [])

    print("👉 TOTAL RECIBIDOS DE COPART:", len(resultados))

    autos = []

    for lot in resultados:

        print("\n----------- LOTE -----------")
        print("LOTE:", lot.get("lotNumberStr"))

        anio_lote = lot.get("lcy")
        print("AÑO:", anio_lote)

        # 🔥 filtro año
        

        # 🔥 fecha
        fecha = None

        if lot.get("ad"):
            try:
                fecha = datetime.fromtimestamp(lot["ad"]/1000).strftime("%Y-%m-%d")
            except:
                fecha = None

        print("FECHA LOTE:", fecha)

        # 🔥 DEBUG FILTRO FECHA

        print("✅ PASÓ FILTROS")

        # valores
        precio = lot.get("hb") or "Sin oferta"
        buy_now = lot.get("bnp") or "No disponible"
        odometro = lot.get("orr") or "No disponible"
        danio = lot.get("dd") or "No especificado"
        danio_sec = lot.get("sdd") or "N/A"
        valor = lot.get("lotPlugAcv") or lot.get("la") or "No disponible"

        # imagen
        imagen = ""

        if lot.get("imagesList"):
            imagen = lot["imagesList"][0].get("url", "")
        elif lot.get("imageUrls") and "full" in lot["imageUrls"]:
            imagen = lot["imageUrls"]["full"][0]
        elif lot.get("tims"):
            imagen = lot["tims"]

        autos.append({
            "lote": lot.get("lotNumberStr"),
            "link": f"https://www.copart.com/lot/{lot.get('lotNumberStr')}",

            "anio": anio_lote,
            "marca": lot.get("mkn"),
            "modelo": lot.get("lmg"),
            "version": lot.get("ltd"),

            "precio": precio,
            "buy_now": buy_now,
            "valor_mercado": valor,

            "odometro": odometro,
            "tipo_odometro": lot.get("ord") or "",

            "danio": danio,
            "danio_secundario": danio_sec,

            "codigo_titulo": lot.get("tgd") or "",
            "descripcion_titulo": lot.get("td") or "",

            "cilindros": lot.get("cy") or "",
            "llaves": lot.get("hk") or "",

            "motor": lot.get("egn") or "",
            "transmision": lot.get("tmtp") or "",
            "traccion": lot.get("drv") or "",
            "combustible": lot.get("ft") or "",

            "fecha_subasta": fecha or "No disponible",
            "destacados": lot.get("ess") or "",
            "notas": lot.get("lcd") or "",

            "ubicacion": lot.get("yn"),
            "imagen": imagen
        })

    print("\n👉 TOTAL ENVIADOS AL FRONT:", len(autos))

    return jsonify(autos)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
