/* ==========================================================================
   WANDERLUST OUTDOORS — script.js
   Funciones de UI + disparo de eventos al dataLayer (para GTM/GA4/Ads/
   Meta Pixel/TikTok Pixel, que "escuchan" estos eventos vía Tag Manager).
   ========================================================================== */

// Aseguramos que dataLayer exista en TODAS las páginas antes de usarlo
window.dataLayer = window.dataLayer || [];

/* ==========================================================================
   NÚMERO DE WHATSAPP — sustituye por el real
   Formato: código de país + número, SIN "+" ni "00" delante.
   Ej. España: "34612345678"
   ========================================================================== */
const WHATSAPP_NUMERO = "34600000000"; // TODO: pon aquí tu número real
const WHATSAPP_MENSAJE = "¡Hola! Tengo una consulta sobre Wanderlust Outdoors.";

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

  /* ---------- Carrito e icono de WhatsApp: en TODAS las páginas ---------- */
  inyectarIconoCarrito();
  inyectarWhatsappFlotante();
  actualizarContadorCarrito();

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

  // Si el usuario llegó aquí directamente (sin pasar por "Añadir al carrito")
  // pero eligió una expedición en el desplegable, la añadimos igualmente
  // para que el carrito nunca esté vacío en el checkout.
  const precios = { islandia: 1290, alpes: 1590 };
  const nombres = { islandia: "Expedición: Trekking Islandia", alpes: "Expedición: Travesía por los Alpes" };
  if (obtenerCarrito().length === 0 && precios[datosLead.destino]) {
    añadirAlCarrito("expedicion-" + datosLead.destino, nombres[datosLead.destino], precios[datosLead.destino], "expedicion", { silencioso: true });
  }

  window.location.href = "checkout.html";
}

/* ==========================================================================
   CHECKOUT (checkout.html) — simulación de pago
   ========================================================================== */
function manejarCheckout(event) {
  event.preventDefault();
  const form = event.target;
  const carrito = obtenerCarrito();
  const total = totalCarrito(carrito);

  // ------------------------------------------------------------------
  // EVENTO DE MARKETING: "add_payment_info"
  // Señala que el usuario introdujo sus datos de pago (simulados).
  // Útil para públicos de remarketing ("llegó a pagar pero no terminó").
  // ------------------------------------------------------------------
  window.dataLayer.push({
    event: "add_payment_info",
    ecommerce: { currency: "EUR", value: total, items: itemsCarritoParaGA4(carrito) },
  });

  // Simulamos el "procesamiento" del pago con un pequeño retardo
  const boton = form.querySelector("button[type='submit']");
  boton.disabled = true;
  boton.textContent = "Procesando pago…";

  setTimeout(function () {
    window.location.href = "gracias.html";
  }, 1200);
}

/* ==========================================================================
   PÁGINA DE GRACIAS (gracias.html)
   AQUÍ es donde se disparan las conversiones "de verdad": compra o
   reserva confirmada. Es la página clave para Google Ads, GA4 (purchase),
   Meta Pixel (Purchase) y TikTok Pixel (CompletePayment).
   ========================================================================== */
function inicializarGracias() {
  const carrito = obtenerCarrito();
  const total = totalCarrito(carrito);
  const idTransaccion = "WO-" + Date.now();
  const nombreArticulos = carrito.map(function (p) {
    return p.cantidad > 1 ? p.nombre + " ×" + p.cantidad : p.nombre;
  }).join(", ") || "Pedido Wanderlust Outdoors";

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
  if (elItem) elItem.textContent = nombreArticulos;
  if (elValor) elValor.textContent = total.toFixed(2) + " €";
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
    ecommerce: { transaction_id: idTransaccion, currency: "EUR", value: total, items: itemsCarritoParaGA4(carrito) },
  });

  // Si en vez de GTM prefieres poner el código de cada plataforma
  // directamente en esta página, este es el sitio exacto para hacerlo.
  // Ver los bloques <!-- TAG: ... --> dentro de gracias.html y el README.

  // El pedido ya se ha "cobrado": vaciamos el carrito para la próxima visita
  localStorage.removeItem("wanderlust_carrito");
  actualizarContadorCarrito();
}

/* ==========================================================================
   CARRITO DE COMPRA (localStorage — persiste entre páginas y sesiones)
   Estructura de cada línea:
   { id, nombre, precio, tipo: "producto"|"expedicion", cantidad }
   ========================================================================== */

