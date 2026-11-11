---
name: biaya-seo
description: Reglas de SEO del sitio de Biaya (sitemap, robots, metadatos, Open Graph, datos estructurados Schema.org, llms.txt e imagen para redes). Úsala al crear o cambiar una página, título, descripción o URL de biaya-web, y antes de publicar.
---

# Biaya · SEO

Dominio canónico: `https://biaya.mx/` (con `https`, sin `www`, con `/` final en la home).
Idioma: `es-MX`. Las reglas de contenido de `biaya-design` (no inventar datos) aplican también aquí.

## Archivos

| Archivo | Para qué |
|---|---|
| `sitemap.xml` | Lista de URLs indexables. Una entrada `<url>` por página (no por `#ancla`). |
| `robots.txt` | Permite todo, bloquea archivos del sitio anterior y apunta al sitemap. |
| `llms.txt` | Resumen del sitio para buscadores con IA (ChatGPT, Perplexity, Claude). |
| `images/og-image.png` | Imagen para redes, 1200×630. Fuente: `.claude/skills/biaya-seo/og-image.html`. |
| `site.webmanifest`, `browserconfig.xml` | Íconos y colores de marca (`#07090c`). |
| `<head>` de cada página | Metadatos + JSON-LD (ver abajo). |

## Al crear una página nueva (ej. `/aviso-de-privacidad/`)

1. Copia el `<head>` de `index.html` y cambia: `<title>`, `description`, `canonical`, `hreflang`,
   `og:url`, `og:title`, `og:description`, `twitter:*`.
2. JSON-LD: solo un `WebPage` con `"@id": "<url>#webpage"`, `isPartOf` → `https://biaya.mx/#website`.
   No repitas la organización; enlázala con `{"@id": "https://biaya.mx/#organization"}`.
   Agrega `BreadcrumbList` (Inicio → página).
3. Agrégala a `sitemap.xml` con `<lastmod>` de hoy y a `llms.txt`.
4. Enlázala desde el footer o la navegación (Google descubre por enlaces internos).
5. Páginas legales: `<meta name="robots" content="noindex, follow">` es opcional; si se indexan, `priority` 0.3.

## Al cambiar contenido

- Actualiza `<lastmod>` en `sitemap.xml` de la URL afectada.
- Si cambian servicios, industrias o hechos, actualiza el JSON-LD (`hasOfferCatalog`, `knowsAbout`) y `llms.txt`.
- Si cambia el mensaje central, regenera la imagen social.

## Límites

- `<title>`: 50–60 caracteres, marca al inicio (`Biaya | …`).
- `description`: 140–160 caracteres, con palabras clave reales del negocio
  (consultoría, ingeniería enterprise, IA, integraciones, APIs, México).
- Un solo `<h1>` por página; secciones con `<h2>`, tarjetas con `<h3>`.
- Imágenes de contenido con `alt` descriptivo en español; decorativas con `alt=""`.
- El `<h1>` del hero es "AI Factory software enterprise" (sin etiqueta ni párrafo alrededor, por decisión del equipo).
- Contenido visible para buscadores: `js/biaya.js` pone `window.biayaReady = true` tras activar las
  animaciones de entrada; si no carga en 4 s, el script del `<head>` quita `.js` y todo se muestra.
  No borres ninguno de los dos.
- Enlaces internos a una industria: `#p-fin`, `#p-tel`, `#p-ret`, `#p-gob` abren su pestaña.

## Datos estructurados: qué NO poner

No agregar sin confirmación del equipo: dirección, teléfono, razón social, `sameAs` (perfiles sociales),
reseñas o `aggregateRating`, precios, certificaciones, clientes. Un dato falso en Schema.org puede generar
una acción manual de Google. `FAQPage` solo si las preguntas son visibles en la página.

## Regenerar la imagen social

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --allow-file-access-from-files --virtual-time-budget=5000 --window-size=1200,630 \
  --screenshot="$PWD/images/og-image.png" "file://$PWD/.claude/skills/biaya-seo/og-image.html"
```

## Verificar antes de publicar

- JSON-LD: https://search.google.com/test/rich-results y https://validator.schema.org
- Vista previa en redes: https://www.linkedin.com/post-inspector/ (recarga la caché de LinkedIn)
- Después de publicar: dar de alta `biaya.mx` en Google Search Console y Bing Webmaster Tools,
  y enviar `https://biaya.mx/sitemap.xml`.
