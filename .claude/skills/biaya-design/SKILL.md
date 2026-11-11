---
name: biaya-design
description: Sistema de diseño y reglas de contenido del sitio de Biaya (consultoría de ingeniería enterprise con IA). Úsala antes de crear o modificar cualquier sección, página, componente, color, tipografía o texto del sitio biaya-web.
---

# Biaya · Sistema de diseño

Biaya es una **consultoría** de ingeniería enterprise que lleva el desarrollo con IA a las organizaciones
(AI Factory + ingenieros senior + transferencia a los equipos del cliente). El sitio toma la experiencia de
producto de herramientas tipo Replit (caja de prompt, demo en vivo), pero **las llamadas a la acción son de
consultoría**: "Agenda una sesión", "Hablemos de tu próximo proyecto". Nunca "Regístrate" o "Prueba gratis".

Mensaje central: **Ingeniería enterprise. Velocidad de la IA. Control tuyo.**

**Todo empieza con una necesidad de negocio (la idea).** Es el primer paso de cualquier narrativa del sitio:
necesidad → diagnóstico → piloto → factory → transferencia. Los ejemplos, prompts y demos se redactan como
problemas de negocio ("Nuestro inventario en línea no cuadra con el de tienda"), nunca como instrucciones
técnicas ("Integra el ERP con el e-commerce"). La tecnología aparece después, como la respuesta.

## Stack

- HTML + CSS + JS puros. Sin frameworks, sin Tailwind, sin jQuery, sin build.
- Archivos: `index.html`, `css/biaya.css`, `js/biaya.js`.
- Fuentes de Google Fonts: Plus Jakarta Sans (títulos), Inter (texto), JetBrains Mono (etiquetas y código).
- Íconos: Material Symbols Outlined con `icon_names=` (lista **ordenada alfabéticamente**). Si agregas un ícono
  en HTML o JS, agrégalo a esa lista o se verá el nombre como texto.

## Tokens (definidos en `:root` de `css/biaya.css`)

| Uso | Token |
|---|---|
| Fondo / superficies | `--bg` #07090c, `--bg-2`, `--surface`, `--surface-2`, `--surface-3` |
| Bordes | `--line` (8% blanco), `--line-2` (14% blanco) |
| Texto | `--text` (principal), `--text-2` (cuerpo), `--text-3` (secundario) |
| Marca | `--green` #2bd46a, `--teal` #00cbae (turquesa del logo), `--grad` (verde→turquesa) |
| Forma | `--r-sm` 8px, `--r` 12px, `--r-lg` 20px |
| Movimiento | `--ease`, `--ease-spring` |

### Temas claro y oscuro

- El sitio tiene dos temas. Oscuro por defecto; claro con `data-theme="light"` en `<html>`.
  El botón `#theme-toggle` de la barra superior alterna y guarda la elección en `localStorage` (`biaya-theme`).
- **Nunca escribas colores fijos** (`rgba(255,255,255,…)`, `#000`, etc.) en reglas nuevas: usa los tokens
  (`--tint`, `--tint-2`, `--tint-3`, `--well`, `--card-a/b`, `--on-text`, `--shadow-card`, `--shadow-xl`…).
  Si necesitas uno nuevo, defínelo en `:root` **y** en `[data-theme="light"]`.
- Los bloques de código (`.studio`, `.code-card`, `.spec`, `.sdk`, `.code-mini`) son "islas oscuras":
  se ven oscuros también en el tema claro. Un bloque de código nuevo debe agregarse a ese selector.
- Revisa cada cambio en los dos temas.

Reglas:
- Oscuro por defecto. El verde y el degradado son **acentos**: CTA principal, una palabra clave por título, íconos activos.
  Nunca fondos grandes en verde.
- Botón principal: `.btn.btn-green`. Secundario: `.btn.btn-ghost`. Un solo botón verde por bloque.
- Títulos de sección: `.section-head` con `.eyebrow` (mono, mayúsculas, verde) + `h2` + párrafo.
- Tarjetas: `.card` (+ `.spot` para luz que sigue al cursor). Bordes sutiles, sin sombras pesadas.
- Etiquetas técnicas y metadatos en `--f-mono`, 11–12px, mayúsculas con `letter-spacing`.
- Contenedor: `.wrap` (máx. 1200px, gutter de 16–32px). Sin scroll horizontal a 390px.
- Responsive: probar 1440, 1024, 768 y 390 px.

## Patrones existentes (reutiliza antes de crear)

- Caja de prompt con borde giratorio: `.prompt-wrap` > `.prompt`.
- Ventana tipo IDE: `.studio` (chat del agente + pestañas Código/Pruebas/Despliegue).
- Carrusel: `.marquee` > `.marquee-track` (el JS duplica el contenido).
- Pasos con escena fija al hacer scroll: `.how` (`.how-step[data-scene]` ↔ `.scene[data-scene]`).
- Bento: `.bento` con `.tile.t-wide` (3/6) y `.tile.t-third` (2/6), cada uno con `.tile-art` animado.
- Pestañas accesibles: `.ind-tab[role=tab]` + `[role=tabpanel][hidden]`.

## Contenido: reglas obligatorias

Español de México, tuteo, frases cortas, sin jerga innecesaria.

**No inventar**: clientes, logos de clientes, testimonios, certificaciones (SOC 2, ISO, PCI), alianzas,
estadísticas, porcentajes, SLAs, plazos garantizados, tiempos de respuesta, integrantes del equipo,
oficinas o direcciones, precios, casos de éxito. Las demos se marcan como "Demostración ilustrativa".

Hechos verificados que sí se pueden usar: Biaya nació en 2020 construyendo microservicios y SDKs para
incorporar instituciones financieras a CoDi (Banco de México). Contacto: contacto@biaya.mx.

No presentar a Biaya como desarrolladora de modelos de IA ni como dependiente de un proveedor de IA.
La marca pública es "Biaya" (no "Biaya Inc." ni otra razón social).

Nombres de tecnologías (SPEI, SAP, Kafka, AWS…) se pueden mencionar como sistemas con los que se integra,
nunca como clientes o socios.

## Accesibilidad

- Íconos decorativos con `aria-hidden="true"`; botones solo-ícono con `aria-label`.
- Contraste mínimo AA: texto de cuerpo `--text-2` sobre `--bg`, nunca `--text-3` para párrafos largos.
- Foco visible (`:focus-visible` ya definido). Pestañas navegables con flechas.
- No meter `<h3>`/`<p>` dentro de `<button>`; usar `<span>` con clase.
