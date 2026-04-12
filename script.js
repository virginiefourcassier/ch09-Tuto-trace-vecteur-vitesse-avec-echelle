/* ══════════════════════════════════════════════════════════════════
   Animation pédagogique — Vecteurs Vitesse
   8 étapes interactives (clic = étape suivante)
══════════════════════════════════════════════════════════════════ */

// ── Données de mouvement (MRU généré par Python) ─────────────────
const DATA = {
  v_reel:   1.2,       // m/s
  dt:       0.4,       // s
  m_per_cm: 0.5,       // m par cm sur graphe
  v_per_cm: 0.5,       // m/s par cm (échelle vecteurs)
  n:        6,
  // Positions réelles (m)
  pos_m: [0, 0.48, 0.96, 1.44, 1.92, 2.4],
  // Positions en cm sur graphe
  pos_cm: [0, 0.96, 1.92, 2.88, 3.84, 4.8],
  // Vecteur vitesse calculé en M2
  target: 2,           // indice i
  dist_m:  0.48,       // M2M3 en mètres
  dist_cm: 0.96,       // M2M3 en cm sur graphe
  v_norme: 1.2,        // m/s
  fleche_cm: 2.4,      // cm sur graphe
};

// ── Paramètres SVG ───────────────────────────────────────────────
const PX     = 38;          // px par cm
const ML     = 55;          // margin left
const Y_TRK  = 110;         // y de la trajectoire (svgStep2-7 h=200)
const Y_RUL  = 165;         // y règle
const Y_TRK_R = 70;         // y trajectoire (recap h=130)
const Y_RUL_R = 110;        // y règle (recap)

// Coordonnées SVG des points
function ptX(i) { return ML + DATA.pos_cm[i] * PX; }

// ── Navigation ────────────────────────────────────────────────────
const TOTAL_SLIDES = 9; // slides 0..8
let current = 0;

const btnPrev   = document.getElementById('btnPrev');
const btnNext   = document.getElementById('btnNext');
const stepNum   = document.getElementById('stepNum');
const progressF = document.getElementById('progressFill');
const navDots   = document.getElementById('navDots');

// Créer les dots
for (let i = 0; i < TOTAL_SLIDES; i++) {
  const d = document.createElement('div');
  d.className = 'nav-dot' + (i === 0 ? ' active' : '');
  d.addEventListener('click', () => goTo(i));
  navDots.appendChild(d);
}

function updateUI() {
  // Badge
  stepNum.textContent = current;
  document.getElementById('stepBadge').textContent =
    current === 0 ? 'Introduction'
    : current === 8 ? 'Récapitulatif'
    : `Étape ${current} / 7`;

  // Progress
  progressF.style.width = ((current / (TOTAL_SLIDES - 1)) * 100) + '%';

  // Boutons
  btnPrev.disabled = current === 0;
  btnNext.textContent = current === TOTAL_SLIDES - 1 ? 'Recommencer ↺' : 'Suivant →';

  // Dots
  document.querySelectorAll('.nav-dot').forEach((d, i) => {
    d.className = 'nav-dot'
      + (i === current ? ' active' : '')
      + (i < current ? ' done' : '');
  });
}

function goTo(idx) {
  if (idx === current) return;
  const old = document.getElementById('slide' + current);
  old.classList.remove('active');
  old.classList.add('exit-left');
  setTimeout(() => old.classList.remove('exit-left'), 400);

  current = ((idx % TOTAL_SLIDES) + TOTAL_SLIDES) % TOTAL_SLIDES;
  const nw = document.getElementById('slide' + current);
  nw.classList.add('active');
  updateUI();
  onSlideEnter(current);
}

btnNext.addEventListener('click', () => {
  if (current === TOTAL_SLIDES - 1) { goTo(0); return; }
  goTo(current + 1);
});
btnPrev.addEventListener('click', () => goTo(current - 1));

// Clic sur le corps de la diapo (sauf nav)
document.querySelector('.slides-container').addEventListener('click', (e) => {
  if (e.target.closest('.nav-bar')) return;
  if (current < TOTAL_SLIDES - 1) goTo(current + 1);
});

// ── Helpers SVG ──────────────────────────────────────────────────

