const DATA = {
  v_reel: 1.2,
  dt: 0.4,
  m_per_cm: 0.5,
  v_per_cm: 0.5,
  n: 6,
  pos_m: [0, 0.48, 0.96, 1.44, 1.92, 2.4],
  pos_cm: [0, 0.96, 1.92, 2.88, 3.84, 4.8],
  target: 2,
  dist_m: 0.48,
  dist_cm: 0.96,
  v_norme: 1.2,
  fleche_cm: 2.4
};

const PX = 38;
const ML = 55;
const Y_TRK = 110;
const Y_RUL = 165;

function ptX(i) {
  return ML + DATA.pos_cm[i] * PX;
}

const TOTAL_SLIDES = 9;
let current = 0;

const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const progressF = document.getElementById('progressFill');
const navDots = document.getElementById('navDots');
const stepBadge = document.getElementById('stepBadge');
const slides = [...document.querySelectorAll('.slide')];

for (let i = 0; i < TOTAL_SLIDES; i++) {
  const d = document.createElement('div');
  d.className = 'nav-dot' + (i === 0 ? ' active' : '');
  d.addEventListener('click', (e) => {
    e.stopPropagation();
    goTo(i);
  });
  navDots.appendChild(d);
}

function updateUI() {
  if (current === 0) {
    stepBadge.textContent = 'Introduction';
  } else if (current === TOTAL_SLIDES - 1) {
    stepBadge.textContent = 'Récapitulatif';
  } else {
    stepBadge.textContent = `Étape ${current} / 7`;
  }

  progressF.style.width = ((current / (TOTAL_SLIDES - 1)) * 100) + '%';

  btnPrev.disabled = current === 0;
  btnNext.textContent = current === TOTAL_SLIDES - 1 ? 'Recommencer ↺' : 'Suivant →';

  document.querySelectorAll('.nav-dot').forEach((d, i) => {
    d.classList.toggle('active', i === current);
    d.classList.toggle('done', i < current);
  });
}

function revealWithDelay(selector, className = 'revealed') {
  document.querySelectorAll(selector).forEach(el => {
    const delay = parseInt(el.dataset.delay || '0', 10);
    el.classList.remove(className);
    setTimeout(() => el.classList.add(className), delay);
  });
}

function goTo(idx) {
  if (idx < 0) idx = 0;
  if (idx > TOTAL_SLIDES - 1) idx = 0;
  if (idx === current) return;

  const oldSlide = document.getElementById('slide' + current);
  const newSlide = document.getElementById('slide' + idx);

  oldSlide.classList.remove('active');
  oldSlide.classList.add('exit-left');

  setTimeout(() => {
    oldSlide.classList.remove('exit-left');
  }, 400);

  current = idx;
  newSlide.classList.add('active');

  updateUI();
  onSlideEnter(current);
}

btnNext.addEventListener('click', (e) => {
  e.stopPropagation();
  if (current === TOTAL_SLIDES - 1) {
    goTo(0);
  } else {
    goTo(current + 1);
  }
});

btnPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  goTo(current - 1);
});

slides.forEach((slide, index) => {
  slide.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    if (e.target.closest('.nav-dot')) return;
    if (index !== current) return;

    if (current === TOTAL_SLIDES - 1) {
      goTo(0);
    } else {
      goTo(current + 1);
    }
  });
});

function ns(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function buildGrid(parentId, W, H, yTrack, yRul) {
  const g = document.getElementById(parentId);
  if (!g) return;
  g.innerHTML = '';

  const cmTotal = (W - ML - 15) / PX;
  const sub = 0.2;

  for (let x = 0; x <= cmTotal + 0.01; x += sub) {
    const px = ML + x * PX;
    if (px > W - 15) break;
    const isCm = Math.abs(x - Math.round(x)) < 0.01;
    const isHalf = !isCm && Math.abs(x * 2 - Math.round(x * 2)) < 0.01;

    const line = ns('line');
    line.setAttribute('x1', px);
    line.setAttribute('x2', px);
    line.setAttribute('y1', 5);
    line.setAttribute('y2', yRul - 5);
    line.setAttribute('class', isCm ? 'grid-cm' : isHalf ? 'grid-half' : 'grid-sub');
    g.appendChild(line);
  }

  const h1 = ns('line');
  h1.setAttribute('x1', ML);
  h1.setAttribute('x2', W - 15);
  h1.setAttribute('y1', yTrack);
  h1.setAttribute('y2', yTrack);
  h1.setAttribute('class', 'grid-half');
  g.appendChild(h1);

  const h2 = ns('line');
  h2.setAttribute('x1', ML);
  h2.setAttribute('x2', W - 15);
  h2.setAttribute('y1', yRul);
  h2.setAttribute('y2', yRul);
  h2.setAttribute('class', 'grid-half');
  g.appendChild(h2);
}

function buildRuler(parentId, W, yRul) {
  const g = document.getElementById(parentId);
  if (!g) return;
  g.innerHTML = '';

  const axis = ns('line');
  axis.setAttribute('x1', ML);
  axis.setAttribute('x2', W - 15);
  axis.setAttribute('y1', yRul);
  axis.setAttribute('y2', yRul);
  axis.setAttribute('class', 'ruler-line');
  g.appendChild(axis);

  for (let cm = 0; cm <= 6; cm++) {
    const x = ML + cm * PX;

    const tick = ns('line');
    tick.setAttribute('x1', x);
    tick.setAttribute('x2', x);
    tick.setAttribute('y1', yRul - 8);
    tick.setAttribute('y2', yRul + 8);
    tick.setAttribute('class', 'ruler-tick');
    g.appendChild(tick);

    const label = ns('text');
    label.setAttribute('x', x);
    label.setAttribute('y', yRul + 20);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'ruler-label');
    label.textContent = cm;
    g.appendChild(label);
  }
}

