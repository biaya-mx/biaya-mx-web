/* =========================================================
   AI Factory · Caso de punta a punta (líneas 3D con Three.js)
   Tap to Pay en iPhone: el celular del comercio cobra con tarjetas sin contacto
   y cada cobro llega al core de pagos como si viniera de una terminal.
   Un orquestador reparte el trabajo, los subagentes construyen cada componente
   y una persona aprueba al cierre de cada fase (human in the loop).
   El estado de las fases lo publica js/biaya.js en window.biayaE2E.
   ========================================================= */
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const root = document.getElementById('e2e');
const S = window.biayaE2E;
const host = root && root.querySelector('.e2e-scene');
if (!root || !S || !host) throw new Error('e2e3d: falta la sección');

/* ---------- Utilidades ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const range = (x, a, b) => clamp((x - a) / (b - a));
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, t) => V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);

/* ---------- Renderer y postproceso (sin cielo ni suelo: solo líneas sobre el fondo de la tarjeta) ---------- */
// El fondo es el mismo de la sección: la escena se funde con la página, sin marco
const sectionBg = () => { const c = getComputedStyle(root.closest('.e2e-band') || document.body).backgroundColor.match(/[\d.]+/g); return c && +(c[3] ?? 1) > 0 ? new THREE.Color(`rgb(${c[0]},${c[1]},${c[2]})`) : new THREE.Color(0x07090c); };
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
// El postproceso vuelve a convertir a sRGB; se compensa para que el fondo sea idéntico al de la página
const setBg = () => { renderer.setClearColor(sectionBg().convertSRGBToLinear(), 1); needsRender = true; };
let needsRender = true;
setBg();
new MutationObserver(() => requestAnimationFrame(setBg)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
renderer.outputColorSpace = THREE.SRGBColorSpace;
const canvas = renderer.domElement;
canvas.className = 'e2e-canvas';
canvas.setAttribute('role', 'img');
canvas.setAttribute('aria-label', 'Animación ilustrativa: de la idea a producción, los subagentes construyen Tap to Pay en iPhone, para que un comercio cobre con tarjetas sin contacto desde su celular y el cobro se autorice en el core de pagos, con aprobación humana en cada fase.');
host.prepend(canvas);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.45, 0.12);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- Materiales de línea ---------- */
const mats = [];
const LM = (color, width, opacity = 1, dashed = false) => {
  const m = new LineMaterial({ color, linewidth: width, transparent: true, opacity, dashed, dashSize: 0.18, gapSize: 0.14, depthWrite: false });
  mats.push(m); return m;
};
const COL = { dim: 0x2a3440, base: 0x7d8fa3, teal: 0x00cbae, green: 0x2bd46a, white: 0xdfe8f1, sketch: 0xbfcad6 };
const MAT = {
  grid: LM(COL.dim, 1, 0.55),
  ghost: LM(COL.base, 1.1, 0.55, true),
  sketch: LM(COL.sketch, 1.6, 0.95, true),
  base: LM(COL.base, 1.4, 0.9),
  build: LM(COL.teal, 1.7, 1),
  detail: LM(COL.teal, 1, 0.75),
  done: LM(COL.green, 1.7, 1),
  doneDetail: LM(COL.green, 1, 0.6),
  wire: LM(COL.base, 1.2, 0.7),
  wireOn: LM(COL.teal, 1.6, 0.95),
  pci: LM(COL.green, 1.5, 0.95, true),
  cloud: LM(0x4b6a80, 1.2, 0.85, true),
  tether: LM(COL.teal, 1, 0.55, true),
  tetherH: LM(COL.white, 1.4, 0.9, true),
  orch: LM(COL.teal, 1.5, 1),
  human: LM(COL.white, 1.6, 1),
  humanOk: LM(COL.green, 1.8, 1),
};

