from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import json
from datetime import datetime
import os
import traceback

app = Flask(__name__)
CORS(app)

def safe_int(value):
    try:
        return int(value)
    except Exception:
        return None

def crear_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--remote-debugging-port=9222")

    # Reducir consumo
    options.add_argument("--blink-settings=imagesEnabled=false")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-background-networking")
    options.add_argument("--disable-software-rasterizer")

    chrome_binary = os.getenv("CHROME_BIN")
    chromedriver_path = os.getenv("CHROMEDRIVER_PATH")

    if chrome_binary:
        options.binary_location = chrome_binary

    print("CHROME_BIN =", chrome_binary)
    print("CHROMEDRIVER_PATH =", chromedriver_path)

    if chromedriver_path:
        service = Service(chromedriver_path)
        driver = webdriver.Chrome(service=service, options=options)
    else:
        driver = webdriver.Chrome(options=options)

    driver.set_page_load_timeout(30)
    return driver

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/buscar", methods=["POST"])
def buscar():
    driver = None

    try:
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

        driver = crear_driver()
        print("✅ Driver creado")

        driver.get("https://www.copart.com")
        print("✅ Copart abierto")

        payload = {
            "query": ["*"],
            "filter": {
                "MAKE": [f'lot_make_desc:"{marca}"'],
                "MISC": [f'#LotModel:"{modelo}"'],
                "YEAR": [f'lot_year:[{anio_min} TO {anio_max}]'] if anio_min and anio_max else []
            },
            "page": 0,
            "size": 100
        }

        script = f"""
        return fetch("https://www.copart.com/public/lots/vehicle-finder-search-results", {{
            method: "POST",
            headers: {{
                "Content-Type": "application/json"
            }},
            body: JSON.stringify({json.dumps(payload)})
        }}).then(res => res.json())
        """

        data = driver.execute_script(script)
        print("✅ Respuesta recibida de fetch")

        if not data:
            return jsonify({"error": "No se obtuvo respuesta válida de Copart"}), 500

        resultados = data.get("data", {}).get("results", {}).get("content", [])
        if not resultados:
            resultados = data.get("data", {}).get("content", [])

        print("👉 TOTAL RECIBIDOS DE COPART:", len(resultados))

        autos = []

        for lot in resultados:
            anio_lote = lot.get("lcy")

            fecha = None
            if lot.get("ad"):
                try:
                    fecha = datetime.fromtimestamp(lot["ad"] / 1000).strftime("%Y-%m-%d")
                except Exception:
                    fecha = None

            precio = lot.get("hb") or "Sin oferta"
            buy_now = lot.get("bnp") or "No disponible"
            odometro = lot.get("orr") or "No disponible"
            danio = lot.get("dd") or "No especificado"
            danio_sec = lot.get("sdd") or "N/A"
            valor = lot.get("lotPlugAcv") or lot.get("la") or "No disponible"

            imagen = ""
            if lot.get("imagesList") and len(lot["imagesList"]) > 0:
                imagen = lot["imagesList"][0].get("url", "")
            elif lot.get("imageUrls") and "full" in lot["imageUrls"] and lot["imageUrls"]["full"]:
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

        print("👉 TOTAL ENVIADOS AL FRONT:", len(autos))
        return jsonify(autos)

    except Exception as e:
        print("❌ ERROR EN /buscar:")
        print(str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