function buildPoints(parentId, highlight = []) {
  const g = document.getElementById(parentId);
  if (!g) return;
  g.innerHTML = '';

  for (let i = 0; i < DATA.n; i++) {
    const x = ptX(i);

    const c = ns('circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', Y_TRK);
    c.setAttribute('r', highlight.includes(i) ? 6 : 5);
    c.setAttribute('class', highlight.includes(i) ? 'track-point-hi' : 'track-point');
    g.appendChild(c);

    const t = ns('text');
    t.setAttribute('x', x);
    t.setAttribute('y', Y_TRK - 14);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', highlight.includes(i) ? 'point-label point-label-hi' : 'point-label');
    t.textContent = `M${i}`;
    g.appendChild(t);
  }
}

function drawStep2() {
  buildGrid('gridStep2', 700, 200, Y_TRK, Y_RUL);
  buildRuler('rulerStep2', 700, Y_RUL);
  buildPoints('pointsStep2');

  const dt = document.getElementById('dtLabels');
  if (!dt) return;
  dt.innerHTML = '';

  for (let i = 0; i < DATA.n - 1; i++) {
    const x1 = ptX(i);
    const x2 = ptX(i + 1);
    const txt = ns('text');
    txt.setAttribute('x', (x1 + x2) / 2);
    txt.setAttribute('y', 55);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('class', 'ruler-label');
    txt.textContent = 'Δt';
    dt.appendChild(txt);
  }
}

function drawStep3() {
  buildGrid('gridStep3', 700, 200, Y_TRK, Y_RUL);
  buildRuler('rulerStep3', 700, Y_RUL);
  buildPoints('pointsStep3', [2, 3]);

  const g = document.getElementById('highlightStep3');
  if (!g) return;
  g.innerHTML = '';

  [2, 3].forEach(i => {
    const ring = ns('circle');
    ring.setAttribute('cx', ptX(i));
    ring.setAttribute('cy', Y_TRK);
    ring.setAttribute('r', 12);
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', i === 2 ? '#6a3fa0' : '#b05800');
    ring.setAttribute('stroke-width', '2');
    g.appendChild(ring);
  });
}

function drawStep4() {
  buildGrid('gridStep4', 700, 200, Y_TRK, Y_RUL);
  buildRuler('rulerStep4', 700, Y_RUL);
  buildPoints('pointsStep4', [2, 3]);

  const g = document.getElementById('displArrow');
  if (!g) return;
  g.innerHTML = '';

  const line = ns('line');
  line.setAttribute('x1', ptX(2));
  line.setAttribute('y1', Y_TRK);
  line.setAttribute('x2', ptX(3));
  line.setAttribute('y2', Y_TRK);
  line.setAttribute('stroke', '#b04040');
  line.setAttribute('stroke-width', '3');
  line.setAttribute('marker-end', 'url(#arrowDispl)');
  g.appendChild(line);
}

function drawStep7() {
  buildGrid('gridStep7', 700, 220, Y_TRK, Y_RUL);
  buildRuler('rulerStep7', 700, Y_RUL);
  buildPoints('pointsStep7', [2, 3]);

  const g = document.getElementById('vitArrow7');
  if (!g) return;
  g.innerHTML = '';

  const displ = ns('line');
  displ.setAttribute('x1', ptX(2));
  displ.setAttribute('y1', Y_TRK + 16);
  displ.setAttribute('x2', ptX(3));
  displ.setAttribute('y2', Y_TRK + 16);
  displ.setAttribute('stroke', '#b04040');
  displ.setAttribute('stroke-width', '2');
  displ.setAttribute('marker-end', 'url(#arrowDispl7)');
  g.appendChild(displ);

  const vel = ns('line');
  vel.setAttribute('x1', ptX(2));
  vel.setAttribute('y1', Y_TRK - 18);
  vel.setAttribute('x2', ptX(2) + DATA.fleche_cm * PX);
  vel.setAttribute('y2', Y_TRK - 18);
  vel.setAttribute('stroke', '#6a3fa0');
  vel.setAttribute('stroke-width', '4');
  vel.setAttribute('marker-end', 'url(#arrowVit7)');
  g.appendChild(vel);
}

function onSlideEnter(i) {
  if (i === 1) revealWithDelay('#legendGrid1 .legend-item');
  if (i === 2) drawStep2();
  if (i === 3) drawStep3();
  if (i === 4) drawStep4();
  if (i === 5) revealWithDelay('#calcSteps .calc-line');
  if (i === 6) {
    document.querySelectorAll('#scaleVis [data-delay]').forEach(el => {
      const delay = parseInt(el.dataset.delay || '0', 10);
      el.classList.remove('revealed');
      setTimeout(() => el.classList.add('revealed'), delay);
    });
  }
  if (i === 7) drawStep7();
  if (i === 8) revealWithDelay('.recap-card');
}

updateUI();
onSlideEnter(0);
