// Definición de las FAQs y sus respuestas
const FAQ = {
  "¿Por qué solicitan un depósito de garantía de L.5,000?":
    "Pedimos L.5,000 como garantía inicial para cubrir posibles multas de Copart (mínimo $600, hasta el 10% si el valor supera $6,000). Confiamos en tu responsabilidad.",
  "¿Me devuelven el depósito si no sigo antes de ganar?":
    "Sí. Si decides no continuar antes de ganar, el depósito se devuelve íntegramente sin problema.",
  "¿Cómo funciona el proceso de importación?":
    "Hola, un placer trabajar contigo. Nos encontramos en San Pedro Sula. Tras tu depósito, te enviamos opciones personalizadas. Cuando ganamos el auto:\n" +
    "• Se devuelve el depósito\n• Te entregamos la factura\n• Se pagan nuestros honorarios de L.5,000\nTiempo estimado: 6–8 semanas en Puerto Cortés.",
  "¿Cuánto tarda la entrega?":
    "El envío del vehículo tarda aproximadamente entre 6 y 8 semanas, y la descarga se realiza en Puerto Cortés.",
  "¿Dónde están ubicados?":
    "Nuestra oficina principal se encuentra en San Pedro Sula, Honduras.",
  "¿Qué pasa cuando ganamos la subasta?":
    "Una vez ganada la subasta, te devolvemos el depósito, te entregamos la factura para el pago y cobramos nuestros honorarios de L.5,000.",
  "¿Dónde y cómo hago el depósito?":
    "Para el depósito de garantía de L.5,000 puedes usar cuenta de ahorro a nombre de LEDIN EDGARDO VALLE ALMENDARES:\n" +
    "• BAC: 751937901\n• FICOHSA: 200017668888\n• ATLÁNTIDA: 21320146125\n• ATLÁNTIDA DÓLARES: 2020027701",
  "¿Cómo elijo el vehículo que quiero?":
    "Después de tu depósito, te enviamos varias opciones de vehículos en Copart según tu presupuesto y preferencias. Tú decides cuál pujar."
};

// Añade un mensaje al chat
function addMessage(text, sender) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message ' + sender;
  div.innerText = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Envía la pregunta al representante
function contactRep(question) {
  console.log("Pregunta para representante:", question);
  addMessage("Un representante se pondrá en contacto contigo en breve.", 'bot');
}

// Busca la respuesta: exacta o por keywords
function findAnswer(question) {
  const q = question.toLowerCase().trim();
  if (FAQ[question]) return FAQ[question];
  for (const key of Object.keys(FAQ)) {
    const kl = key.toLowerCase();
    if (q.includes(kl)) return FAQ[key];
    const words = kl.split(/\s+/).filter(w => w.length > 3);
    for (const w of words) {
      if (q.includes(w)) return FAQ[key];
    }
  }
  return null;
}

// Procesa la entrada del usuario
function handleQuestion(input) {
  const question = input.trim();
  if (!question) return;
  addMessage(question, 'user');
  const answer = findAnswer(question);
  if (answer) {
    addMessage(answer, 'bot');
  } else {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message bot';
    div.innerHTML = "Lo siento, no tengo esa respuesta todavía.<br/>" +
      "<button id='contact-rep'>Hablar con representante</button>";
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    div.querySelector('#contact-rep').onclick = () => contactRep(question);
  }
  document.getElementById('chat-input').value = '';
}

// Carga la lista de FAQs en el DOM
function loadFAQs() {
  const faqList = document.getElementById('faq-list');
  Object.keys(FAQ).forEach(q => {
    const li = document.createElement('li');
    li.innerText = q;
    li.onclick = () => handleQuestion(q);
    faqList.appendChild(li);
  });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Toggle del chat flotante
  const toggle = document.getElementById('chat-toggle');
  const box    = document.getElementById('chat-box');
  toggle.onclick = () => box.classList.toggle('open');

  loadFAQs();
  document.getElementById('chat-send').onclick = () => {
    handleQuestion(document.getElementById('chat-input').value);
  };
  document.getElementById('chat-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') handleQuestion(e.target.value);
  });
});