function obtenerCarrito() {
  try {
    return JSON.parse(localStorage.getItem("wanderlust_carrito") || "[]");
  } catch (e) {
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem("wanderlust_carrito", JSON.stringify(carrito));
  actualizarContadorCarrito();
}

function totalCarrito(carrito) {
  return carrito.reduce(function (suma, p) { return suma + p.precio * p.cantidad; }, 0);
}

function itemsCarritoParaGA4(carrito) {
  return carrito.map(function (p) {
    return { item_id: p.id, item_name: p.nombre, item_category: p.tipo, price: p.precio, quantity: p.cantidad };
  });
}

/**
 * Añade un producto o expedición al carrito.
 * opciones.silencioso = true evita el evento add_to_cart y el aviso visual
 * (se usa cuando el carrito se rellena automáticamente, no por un clic del usuario).
 */
function añadirAlCarrito(id, nombre, precio, tipo, opciones) {
  opciones = opciones || {};
  let carrito = obtenerCarrito();
  const existente = carrito.find(function (p) { return p.id === id; });
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ id: id, nombre: nombre, precio: precio, tipo: tipo, cantidad: 1 });
  }
  guardarCarrito(carrito);

  if (!opciones.silencioso) {
    window.dataLayer.push({
      event: "add_to_cart",
      ecommerce: { currency: "EUR", value: precio, items: [{ item_id: id, item_name: nombre, item_category: tipo, price: precio, quantity: 1 }] },
    });
    mostrarAvisoCarrito(nombre + " añadido al carrito");
  }
  return carrito;
}

function cambiarCantidadCarrito(id, delta) {
  let carrito = obtenerCarrito();
  const item = carrito.find(function (p) { return p.id === id; });
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter(function (p) { return p.id !== id; });
  }
  guardarCarrito(carrito);
  renderizarCarrito();
}

function eliminarDelCarrito(id) {
  const carrito = obtenerCarrito().filter(function (p) { return p.id !== id; });
  guardarCarrito(carrito);
  window.dataLayer.push({ event: "remove_from_cart", ecommerce: { items: [{ item_id: id }] } });
  renderizarCarrito();
}

/* ---------- Icono de carrito inyectado en el header de TODAS las páginas ---------- */
function inyectarIconoCarrito() {
  const navCta = document.querySelector(".nav-cta");
  if (!navCta || navCta.querySelector(".carrito-link")) return;
  const enlace = document.createElement("a");
  enlace.href = "carrito.html";
  enlace.className = "carrito-link";
  enlace.setAttribute("aria-label", "Ver carrito");
  enlace.innerHTML = '🛒<span class="carrito-contador">0</span>';
  navCta.prepend(enlace);
}

function actualizarContadorCarrito() {
  const total = obtenerCarrito().reduce(function (s, p) { return s + p.cantidad; }, 0);
  document.querySelectorAll(".carrito-contador").forEach(function (el) {
    el.textContent = total;
    el.style.display = total > 0 ? "flex" : "none";
  });
}

function mostrarAvisoCarrito(texto) {
  let aviso = document.querySelector(".aviso-flotante");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.className = "aviso-flotante";
    document.body.appendChild(aviso);
  }
  aviso.textContent = "✓ " + texto;
  aviso.classList.remove("visible");
  // Forzamos reflow para poder re-disparar la animación en clics seguidos
  void aviso.offsetWidth;
  aviso.classList.add("visible");
  clearTimeout(aviso._timeout);
  aviso._timeout = setTimeout(function () { aviso.classList.remove("visible"); }, 2400);
}

/* ---------- Página carrito.html ---------- */
function renderizarCarrito() {
  const lista = document.getElementById("carrito-lista");
  if (!lista) return;
  const vacio = document.getElementById("carrito-vacio");
  const resumen = document.getElementById("carrito-resumen");
  const carrito = obtenerCarrito();

  if (!carrito.length) {
    lista.innerHTML = "";
    if (vacio) vacio.style.display = "block";
    if (resumen) resumen.style.display = "none";
    return;
  }
  if (vacio) vacio.style.display = "none";
  if (resumen) resumen.style.display = "";

  lista.innerHTML = carrito.map(function (p) {
    const subtotal = (p.precio * p.cantidad).toFixed(2);
    return (
      '<div class="carrito-fila">' +
        '<div class="carrito-fila-info">' +
          '<span class="carrito-fila-nombre">' + p.nombre + "</span>" +
          '<span class="carrito-fila-precio">' + p.precio.toFixed(2) + " € / ud.</span>" +
        "</div>" +
        '<div class="carrito-fila-cantidad">' +
          '<button type="button" onclick="cambiarCantidadCarrito(\'' + p.id + "', -1)\" aria-label=\"Restar unidad\">−</button>" +
          "<span>" + p.cantidad + "</span>" +
          '<button type="button" onclick="cambiarCantidadCarrito(\'' + p.id + "', 1)\" aria-label=\"Sumar unidad\">+</button>" +
        "</div>" +
        '<div class="carrito-fila-subtotal">' + subtotal + " €</div>" +
        '<button type="button" class="carrito-fila-eliminar" onclick="eliminarDelCarrito(\'' + p.id + "')\" aria-label=\"Eliminar\">🗑</button>" +
      "</div>"
    );
  }).join("");

  const total = totalCarrito(carrito);
  const totalEl = document.getElementById("carrito-total");
  if (totalEl) totalEl.textContent = total.toFixed(2) + " €";

  window.dataLayer.push({ event: "view_cart", ecommerce: { currency: "EUR", value: total, items: itemsCarritoParaGA4(carrito) } });
}

