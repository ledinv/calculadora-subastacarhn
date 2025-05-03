// Definición de las FAQs y sus respuestas
const FAQ = {
  "¿Por qué solicitan un depósito de garantía de L.5,000?":
    "Pedimos L.5,000 como garantía inicial para cubrir posibles multas de Copart (mínimo $600, hasta el 10% si el valor supera $6,000). Confiamos en que, si decides no continuar, seas responsable y cubras el faltante si hace falta.",
  "¿Me devuelven el depósito si no sigo antes de ganar?":
    "Sí. Si decides no continuar antes de ganar, el depósito se devuelve íntegramente sin problema.",
  "¿Cómo funciona el proceso de importación?":
    "Hola, un placer trabajar contigo. Somos de San Pedro Sula. " +
    "Tras tu depósito de L.5,000, te enviamos opciones personalizadas según tu presupuesto. " +
    "Cuando ganamos el auto:\n" +
    " • Se devuelve el depósito\n" +
    " • Te entregamos la factura para el pago del vehículo\n" +
    " • Se pagan nuestros honorarios de L.5,000\n" +
    "Tiempo estimado de entrega: 6–8 semanas en Puerto Cortés. ¡Gracias por confiar!",
  "¿Cuánto tarda la entrega?":
    "El envío del vehículo tarda aproximadamente entre 6 y 8 semanas, y la descarga se realiza en Puerto Cortés.",
  "¿Dónde están ubicados?":
    "Nuestra oficina principal se encuentra en San Pedro Sula, Honduras.",
  "¿Qué pasa cuando ganamos la subasta?":
    "Una vez ganada la subasta, te devolvemos el depósito, te entregamos la factura para el pago y cobramos nuestros honorarios de L.5,000.",
  "¿Cómo elijo el vehículo que quiero?":
    "Después de tu depósito de garantía, te enviamos varias opciones de vehículos en Copart, ajustadas a tu presupuesto y preferencias. Tú eliges cuál pujar."
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

// Procesa la entrada del usuario
function handleQuestion(input) {
  const question = input.trim();
  if (!question) return;
  addMessage(question, 'user');
  const answer = FAQ[question];
  if (answer) {
    addMessage(answer, 'bot');
  } else {
    addMessage(
      "Lo siento, no tengo esa respuesta todavía. " +
      "Por favor, selecciona una de las preguntas frecuentes o reformula tu consulta.",
      'bot'
    );
  }
  document.getElementById('chat-input').value = '';
}

// Carga la lista de FAQs en el DOM
function loadFAQs() {
  const faqList = document.getElementById('faq-list');
  Object.keys(FAQ).forEach(q => {
    const li = document.createElement('li');
    li.innerText = q;
    li.addEventListener('click', () => handleQuestion(q));
    faqList.appendChild(li);
  });
}

// Eventos de envío
document.addEventListener('DOMContentLoaded', () => {
  loadFAQs();
  document.getElementById('chat-send').addEventListener('click', () => {
    const input = document.getElementById('chat-input').value;
    handleQuestion(input);
  });
  document.getElementById('chat-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      handleQuestion(document.getElementById('chat-input').value);
    }
  });
});