/* ---------- Generadores de segmentos ---------- */
const seg = (out, a, b) => { out.push(a.x, a.y, a.z, b.x, b.y, b.z); return out; };
const box = (o, c, w, h, d) => {
  const x0 = c.x - w / 2, x1 = c.x + w / 2, y0 = c.y, y1 = c.y + h, z0 = c.z - d / 2, z1 = c.z + d / 2;
  const P = [V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), V(x0, y1, z0), V(x1, y1, z0), V(x1, y1, z1), V(x0, y1, z1)];
  [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => seg(o, P[a], P[b]));
  return o;
};
const ring = (o, c, r, n = 32, axis = 'y') => {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const p = (a) => (axis === 'y' ? V(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r) : axis === 'z' ? V(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.z) : V(c.x, c.y + Math.sin(a) * r, c.z + Math.cos(a) * r));
    seg(o, p(a0), p(a1));
  }
  return o;
};
const arc = (o, c, r, a0, a1, n = 12) => { for (let i = 0; i < n; i++) seg(o, V(c.x + Math.cos(a0 + (a1 - a0) * i / n) * r, c.y + Math.sin(a0 + (a1 - a0) * i / n) * r, c.z), V(c.x + Math.cos(a0 + (a1 - a0) * (i + 1) / n) * r, c.y + Math.sin(a0 + (a1 - a0) * (i + 1) / n) * r, c.z)); return o; };
const rectXZ = (o, c, w, d) => { const a = V(c.x - w / 2, c.y, c.z - d / 2), b = V(c.x + w / 2, c.y, c.z - d / 2), e = V(c.x + w / 2, c.y, c.z + d / 2), f = V(c.x - w / 2, c.y, c.z + d / 2); seg(o, a, b); seg(o, b, e); seg(o, e, f); seg(o, f, a); return o; };
const rectXY = (o, c, w, h) => { const a = V(c.x - w / 2, c.y, c.z), b = V(c.x + w / 2, c.y, c.z), e = V(c.x + w / 2, c.y + h, c.z), f = V(c.x - w / 2, c.y + h, c.z); seg(o, a, b); seg(o, b, e); seg(o, e, f); seg(o, f, a); return o; };
const hexPrism = (o, c, r, h) => {
  const P = (y, i) => V(c.x + Math.cos(i * Math.PI / 3 + Math.PI / 6) * r, y, c.z + Math.sin(i * Math.PI / 3 + Math.PI / 6) * r);
  for (let i = 0; i < 6; i++) { seg(o, P(c.y, i), P(c.y, i + 1)); seg(o, P(c.y + h, i), P(c.y + h, i + 1)); seg(o, P(c.y, i), P(c.y + h, i)); }
  return o;
};
const cylinder = (o, c, r, h, layers = 3) => { for (let i = 0; i <= layers; i++) ring(o, V(c.x, c.y + (h * i) / layers, c.z), r, 28); [0, 1, 2, 3].forEach((i) => { const a = i * Math.PI / 2; seg(o, V(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r), V(c.x + Math.cos(a) * r, c.y + h, c.z + Math.sin(a) * r)); }); return o; };
const make = (arr, mat) => {
  const g = new LineSegmentsGeometry(); g.setPositions(arr);
  const m = new LineSegments2(g, mat); m.computeLineDistances(); m.userData.total = arr.length / 6;
  g.instanceCount = 0; m.visible = false; scene.add(m); return m;
};
const reveal = (m, f, mat) => { if (mat && m.material !== mat) m.material = mat; const n = Math.floor(m.userData.total * clamp(f)); m.geometry.instanceCount = n; m.visible = n > 0; };

/* ---------- Piso: retícula de líneas que se desvanece ---------- */
{
  const o = [];
  for (let i = -16; i <= 16; i += 2) { seg(o, V(i, 0, -11), V(i, 0, 11)); }
  for (let j = -10; j <= 10; j += 2) { seg(o, V(-16, 0, j), V(16, 0, j)); }
  const grid = make(o, MAT.grid); reveal(grid, 1);
}

/* ---------- Componentes de la arquitectura ----------
   Tap to Pay en iPhone: la app de cobro del banco o adquirente lee la tarjeta sin contacto,
   la plataforma de aceptación la trata como una terminal más y el cobro se autoriza en el core de pagos.
   Cada componente tiene contorno 3D, detalle interno y un nodo con ícono (estilo diagrama de producto). */
