# Wanderlust Outdoors — Sitio funnel de conversión (demo)

4 páginas listas para subir a **GitHub Pages** (o cualquier hosting estático):

```
wanderlust-outdoors/
├── index.html       → 1. Landing / Inicio
├── registro.html    → 2. Formulario de registro (lead)
├── checkout.html    → 3. Carrito / Checkout (pago simulado)
├── gracias.html     → 4. Thank you page (conversión)
├── css/style.css
├── js/script.js
└── README.md
```

## Cómo publicarlo en GitHub Pages
1. Crea un repositorio (ej. `wanderlust-outdoors`) y sube todo el contenido de esta carpeta a la raíz.
2. En el repo: **Settings → Pages → Branch: main → carpeta `/root`** → Save.
3. En 1-2 minutos tu web estará en `https://tu-usuario.github.io/wanderlust-outdoors/`.

## Cómo funciona el "embudo" (funnel)
- `index.html` → botones "Reserva tu aventura" / "Comprar" llevan a **registro.html** (con el producto/expedición elegido en la URL).
- `registro.html` → al enviar el formulario, se guarda el lead y se dispara el evento `generate_lead` → redirige a **checkout.html**.
- `checkout.html` → pago simulado (no se procesa nada real) → dispara `add_payment_info` → redirige a **gracias.html**.
- `gracias.html` → dispara el evento `purchase` con el importe y el artículo. **Esta es la página de conversión.**

Todos los eventos se envían a `window.dataLayer` (lo verás en `js/script.js`), que es exactamente lo que Google Tag Manager necesita para funcionar.

---

## 🏷️ Dónde va cada etiqueta — resumen exacto

### 1. Google Tag Manager (GTM)
- **Dónde:** dentro de `<head>`, en **las 4 páginas** (`index.html`, `registro.html`, `checkout.html`, `gracias.html`).
- **Busca el comentario:** `<!-- INICIO: Google Tag Manager -->`
- Pega también el segundo fragmento (noscript) justo después de `<body>` — busca `<!-- INICIO: Google Tag Manager (noscript) -->`.
- Recomendación: gestiona **todo lo demás** (GA4, Ads, Meta, TikTok) como tags *dentro* de GTM en vez de pegarlos por separado en el HTML. Es más fácil de mantener y evita duplicar conversiones.

### 2. GA4 (Google Analytics 4)
- **Opción recomendada:** no lo pegues en el HTML — créalo como **tag "Google Analytics: GA4 Configuration"** dentro de GTM. Como el `dataLayer` ya envía `generate_lead`, `add_payment_info` y `purchase`, solo tienes que crear en GTM un trigger de "Evento personalizado" con esos nombres.
- **Opción manual (sin GTM):** en `gracias.html`, busca `<!-- INICIO: GA4 — Evento "purchase" directo -->` (necesitarías añadir también el script base `gtag.js` en el `<head>`, no incluido por defecto para evitar duplicar tracking con GTM).

### 3. Google Ads (etiqueta de conversión)
- **Dónde:** `gracias.html`, busca `<!-- INICIO: Google Ads — Etiqueta de conversión -->`.
- Sustituye `AW-XXXXXXXXX/XXXXXXXXXXXXXXXXXXXX` por tu ID de conversión (lo obtienes en Google Ads → Herramientas → Conversiones).
- Igual que GA4: mejor gestionarlo como tag dentro de GTM disparado por el evento `purchase`.

### 4. Google Search Console
- **Dónde:** `index.html` únicamente, en el `<head>`.
- Busca la línea:
  ```html
  <meta name="google-site-verification" content="TU_CODIGO_DE_SEARCH_CONSOLE_AQUI" />
  ```
- Sustituye el contenido por el código que te da Search Console (Configuración → Verificación de propiedad → Etiqueta HTML).
- Alternativa: en vez de la meta etiqueta, puedes verificar el dominio directamente desde tu proveedor DNS (si usas dominio propio) — no requiere tocar el HTML.

### 5. Looker Studio
- **No lleva ninguna etiqueta en el sitio.** Looker Studio se conecta directamente a tus fuentes de datos (GA4, Google Ads, Google Sheets, etc.) desde su propia interfaz — no requiere ningún cambio en este código.

### 6. Meta Pixel (Facebook/Instagram Ads)
- **Dónde:** `<head>` de **las 4 páginas** — busca `<!-- INICIO: Meta Pixel Code -->`. Sustituye `TU_PIXEL_ID` por tu ID real.
- **Eventos importantes:**
  - `Lead` → cuando se completa **registro.html** (ya se envía a `dataLayer` como `generate_lead`; configúralo en GTM, o descomenta `fbq('track', 'Lead')` dentro de la función `manejarRegistro()` en `js/script.js`).
  - `Purchase` → en **gracias.html**, busca `<!-- INICIO: Meta Pixel — Evento "Purchase" -->`.
- Recomendación adicional: activa también la **API de Conversiones (Conversions API)** desde Meta Events Manager para mayor fiabilidad de datos (server-side), especialmente si usas bloqueadores de anuncios o iOS.

### 7. Meta Business Suite
- **No es una etiqueta de código.** Es el panel donde gestionas tu Página, anuncios, Pixel y Conversions API. Todo lo que necesitas en el sitio ya lo cubre el **Meta Pixel** del punto 6 — Business Suite se conecta desde su propia plataforma, no desde el HTML.

### 8. TikTok Ads (Pixel)
- **Dónde:** `<head>` de **las 4 páginas** — busca `<!-- INICIO: TikTok Pixel Code -->`. Sustituye `TU_PIXEL_ID_TIKTOK` por tu ID real.
- **Eventos importantes:**
  - `SubmitForm` → al completar **registro.html**.
  - `CompletePayment` → en **gracias.html**, busca `<!-- INICIO: TikTok Pixel — Evento "CompletePayment" -->`.

---

## ⚠️ Importante: evita contar conversiones duplicadas
Si activas GTM (recomendado) **no** descomentes también los bloques manuales de GA4 / Google Ads / Meta / TikTok en `gracias.html` — elige **una sola vía** (GTM *o* código directo) por herramienta, nunca las dos a la vez.

## Imágenes
Las fotos se cargan directamente desde Unsplash (`images.unsplash.com`) mediante enlace directo — no necesitas descargar nada. Si quieres sustituirlas por fotos propias, cambia el atributo `src` de cada `<img>` por la ruta de tu archivo (ej. `assets/mi-foto.jpg`).

## Nota sobre el pago
El formulario de `checkout.html` es **100% una simulación visual**: no se conecta a ninguna pasarela de pago real ni almacena datos de tarjeta. Para procesar pagos reales necesitarías integrar una pasarela como Stripe, Redsys o PayPal (requiere backend, no incluido en este sitio estático).
