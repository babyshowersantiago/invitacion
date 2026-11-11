(() => {
  const M = window.MANIFEST, C = window.CONFIG;
  const $ = s => document.querySelector(s);
  const px = v => v + 'px';
  const ORDEN = [1, 2, 3, 4, 5]; // páginas de la invitación (la 0 es el sobre)
  const raiz = document.documentElement.style;
  let abierto = false, carta;

  // ---------- Tamaños: páginas a lo ancho (desplazamiento normal) y sobre centrado ----------
  function medir() {
    const W = document.documentElement.clientWidth, H = window.innerHeight;
    const pw = Math.min(W, 520);                 // ancho de cada página
    const iw = Math.min(W, H * 9 / 16);          // el sobre se ve completo en la pantalla
    raiz.setProperty('--pw', px(pw)); raiz.setProperty('--k', pw / 1080);
    raiz.setProperty('--iw', px(iw)); raiz.setProperty('--ik', iw / 1080);
  }
  window.addEventListener('resize', medir); medir();

  // ---------- Construir páginas ----------
  const acciones = {
    mapa: () => window.open(C.MAPA_URL, '_blank', 'noopener'),
    confirmar: abrirModal,
    regalos: () => window.open(C.REGALOS_URL, '_blank', 'noopener'),
  };
  const etiquetas = { mapa: 'Ver ubicación', confirmar: 'Confirmar asistencia', regalos: 'Ver lista de deseos' };
  const imgs = [];
  const enAccion = (el, fn, etiqueta) => {
    el.classList.add('accion'); el.setAttribute('role', 'button'); el.tabIndex = 0; if (etiqueta) el.setAttribute('aria-label', etiqueta);
    el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  };
  const capaImg = L => {
    const im = new Image(); im.src = L.src; im.alt = ''; im.decoding = 'async'; imgs.push(im);
    Object.assign(im.style, { left: px(L.x), top: px(L.y), width: px(L.w), height: px(L.h) });
    im.className = L.kind ? 'k-' + L.kind : 'k-' + L.type;
    if (L.id) im.dataset.id = L.id;
    if (L.action && acciones[L.action]) enAccion(im, acciones[L.action], etiquetas[L.action]);
    return im;
  };

  function pagina(n) {
    const pg = document.createElement('div'); pg.className = 'pagina'; pg.dataset.p = n;
    const es = document.createElement('div'); es.className = 'escena'; pg.appendChild(es);
    for (const L of M.pages[n].layers) {
      if (L.action === 'abrir') continue; // sin botón "Abrir invitación": se abre tocando el sello
      es.appendChild(capaImg(L));
    }
    if (n === 3) { cuentaRegresiva(es); botonCalendario(es); }
    return pg;
  }

  const intro = $('#intro'), inv = $('#inv');
  const pIntro = pagina(0); pIntro.classList.add('visible'); intro.appendChild(pIntro);
  armarSobre(pIntro.querySelector('.escena'));
  ORDEN.forEach(n => inv.appendChild(pagina(n)));

  // pantalla de carga hasta que esté el sobre
  const primeras = imgs.slice(0, M.pages[0].layers.length - 1);
  Promise.race([Promise.all(primeras.map(i => i.decode ? i.decode().catch(() => { }) : null)), new Promise(r => setTimeout(r, 5000))])
    .then(() => $('#cargando').classList.add('fuera'));

  // ---------- Sobre: solapa, carta que asoma y sello ----------
  function armarSobre(es) {
    const L = M.pages[0].layers.find(l => l.id === 'sobre'), S = M.pages[0].layers.find(l => l.id === 'sello');
    const imSobre = es.querySelector('[data-id="sobre"]'), imSello = es.querySelector('[data-id="sello"]');
    // geometría del sobre en Canva (elemento 3); la punta de la solapa está en el centro del sello
    const x0 = 207 - L.x, y0 = 703.5 - L.y, x1 = 873 - L.x, y1 = 1216.5 - L.y, ax = 540 - L.x, ay = 1042 - L.y; // punta de la solapa (según el recorte de la solapa enviado)
    const pc = (x, y) => (x / L.w * 100).toFixed(2) + '% ' + (y / L.h * 100).toFixed(2) + '%';
    const yTop = (y0 / L.h * 100).toFixed(2) + '%';
    const sobre = document.createElement('div'); sobre.className = 'sobre3d';
    Object.assign(sobre.style, { left: px(L.x), top: px(L.y), width: px(L.w), height: px(L.h) });
    sobre.style.setProperty('--tly', px(y0));
    const interior = document.createElement('div'); interior.className = 's-interior';
    interior.style.clipPath = 'polygon(' + [pc(x0, y0), pc(x1, y0), pc(ax, ay)].join(',') + ')';
    // carril: la carta solo se ve por encima del bolsillo del sobre
    const carril = document.createElement('div'); carril.className = 's-carril';
    Object.assign(carril.style, { top: px(-1600), height: px(1600 + y1 - 26) });
    const cw = 0.78 * (x1 - x0), ch = cw * 16 / 9;
    carta = document.createElement('div'); carta.className = 's-carta';
    Object.assign(carta.style, { left: px((x0 + x1) / 2 - cw / 2), top: px(1600 + y0 + 22), width: px(cw), height: px(ch), backgroundImage: 'url(assets/gen/carta.webp)' });
    carta.dataset.sube = Math.round(ch * 0.62);
    carril.appendChild(carta);
    const mk = (cls, clip) => { const d = document.createElement('div'); d.className = cls; const im = new Image(); im.src = L.src; im.alt = ''; d.appendChild(im); d.style.clipPath = clip; return d; };
    const frente = mk('s-frente', 'polygon(' + ['0% ' + yTop, pc(ax, ay), '100% ' + yTop, '100% 100%', '0% 100%'].join(',') + ')');
    const solapa = mk('s-solapa', 'polygon(' + ['0% 0%', '100% 0%', '100% ' + yTop, pc(ax, ay), '0% ' + yTop].join(',') + ')');
    sobre.append(interior, carril, frente, solapa);
    if (imSello) { // el sello va dentro del sobre para moverse con él
      imSello.className = 's-sello'; Object.assign(imSello.style, { left: px(S.x - L.x), top: px(S.y - L.y), width: px(S.w), height: px(S.h), position: 'absolute' });
      sobre.appendChild(imSello);
      const anillo = document.createElement('span'); anillo.className = 's-anillo';
      Object.assign(anillo.style, { left: px(S.x - L.x), top: px(S.y - L.y), width: px(S.w), height: px(S.h) });
      sobre.appendChild(anillo);
    }
    imSobre.replaceWith(sobre);
    enAccion(sobre, abrirSobre, 'Abrir invitación');
  }

  // ---------- Abrir el sobre (mismo efecto del zip) ----------
  function abrirSobre() {
    if (abierto) return; abierto = true;
    intro.classList.add('presionado');                                  // el sello salta con un anillo dorado
    setTimeout(() => intro.classList.add('solapa'), 350);               // se abre la solapa
    setTimeout(() => intro.classList.add('detras'), 1200);
    setTimeout(() => { carta.style.transform = 'translateY(' + px(-carta.dataset.sube) + ')'; }, 1300); // asoma la invitación
    setTimeout(agrandarCarta, 2500);                                    // la invitación sale completa y llena la pantalla
    setTimeout(entrar, 3600);
  }
  function agrandarCarta() {
    const es = pIntro.querySelector('.escena'), r = carta.getBoundingClientRect(), e = es.getBoundingClientRect(), k = e.width / 1080;
    const z = document.createElement('div'); z.className = 'carta-zoom'; z.style.backgroundImage = carta.style.backgroundImage;
    Object.assign(z.style, { left: px((r.left - e.left) / k), top: px((r.top - e.top) / k), width: px(r.width / k), height: px(r.height / k) });
    // termina exactamente donde aparecerá la página 1 (arriba de la pantalla)
    const p1 = inv.querySelector('.pagina').getBoundingClientRect(), pw = p1.width || Math.min(document.documentElement.clientWidth, 520);
    const izq = (document.documentElement.clientWidth - pw) / 2;
    const destino = { left: px((izq - e.left) / k), top: px(-e.top / k), width: px(pw / k), height: px(pw * 16 / 9 / k), borderRadius: '0px' };
    es.appendChild(z); carta.style.visibility = 'hidden'; intro.classList.add('agrandando');
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(z.style, destino)));
  }
  function entrar() {
    document.body.classList.remove('cerrado'); document.body.classList.add('abierto'); window.scrollTo(0, 0);
    setTimeout(() => { intro.hidden = true; }, 700);
  }
  if (location.hash === '#abierta') { abierto = true; entrar(); }

  // ---------- Animar solo lo que se ve ----------
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)), { threshold: 0.05 });
  inv.querySelectorAll('.pagina').forEach(p => io.observe(p));

  // ---------- Cuenta regresiva en tarjetas ----------
  function cuentaRegresiva(es) {
    const caja = document.createElement('div'); caja.className = 'capa cuenta'; caja.setAttribute('aria-live', 'off');
    const partes = ['Días', 'Horas', 'Minutos', 'Segundos'].map(t => { const d = document.createElement('div'); d.innerHTML = '<b>00</b><span>' + t + '</span>'; caja.appendChild(d); return d.querySelector('b'); });
    es.appendChild(caja);
    const meta = new Date(C.EVENTO).getTime(), z = n => String(n).padStart(2, '0');
    const tic = () => {
      const ms = meta - Date.now();
      if (ms <= 0) { caja.className = 'capa cuenta fin'; caja.textContent = '¡Hoy es el gran día!'; return clearInterval(t); }
      const s = Math.floor(ms / 1000);
      const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
      v.forEach((n, i) => { const t = i === 0 ? String(n) : z(n); if (partes[i].textContent !== t) partes[i].textContent = t; });
    };
    const t = setInterval(tic, 1000); tic();
  }

  // ---------- Guardar en calendario ----------
  function botonCalendario(es) {
    const b = document.createElement('div'); b.className = 'capa btn-cal'; b.textContent = 'Guardar en calendario';
    enAccion(b, guardarCalendario, 'Guardar en calendario');
    es.appendChild(b);
  }
  function guardarCalendario() {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if (/Android/i.test(ua)) {
      const f = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const u = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
        + '&text=' + encodeURIComponent(C.TITULO)
        + '&dates=' + f(C.EVENTO) + '/' + f(C.EVENTO_FIN)
        + '&location=' + encodeURIComponent(C.LUGAR)
        + '&details=' + encodeURIComponent('Marcia y Ángel te esperan para celebrar la dulce espera de Santiago 🍯');
      window.open(u, '_blank', 'noopener');
      aviso('Al guardarlo, agrega una notificación 1 hora antes 🐝');
    } else {
      window.location.href = C.ICS; // iPhone y computador: archivo con alertas (9:00 del día y 1 hora antes)
      if (ios) aviso('Toca «Agregar» para guardarlo en tu calendario 🐝');
    }
  }

  // ---------- Hojitas cayendo ----------
  (function hojas() {
    const cont = $('#hojas'), colores = ['#9db59a', '#7e9c7b', '#b5c9a8', '#8faa8a'];
    for (let i = 0; i < 9; i++) {
      const d = document.createElement('div'); d.className = 'hoja-cae';
      const tam = 16 + Math.random() * 12, dur = 11 + Math.random() * 9, c = colores[i % colores.length];
      Object.assign(d.style, { left: (4 + Math.random() * 90) + '%', animationDuration: dur + 's', animationDelay: (-Math.random() * dur) + 's', opacity: 0.75 + Math.random() * 0.2 });
      d.innerHTML = '<svg width="' + tam + '" height="' + (tam * 0.62) + '" viewBox="0 0 40 25" style="animation-duration:' + (2.4 + Math.random() * 2) + 's">'
        + '<path d="M2 12.5C9 2 27 0 38 12.5 27 25 9 23 2 12.5Z" fill="' + c + '"/><path d="M3 12.5Q20 11 37 12.5" stroke="#ffffff" stroke-opacity=".45" stroke-width="1.2" fill="none"/></svg>';
      cont.appendChild(d);
    }
  })();

  // ---------- Aviso breve ----------
  let tAviso;
  function aviso(t) { const a = $('#aviso'); a.textContent = t; a.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(() => a.hidden = true, 4000); }

  // ---------- Confirmar asistencia por WhatsApp ----------
  const modal = $('#modal'), form = $('#f-confirmar'), error = form.querySelector('.m-error');
  const ICONO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8z"/><path fill="currentColor" d="M8.6 7.2c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.3-.1.6.5.9 1.2 1.6 2.1 2.2.3.2.5.1.6 0l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .5-.1 1.1-.6 1.5-.5.5-1.3.8-2 .7-1.1-.1-2.6-.7-4-2-1.5-1.4-2.2-2.9-2.4-3.9-.1-.8.2-1.5.7-2.2z"/></svg>';
  for (const [quien, numero] of Object.entries(C.WHATSAPP)) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'm-wsp';
    b.innerHTML = ICONO + '<span>Enviar confirmación a ' + quien + '</span>';
    b.addEventListener('click', () => enviar(quien, numero));
    form.querySelector('.m-botones').appendChild(b);
  }
  function enviar(quien, numero) {
    const nombre = form.nombre.value.trim(), op = form.asiste.value;
    if (nombre.length < 2) { error.textContent = 'Escribe tu nombre, por favor.'; form.nombre.focus(); return; }
    if (!op) { error.textContent = 'Cuéntanos si podrás acompañarnos.'; return; }
    error.textContent = '';
    const txt = op === 'si'
      ? '¡Hola ' + quien + '! 🐝 Soy *' + nombre + '* y confirmo que *sí asistiré* al Baby Shower de Santiago 🍯\n📅 Sábado 12 de diciembre, 17:00 hrs.\n📍 El Roble #2171, Concepción.'
      : '¡Hola ' + quien + '! Soy *' + nombre + '*. Lamentablemente *no podré asistir* al Baby Shower de Santiago, pero les envío mucho cariño en esta dulce espera 💛';
    const url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(txt);
    const w = window.open(url, '_blank', 'noopener'); if (!w) window.location.href = url;
  }
  function abrirModal() { modal.hidden = false; error.textContent = ''; }
  function cerrarModal() { modal.hidden = true; }
  modal.querySelector('.m-cerrar').addEventListener('click', cerrarModal);
  modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) cerrarModal(); });
})();