const C = {};
const comp = (id, label, icon, pos, outline, detail, opts = {}) => {
  C[id] = { id, label, icon, pos, top: opts.top || 1.6, out: make(outline, MAT.ghost), det: make(detail, MAT.detail), ...opts };
};
{ // iPhone del comercio: pantalla de cobro con monto y símbolo sin contacto
  const p = V(-12.4, 0, 3.4); const o = []; const d = [];
  box(o, V(p.x, 0.02, p.z), 1.0, 1.9, 0.14);
  rectXY(d, V(p.x, 0.22, p.z + 0.08), 0.8, 1.45);
  seg(d, V(p.x - 0.12, 1.55, p.z + 0.09), V(p.x + 0.12, 1.55, p.z + 0.09)); // bocina
  for (let i = 0; i < 2; i++) seg(d, V(p.x - 0.28, 1.2 - i * 0.14, p.z + 0.09), V(p.x + 0.28 - i * 0.16, 1.2 - i * 0.14, p.z + 0.09)); // monto
  for (let r = 1; r <= 3; r++) arc(d, V(p.x - 0.12, 0.62, p.z + 0.09), 0.09 * r, -0.75, 0.75, 8); // sin contacto
  rectXY(d, V(p.x, 0.3, p.z + 0.09), 0.5, 0.12); // botón cobrar
  comp('phone', 'iPhone del comercio', 'smartphone', p, o, d, { top: 2.35 });
}
{ // Tarjeta sin contacto, de pie frente al iPhone: chip, ondas y número
  const p = V(-12.4, 0, -1.6); const o = []; const d = [];
  box(o, V(p.x, 0.25, p.z), 1.55, 1.0, 0.06);
  rectXY(d, V(p.x - 0.42, 0.62, p.z + 0.035), 0.32, 0.24); seg(d, V(p.x - 0.58, 0.74, p.z + 0.035), V(p.x - 0.26, 0.74, p.z + 0.035)); seg(d, V(p.x - 0.42, 0.62, p.z + 0.035), V(p.x - 0.42, 0.86, p.z + 0.035));
  for (let r = 1; r <= 3; r++) arc(d, V(p.x + 0.38, 0.74, p.z + 0.035), 0.07 * r, -0.8, 0.8, 8);
  for (let i = 0; i < 4; i++) seg(d, V(p.x - 0.62 + i * 0.3, 0.42, p.z + 0.035), V(p.x - 0.42 + i * 0.3, 0.42, p.z + 0.035));
  comp('card', 'Tarjeta sin contacto', 'contactless', p, o, d, { top: 1.85 });
}
const service = (id, label, icon, p, w, h, d0, layers = 3, mods = 3) => {
  const o = []; const d = [];
  box(o, p, w, h, d0);
  for (let i = 1; i < layers; i++) { const y = p.y + (h * i) / layers; seg(d, V(p.x - w / 2, y, p.z + d0 / 2), V(p.x + w / 2, y, p.z + d0 / 2)); seg(d, V(p.x + w / 2, y, p.z + d0 / 2), V(p.x + w / 2, y, p.z - d0 / 2)); }
  for (let i = 0; i < mods; i++) box(d, V(p.x - w / 2 + (w / mods) * (i + 0.5), p.y + h + 0.02, p.z), (w / mods) * 0.62, 0.22 + (i % 2) * 0.12, d0 * 0.55);
  for (let i = 0; i < 4; i++) rectXY(d, V(p.x - w / 2 + 0.25 + i * 0.22, p.y + 0.12, p.z + d0 / 2 + 0.01), 0.12, 0.08);
  comp(id, label, icon, p, o, d, { top: h + 0.75 });
};
service('mer', 'Alta de comercios', 'storefront', V(-6.2, 0, -5.6), 2.2, 0.9, 1.6, 2, 2);
service('gw', 'API Gateway', 'api', V(-6.2, 0, 3.4), 2.0, 0.8, 1.5, 2, 3);
service('soft', 'Plataforma de aceptación', 'hub', V(-1.4, 0, 3.4), 2.8, 1.2, 2.0, 3, 4);
service('att', 'Atestación del dispositivo', 'verified_user', V(-1.4, 0, 7.6), 2.4, 0.9, 1.4, 2, 3);
service('core', 'Core de pagos', 'account_balance', V(3.6, 0, -0.4), 2.6, 1.2, 1.9, 3, 3);
{ // HSM con candado: descifra los datos de la tarjeta
  const p = V(3.6, 0, 7.6); const o = []; const d = [];
  box(o, p, 1.7, 1.0, 1.4);
  rectXY(d, V(p.x, 0.25, p.z + 0.71), 0.5, 0.36); arc(d, V(p.x, 0.61, p.z + 0.71), 0.17, 0, Math.PI, 10);
  for (let i = 1; i < 4; i++) seg(d, V(p.x - 0.85, i * 0.25, p.z - 0.7), V(p.x - 0.85, i * 0.25, p.z + 0.7));
  comp('hsm', 'HSM y llaves', 'lock', p, o, d, { top: 1.75 });
}
{ // Gestión de terminales: cada iPhone activo es una terminal registrada
  const p = V(3.6, 0, 3.6); const o = []; const d = [];
  cylinder(o, p, 0.8, 1.1, 1); cylinder(d, V(p.x, 0.15, p.z), 0.6, 0.8, 3);
  comp('tms', 'Gestión de terminales', 'database', p, o, d, { top: 1.85 });
}
const net = (id, label, p) => {
  const o = []; const d = [];
  hexPrism(o, p, 1.5, 0.9); hexPrism(d, V(p.x, 0.9, p.z), 0.9, 0.35); ring(d, V(p.x, 0.02, p.z), 1.9, 36); ring(d, V(p.x, 1.25, p.z), 0.45, 18);
  comp(id, label, 'public', p, o, d, { top: 2.0 });
};
net('visa', 'Red Visa', V(10.6, 0, 4.2));
net('mc', 'Red Mastercard', V(10.6, 0, -2.8));

// Límites: tu infraestructura y alcance PCI (líneas punteadas en el piso)
const cloudLine = make(rectXZ([], V(-1.3, 0.03, 3.6), 12.6, 11.4), MAT.cloud);
const pciLine = make(rectXZ([], V(1.1, 0.06, 4.6), 7.6, 8.6), MAT.pci);

