/* ==========================================================================
   WANDERLUST OUTDOORS — script.js
   Funciones de UI + disparo de eventos al dataLayer (para GTM/GA4/Ads/
   Meta Pixel/TikTok Pixel, que "escuchan" estos eventos vía Tag Manager).
   ========================================================================== */

// Aseguramos que dataLayer exista en TODAS las páginas antes de usarlo
window.dataLayer = window.dataLayer || [];

document.addEventListener("DOMContentLoaded", function () {
  /* ---------- Header sólido al hacer scroll ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    window.addEventListener("scroll", function () {
      header.classList.toggle("solido", window.scrollY > 40);
    });
  }

  /* ---------- Menú móvil ---------- */
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("abierto");
    });
  }

  /* ---------- Animación reveal al hacer scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );
    reveals.forEach((el) => observer.observe(el));

    // Red de seguridad: si algo falla, todo se muestra igualmente a los 4s
    setTimeout(() => {
      reveals.forEach((el) => el.classList.add("visible"));
    }, 4000);
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }
});

/* ==========================================================================
   FORMULARIO DE REGISTRO (registro.html) — captura de LEAD
   ========================================================================== */
function manejarRegistro(event) {
  event.preventDefault();
  const form = event.target;

  const datosLead = {
    nombre: form.nombre.value,
    email: form.email.value,
    telefono: form.telefono.value,
    destino: form.destino.value,
  };

  // Guardamos los datos localmente solo para poder mostrarlos luego
  // en el checkout / página de gracias (simulación, no hay backend real).
  sessionStorage.setItem("wanderlust_lead", JSON.stringify(datosLead));

  // ------------------------------------------------------------------
  // EVENTO DE MARKETING: "generate_lead"
  // Este es el evento que Google Tag Manager, Meta Pixel y TikTok Pixel
  // deben escuchar para contar un Lead (formulario de registro completado,
  // ANTES de que el usuario pague).
  // ------------------------------------------------------------------
  window.dataLayer.push({
    event: "generate_lead",
    lead_source: "formulario_registro",
    lead_destino: datosLead.destino,
  });

  // Si NO usas GTM y prefieres disparar los píxeles directamente aquí,
  // este es el punto exacto donde tendrías que añadir, por ejemplo:
  //   fbq('track', 'Lead');
  //   ttq.track('SubmitForm');
  // (ver README.md para las alternativas "con GTM" vs "sin GTM")

  // Avanzamos al siguiente paso del funnel: checkout,
  // arrastrando el item/valor/tipo si veníamos de la tienda
  const item = sessionStorage.getItem("wanderlust_item");
  const valor = sessionStorage.getItem("wanderlust_valor");
  const tipo = sessionStorage.getItem("wanderlust_tipo");

  let destinoUrl = "checkout.html";
  if (item) {
    destinoUrl += "?item=" + encodeURIComponent(item) +
      "&valor=" + encodeURIComponent(valor || "0") +
      "&tipo=" + encodeURIComponent(tipo || "producto");
  } else {
    // Reserva de expedición: precio orientativo según destino
    const precios = { islandia: 1290, alpes: 1590 };
    const precio = precios[datosLead.destino] || 0;
    destinoUrl += "?item=" + encodeURIComponent("Expedición: " + (datosLead.destino || "aventura")) +
      "&valor=" + precio + "&tipo=expedicion";
  }

  window.location.href = destinoUrl;
}

/* ==========================================================================
   CHECKOUT (checkout.html) — simulación de pago
   ========================================================================== */
function manejarCheckout(event) {
  event.preventDefault();
  const form = event.target;

  const params = new URLSearchParams(window.location.search);
  const tipo = params.get("tipo") || "producto"; // "producto" o "expedicion"
  const valor = params.get("valor") || "0";
  const item = params.get("item") || "Pedido Wanderlust Outdoors";

  // ------------------------------------------------------------------
  // EVENTO DE MARKETING: "add_payment_info"
  // Señala que el usuario introdujo sus datos de pago (simulados).
  // Útil para públicos de remarketing ("llegó a pagar pero no terminó").
  // ------------------------------------------------------------------
  window.dataLayer.push({
    event: "add_payment_info",
    ecommerce: {
      currency: "EUR",
      value: parseFloat(valor),
      items: [{ item_name: item }],
    },
  });

  // Simulamos el "procesamiento" del pago con un pequeño retardo
  const boton = form.querySelector("button[type='submit']");
  boton.disabled = true;
  boton.textContent = "Procesando pago…";

  setTimeout(function () {
    window.location.href =
      "gracias.html?tipo=" + encodeURIComponent(tipo) +
      "&valor=" + encodeURIComponent(valor) +
      "&item=" + encodeURIComponent(item);
  }, 1200);
}

/* ==========================================================================
   PÁGINA DE GRACIAS (gracias.html)
   AQUÍ es donde se disparan las conversiones "de verdad": compra o
   reserva confirmada. Es la página clave para Google Ads, GA4 (purchase),
   Meta Pixel (Purchase) y TikTok Pixel (CompletePayment).
   ========================================================================== */
function inicializarGracias() {
  const params = new URLSearchParams(window.location.search);
  const tipo = params.get("tipo") || "producto";
  const valor = parseFloat(params.get("valor") || "0");
  const item = params.get("item") || "Pedido Wanderlust Outdoors";
  const idTransaccion = "WO-" + Date.now();

  // Recuperamos los datos del lead si existen (para mostrarlos en pantalla)
  let lead = {};
  try {
    lead = JSON.parse(sessionStorage.getItem("wanderlust_lead") || "{}");
  } catch (e) {
    lead = {};
  }

  // Rellenamos el resumen visual de la página
  const elNombre = document.getElementById("gracias-nombre");
  const elItem = document.getElementById("gracias-item");
  const elValor = document.getElementById("gracias-valor");
  const elId = document.getElementById("gracias-id");
  if (elNombre) elNombre.textContent = lead.nombre || "aventurero/a";
  if (elItem) elItem.textContent = item;
  if (elValor) elValor.textContent = valor.toFixed(2) + " €";
  if (elId) elId.textContent = idTransaccion;

  // ------------------------------------------------------------------
  // EVENTO DE MARKETING PRINCIPAL: "purchase"
  // Este es EL evento de conversión. GTM debe usarlo para disparar:
  //   - Conversión de Google Ads
  //   - Evento "purchase" de GA4
  //   - Evento "Purchase" de Meta Pixel
  //   - Evento "CompletePayment" de TikTok Pixel
  // ------------------------------------------------------------------
  window.dataLayer.push({
    event: "purchase",
    ecommerce: {
      transaction_id: idTransaccion,
      currency: "EUR",
      value: valor,
      items: [{ item_name: item, item_category: tipo }],
    },
  });

  // Si en vez de GTM prefieres poner el código de cada plataforma
  // directamente en esta página, este es el sitio exacto para hacerlo.
  // Ver los bloques <!-- TAG: ... --> dentro de gracias.html y el README.
}