/* ---------- Checkout: pinta el resumen a partir del carrito ---------- */
function inicializarCheckout() {
  const carrito = obtenerCarrito();
  const lista = document.getElementById("resumen-lista");
  const totalEl = document.getElementById("resumen-total");
  const boton = document.querySelector("#formulario-checkout button[type='submit']");

  if (!carrito.length) {
    if (lista) lista.innerHTML = '<p class="carrito-vacio-mini">Tu carrito está vacío. <a href="index.html#tienda">Vuelve a la tienda</a></p>';
    if (totalEl) totalEl.textContent = "0,00 €";
    if (boton) boton.disabled = true;
    return;
  }

  if (lista) {
    lista.innerHTML = carrito.map(function (p) {
      const etiquetaCantidad = p.cantidad > 1 ? " × " + p.cantidad : "";
      const subtotal = (p.precio * p.cantidad).toFixed(2);
      return '<div class="resumen-item"><span>' + p.nombre + etiquetaCantidad + "</span><span>" + subtotal + " €</span></div>";
    }).join("");
  }

  const total = totalCarrito(carrito);
  if (totalEl) totalEl.textContent = total.toFixed(2) + " €";

  window.dataLayer.push({ event: "view_cart", ecommerce: { currency: "EUR", value: total, items: itemsCarritoParaGA4(carrito) } });

  // Vista previa visual de la tarjeta (solo estética, no valida nada real)
  const numero = document.getElementById("numero_tarjeta");
  const titular = document.getElementById("titular");
  const caducidad = document.getElementById("caducidad");
  if (numero) {
    numero.addEventListener("input", function () {
      const val = numero.value.replace(/\D/g, "").padEnd(16, "•").match(/.{1,4}/g).join(" ");
      document.getElementById("preview-numero").textContent = val;
    });
  }
  if (titular) {
    titular.addEventListener("input", function () {
      document.getElementById("preview-nombre").textContent = titular.value.toUpperCase() || "NOMBRE APELLIDOS";
    });
  }
  if (caducidad) {
    caducidad.addEventListener("input", function () {
      document.getElementById("preview-caducidad").textContent = caducidad.value || "MM/AA";
    });
  }
}

/* ---------- WhatsApp: botón flotante (todas las páginas) + tracking ---------- */
function trackWhatsapp(origen) {
  window.dataLayer.push({ event: "contacto_whatsapp", origen: origen || "desconocido" });
}

function inyectarWhatsappFlotante() {
  if (document.querySelector(".whatsapp-flotante")) return;
  const enlace = document.createElement("a");
  enlace.href = "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(WHATSAPP_MENSAJE);
  enlace.target = "_blank";
  enlace.rel = "noopener";
  enlace.className = "whatsapp-flotante";
  enlace.setAttribute("aria-label", "Contactar por WhatsApp");
  enlace.innerHTML =
    '<svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">' +
    '<path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.35.66 4.55 1.8 6.43L4 29l7.74-1.75a11.98 11.98 0 0 0 4.28.8h.01c6.62 0 12.02-5.4 12.02-12.02C28.04 8.4 22.64 3 16.02 3zm0 21.86h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-4.6 1.04 1.06-4.48-.24-.37a9.85 9.85 0 0 1-1.53-5.44c0-5.46 4.44-9.9 9.92-9.9 2.65 0 5.14 1.03 7.01 2.9a9.83 9.83 0 0 1 2.9 6.99c0 5.46-4.45 9.9-9.11 9.85zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>' +
    "</svg>";
  enlace.addEventListener("click", function () { trackWhatsapp("flotante"); });
  document.body.appendChild(enlace);
}