/* ---------- Conexiones (ruteo ortogonal, a ras de piso) ---------- */
const route = (a, b) => { const A = C[a].pos, B = C[b].pos; const y = 0.12; return [V(A.x, y, A.z), V(B.x, y, A.z), V(B.x, y, B.z)]; };
const WIRES = [['phone', 'gw'], ['gw', 'soft'], ['soft', 'att'], ['soft', 'tms'], ['soft', 'hsm'], ['att', 'hsm'], ['hsm', 'core'], ['tms', 'core'], ['core', 'visa'], ['core', 'mc'], ['mer', 'gw'], ['mer', 'core']];
const wires = WIRES.map(([a, b]) => { const pts = route(a, b); const o = []; seg(o, pts[0], pts[1]); seg(o, pts[1], pts[2]); return { a, b, m: make(o, MAT.wire) }; });
// Ondas NFC: del iPhone hacia la tarjeta
const nfc = make((() => { const o = []; const c = V(-12.4, 1.1, 2.2); for (let i = 1; i <= 3; i++) { for (let k = 0; k < 10; k++) { const a0 = -0.7 + (1.4 * k) / 10, a1 = -0.7 + (1.4 * (k + 1)) / 10; seg(o, V(c.x + Math.sin(a0) * 0.3 * i, c.y + Math.cos(a0) * 0.3 * i, c.z - 0.25 * i), V(c.x + Math.sin(a1) * 0.3 * i, c.y + Math.cos(a1) * 0.3 * i, c.z - 0.25 * i)); } } return o; })(), MAT.build);

/* ---------- Orquestador y human in the loop ---------- */
const ORCH = V(-1.5, 5.4, -7.6);
const HUMAN = V(-6.8, 5.0, -7.6);
const orch = new THREE.Group(); orch.position.copy(ORCH); scene.add(orch);
const orchLines = make((() => { const o = []; const ico = new THREE.IcosahedronGeometry(0.75, 0); const e = new THREE.EdgesGeometry(ico).attributes.position.array; for (let i = 0; i < e.length; i += 6) seg(o, V(e[i], e[i + 1], e[i + 2]), V(e[i + 3], e[i + 4], e[i + 5])); ring(o, V(0, 0, 0), 1.25, 40); ring(o, V(0, 0, 0), 1.25, 40, 'x'); return o; })(), MAT.orch);
scene.remove(orchLines); orch.add(orchLines);
const humanLines = make((() => { const o = []; ring(o, V(0, 0.95, 0), 0.32, 24, 'z'); arc(o, V(0, 0.1, 0), 0.6, 0.15, Math.PI - 0.15, 14); seg(o, V(-0.58, 0.25, 0), V(-0.6, -0.35, 0)); seg(o, V(0.58, 0.25, 0), V(0.6, -0.35, 0)); seg(o, V(-0.6, -0.35, 0), V(0.6, -0.35, 0)); ring(o, V(0, 0.3, 0), 1.25, 40, 'z'); return o; })(), MAT.human);
const human = new THREE.Group(); human.position.copy(HUMAN); scene.remove(humanLines); human.add(humanLines); scene.add(human);
const gateLink = make(seg([], ORCH, HUMAN), MAT.tetherH);

/* ---------- Sprites de luz: agentes y paquetes ---------- */
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.2, 'rgba(255,255,255,.75)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const spark = (color, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(size, size, 1); s.visible = false; scene.add(s); return s; };

/* ---------- Etiquetas HTML ---------- */
const tagLayer = document.createElement('div'); tagLayer.className = 'e2e-tags'; tagLayer.setAttribute('aria-hidden', 'true'); host.appendChild(tagLayer);
const tag = (text, cls = '') => { const el = document.createElement('span'); el.className = `e2e-tag ${cls}`; el.textContent = text; tagLayer.appendChild(el); return el; };
// Nodo: cuadro con un ícono que dice qué es el componente y su nombre debajo
const node = (text, icon, cls = 'e2e-node') => { const el = tag('', cls); const t = document.createElement('span'); t.className = 'e2e-ico'; const i = document.createElement('span'); i.className = 'ms'; i.textContent = icon; const k = document.createElement('i'); k.className = 'e2e-badge'; t.append(i, k); const b = document.createElement('b'); b.textContent = text; el.append(t, b); return el; };
const pv = new THREE.Vector3();
const place = (el, pos, show, dy = -120) => {
  pv.copy(pos).project(camera);
  const vis = show > 0.02 && pv.z < 1;
  el.style.opacity = vis ? Math.min(1, show) : 0;
  if (vis) el.style.transform = `translate(${((pv.x + 1) / 2) * host.clientWidth}px, ${((1 - pv.y) / 2) * host.clientHeight}px) translate(-50%, ${dy}%)`;
};
Object.values(C).forEach((c) => { c.tag = node(c.label, c.icon); });
const orchTag = node('Orquestador', 'smart_toy', 'orch hub');
const humanTag = tag('Human in the loop', 'human');
const cloudTag = tag('Tu infraestructura', 'zone');
const pciTag = tag('Alcance PCI', 'zone ok');

/* ---------- Guion por fase ----------
   Cada agente: nombre, componentes que construye y ventana de tiempo dentro de la fase (0–1). */