function buildGrid(parentId, W, H, yTrack, yRul) {
  const g = document.getElementById(parentId);
  g.innerHTML = '';
  const cmTotal = (W - ML - 15) / PX;
  const sub = 0.2; // subdivisions (0.2 cm)

  for (let x = 0; x <= cmTotal + 0.01; x += sub) {
    const px = ML + x * PX;
    if (px > W - 15) break;
    const isCm   = Math.abs(x - Math.round(x)) < 0.01;
    const isHalf = !isCm && Math.abs(x * 2 - Math.round(x * 2)) < 0.01;
    const cls = isCm ? 'grid-cm' : isHalf ? 'grid-half' : 'grid-sub';
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', px); line.setAttribute('x2', px);
    line.setAttribute('y1', 5);  line.setAttribute('y2', yRul - 5);
    line.setAttribute('class', cls);
    g.appendChild(line);
  }
  // Horizontale
  for (let y = 10; y < yRul - 5; y += PX * 0.5) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', ML); line.setAttribute('x2', W - 15);
    line.setAttribute('y1', y);  line.setAttribute('y2', y);
    const isCm = Math.abs(y - 10) % PX < 1 || Math.abs(y - 10) % PX > PX - 1;
    line.setAttribute('class', isCm ? 'grid-cm' : 'grid-half');
    g.appendChild(line);
  }
}

function buildRuler(parentId, W, yRul) {
  const g = document.getElementById(parentId);
  g.innerHTML = '';
  const svgNS = 'http://www.w3.org/2000/svg';

  // Ligne principale
  const rl = document.createElementNS(svgNS, 'line');
  rl.setAttribute('x1', ML); rl.setAttribute('x2', W - 15);
  rl.setAttribute('y1', yRul); rl.setAttribute('y2', yRul);
  rl.setAttribute('class', 'ruler-line');
  g.appendChild(rl);

  const cmTotal = Math.floor((W - ML - 15) / PX);
  for (let cm = 0; cm <= cmTotal; cm++) {
    const x = ML + cm * PX;
    const tick = document.createElementNS(svgNS, 'line');
    tick.setAttribute('x1', x); tick.setAttribute('x2', x);
    tick.setAttribute('y1', yRul - 6); tick.setAttribute('y2', yRul + 6);
    tick.setAttribute('class', 'ruler-tick');
    g.appendChild(tick);
    const lbl = document.createElementNS(svgNS, 'text');
    lbl.setAttribute('x', x); lbl.setAttribute('y', yRul + 16);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('class', 'ruler-label');
    lbl.textContent = cm + ' cm';
    g.appendChild(lbl);
    // Demi-cm
    if (cm < cmTotal) {
      const xh = x + PX / 2;
      const th = document.createElementNS(svgNS, 'line');
      th.setAttribute('x1', xh); th.setAttribute('x2', xh);
      th.setAttribute('y1', yRul - 3); th.setAttribute('y2', yRul + 3);
      th.setAttribute('class', 'ruler-tick');
      th.style.opacity = '0.5';
      g.appendChild(th);
    }
  }
}

function buildPoints(parentId, yTrack, highlight = [], dimmed = []) {
  const g = document.getElementById(parentId);
  g.innerHTML = '';
  const svgNS = 'http://www.w3.org/2000/svg';

  for (let i = 0; i < DATA.n; i++) {
    const x = ptX(i);
    const isHi  = highlight.includes(i);
    const isDim = dimmed.includes(i);

    const c = document.createElementNS(svgNS, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', yTrack);
    c.setAttribute('r', isHi ? 7 : 5);
    c.setAttribute('class', isHi ? 'track-point-hi' : 'track-point');
    c.style.opacity = isDim ? '0.3' : '1';
    g.appendChild(c);

    const lbl = document.createElementNS(svgNS, 'text');
    lbl.setAttribute('x', x); lbl.setAttribute('y', yTrack - 12);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('class', isHi ? 'point-label-hi' : 'point-label');
    lbl.style.opacity = isDim ? '0.3' : '1';
    lbl.textContent = 'M' + i;
    g.appendChild(lbl);
  }
}

function arrow(svgNS, x1, y1, x2, y2, color, markerId, sw) {
  const line = document.createElementNS(svgNS, 'line');
  line.setAttribute('x1', x1); line.setAttribute('y1', y1);
  line.setAttribute('x2', x2); line.setAttribute('y2', y2);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', sw || 3);
  line.setAttribute('marker-end', 'url(#' + markerId + ')');
  return line;
}

function mkMarker(svgId, markerId, color) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }
  if (defs.querySelector('#' + markerId)) return;
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', markerId);
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '8');
  marker.setAttribute('refY', '4');
  marker.setAttribute('orient', 'auto');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M0,0 L0,8 L10,4 z');
  path.setAttribute('fill', color);
  marker.appendChild(path);
  defs.appendChild(marker);
}

