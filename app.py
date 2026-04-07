from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

def safe_int(value):
    try:
        return int(value)
    except:
        return None

# ===============================
# RUTAS
# ===============================

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/login")
def login():
    return render_template("login.html")

# ===============================
# BUSCADOR (SIN SELENIUM 🔥)
# ===============================

@app.route("/buscar", methods=["POST"])
def buscar():
    try:
        filtros = request.json or {}

        marca = filtros.get("marca", "TOYOTA")
        modelo = filtros.get("modelo", "camry")

        anio_min = safe_int(filtros.get("anio_min"))
        anio_max = safe_int(filtros.get("anio_max"))

        print("\n================= NUEVA BUSQUEDA =================")
        print("MARCA:", marca)
        print("MODELO:", modelo)

        payload = {
            "query": ["*"],
            "filter": {
                "MAKE": [f'lot_make_desc:"{marca}"'],
                "MISC": [f'#LotModel:"{modelo}"'],
                "YEAR": [
                    f'lot_year:[{anio_min} TO {anio_max}]'
                ] if anio_min and anio_max else []
            },
            "page": 0,
            "size": 100
        }

        url = "https://www.copart.com/public/lots/vehicle-finder-search-results"

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        }

        res = requests.post(url, json=payload, headers=headers)
        data = res.json()

        resultados = data.get("data", {}).get("results", {}).get("content", [])

        if not resultados:
            resultados = data.get("data", {}).get("content", [])

        autos = []

        for lot in resultados:

            fecha = None
            if lot.get("ad"):
                try:
                    fecha = datetime.fromtimestamp(lot["ad"]/1000).strftime("%Y-%m-%d")
                except:
                    fecha = None

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

                "anio": lot.get("lcy"),
                "marca": lot.get("mkn"),
                "modelo": lot.get("lmg"),

                "precio": lot.get("hb") or "Sin oferta",
                "buy_now": lot.get("bnp") or "No disponible",
                "valor_mercado": lot.get("lotPlugAcv") or lot.get("la") or "No disponible",

                "odometro": lot.get("orr") or "No disponible",
                "motor": lot.get("egn") or "",
                "transmision": lot.get("tmtp") or "",
                "traccion": lot.get("drv") or "",
                "combustible": lot.get("ft") or "",
                "cilindros": lot.get("cy") or "",

                "danio": lot.get("dd") or "No especificado",
                "danio_secundario": lot.get("sdd") or "N/A",

                "codigo_titulo": lot.get("tgd") or "",
                "llaves": lot.get("hk") or "",

                "fecha_subasta": fecha or "No disponible",
                "destacados": lot.get("ess") or "",
                "ubicacion": lot.get("yn"),

                "imagen": imagen
            })

        print("👉 TOTAL ENVIADOS:", len(autos))

        return jsonify(autos)

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