const AGENTS = {
  2: [['Analista de negocio', ['phone', 'card', 'mer'], 0.05, 0.7], ['Explorador de sistemas', ['core', 'hsm'], 0.12, 0.75], ['Revisor regulatorio', ['att', 'visa', 'mc'], 0.2, 0.8]],
  3: [['Arquitecto de soluciones', ['soft', 'gw', 'core'], 0.02, 0.62], ['Diseñador de contratos', ['phone', 'mer', 'visa'], 0.1, 0.66], ['Modelador de datos', ['tms', 'att', 'hsm'], 0.16, 0.7]],
  4: [['Desarrollador iOS', ['phone', 'card'], 0.02, 0.7], ['Desarrollador de servicios', ['gw', 'soft', 'tms'], 0.08, 0.7], ['Integrador del core', ['core', 'hsm'], 0.12, 0.72], ['Integrador de redes', ['visa', 'mc'], 0.16, 0.72], ['Desarrollador del portal', ['mer', 'att'], 0.2, 0.74]],
  5: [['Pruebas de integración', ['card', 'phone', 'soft'], 0.02, 0.72], ['Pruebas de carga', ['core', 'visa', 'mc'], 0.1, 0.72]],
  6: [['Análisis estático', ['phone', 'gw'], 0.02, 0.7], ['Revisor de cumplimiento', ['hsm', 'att', 'tms'], 0.08, 0.72]],
  7: [['Ingeniero de CI/CD', ['soft', 'core', 'gw'], 0.02, 0.45], ['Observabilidad', ['core', 'mer'], 0.06, 0.5]],
};
// Orden en que la arquitectura (fase 3) y la construcción (fase 4) avanzan por componente
const ARCH_ORDER = ['phone', 'card', 'gw', 'soft', 'att', 'tms', 'hsm', 'core', 'mer', 'visa', 'mc'];
const agentPool = [...Array(5)].map((_, i) => ({ s: spark(i % 2 ? 0x2bd46a : 0x00cbae, 0.75), tag: tag('', 'agent'), tether: make(seg([], V(0, 0, 0), V(0, 1, 0)), MAT.tether) }));

/* Flujos: activación del iPhone como terminal y cobro con una tarjeta sin contacto */
const hop = (a, b) => route(a, b);
const pathOf = (hops) => { const pts = []; hops.forEach(([a, b]) => { const r = hop(a, b); if (pts.length) r.shift(); pts.push(...r); }); return pts; };
// Activación: la app registra el iPhone; la plataforma valida al comercio, atesta el dispositivo y le asigna una terminal
const FLOW_PROV = { pts: pathOf([['phone', 'gw'], ['gw', 'soft'], ['soft', 'att'], ['att', 'soft'], ['soft', 'tms'], ['tms', 'soft'], ['soft', 'gw'], ['gw', 'phone']]), labels: [[0.02, 'Activar Tap to Pay', 'gw'], [0.2, 'Validar comercio', 'soft'], [0.34, 'Atestar dispositivo', 'att'], [0.55, 'Asignar terminal', 'tms'], [0.92, 'Listo para cobrar', 'phone']] };
// Cobro: tarjeta → iPhone (lectura cifrada) → plataforma → HSM descifra → core autoriza con la red → aprobado en el iPhone
const FLOW_PAY = { pts: pathOf([['card', 'phone'], ['phone', 'gw'], ['gw', 'soft'], ['soft', 'hsm'], ['hsm', 'core'], ['core', 'mc'], ['mc', 'core'], ['core', 'soft'], ['soft', 'gw'], ['gw', 'phone']]), labels: [[0.0, 'Acercar tarjeta o celular', 'card'], [0.08, 'Lectura EMV cifrada', 'phone'], [0.3, 'Descifrar en HSM', 'hsm'], [0.42, 'Autorizar en tu core', 'core'], [0.55, 'La red y el emisor aprueban', 'mc'], [0.93, 'Cobro aprobado', 'phone']] };
const lenOf = (pts) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1])); return L; };
[FLOW_PROV, FLOW_PAY].forEach((f) => { f.L = lenOf(f.pts); f.total = f.L[f.L.length - 1]; });
const at = (f, u) => { const d = clamp(u) * f.total; let i = 1; while (i < f.L.length - 1 && f.L[i] < d) i++; const t = (d - f.L[i - 1]) / Math.max(1e-6, f.L[i] - f.L[i - 1]); return lerpV(f.pts[i - 1], f.pts[i], clamp(t)); };
const packets = [...Array(14)].map(() => spark(0xffffff, 0.55));
const flowTags = [...Array(6)].map(() => tag('', 'flow'));
const checks = Object.keys(C).map((id) => ({ id, el: tag('✓', 'check') }));
const ideaTags = [tag('“Queremos que nuestros comercios cobren con su iPhone, desde nuestra app y sin terminal.”', 'idea'), tag('¿Cómo lo hacemos seguro?', 'q')];
const findTags = [['EMV sin contacto', 'phone'], ['PCI DSS y PCI MPoC', 'hsm'], ['Atestación del iPhone', 'att'], ['Core de pagos actual', 'core']].map(([t, id]) => ({ id, el: tag(t, 'find') }));
// Calidad: un cobro declinado de prueba (✕) antes de que todo quede en verde
const failTag = tag('✕', 'check fail');
const liveTag = tag('En producción', 'live');

