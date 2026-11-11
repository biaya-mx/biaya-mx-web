(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));

  /* ---------- Vista local: al abrir el archivo directo (file://), "carpeta/" no carga su index.html ---------- */
  if (location.protocol === 'file:') {
    $$('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (/^[a-z][a-z0-9+.-]*:|^\/\/|^#/i.test(href)) return;
      const m = href.match(/^([^#?]*\/)([?#].*)?$/);
      if (m) a.setAttribute('href', `${m[1]}index.html${m[2] || ''}`);
    });
  }

  /* ---------- Tema claro / oscuro (se recuerda en este navegador) ---------- */
  const themeBtn = $('#theme-toggle');
  const metaTheme = $('meta[name="theme-color"]');
  const paintThemeBtn = () => {
    const light = document.documentElement.dataset.theme === 'light';
    $('.ms', themeBtn).textContent = light ? 'dark_mode' : 'light_mode';
    themeBtn.lastElementChild.textContent = light ? 'Oscuro' : 'Claro';
    themeBtn.setAttribute('aria-label', light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    metaTheme.setAttribute('content', light ? '#f6f7f9' : '#07090c');
  };
  themeBtn.addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    if (!reduceMotion) { root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 400); }
    if (next === 'light') root.dataset.theme = 'light'; else delete root.dataset.theme;
    try { localStorage.setItem('biaya-theme', next); } catch (e) { /* sin almacenamiento: solo esta visita */ }
    paintThemeBtn();
  });
  paintThemeBtn();

  /* ---------- Menú móvil ---------- */
  const toggle = $('.nav-toggle');
  const links = $('#nav-links');
  const setMenu = (open) => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    $('.ms', toggle).textContent = open ? 'close' : 'menu';
  };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('a', links).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Nav: fondo al hacer scroll ---------- */
  const nav = $('.nav');
  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- Títulos palabra por palabra ---------- */
  $$('.split').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--i', i++);
            w.textContent = part;
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // Los degradados se animan como bloque para no romper el recorte del texto
          if (child.classList.contains('grad-text')) { child.classList.add('w'); child.style.setProperty('--i', i++); }
          else walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- Entrada al hacer scroll ---------- */
  const revealTargets = $$('.reveal, .split, .studio, .timeline');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach((el) => io.observe(el));
  }
  window.biayaReady = true;

  /* ---------- Luz que sigue al cursor en tarjetas ---------- */
  $$('.spot').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Capacidades: flujo de punta a punta ---------- */
  const flow = $('.flow');
  if (flow) {
    const steps = $$('li', flow);
    const fill = $('.flow-track i', flow);
    let n = -1;
    const paint = () => {
      steps.forEach((li, i) => li.classList.toggle('on', i <= n));
      fill.style.width = `${(Math.max(0, Math.min(n, steps.length - 1)) / (steps.length - 1)) * 100}%`;
    };
    if (reduceMotion) { n = steps.length - 1; paint(); }
    else setInterval(() => { n = n >= steps.length + 2 ? -1 : n + 1; paint(); }, 650);
  }

  /* ---------- Capacidades: el mismo SDK en varios lenguajes ---------- */
  const sdkCode = $('#sdk-code');
  if (sdkCode) {
    const sdkTabs = $$('.sdk-tabs span');
    const SDK = [
      'const biaya = new Cliente({ token });\n\nawait biaya.operaciones.crear({\n  monto: 1500,\n  destino: "cuenta-123",\n});',
      'Cliente biaya = new Cliente(token);\n\nbiaya.operaciones().crear(\n  new Operacion(1500, "cuenta-123")\n);',
      'biaya = Cliente(token=token)\n\nbiaya.operaciones.crear(\n    monto=1500,\n    destino="cuenta-123",\n)',
    ];
    const hl = (code) => code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/("[^"]*")/g, '<span class="s">$1</span>')
      .replace(/\b(const|await|new)\b/g, '<span class="k">$1</span>');
    let lang = 0;
    const show = () => {
      sdkTabs.forEach((tab, i) => tab.classList.toggle('on', i === lang));
      sdkCode.innerHTML = hl(SDK[lang]);
    };
    show();
    if (!reduceMotion) {
      setInterval(() => {
        sdkCode.classList.add('fade');
        setTimeout(() => { lang = (lang + 1) % SDK.length; show(); sdkCode.classList.remove('fade'); }, 250);
      }, 3200);
    }
  }

  /* ---------- Caja de prompt del hero (solo en el inicio) ---------- */
  if ($('#hero-prompt')) {
  /* ---------- Caja de prompt del hero ---------- */
    const promptForm = $('#hero-prompt');
    const textarea = $('#prompt-text');
    const inputWrap = $('#prompt-input');
    const ghost = $('#prompt-ghost');
    const ghostExamples = {
      'Nuevo producto': ['Queremos lanzar una tarjeta de crédito garantizada…', 'Queremos lanzar una cuenta digital para jóvenes…', 'Queremos vender seguros desde nuestra app…'],
      'Automatizar un proceso': ['Conciliamos pagos a mano y nos toma horas cada día…', 'Aprobar un crédito nos toma semanas…'],
      'Conectar sistemas': ['Nuestro inventario en línea no cuadra con el de tienda…', 'Los datos del cliente viven en tres sistemas distintos…'],
      'Atención con IA': ['Nuestro call center no da abasto con preguntas repetidas…', 'Queremos atender clientes 24/7 por WhatsApp…'],
      'Modernizar': ['Nuestros sistemas legados frenan cada lanzamiento…', 'Nadie entiende ya cómo funcionan nuestras APIs…'],
    };
    let kind = 'Nuevo producto';
    let ghostToken = 0;

    const syncHasText = () => inputWrap.classList.toggle('has-text', textarea.value.trim() !== '');
    textarea.addEventListener('input', syncHasText);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); promptForm.requestSubmit(); }
    });

    async function typeGhost() {
      const token = ++ghostToken;
      if (reduceMotion) { ghost.textContent = ghostExamples[kind][0]; return; }
      let n = 0;
      while (token === ghostToken) {
        const text = ghostExamples[kind][n++ % ghostExamples[kind].length];
        for (let i = 1; i <= text.length && token === ghostToken; i++) { ghost.textContent = text.slice(0, i); await sleep(32); }
        await sleep(1800);
        for (let i = text.length; i >= 0 && token === ghostToken; i--) { ghost.textContent = text.slice(0, i); await sleep(14); }
        await sleep(300);
      }
    }
    typeGhost();

    $$('.prompt-tab').forEach((tab) => tab.addEventListener('click', () => {
      $$('.prompt-tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      kind = tab.dataset.kind;
      typeGhost();
      textarea.focus();
    }));

    // Los ejemplos llenan la caja; al enviar, la necesidad viaja al formulario de contacto
    $$('.chip').forEach((chip) => chip.addEventListener('click', () => {
      textarea.value = chip.dataset.prompt;
      syncHasText();
      textarea.focus();
    }));

    promptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = textarea.value.trim() || ghostExamples[kind][0].replace('…', '.');
      const page = location.protocol === 'file:' ? 'contacto/index.html' : 'contacto/';
      location.href = `${page}?necesidad=${encodeURIComponent(text.slice(0, 280))}`;
    });


  
  }

  if ($('#how-steps')) {
  /* ---------- Cómo trabajamos: escena fija sincronizada con el scroll ---------- */
    const steps = $$('.how-step');
    const scenes = $$('.scene');
    const rail = $('#how-rail');
    const stepsBox = $('#how-steps');
    let ticking = false;
    const updateHow = () => {
      ticking = false;
      const mid = window.innerHeight / 2;
      let active = 0;
      let best = Infinity;
      steps.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < best) { best = d; active = i; }
      });
      steps.forEach((s, i) => s.classList.toggle('on', i === active));
      scenes.forEach((s, i) => s.classList.toggle('on', i === active));
      const box = stepsBox.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (mid - box.top) / box.height));
      rail.style.setProperty('--p', p.toFixed(3));
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateHow); } }, { passive: true });
    window.addEventListener('resize', updateHow);
    updateHow();

  
  }

  /* ---------- Carrusel infinito: duplica el contenido para el bucle ---------- */
  const track = $('.marquee-track');
  if (track) [...track.children].forEach((n) => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });

  /* ---------- AI Factory: una ventana por fase, con subagentes especializados ----------
     Los datos salen de las tarjetas .phase-card de la página (una sola fuente de verdad):
     nombre, ícono, entregable, quién aprueba (data-gate) y la bitácora de cada subagente (data-log). */
  const factory = $('#factory');
  if (factory) {
    const stage = $('#fx-stage');
    const phasesEl = $('#fx-phases');
    const dock = $('#fx-dock');
    const fxState = $('#fx-state');
    const fxToggle = $('#fx-toggle');
    const mk = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };

    const fxData = $('#fx-data');
    const PHASES = $$('.phase-card', fxData ? fxData.content : document).map((card) => ({
      num: $('.num', card).textContent.trim(),
      name: $('h3', card).textContent.trim(),
      icon: $('.phase-ic .ms', card).textContent.trim(),
      out: $('.phase-foot b', card).textContent.trim(),
      gate: card.dataset.gate,
      gateAv: card.dataset.gateAv,
      agents: $$('.agents-list li', card).map((li) => ({
        name: li.lastChild.textContent.trim(),
        icon: $('.ms', li).textContent.trim(),
        logs: (li.dataset.log || '').split('|').filter(Boolean),
      })),
    }));

    const phaseItems = PHASES.map((p) => {
      const li = mk('li', '', `<span class="ms" aria-hidden="true">radio_button_unchecked</span><span>${p.name}</span><small>${p.agents.length} subagentes</small>`);
      phasesEl.appendChild(li);
      return li;
    });
    const dockItems = PHASES.map((p) => {
      const d = mk('span', '', `<span class="ms" aria-hidden="true">${p.icon}</span>`);
      d.title = p.name;
      dock.appendChild(d);
      return d;
    });
    const setPhase = (i, state, note) => {
      const li = phaseItems[i];
      li.className = state;
      $('.ms', li).textContent = { doing: 'progress_activity', gate: 'person_check', done: 'check_circle' }[state] || 'radio_button_unchecked';
      if (note) $('small', li).textContent = note;
      dockItems[i].className = state === 'gate' ? 'doing' : state;
    };

    const buildWindow = (p) => {
      const w = mk('div', 'fx-win');
      w.innerHTML =
        `<div class="fx-win-bar"><span class="win-dots" aria-hidden="true"><i></i><i></i><i></i></span>` +
        `<span class="ms" aria-hidden="true">${p.icon}</span><span class="fx-win-t">${p.num} · <b>${p.name}</b></span>` +
        `<span class="cnt">${p.agents.length} subagentes</span></div>` +
        `<div class="fx-agents">${p.agents.map((a) =>
          `<div class="fx-agent"><div class="fx-agent-head"><span class="fx-agent-ic"><span class="ms" aria-hidden="true">${a.icon}</span></span>` +
          `<span class="fx-agent-name">${a.name}<small>subagente</small></span><span class="fx-st">En cola</span></div>` +
          `<ul class="fx-log"></ul><span class="bar"><i></i></span></div>`).join('')}</div>` +
        `<div class="fx-win-foot"><span>Entregable: <b>${p.out}</b></span>` +
        `<span class="fx-gate"><span class="who${p.gateAv === 'TU' ? ' tu' : ''}">${p.gateAv}</span><span class="fx-gate-t">Human in the loop</span></span></div>`;
      return w;
    };

    let fxRun = 0;
    let fxVisible = false;
    let fxStarted = false;
    let paused = false;
    const FX_CANCEL = Symbol('cancel');
    const fxWait = async (ms, id) => {
      await sleep(ms);
      // Se detiene si el usuario pausa o si la demo sale de la pantalla
      while ((paused || (!fxVisible && !reduceMotion)) && id === fxRun) await new Promise((r) => setTimeout(r, 250));
      if (id !== fxRun) throw FX_CANCEL;
    };

    const runAgent = async (card, a, j, wait) => {
      const st = $('.fx-st', card);
      const log = $('.fx-log', card);
      const bar = $('.bar i', card);
      await wait(j * 260);
      card.classList.add('run');
      st.textContent = 'Trabajando';
      for (let k = 0; k < a.logs.length; k++) {
        await wait(520 + ((j + k) % 3) * 140);
        const item = mk('li', k === a.logs.length - 1 ? 'ok' : '');
        item.textContent = a.logs[k];
        log.appendChild(item);
        bar.style.width = `${((k + 1) / a.logs.length) * 100}%`;
      }
      card.classList.replace('run', 'done');
      st.textContent = 'Listo';
    };

    async function runFactory() {
      const id = ++fxRun;
      const wait = (ms) => fxWait(ms, id);
      fxStarted = true;
      try {
        stage.innerHTML = '';
        PHASES.forEach((p, i) => setPhase(i, '', `${p.agents.length} subagentes`));
        fxState.textContent = 'Orquestando';
        await wait(500);
        const wins = [];
        for (let i = 0; i < PHASES.length; i++) {
          const p = PHASES[i];
          setPhase(i, 'doing', 'Subagentes trabajando');
          fxState.textContent = p.name;
          // Las ventanas anteriores se apilan detrás, como en un escritorio
          wins.forEach((w) => {
            const depth = Number(w.dataset.depth) + 1;
            w.dataset.depth = String(depth);
            if (depth > 2) setTimeout(() => w.remove(), 700);
          });
          const win = buildWindow(p);
          win.dataset.depth = '0';
          win.style.zIndex = String(i + 1);
          stage.appendChild(win);
          wins.push(win);
          await wait(450);

          const cards = $$('.fx-agent', win);
          await Promise.all(p.agents.map((a, j) => runAgent(cards[j], a, j, wait)));

          // Human in the loop: nadie avanza de fase sin aprobación
          const gate = $('.fx-gate', win);
          gate.classList.add('wait');
          $('.fx-gate-t', gate).textContent = 'Esperando aprobación';
          setPhase(i, 'gate', 'Human in the loop');
          fxState.textContent = 'En revisión';
          await wait(1000);
          gate.classList.replace('wait', 'ok');
          $('.fx-gate-t', gate).textContent = `Aprobado · ${p.gate}`;
          setPhase(i, 'done', `Aprobado · ${p.gate}`);
          await wait(650);
        }
        const done = mk('div', 'fx-done', '<span class="dot" aria-hidden="true"></span><span>api.tu-empresa.mx/v1/tarjetas<small>En tu ambiente de pruebas · código en tu repositorio</small></span>');
        stage.appendChild(done);
        await wait(60);
        done.classList.add('on');
        fxState.textContent = 'Desplegado';

        if (reduceMotion) return;
        await wait(6000);
        runFactory();
      } catch (err) {
        if (err !== FX_CANCEL) throw err;
      }
    }

    fxToggle.addEventListener('click', () => {
      paused = !paused;
      factory.classList.toggle('paused', paused);
      $('.ms', fxToggle).textContent = paused ? 'play_arrow' : 'pause';
      fxToggle.setAttribute('aria-label', paused ? 'Reanudar la demostración' : 'Pausar la demostración');
    });

    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          fxVisible = en.isIntersecting;
          if (fxVisible && !fxStarted) runFactory();
        });
      }, { threshold: 0.25 }).observe(factory);
    } else {
      fxVisible = true;
      runFactory();
    }
  }

  /* ---------- Año ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Formulario: abre el correo con los datos (sin backend todavía) ---------- */
  if ($('#contact-form')) {
  const form = $('#contact-form');
    const note = $('#form-note');
    const showNote = (type, icon, text) => {
      note.className = 'form-note ' + type;
      note.innerHTML = `<span class="ms" aria-hidden="true">${icon}</span><span></span>`;
      note.lastChild.textContent = text;
    };
    const necesidad = new URLSearchParams(location.search).get('necesidad');
    if (necesidad) form.elements.mensaje.value = necesidad.slice(0, 280);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstInvalid = null;
      ['nombre', 'correo', 'empresa'].forEach((name) => {
        const input = form.elements[name];
        const ok = input.value.trim() !== '' && input.checkValidity();
        input.closest('.field').classList.toggle('invalid', !ok);
        input.setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        showNote('err', 'error', 'Revisa tu nombre, un correo válido y el nombre de tu organización.');
        firstInvalid.focus();
        return;
      }
      const f = form.elements;
      const body = [
        `Nombre: ${f.nombre.value.trim()}`,
        `Correo: ${f.correo.value.trim()}`,
        `Organización: ${f.empresa.value.trim()}`,
        `Me interesa: ${f.tipo.value}`,
        '',
        f.mensaje.value.trim(),
      ].join('\n');
      window.location.href = `mailto:contacto@biaya.mx?subject=${encodeURIComponent('Sesión con Biaya – ' + f.empresa.value.trim())}&body=${encodeURIComponent(body)}`;
      showNote('ok', 'task_alt', 'Abrimos tu correo con la solicitud lista. Solo falta enviarla.');
    });
    form.addEventListener('input', (e) => {
      const field = e.target.closest('.field');
      if (field && field.classList.contains('invalid') && e.target.value.trim() && e.target.checkValidity()) {
        field.classList.remove('invalid');
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  }

  
})();