// Anime une ligne de x1 à x2 progressivement
function animateLine(el, x1, x2, duration) {
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    el.setAttribute('x2', x1 + (x2 - x1) * p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Logique par slide ─────────────────────────────────────────────

function onSlideEnter(n) {
  switch(n) {
    case 0: break; // titre

    case 1: {
      // Révéler les légendes une par une
      document.querySelectorAll('#legendGrid1 .legend-item').forEach(el => {
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('revealed'), 200 + delay);
      });
      break;
    }

    case 2: {
      // Construire le SVG de l'enregistrement
      buildGrid('gridStep2', 700, 200, Y_TRK, Y_RUL);
      buildRuler('rulerStep2', 700, Y_RUL);
      buildPoints('pointsStep2', Y_TRK);

      // Ajouter les accolades Δt entre les points
      const g = document.getElementById('dtLabels');
      g.innerHTML = '';
      const svgNS = 'http://www.w3.org/2000/svg';
      for (let i = 0; i < DATA.n - 1; i++) {
        const x1 = ptX(i), x2 = ptX(i+1), xm = (x1+x2)/2;
        const yl = Y_TRK + 28;
        // Ligne
        const ln = document.createElementNS(svgNS, 'line');
        ln.setAttribute('x1', x1+5); ln.setAttribute('x2', x2-5);
        ln.setAttribute('y1', yl); ln.setAttribute('y2', yl);
        ln.setAttribute('stroke', '#888'); ln.setAttribute('stroke-width', '1');
        g.appendChild(ln);
        // Barres
        [x1+5, x2-5].forEach(xb => {
          const b = document.createElementNS(svgNS, 'line');
          b.setAttribute('x1', xb); b.setAttribute('x2', xb);
          b.setAttribute('y1', yl-4); b.setAttribute('y2', yl+4);
          b.setAttribute('stroke', '#888'); b.setAttribute('stroke-width', '1');
          g.appendChild(b);
        });
        // Label
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', xm); t.setAttribute('y', yl + 14);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-size', '9'); t.setAttribute('fill', '#888');
        t.setAttribute('font-family', 'Nunito');
        t.textContent = 'Δt';
        g.appendChild(t);
      }
      // Chips fade in
      const row = document.getElementById('infoStep2');
      row.querySelectorAll('.info-chip').forEach((c, i) => {
        c.style.opacity = '0';
        c.style.transition = 'opacity 0.4s ease';
        setTimeout(() => c.style.opacity = '1', 300 + i * 200);
      });
      break;
    }

    case 3: {
      buildGrid('gridStep3', 700, 200, Y_TRK, Y_RUL);
      buildRuler('rulerStep3', 700, Y_RUL);
      buildPoints('pointsStep3', Y_TRK, [2, 3], [0, 1, 4, 5]);

      // Cercle de surbrillance et labels
      const g = document.getElementById('highlightStep3');
      g.innerHTML = '';
      const svgNS = 'http://www.w3.org/2000/svg';

      // Halo M2 (violet)
      const h2 = document.createElementNS(svgNS, 'circle');
      h2.setAttribute('cx', ptX(2)); h2.setAttribute('cy', Y_TRK);
      h2.setAttribute('r', 18); h2.setAttribute('fill', 'none');
      h2.setAttribute('stroke', '#6a3fa0'); h2.setAttribute('stroke-width', '2');
      h2.setAttribute('stroke-dasharray', '4 3'); h2.setAttribute('opacity', '0');
      g.appendChild(h2);

      // Halo M3 (rouge)
      const h3 = document.createElementNS(svgNS, 'circle');
      h3.setAttribute('cx', ptX(3)); h3.setAttribute('cy', Y_TRK);
      h3.setAttribute('r', 18); h3.setAttribute('fill', 'none');
      h3.setAttribute('stroke', '#b04040'); h3.setAttribute('stroke-width', '2');
      h3.setAttribute('stroke-dasharray', '4 3'); h3.setAttribute('opacity', '0');
      g.appendChild(h3);

      // Labels
      function mkLbl(x, y, txt, fill) {
        const r = document.createElementNS(svgNS, 'rect');
        r.setAttribute('x', x-28); r.setAttribute('y', y-14);
        r.setAttribute('width', 56); r.setAttribute('height', 18);
        r.setAttribute('rx', 5); r.setAttribute('fill', fill);
        r.setAttribute('opacity', '0.9');
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', x); t.setAttribute('y', y);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-size', '11'); t.setAttribute('fill', 'white');
        t.setAttribute('font-family', 'Nunito'); t.setAttribute('font-weight', '700');
        t.textContent = txt;
        return [r, t];
      }

      const [r2, t2] = mkLbl(ptX(2), Y_TRK - 30, 'Mᵢ = M₂', '#6a3fa0');
      const [r3, t3] = mkLbl(ptX(3), Y_TRK - 30, 'Mᵢ₊₁ = M₃', '#b04040');
      [r2, t2, r3, t3].forEach(el => { el.setAttribute('opacity', '0'); g.appendChild(el); });

      // Apparition progressive
      setTimeout(() => { h2.setAttribute('opacity', '1'); r2.setAttribute('opacity', '0.9'); t2.setAttribute('opacity', '1'); }, 200);
      setTimeout(() => { h3.setAttribute('opacity', '1'); r3.setAttribute('opacity', '0.9'); t3.setAttribute('opacity', '1'); }, 500);
      break;
    }

    case 4: {
      buildGrid('gridStep4', 700, 200, Y_TRK, Y_RUL);
      buildRuler('rulerStep4', 700, Y_RUL);
      buildPoints('pointsStep4', Y_TRK, [2, 3], [0, 1, 4, 5]);

      const g = document.getElementById('displArrow');
      g.innerHTML = '';
      mkMarker('svgStep4', 'arrowDispl', '#b04040');

      const svgNS = 'http://www.w3.org/2000/svg';
      const x1 = ptX(2) + 7, x2 = ptX(3) - 9;
      const lineEl = document.createElementNS(svgNS, 'line');
      lineEl.setAttribute('x1', x1); lineEl.setAttribute('y1', Y_TRK);
      lineEl.setAttribute('x2', x1); lineEl.setAttribute('y2', Y_TRK);
      lineEl.setAttribute('stroke', '#b04040'); lineEl.setAttribute('stroke-width', '3');
      lineEl.setAttribute('marker-end', 'url(#arrowDispl)');
      g.appendChild(lineEl);

      // Cote sous la flèche
      const cote = document.createElementNS(svgNS, 'text');
      cote.setAttribute('x', (ptX(2)+ptX(3))/2); cote.setAttribute('y', Y_TRK + 20);
      cote.setAttribute('text-anchor', 'middle');
      cote.setAttribute('font-size', '11'); cote.setAttribute('fill', '#b04040');
      cote.setAttribute('font-family', 'Nunito'); cote.setAttribute('font-weight', '700');
      cote.setAttribute('opacity', '0');
      cote.textContent = '0,96 cm';
      g.appendChild(cote);

      setTimeout(() => {
        animateLine(lineEl, x1, x2, 600);
        setTimeout(() => { cote.setAttribute('opacity', '1'); }, 700);

        // Measure box
        const mb = document.getElementById('measureDispl');
        mb.style.opacity = '0'; mb.style.transition = 'opacity 0.5s';
        setTimeout(() => mb.style.opacity = '1', 800);
      }, 200);
      break;
    }

    case 5: {
      // Lignes de calcul
      document.querySelectorAll('#calcSteps .calc-line').forEach(el => {
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('revealed'), 200 + delay);
      });
      break;
    }

    case 6: {
      // Échelle vecteurs
      setTimeout(() => {
        document.querySelector('#scaleVis .scale-calc').classList.add('revealed');
      }, 400);
      setTimeout(() => {
        document.querySelector('#scaleVis .ruler-demo').classList.add('revealed');
        // Animer la flèche démo
        const lineEl = document.getElementById('arrowDemoLine');
        const label  = document.getElementById('arrowDemoLabel');
        const lenLbl = document.getElementById('arrowDemoLen');
        const x1 = 90, x2 = 90 + DATA.fleche_cm * PX; // 2.4 cm * 38 = 91.2px
        lineEl.setAttribute('x1', x1); lineEl.setAttribute('x2', x1);
        label.setAttribute('x', x1); label.textContent = '';
        lenLbl.textContent = '';

        setTimeout(() => {
          animateLine(lineEl, x1, x2, 700);
          setTimeout(() => {
            label.setAttribute('x', x1); label.textContent = '2,40 cm = 1,20 m/s';
            label.setAttribute('x', (x1 + x2) / 2);
            lenLbl.setAttribute('x', (x1 + x2) / 2);
            lenLbl.textContent = '← 2,40 cm →';
          }, 750);
        }, 200);
      }, 700);
      break;
    }

    case 7: {
      buildGrid('gridStep7', 700, 220, Y_TRK, Y_RUL);
      buildRuler('rulerStep7', 700, Y_RUL);
      buildPoints('pointsStep7', Y_TRK, [2], [0, 1, 3, 4, 5]);

      mkMarker('svgStep7', 'arrowVit7m', '#6a3fa0');
      mkMarker('svgStep7', 'arrowDisp7m', '#b04040');

      const g = document.getElementById('vitArrow7');
      g.innerHTML = '';
      const svgNS = 'http://www.w3.org/2000/svg';

      // Vecteur déplacement M2M3 (en transparence)
      const xd1 = ptX(2)+7, xd2 = ptX(3)-9;
      const dLine = document.createElementNS(svgNS, 'line');
      dLine.setAttribute('x1', xd1); dLine.setAttribute('y1', Y_TRK);
      dLine.setAttribute('x2', xd1); dLine.setAttribute('y2', Y_TRK);
      dLine.setAttribute('stroke', '#b04040'); dLine.setAttribute('stroke-width', '2');
      dLine.setAttribute('stroke-dasharray', '5 3');
      dLine.setAttribute('marker-end', 'url(#arrowDisp7m)');
      dLine.setAttribute('opacity', '0.5');
      g.appendChild(dLine);

      // Étiquette M2M3
      const dLbl = document.createElementNS(svgNS, 'text');
      dLbl.setAttribute('x', (ptX(2)+ptX(3))/2); dLbl.setAttribute('y', Y_TRK + 18);
      dLbl.setAttribute('text-anchor', 'middle');
      dLbl.setAttribute('font-size', '10'); dLbl.setAttribute('fill', '#b04040');
      dLbl.setAttribute('font-family', 'Nunito'); dLbl.setAttribute('font-weight', '700');
      dLbl.setAttribute('opacity', '0');
      dLbl.textContent = 'M₂M₃ = 0,96 cm';
      g.appendChild(dLbl);

      // Vecteur vitesse (2.4 cm depuis M2)
      const xv1 = ptX(2), xv2 = ptX(2) + DATA.fleche_cm * PX;
      const vLine = document.createElementNS(svgNS, 'line');
      vLine.setAttribute('x1', xv1); vLine.setAttribute('y1', Y_TRK - 30);
      vLine.setAttribute('x2', xv1); vLine.setAttribute('y2', Y_TRK - 30);
      vLine.setAttribute('stroke', '#6a3fa0'); vLine.setAttribute('stroke-width', '4');
      vLine.setAttribute('marker-end', 'url(#arrowVit7m)');
      g.appendChild(vLine);

      // Label vitesse
      const vLbl = document.createElementNS(svgNS, 'text');
      vLbl.setAttribute('x', xv1 + (DATA.fleche_cm * PX)/2);
      vLbl.setAttribute('y', Y_TRK - 42);
      vLbl.setAttribute('text-anchor', 'middle');
      vLbl.setAttribute('font-size', '11'); vLbl.setAttribute('fill', '#6a3fa0');
      vLbl.setAttribute('font-family', 'Nunito'); vLbl.setAttribute('font-weight', '800');
      vLbl.setAttribute('opacity', '0');
      vLbl.textContent = 'v⃗(M₂) = 1,20 m/s';
      g.appendChild(vLbl);

      // Point d'origine (tige)
      const stem = document.createElementNS(svgNS, 'line');
      stem.setAttribute('x1', xv1); stem.setAttribute('y1', Y_TRK - 7);
      stem.setAttribute('x2', xv1); stem.setAttribute('y2', Y_TRK - 30);
      stem.setAttribute('stroke', '#6a3fa0'); stem.setAttribute('stroke-width', '1.5');
      stem.setAttribute('stroke-dasharray', '3 2'); stem.setAttribute('opacity', '0.5');
      g.appendChild(stem);

      // Légende des deux échelles (en bas)
      const ec = document.createElementNS(svgNS, 'text');
      ec.setAttribute('x', 350); ec.setAttribute('y', 205);
      ec.setAttribute('text-anchor', 'middle');
      ec.setAttribute('font-size', '9'); ec.setAttribute('fill', '#5a3880');
      ec.setAttribute('font-family', 'Nunito');
      ec.textContent = 'Éch. distances : 1 cm → 0,5 m   |   Éch. vecteurs : 1 cm → 0,5 m/s   |   Δt = 0,4 s';
      ec.setAttribute('opacity', '0');
      g.appendChild(ec);

      // Animations
      setTimeout(() => {
        animateLine(dLine, xd1, xd2, 500);
        setTimeout(() => { dLbl.setAttribute('opacity', '1'); }, 600);
      }, 200);
      setTimeout(() => {
        animateLine(vLine, xv1, xv2, 700);
        setTimeout(() => {
          vLbl.setAttribute('opacity', '1');
          ec.setAttribute('opacity', '1');
        }, 800);
      }, 900);
      break;
    }

    case 8: {
      // Révéler les cartes recap
      document.querySelectorAll('.recap-card').forEach(el => {
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('revealed'), 200 + delay);
      });

      // Mini SVG récap (compact, h=130)
      buildGrid('gridRecap', 700, 130, Y_TRK_R, Y_RUL_R);
      buildRuler('rulerRecap', 700, Y_RUL_R);
      buildPoints('pointsRecap', Y_TRK_R, [2]);

      mkMarker('svgRecap', 'arrowRecapM', '#6a3fa0');

      const g = document.getElementById('vitRecap');
      g.innerHTML = '';
      const svgNS = 'http://www.w3.org/2000/svg';
      const xv1r = ptX(2), xv2r = ptX(2) + DATA.fleche_cm * PX;

      const vr = document.createElementNS(svgNS, 'line');
      vr.setAttribute('x1', xv1r); vr.setAttribute('y1', Y_TRK_R - 20);
      vr.setAttribute('x2', xv1r); vr.setAttribute('y2', Y_TRK_R - 20);
      vr.setAttribute('stroke', '#6a3fa0'); vr.setAttribute('stroke-width', '4');
      vr.setAttribute('marker-end', 'url(#arrowRecapM)');
      g.appendChild(vr);

      const lr = document.createElementNS(svgNS, 'text');
      lr.setAttribute('x', xv1r + (DATA.fleche_cm*PX)/2); lr.setAttribute('y', Y_TRK_R - 30);
      lr.setAttribute('text-anchor', 'middle');
      lr.setAttribute('font-size', '10'); lr.setAttribute('fill', '#6a3fa0');
      lr.setAttribute('font-family', 'Nunito'); lr.setAttribute('font-weight', '800');
      lr.setAttribute('opacity', '0');
      lr.textContent = 'v⃗(M₂) = 1,20 m/s — 2,40 cm';
      g.appendChild(lr);

      setTimeout(() => {
        animateLine(vr, xv1r, xv2r, 700);
        setTimeout(() => lr.setAttribute('opacity', '1'), 800);
      }, 900);
      break;
    }
  }
}

// ── Init ──────────────────────────────────────────────────────────
updateUI();
onSlideEnter(0);