/* ---------- Tamaño ---------- */
const resize = () => {
  const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2);
  const pr = renderer.getPixelRatio(); mats.forEach((m) => m.resolution.set(w * pr, h * pr));
  camera.aspect = w / h; camera.updateProjectionMatrix(); needsRender = true;
};
new ResizeObserver(resize).observe(host);
resize();

/* ---------- Animación ---------- */
// Cámara por fase: inicio de cada fase → la siguiente; el último punto es la vista completa
const CAM = [
  { tgt: V(-12.2, 0.9, 1.0), R: 12.5, yaw: 0.16, pitch: 0.58 }, // La idea: iPhone y tarjeta
  { tgt: V(-8.6, 1.4, 0.8), R: 18.5, yaw: 0.24, pitch: 0.62 },  // Descubrimiento: el comercio y su adquirente
  { tgt: V(-4.6, 1.7, 0.6), R: 25.0, yaw: 0.32, pitch: 0.66 },  // Arquitectura: la plataforma de aceptación
  { tgt: V(-2.0, 1.7, 0.4), R: 30.0, yaw: 0.38, pitch: 0.7 },   // Construcción
  { tgt: V(-1.2, 1.6, 0.4), R: 34.0, yaw: 0.42, pitch: 0.74 },  // Calidad
  { tgt: V(-1.0, 1.5, 0.4), R: 37.5, yaw: 0.45, pitch: 0.78 },  // Seguridad
  { tgt: V(-0.9, 1.4, -0.4), R: 41.0, yaw: 0.48, pitch: 0.82 },  // Producción
  { tgt: V(-0.9, 1.2, -1.0), R: 46.0, yaw: 0.5, pitch: 0.86 },   // Vista de punta a punta
]
const cam = {};
let camDt = 0;
function update(t) {
  const s = S.stage; const p = S.reduceMotion ? 1 : S.p;
  const k = (n) => (s > n ? 1 : s === n ? p : 0);

  // Cámara: zoom out continuo. Empieza pegada a la idea (iPhone y tarjeta) y se aleja fase por fase
  // hasta ver la arquitectura de punta a punta, con orquestador y human in the loop, en producción.
  const aspect = camera.aspect || 1;
  const sway = S.reduceMotion ? 0 : Math.sin(t * 0.12) * 0.12;
  const i0 = clamp(s, 1, 7) - 1;
  const ka = CAM[i0], kb = CAM[i0 + 1], f = s === 0 ? 0 : ease(p);
  const goal = {
    tgt: lerpV(ka.tgt, kb.tgt, f),
    R: (ka.R + (kb.R - ka.R) * f) * Math.max(1, 1.7 / aspect), // en vertical se aleja para que quepa
    yaw: ka.yaw + (kb.yaw - ka.yaw) * f,
    pitch: ka.pitch + (kb.pitch - ka.pitch) * f,
  };
  // Amortiguado: al reiniciar o al elegir una fase, la cámara vuela en vez de saltar
  const a = cam.R && S.running && !S.reduceMotion ? 1 - Math.exp(-camDt * 2.2) : 1;
  cam.tgt = cam.tgt ? lerpV(cam.tgt, goal.tgt, a) : goal.tgt;
  ['R', 'yaw', 'pitch'].forEach((key) => { cam[key] = cam[key] ? cam[key] + (goal[key] - cam[key]) * a : goal[key]; });
  const yaw = cam.yaw + sway, hz = Math.cos(cam.pitch) * cam.R;
  camera.position.set(cam.tgt.x + Math.sin(yaw) * hz, cam.tgt.y + Math.sin(cam.pitch) * cam.R, cam.tgt.z + Math.cos(yaw) * hz);
  camera.lookAt(cam.tgt);
  if (a < 1 && Math.abs(goal.R - cam.R) > 0.01) needsRender = true;

  // 1 · La idea: boceto del iPhone y la tarjeta
  const sketch = s === 1 ? ease(range(p, 0, 0.55)) : 0;
  ['phone', 'card'].forEach((id) => { if (s === 1) { reveal(C[id].out, sketch, MAT.sketch); reveal(C[id].det, ease(range(p, 0.35, 0.7)), MAT.sketch); } });
  reveal(nfc, s === 1 ? range(p, 0.5, 0.65) * (0.5 + 0.5 * Math.sin(t * 5)) : s >= 7 ? 0 : 0, MAT.build);
  place(ideaTags[0], V(-12.4, 2.4, 1), s === 1 ? ease(range(p, 0.15, 0.3)) : 0, -150);
  place(ideaTags[1], V(-12.4, 0.2, -3.2), s === 1 ? ease(range(p, 0.6, 0.75)) : 0, 40);

  // 2 · Descubrimiento: actores como fantasmas punteados y hallazgos
  // 3 · Arquitectura: los componentes se dibujan y se conectan
  // 4 · Construcción: detalle interno en turquesa
  // 5–7 · Calidad, seguridad y producción: verde al aprobarse
  ARCH_ORDER.forEach((id, i) => {
    const c = C[id]; const n = ARCH_ORDER.length;
    if (s === 1) return;
    let outF = 0; let outM = MAT.ghost; let detF = 0; let detM = MAT.detail;
    if (s === 2) { outF = ease(range(p, 0.05 + (i / n) * 0.5, 0.3 + (i / n) * 0.5)); }
    if (s >= 3) { outF = 1; outM = s === 3 ? (range(p, 0.05 + (i / n) * 0.6, 0.2 + (i / n) * 0.6) > 0 ? MAT.base : MAT.ghost) : MAT.base; }
    if (s === 3) { const f = range(p, 0.05 + (i / n) * 0.6, 0.2 + (i / n) * 0.6); outF = f > 0 ? ease(f) : 1; if (!f) outM = MAT.ghost; }
    if (s >= 4) { detF = s === 4 ? ease(range(p, 0.04 + (i / n) * 0.62, 0.18 + (i / n) * 0.62)) : 1; outM = s === 4 && detF < 1 ? MAT.build : MAT.base; }
    if (s >= 7) { const f = range(p, 0.05 + (i / n) * 0.3, 0.1 + (i / n) * 0.3); outM = f > 0 || s > 7 ? MAT.done : MAT.base; detM = f > 0 ? MAT.doneDetail : MAT.detail; }
    reveal(c.out, outF, outM); reveal(c.det, detF, detM);
    const lab = s === 2 ? ease(range(p, 0.15 + (i / n) * 0.5, 0.3 + (i / n) * 0.5)) : s >= 3 ? 1 : 0;
    place(c.tag, V(c.pos.x, c.top, c.pos.z), lab, -100);
    c.tag.classList.toggle('build', s === 4 && detF > 0 && detF < 1);
    c.tag.classList.toggle('on', s >= 7 && outM === MAT.done);
  });
  findTags.forEach(({ id, el }, i) => place(el, V(C[id].pos.x + 1.6, C[id].pos.y + 0.6, C[id].pos.z + 1.2), s === 2 ? ease(range(p, 0.45 + i * 0.08, 0.55 + i * 0.08)) : 0, -50));
  wires.forEach((w, i) => { const f = s === 3 ? ease(range(p, 0.45 + (i / wires.length) * 0.4, 0.55 + (i / wires.length) * 0.4)) : s > 3 ? 1 : 0; reveal(w.m, f, s >= 7 ? MAT.wireOn : MAT.wire); });
  reveal(cloudLine, s === 3 ? ease(range(p, 0.3, 0.6)) : s > 3 ? 1 : 0, MAT.cloud);
  place(cloudTag, V(-7.4, 0.1, 9.3), s >= 3 ? (s === 3 ? ease(range(p, 0.5, 0.6)) : 1) : 0, -50);

  // 6 · Seguridad: alcance PCI y candados
  reveal(pciLine, s === 6 ? ease(range(p, 0.1, 0.45)) : s > 6 ? 1 : 0, MAT.pci);
  place(pciTag, V(4.9, 0.1, 9.1), s >= 6 ? (s === 6 ? ease(range(p, 0.4, 0.5)) : 1) : 0, -50);

  // Orquestador y persona que aprueba
  const orchOn = s >= 2 ? 1 : 0;
  orch.rotation.y = t * 0.4; orch.rotation.x = Math.sin(t * 0.3) * 0.2;
  reveal(orchLines, orchOn * (s === 2 ? ease(range(p, 0, 0.12)) : 1), MAT.orch);
  place(orchTag, V(ORCH.x, ORCH.y + 1.6, ORCH.z), orchOn * (s === 2 ? ease(range(p, 0.05, 0.15)) : 1), -100);
  const gateOpen = s >= 1 && p > 0.62;
  const approved = s >= 1 && p > 0.8;
  human.lookAt(camera.position);
  reveal(humanLines, s >= 1 ? 1 : 0, approved ? MAT.humanOk : MAT.human);
  human.scale.setScalar(gateOpen && !approved ? 1 + Math.sin(t * 6) * 0.05 : 1);
  place(humanTag, V(HUMAN.x, HUMAN.y + 1.7, HUMAN.z), s >= 1 ? 1 : 0);
  humanTag.classList.toggle('wait', gateOpen && !approved);
  humanTag.classList.toggle('ok', approved);
  reveal(gateLink, s >= 2 && gateOpen ? 1 : 0, MAT.tetherH);

  // Agentes: salen del orquestador, trabajan en sus componentes y regresan
  const list = AGENTS[s] || [];
  agentPool.forEach((a, i) => {
    const def = list[i];
    if (!def || S.stage === 0) { a.s.visible = false; reveal(a.tether, 0); place(a.tag, ORCH, 0); return; }
    const [name, targets, t0, t1] = def;
    const u = range(p, t0, t1);
    const out = ease(range(u, 0, 0.18)); const back = ease(range(u, 0.88, 1));
    const ti = Math.min(targets.length - 1, Math.floor(range(u, 0.18, 0.88) * targets.length));
    const c = C[targets[ti]];
    const orbit = V(c.pos.x + Math.cos(t * 1.6 + i) * 1.4, c.top + 0.2 + Math.sin(t * 2.2 + i) * 0.2, c.pos.z + Math.sin(t * 1.6 + i) * 1.1);
    const pos = u <= 0 ? ORCH.clone() : back > 0 ? lerpV(orbit, ORCH, back) : lerpV(ORCH, orbit, out);
    a.s.visible = u > 0 && u < 1; a.s.position.copy(pos);
    a.s.scale.setScalar(0.65 + Math.sin(t * 8 + i) * 0.08);
    const arr = []; seg(arr, ORCH, pos); a.tether.geometry.setPositions(arr); a.tether.computeLineDistances(); reveal(a.tether, a.s.visible ? 1 : 0, MAT.tether);
    a.tag.textContent = name;
    place(a.tag, pos, a.s.visible ? Math.min(out, 1 - back) : 0, -170);
  });

  // Flujos simulados (calidad) y reales (producción)
  let used = 0;
  const run = (f, u, color, tagsOn) => {
    const pk = packets[used++]; if (!pk) return;
    pk.visible = u > 0 && u < 1; pk.material.color.set(color); pk.position.copy(at(f, u)).setY(0.3);
    for (let j = 1; j <= 2; j++) { const tr = packets[used++]; if (!tr) break; tr.visible = pk.visible && u - j * 0.012 > 0; tr.material.color.set(color); tr.position.copy(at(f, u - j * 0.012)).setY(0.3); tr.scale.setScalar(0.55 - j * 0.15); }
    if (tagsOn) { let best = null, bd = 1e9; const q = at(f, u); Object.values(C).forEach((c) => { const d = Math.hypot(c.pos.x - q.x, c.pos.z - q.z); if (d < bd) { bd = d; best = c; } }); if (pk.visible && best && bd < 1.6) hot.add(best.id); }
    if (tagsOn) f.labels.forEach(([u0, txt, id], j) => { const el = flowTags[j]; el.textContent = txt; place(el, V(C[id].pos.x, C[id].top + 0.6, C[id].pos.z), u > u0 && u < Math.min(0.99, u0 + 0.22) ? 1 : 0, -120); });
  };
  flowTags.forEach((el) => { el.style.opacity = 0; });
  const hot = new Set();
  if (s === 5) {
    if (p <= 0.45) run(FLOW_PROV, range(p, 0.05, 0.45), 0xffffff, true);
    if (p > 0.45) run(FLOW_PAY, range(p, 0.45, 0.8), 0x00cbae, true);
    if (p > 0.6) for (let j = 0; j < 2; j++) run(FLOW_PAY, ((t * 0.35 + j * 0.5) % 1), 0x00cbae, false);
  } else if (s === 7) {
    if (p <= 0.62) run(FLOW_PROV, range(p, 0.35, 0.62), 0xffffff, true);
    if (p > 0.62) run(FLOW_PAY, range(p, 0.62, 0.92), 0x2bd46a, true);
  }
  packets.slice(used).forEach((pk) => { pk.visible = false; });
  Object.values(C).forEach((c) => c.tag.classList.toggle('hot', hot.has(c.id)));
  reveal(nfc, s === 7 ? (p > 0.6 && p < 0.7 ? 1 : 0) : s === 1 ? range(p, 0.5, 0.65) : 0, MAT.build);

  // Checks por componente en calidad / producción
  checks.forEach(({ id, el }, i) => { const c = C[id]; const on = s === 5 ? range(p, 0.2 + i * 0.05, 0.25 + i * 0.05) : s === 6 ? 1 : 0; const fail = id === 'core' && s === 5 && p > 0.38 && p < 0.5; el.style.opacity = 0; c.tag.classList.toggle('fail', fail); c.tag.classList.toggle('ok', !fail && on > 0); });
  failTag.style.opacity = 0;
  place(liveTag, V(-1.4, 4.2, 3.4), s === 7 ? ease(range(p, 0.9, 1)) : 0, -50);

  bloom.strength = (aspect < 1 ? 0.28 : 0.45) + (s >= 7 ? 0.2 : 0);
}

/* ---------- Bucle ---------- */
let t = 0, last = 0, lastVersion = -1;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
  const running = S.running && !S.reduceMotion;
  if (!running && !needsRender && S.version === lastVersion) return;
  if (running) t += dt;
  camDt = dt;
  update(t);
  composer.render();
  needsRender = false; lastVersion = S.version;
  host.classList.add('has-3d');
}
requestAnimationFrame(frame);
