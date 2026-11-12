---
name: biaya-motion
description: Reglas y recetas de animación del sitio de Biaya (entradas al hacer scroll, texto palabra por palabra, demo del agente, escenas fijas, micro-interacciones). Úsala antes de agregar o cambiar cualquier animación, transición o interacción en biaya-web, y para verificarlas con capturas en tiempo real.
---

# Biaya · Movimiento y animación

El movimiento explica, no decora: cada animación debe mostrar un proceso (construir, probar, desplegar,
revisar) o guiar la lectura. Todo en CSS y JS puros (`css/biaya.css`, `js/biaya.js`), sin librerías.

## Principios

1. **Rápido y suave**: 300–800 ms para entradas; curva `var(--ease)` (cubic-bezier(.2,.7,.2,1)).
   `var(--ease-spring)` solo para "éxito" (checks, tarjeta de desplegado).
2. **Solo `transform`, `opacity` y `filter`**. Nunca animar `width/height/top/left` en bucles
   (excepción: barras de progreso cortas).
3. **Escalonar** grupos con `--d` (ms) o `--i` (índice); máximo ~80 ms entre elementos.
4. **Bucles discretos**: auroras, carrusel, bitácoras y bordes giratorios lentos (5–40 s) y de bajo contraste.
5. **Pausa al no verse**: la demo se reinicia solo si está visible (IntersectionObserver).
6. **`prefers-reduced-motion`**: obligatorio. CSS lo neutraliza globalmente; en JS usa `reduceMotion`
   (`sleep()` devuelve 0 ms y la demo muestra el estado final sin repetir).
7. **Contenido visible sin JS**: los estados ocultos iniciales van bajo `.js` (la clase se pone en `<head>`).

## Recetas disponibles

| Efecto | Cómo usarlo |
|---|---|
| Entrada al hacer scroll (sube + desenfoque) | clase `.reveal`, retardo opcional `style="--d:120ms"` |
| Título palabra por palabra | clase `.split` en el `h1/h2` (el JS envuelve palabras; `.grad-text` se anima como bloque) |
| Luz que sigue al cursor | clase `.spot` en una `.card` |
| Borde con brillo giratorio | contenedor `.prompt-wrap` (usa `@property --angle`) |
| Auroras de fondo | `<div class="aurora"><i></i><i></i><i></i></div>` dentro de una sección con `isolation:isolate` |
| Carrusel infinito | `.marquee > .marquee-track`; el JS clona los hijos, la animación va a `-50%` |
| Escena fija con scroll | `.how-step[data-scene=n]` + `.scene[data-scene=n]`; el riel `#how-rail` usa `--p` |
| Línea de tiempo que se dibuja | `.timeline` (se activa con `.in`) |
| Anillo de progreso | `svg.ring` con `.fg` (stroke-dashoffset a 0 cuando el padre tiene `.in`) |
| Animación AI Factory | `#factory` en el inicio y en `/ai-factory/` (bloque "AI Factory" de `js/biaya.js`) |
| Caso de punta a punta (3D de líneas) | `#e2e` en `/ai-factory/`: `js/biaya.js` controla fases, bitácora y human in the loop (datos en `data-*` de cada `.e2e-step`) y publica `window.biayaE2E`; `js/e2e3d.js` (Three.js) dibuja la arquitectura, agentes y flujos. Sin marco: la sección `.e2e-band` ocupa todo el ancho, el lienzo usa el fondo de la sección y se desvanece en los bordes. La cámara hace zoom out por fase (tabla `CAM`): de la idea en primer plano a la arquitectura completa en producción. Caso actual: Tap to Pay en iPhone. Cada componente lleva un nodo HTML con ícono y nombre (`.e2e-node` > `.e2e-ico`, estilo diagrama de producto) con estados `build`, `hot` (pasa el flujo), `ok` (✓) y `fail` (✕); el orquestador es un nodo central (`.orch.hub`). Los íconos nuevos van en `icon_names` de `/ai-factory/`. Sin WebGL queda un resumen en texto |

### Cambiar la animación de la AI Factory

- Los datos salen de las tarjetas `.phase-card`: nombre, ícono, entregable, `data-gate` (quién aprueba),
  `data-gate-av` (`TU` o `IB`) y la bitácora de cada subagente en `li[data-log]` (pasos separados por `|`).
- En `/ai-factory/` se leen de las tarjetas visibles; en el inicio, de la copia en `<template id="fx-data">`.
  Si cambias una fase, cámbiala en los dos lugares.
- Cada paso usa `await wait(ms)`; la animación se pausa con el botón o al salir de pantalla.
- Mantén el texto "Demostración ilustrativa" visible.

## Verificación (obligatoria tras cambios de animación)

Las capturas headless con `--virtual-time-budget` congelan animaciones y dan falsos errores. Usa capturas
en tiempo real con Chrome DevTools Protocol:

1. Sirve el sitio: `python3 -m http.server 8765` desde la raíz del proyecto.
2. Usa un script de Node (Node 22 trae `WebSocket` y `fetch`) que lance Chrome con
   `--remote-debugging-port`, navegue, haga scroll con `Runtime.evaluate`, espere tiempo real y capture con
   `Page.captureScreenshot`. Prueba a 1440×900 y 390×844 (`Emulation.setDeviceMetricsOverride`, `mobile: true`).
3. Comprueba `document.documentElement.scrollWidth === innerWidth` (sin desborde horizontal).
4. Revisa: animación de la AI Factory completa (6 fases con aprobación humana y servicio desplegado), menú móvil, pestañas y que
   ningún ícono aparezca como texto.
5. Detén el servidor al terminar.
