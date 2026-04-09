FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libu2f-udev \
    libvulkan1 \
    xdg-utils \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

<<<<<<< HEAD
CMD gunicorn app:app --bind 0.0.0.0:$PORT
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-8000}"]
=======
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-8080}"]
>>>>>>> f4a1b065628ef55fedf067d0e1ff40d83b43e1e2
