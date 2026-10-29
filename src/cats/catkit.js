// Code-drawn cats, face #1 style: thick outline, flat colour, front-facing head on a side-view body.
// Each cat = coat (calico / tabby) + personality (lively / cool / lazy); personality drives both the face and how it moves.
const CatKit = (() => {
  const TAU = Math.PI * 2, OL = '#3a2a24', LW = 3.3;
  const FW = 230, FH = 190, GY = 182;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const c01 = t => Math.max(0, Math.min(1, t));
  const seg01 = (t, a, b) => c01((t - a) / (b - a));
  const bump = (t, a, b) => { const u = seg01(t, a, b); return Math.sin(Math.PI * u); };
  const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); };

const Face = (() => {
const TAU = Math.PI * 2;
const C = { cream: '#fdf5e8', char: '#4b4448', orange: '#ea9148', pink: '#f5aeac', line: '#3a2a24', nose: '#e7838c' };
const ell = (x, y, rx, ry, r = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), r, 0, TAU); };
let ctx;

// head outline: superellipse with optional wider cheeks (bw) and chin (chin)
function headPath(s) {
  const { W, H, n = 2.2, bw = 0, chin = 0, fluff = 0 } = s;
  ctx.beginPath();
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const a = i / N * TAU, c = Math.cos(a), si = Math.sin(a);
    let x = W * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y = H * Math.sign(si) * Math.pow(Math.abs(si), 2 / n);
    if (si > 0) { x *= 1 + bw * si * (1 - si) * 2.2; y *= 1 + chin * Math.pow(Math.abs(c) < .3 ? 1 - Math.abs(c) / .3 : 0, 2); }
    if (fluff && si > 0.05 && si < .75 && Math.abs(c) > .55) { const k = Math.sin(a * 18); x += Math.sign(c) * fluff * Math.max(0, k); }
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}
function earPath(s, side) {
  const { W, H, earX = .55, earS = 1, earA = .25, earR = .25, earW = 1 } = s;
  const bx = side * W * earX, by = -H * .55;
  const base = 17 * earS * earW, h = 30 * earS;
  const a = side * earA;
  const rot = (x, y) => [bx + x * Math.cos(a) - y * Math.sin(a), by + x * Math.sin(a) + y * Math.cos(a)];
  const b1 = rot(-base, 8), b2 = rot(base, 8), t = rot(side * 3, -h);
  const t1 = [t[0] + (b1[0] - t[0]) * earR, t[1] + (b1[1] - t[1]) * earR], t2 = [t[0] + (b2[0] - t[0]) * earR, t[1] + (b2[1] - t[1]) * earR];
  ctx.beginPath(); ctx.moveTo(...b1); ctx.lineTo(...t1); ctx.quadraticCurveTo(...t, ...t2); ctx.lineTo(...b2); ctx.closePath();
  return { b1, b2, t };
}
function innerEar(s, side) {
  const { W, H, earX = .55, earS = 1, earA = .25, earW = 1 } = s;
  const bx = side * W * earX, by = -H * .55, a = side * earA;
  const rot = (x, y) => [bx + x * Math.cos(a) - y * Math.sin(a), by + x * Math.sin(a) + y * Math.cos(a)];
  const b1 = rot(-10 * earS * earW, -1), b2 = rot(10 * earS * earW, -1), t = rot(side * 2.5, -22 * earS);
  ctx.beginPath(); ctx.moveTo(...b1); ctx.quadraticCurveTo(...t, ...b2); ctx.closePath();
}

function eye(s, x, y, side) {
  const r = s.eyeR || 6, t = s.eye, L = s.lineCol || C.line;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (t === 'closed') { ctx.strokeStyle = L; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x - r * .9, y); ctx.quadraticCurveTo(x, y + r * .8, x + r * .9, y); ctx.stroke(); return; }
  if (t === 'dot') { ell(x, y, r * .55, r * .55); ctx.fillStyle = L; ctx.fill(); return; }
  if (t === 'bean') { ell(x, y, r * .55, r * .85); ctx.fillStyle = L; ctx.fill(); ell(x + r * .15, y - r * .35, r * .18, r * .18); ctx.fillStyle = '#fff'; ctx.fill(); return; }
  if (t === 'oval') { ell(x, y, r * .5, r * .8); ctx.fillStyle = '#222'; ctx.fill(); return; }
  if (t === 'line') { ctx.strokeStyle = L; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - r * .8, y); ctx.lineTo(x + r * .8, y); ctx.stroke(); return; }
  if (t === 'smile') { ctx.strokeStyle = L; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x - r, y + r * .35); ctx.quadraticCurveTo(x, y - r * 1.1, x + r, y + r * .35); ctx.stroke(); return; }
  if (t === 'big') {
    ell(x, y, r, r * 1.05); ctx.fillStyle = '#2a1d18'; ctx.fill();
    ell(x + r * .3, y - r * .35, r * .38, r * .38); ctx.fillStyle = '#fff'; ctx.fill();
    ell(x - r * .35, y + r * .45, r * .16, r * .16); ctx.fill(); return;
  }
  if (t === 'button') {
    ell(x, y, r * .8, r * .8); ctx.fillStyle = '#1e1a1a'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([1.5, 1.8]); ell(x, y, r * .5, r * .5); ctx.stroke(); ctx.setLineDash([]);
    ell(x + r * .3, y - r * .3, r * .15, r * .15); ctx.fillStyle = '#fff'; ctx.fill(); return;
  }
  if (t === 'cartoon') {
    ell(x, y, r * .8, r * 1.15); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = L; ctx.lineWidth = 2; ctx.stroke();
    ell(x + side * -r * .1 + r * .1, y + r * .3, r * .32, r * .42); ctx.fillStyle = '#1e1a1a'; ctx.fill(); return;
  }
  if (t === 'almond') {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - r * 1.1, y + r * .1 * side); ctx.quadraticCurveTo(x, y - r * 1.05, x + r * 1.1, y - r * .1 * side); ctx.quadraticCurveTo(x, y + r * .95, x - r * 1.1, y + r * .1 * side); ctx.closePath();
    ctx.fillStyle = '#9cc35a'; ctx.fill(); ctx.clip();
    ell(x, y + r * .4, r, r * .4); ctx.fillStyle = '#c9de7c'; ctx.fill();
    ell(x, y, r * .2, r * .75); ctx.fillStyle = '#1e1a1a'; ctx.fill();
    ell(x + r * .35, y - r * .3, r * .15, r * .15); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(x - r * 1.1, y + r * .1 * side); ctx.quadraticCurveTo(x, y - r * 1.05, x + r * 1.1, y - r * .1 * side); ctx.quadraticCurveTo(x, y + r * .95, x - r * 1.1, y + r * .1 * side); ctx.closePath();
    ctx.strokeStyle = L; ctx.lineWidth = 1.8; ctx.stroke(); return;
  }
  if (t === 'bright') {
    ell(x, y, r * .7, r * .92); ctx.fillStyle = '#2a1d18'; ctx.fill();
    ctx.save(); ell(x, y, r * .7, r * .92); ctx.clip(); ell(x, y + r * .75, r * .7, r * .4); ctx.fillStyle = s.iris || '#8a5a2a'; ctx.globalAlpha = .55; ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fff'; ell(x + r * .22, y - r * .34, r * .3, r * .3); ctx.fill(); ell(x - r * .25, y + r * .4, r * .13, r * .13); ctx.fill(); return;
  }
  if (t === 'cool' || t === 'lazy') {
    const rx = r * .9, ry = r * .95, iris = s.iris || '#c9a845';
    const lid = t === 'cool' ? .42 : .56;
    const lookX = t === 'cool' ? rx * .4 : 0, lookY = t === 'lazy' ? ry * .28 : 0;
    const xi = x - side * rx, xo = x + side * rx, ly = y - ry + ry * 2 * lid;
    const yi = t === 'lazy' ? ly - ry * .1 : ly + ry * .04, yo = t === 'lazy' ? ly + ry * .3 : ly - ry * .04;
    ctx.save(); ell(x, y, rx, ry); ctx.fillStyle = iris; ctx.fill(); ctx.clip();
    ell(x + lookX, y + lookY + ry * .1, rx * .5, ry * .62); ctx.fillStyle = '#21160f'; ctx.fill();
    ell(x + lookX + rx * .22, y + lookY - ry * .02, rx * .2, rx * .2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
    // lid covers a touch past the eye so no iris halo shows above it
    const lidPoly = () => { ctx.beginPath(); ctx.moveTo(xi - side * 3, yi); ctx.lineTo(xo + side * 3, yo); ctx.lineTo(xo + side * 3, y - ry - 4); ctx.lineTo(xi - side * 3, y - ry - 4); ctx.closePath(); };
    ctx.save(); ell(x, y, rx + 1.5, ry + 1.5); ctx.clip(); lidPoly(); ctx.fillStyle = s.lidCol; ctx.fill(); ctx.restore();
    ctx.strokeStyle = L; ctx.lineWidth = 1.8; ctx.save();
    ctx.beginPath(); ctx.moveTo(xi - side * 3, yi); ctx.lineTo(xo + side * 3, yo); ctx.lineTo(xo + side * 3, y + ry + 4); ctx.lineTo(xi - side * 3, y + ry + 4); ctx.closePath(); ctx.clip();
    ell(x, y, rx, ry); ctx.stroke(); ctx.restore();
    ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(xi, yi); ctx.lineTo(xo + side * 1.5, yo); ctx.stroke();
    return;
  }
  // iris-based eyes: anime / sparkle / owl / sleepy / shoujo
  const rx = t === 'owl' ? r * 1.05 : r * .82, ry = t === 'owl' ? r * 1.05 : r * 1.08;
  const iris = s.iris || (t === 'owl' ? '#f2c14e' : '#c9a845');
  ctx.save();
  ell(x, y, rx, ry); ctx.fillStyle = iris; ctx.fill(); ctx.clip();
  const g = ctx.createLinearGradient(0, y - ry, 0, y + ry); g.addColorStop(0, 'rgba(60,30,10,.45)'); g.addColorStop(.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,255,220,.35)');
  ctx.fillStyle = g; ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
  ell(x, y + ry * .05, rx * (t === 'owl' ? .55 : .55), ry * (t === 'owl' ? .55 : .72)); ctx.fillStyle = '#21160f'; ctx.fill();
  ctx.fillStyle = '#fff';
  if (t === 'sparkle') {
    const sx = x + rx * .2, sy = y - ry * .3, R = rx * .5;
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? R * .35 : R, a = i * Math.PI / 4 - Math.PI / 2; ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
    ell(x - rx * .35, y + ry * .45, rx * .16, rx * .16); ctx.fill();
  } else {
    ell(x + rx * .3, y - ry * .35, rx * .32, rx * .32); ctx.fill();
    ell(x - rx * .3, y + ry * .45, rx * .14, rx * .14); ctx.fill();
  }
  if (t === 'sleepy') { ctx.fillStyle = s.lidCol || C.cream; ctx.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 1.05); }
  ctx.restore();
  ctx.strokeStyle = L; ctx.lineWidth = 1.7; ell(x, y, rx, ry); ctx.stroke();
  if (t === 'sleepy') { ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - rx - 1, y - ry * .05); ctx.lineTo(x + rx + 1, y - ry * .05); ctx.stroke(); }
  else { ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(x, y, rx + .3, ry + .3, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  if (t === 'shoujo') {
    ctx.lineWidth = 1.8; ctx.beginPath();
    const ox = side > 0 ? 1 : -1;
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + ox * (.55 + k * .3); ctx.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * ry); ctx.lineTo(x + Math.cos(a) * (rx + 3.5), y + Math.sin(a) * (ry + 3.5)); }
    ctx.stroke();
  }
}
function noseMouth(s) {
  const y = s.noseY ?? 8, L = s.lineCol || C.line, k = s.mouthK || 1;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = L; ctx.lineWidth = 1.7;
  const nose = s.nose ?? 'tri';
  if (nose === 'tri') { ctx.beginPath(); ctx.moveTo(-3.2, y - 2); ctx.quadraticCurveTo(0, y - 3, 3.2, y - 2); ctx.lineTo(0, y + 1.6); ctx.closePath(); ctx.fillStyle = C.nose; ctx.fill(); if (s.ow !== 0) { ctx.lineWidth = 1.2; ctx.stroke(); } }
  if (nose === 'dot') { ell(0, y, 1.8, 1.4); ctx.fillStyle = L; ctx.fill(); }
  if (nose === 'heart') { ctx.beginPath(); ctx.moveTo(0, y + 2); ctx.bezierCurveTo(-5, y - 1, -3, y - 4.5, 0, y - 2); ctx.bezierCurveTo(3, y - 4.5, 5, y - 1, 0, y + 2); ctx.fillStyle = C.nose; ctx.fill(); }
  if (nose === 'oval') { ell(0, y, 3.4, 2.4); ctx.fillStyle = '#f2c14e'; ctx.fill(); ctx.lineWidth = 1.3; ctx.stroke(); }
  if (nose === 'big') { ctx.beginPath(); ctx.moveTo(-4.5, y - 2.5); ctx.quadraticCurveTo(0, y - 4, 4.5, y - 2.5); ctx.quadraticCurveTo(2, y + 2.5, 0, y + 2.5); ctx.quadraticCurveTo(-2, y + 2.5, -4.5, y - 2.5); ctx.fillStyle = C.nose; ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke(); ell(-1.2, y - 1.6, 1.2, .7); ctx.fillStyle = '#fff'; ctx.fill(); }
  const m = s.mouth ?? 'w', my = y + 2.2;
  ctx.lineWidth = 1.7; ctx.beginPath();
  if (m === 'w') { ctx.moveTo(0, my - .6); ctx.lineTo(0, my + 1.2); ctx.moveTo(-4 * k, my + .6); ctx.quadraticCurveTo(-2 * k, my + 4 * k, 0, my + 1.2); ctx.quadraticCurveTo(2 * k, my + 4 * k, 4 * k, my + .6); }
  if (m === 'v') { ctx.moveTo(-2.2, my + .5); ctx.lineTo(0, my + 2.6); ctx.lineTo(2.2, my + .5); }
  if (m === 'lam') { ctx.moveTo(-3.5, my + 3); ctx.lineTo(0, my); ctx.lineTo(3.5, my + 3); }
  if (m === 'cat3') { ctx.moveTo(-1, my - 1); ctx.quadraticCurveTo(4.5, my, -1, my + 2.2); ctx.quadraticCurveTo(4.5, my + 3, -1, my + 5); }
  if (m === 'flat') { ctx.moveTo(0, my - .6); ctx.lineTo(0, my + 1.4); ctx.moveTo(-3, my + 1.6); ctx.lineTo(3, my + 2.2); }
  if (m === 'frown') { ctx.moveTo(-3.5, my + 3); ctx.quadraticCurveTo(0, my + .5, 3.5, my + 3); }
  if (m === 'stitch') { ctx.moveTo(0, my - 1); ctx.lineTo(0, my + 3); ctx.moveTo(-5, my + 3); ctx.lineTo(5, my + 3); for (const d of [-3.5, -1.2, 1.2, 3.5]) { ctx.moveTo(d, my + 1.6); ctx.lineTo(d, my + 4.4); } }
  ctx.stroke();
  if (m === 'open') {
    ctx.beginPath(); ctx.moveTo(-5.5, my + .6); ctx.quadraticCurveTo(0, my + 11, 5.5, my + .6); ctx.quadraticCurveTo(0, my + 2, -5.5, my + .6); ctx.fillStyle = '#9c3a47'; ctx.fill(); ctx.stroke();
    ell(0, my + 5.6, 3, 1.8); ctx.fillStyle = '#f08b98'; ctx.fill();
  }
}
function whiskers(s) {
  const n = s.wh ?? 2; if (!n) return;
  const W = s.W, y = (s.noseY ?? 8) + 1;
  ctx.strokeStyle = s.whCol || 'rgba(58,42,36,.6)'; ctx.lineWidth = s.whW || 1; ctx.lineCap = 'round';
  for (const sd of [-1, 1]) for (let i = 0; i < n; i++) {
    const dy = (i - (n - 1) / 2) * 4;
    ctx.beginPath(); ctx.moveTo(sd * W * .62, y + dy); ctx.quadraticCurveTo(sd * W * .95, y + dy * 1.4 - 1, sd * (W + 10), y + dy * 2 - .5); ctx.stroke();
  }
}

function drawHead(s) {
  const lw = s.ow ?? 2.3, L = s.lineCol || C.line;
  const col = Object.assign({}, C, s.pal || {});
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // outline pass for the ear + head silhouette
  if (lw) {
    ctx.fillStyle = L; ctx.strokeStyle = L; ctx.lineWidth = lw * 2;
    for (const sd of [-1, 1]) { earPath(s, sd); ctx.fill(); ctx.stroke(); }
    headPath(s); ctx.fill(); ctx.stroke();
  }
  const tab = s.coat === 'tabby';
  earPath(s, -1); ctx.fillStyle = tab ? col.cream : col.char; ctx.fill();
  earPath(s, 1); ctx.fillStyle = tab ? col.cream : col.orange; ctx.fill();
  if (s.tuft) { ctx.strokeStyle = col.stripe; ctx.lineWidth = 2; for (const sd of [-1, 1]) { const { t } = earPath(s, sd); for (const d of [-2.5, 0, 2.5]) { ctx.beginPath(); ctx.moveTo(t[0] + d * .6, t[1] + 3); ctx.lineTo(t[0] + d + sd * 2, t[1] - 7 - Math.abs(d)); ctx.stroke(); } } }
  ctx.fillStyle = col.pink; innerEar(s, -1); ctx.fill(); innerEar(s, 1); ctx.fill();
  headPath(s); ctx.fillStyle = col.cream; ctx.fill();
  ctx.save(); headPath(s); ctx.clip();
  // calico: charcoal over the left eye and crown, orange cap on the right
  if (!tab) {
    ctx.fillStyle = col.char; ell(-s.W * .55, -s.H * .5, s.W * .62, s.H * .62, -.3); ctx.fill();
    if (s.patchEye !== false) { ell(-s.W * .42, (s.eyeY ?? -2) - 1, s.W * .3, s.H * .32, .2); ctx.fill(); }
    ctx.fillStyle = col.orange; ell(s.W * .58, -s.H * .72, s.W * .42, s.H * .38, .3); ctx.fill();
  } else {
    const ny = s.noseY ?? 8, ex = s.eyeX ?? 17, ey = s.eyeY ?? -2, er = s.eyeR || 6;
    ctx.fillStyle = col.muzzle; ell(0, ny + 7, 15, 10); ctx.fill(); ell(0, s.H * .95, 14, 8); ctx.fill();
    for (const sd of [-1, 1]) { ell(sd * ex, ey + 1, er * 1.35, er * 1.3); ctx.fill(); }
    ctx.strokeStyle = col.stripe; ctx.lineCap = 'round'; ctx.lineWidth = 2.8;
    for (const dx of [-6.5, 0, 6.5]) { ctx.beginPath(); ctx.moveTo(dx * 1.15, -s.H * 1.02); ctx.quadraticCurveTo(dx, -s.H * .7, dx * .75, -s.H * .45); ctx.stroke(); }
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sd * 10, -s.H * .45); ctx.quadraticCurveTo(sd * 15, -s.H * .72, sd * 20, -s.H * .52); ctx.stroke();
      for (const k of [0, 1]) { const y0 = -9 + k * 6; ctx.beginPath(); ctx.moveTo(sd * s.W * 1.1, y0 - 3); ctx.quadraticCurveTo(sd * s.W * .95, y0, sd * s.W * .82, y0 + 1.5); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(sd * (ex + er * 1.2), ey + 2); ctx.quadraticCurveTo(sd * (ex + er * 1.9), ey + 3, sd * (ex + er * 2.4), ey + 7); ctx.stroke();
    }
  }
  if (s.shade !== false) { const g = ctx.createLinearGradient(0, s.H * .3, 0, s.H); g.addColorStop(0, 'rgba(200,170,140,0)'); g.addColorStop(1, 'rgba(200,170,140,.35)'); ctx.fillStyle = g; ctx.fillRect(-s.W * 1.5, 0, s.W * 3, s.H * 1.4); }
  if (s.muzzle) { ctx.fillStyle = '#fffbf4'; ell(-6, (s.noseY ?? 8) + 4, 8, 6); ctx.fill(); ell(6, (s.noseY ?? 8) + 4, 8, 6); ctx.fill(); }
  ctx.restore();
  if (s.blush) { ctx.fillStyle = `rgba(245,130,130,${s.blush})`; for (const sd of [-1, 1]) { ell(sd * (s.eyeX ?? 17) * 1.15, (s.eyeY ?? -2) + (s.eyeR || 6) * 1.25 + 3, 5.5, 3); ctx.fill(); } }
  if (s.blushLines) { ctx.strokeStyle = 'rgba(230,100,110,.8)'; ctx.lineWidth = 1.2; for (const sd of [-1, 1]) for (const d of [-2.5, 0, 2.5]) { const cx = sd * (s.eyeX ?? 17) * 1.15 + d, cy = (s.eyeY ?? -2) + (s.eyeR || 6) * 1.25 + 3; ctx.beginPath(); ctx.moveTo(cx + 1, cy - 1.6); ctx.lineTo(cx - 1, cy + 1.6); ctx.stroke(); } }
  for (const sd of [-1, 1]) eye(Object.assign({ lidCol: tab ? col.muzzle : sd < 0 ? col.char : col.cream }, s), sd * (s.eyeX ?? 17), s.eyeY ?? -2, sd);
  if (s.brows) { ctx.strokeStyle = L; ctx.lineWidth = 2; for (const sd of [-1, 1]) { const ex = sd * (s.eyeX ?? 17), ey = (s.eyeY ?? -2) - (s.eyeR || 6) * 1.6; ctx.beginPath(); ctx.moveTo(ex - sd * 5, ey + s.brows * 2.5); ctx.lineTo(ex + sd * 5, ey - s.brows * 1.5); ctx.stroke(); } }
  noseMouth(s); whiskers(s);
}

return { draw(c, s) { ctx = c; drawHead(s); } };
})();

  // ---------- cats ----------
  const COATS = {
    calico: { coat: 'calico', base: '#fdf5e8', far: '#e9dccb', belly: '#fffaf2', char: '#4b4448', orange: '#ea9148', pink: '#f5aeac', iris: '#d9a43c',
      tail: ['orange', 'orange', 'char', 'orange', 'char', 'base', 'char', 'char', 'char'], size: 1, tailW: 1 },
    maine: { coat: 'tabby', base: '#a8917b', far: '#8f7a66', belly: '#f1e6d6', stripe: '#5a4636', muzzle: '#f1e6d6', pink: '#e9a7a0', iris: '#a9b94c',
      tuft: 1, fluff: 2.6, earS: 1.08, W: 36, tail: ['base', 'stripe', 'base', 'stripe', 'base', 'stripe', 'base', 'stripe', 'stripe'], size: 1.12, tailW: 1.45, ruff: 1 },
    lihua: { coat: 'tabby', base: '#c3a67c', far: '#a88d66', belly: '#f4ead9', stripe: '#3f3226', muzzle: '#f4ead9', pink: '#eda9a2', iris: '#9cc35a',
      tail: ['base', 'stripe', 'base', 'stripe', 'base', 'stripe', 'base', 'stripe', 'stripe'], size: .98, tailW: 1 },
  };
  const FACE0 = { W: 34, H: 27, n: 2.4, bw: .12, ow: 4, shade: false, wh: 2, whW: 1.3, whCol: '#3a2a24', eyeX: 15, eyeY: 1, noseY: 10 };
  const PERS = {
    lively: { face: { eye: 'bright', eyeR: 8.5, eyeY: 0, mouth: 'open', blush: .45, earA: .16 },
      // gait: walk / run cycle seconds, step lift, body bob, head height, tail
      walkT: .62, runT: .42, lift: 8, bob: 1.8, headY: 0, tailUp: 1, wag: .2, hop: 1 },
    cool: { face: { eye: 'cool', eyeR: 7.5, mouth: 'flat', blush: 0, earA: .34 },
      walkT: .82, runT: .5, lift: 5.5, bob: .6, headY: -3, tailUp: .8, wag: .07, hop: .7 },
    lazy: { face: { eye: 'lazy', eyeR: 7.5, mouth: 'w', mouthK: .8, blush: .25, earA: .55, earR: .35 },
      walkT: 1.05, runT: .62, lift: 3.5, bob: .9, headY: 7, tailUp: 0, wag: .1, hop: .5 },
  };
  let K = null, M = null;

  // ---------- pose ----------
  const BASE = {
    hx: -27, hy: -46, rh: 20, sx: 19, sy: -49, rs: 21, arch: 3, belly: 2,
    kx: 34, ky: -80, kr: 0, ks: 1,
    fnx: 25, fny: 0, ffx: 15, ffy: 0, hnx: -23, hny: 0, hfx: -32, hfy: 0,
    kwf: 0, fnkx: 0, fnky: 0, ffkx: 0, ffky: 0, kwh: 0, hnkx: 0, hnky: 0, hfkx: 0, hfky: 0,
    ta: 2.45, tc: .21, tw: 0, tp: 0, tl: 6.8, tbx: .85, tby: .4,
    lift: 0, sqx: 1, sqy: 1, bodyFlip: 1, eye: '', blink: 0,
  };
  const P = (o, b = BASE) => Object.assign({}, b, o);
  const TN = 9;
  const tailAngles = p => p.tA ? p.tA.slice() : Array.from({ length: TN }, (_, i) => p.ta + i * p.tc);
  function mix(a, b, t) {
    const o = {}, A = Object.assign({}, a), B = Object.assign({}, b);
    for (const [w, ks] of [['kwf', ['fnkx', 'fnky', 'ffkx', 'ffky']], ['kwh', ['hnkx', 'hnky', 'hfkx', 'hfky']]]) {
      if (!A[w]) ks.forEach(k => A[k] = B[k]);
      if (!B[w]) ks.forEach(k => B[k] = A[k]);
    }
    for (const k in Object.assign({}, A, B)) { const x = A[k], y = B[k]; o[k] = typeof x === 'number' && typeof y === 'number' ? lerp(x, y, t) : (t < .5 ? x : y); }
    const ta = tailAngles(A), tb = tailAngles(B);
    o.tA = ta.map((v, i) => { let w = tb[i]; while (w - v > Math.PI) w -= TAU; while (v - w > Math.PI) w += TAU; return lerp(v, w, t); });
    return o;
  }
  // personality baseline: where the head sits and how the tail is carried
  function stand() {
    const up = M.tailUp;
    return P({ ky: -80 + M.headY, kx: 34 + M.headY * .5, ta: lerp(2.75, 4.28, up), tc: lerp(.06, .13, up), hy: -46 + (M === PERS.lazy ? 2 : 0) });
  }

  // ---------- geometry ----------
  function ik(rx, ry, px, py, a, b, s) {
    const dx = px - rx, dy = py - ry; let d = Math.hypot(dx, dy);
    d = Math.max(Math.abs(a - b) + .01, Math.min(a + b - .01, d));
    const base = Math.atan2(dy, dx), al = Math.acos((a * a + d * d - b * b) / (2 * a * d)), ang = base + s * al;
    return [rx + a * Math.cos(ang), ry + a * Math.sin(ang)];
  }
  function bodyFrame(p) {
    const th = Math.atan2(p.sy - p.hy, p.sx - p.hx), L = Math.hypot(p.sx - p.hx, p.sy - p.hy), c = Math.cos(th), s = Math.sin(th);
    return { th, L, loc: (u, v) => [p.hx + c * u - s * v, p.hy + s * u + c * v] };
  }
  function bodyPath(ctx, p, F) {
    const { th, L, loc } = F;
    const ht = loc(0, -p.rh), st = loc(L, -p.rs), sb = loc(L, p.rs), hb = loc(0, p.rh);
    const mt = loc(L / 2, -(p.rh + p.rs) / 2 - p.arch * 2), mb = loc(L / 2, (p.rh + p.rs) / 2 + p.belly * 2);
    ctx.beginPath(); ctx.moveTo(...ht); ctx.quadraticCurveTo(...mt, ...st);
    ctx.arc(p.sx, p.sy, p.rs, th - Math.PI / 2, th + Math.PI / 2, false);
    ctx.lineTo(...sb); ctx.quadraticCurveTo(...mb, ...hb);
    ctx.arc(p.hx, p.hy, p.rh, th + Math.PI / 2, th + Math.PI * 1.5, false); ctx.closePath();
  }
  function legs(p) {
    const mk = (root, px, py, a, s, kw, kx, ky, front) => {
      const tgt = [px, py - 5.5];
      let k = ik(root[0], root[1], tgt[0], tgt[1], a, a, s);
      if (kw) k = [lerp(k[0], kx, kw), lerp(k[1], ky, kw)];
      return { root, knee: k, paw: tgt, front };
    };
    return {
      ff: mk([p.sx - 3, p.sy + 6], p.ffx, p.ffy, 20, -1, p.kwf, p.ffkx, p.ffky, 1),
      hf: mk([p.hx - 1, p.hy + 5], p.hfx, p.hfy, 21, 1, p.kwh, p.hfkx, p.hfky, 0),
      fn: mk([p.sx + 3, p.sy + 7], p.fnx, p.fny, 20, -1, p.kwf, p.fnkx, p.fnky, 1),
      hn: mk([p.hx + 5, p.hy + 6], p.hnx, p.hny, 21, 1, p.kwh, p.hnkx, p.hnky, 0),
    };
  }
  const legW = g => g.front ? 12.5 : 13.5;
  const legLine = (ctx, g) => { ctx.beginPath(); ctx.moveTo(...g.root); ctx.lineTo(...g.knee); ctx.lineTo(...g.paw); };
  const paw = (ctx, g) => ell(ctx, g.paw[0] + 1.5, g.paw[1] + .5, 8.4, 5.6);
  function legSet(ctx, gs, col, outline) {
    if (outline) {
      ctx.strokeStyle = OL; ctx.fillStyle = OL;
      for (const g of gs) { ctx.lineWidth = legW(g) + LW * 2; legLine(ctx, g); ctx.stroke(); paw(ctx, g); ctx.lineWidth = LW * 2; ctx.fill(); ctx.stroke(); }
    }
    ctx.strokeStyle = col; ctx.fillStyle = col;
    for (const g of gs) { ctx.lineWidth = legW(g); legLine(ctx, g); ctx.stroke(); paw(ctx, g); ctx.fill(); }
  }
  function legStripes(ctx, gs) {
    if (K.coat !== 'tabby') return;
    ctx.strokeStyle = K.stripe; ctx.lineWidth = 3;
    for (const g of gs) {
      const [kx, ky] = g.knee, [px, py] = g.paw, a = Math.atan2(py - ky, px - kx) + Math.PI / 2, h = legW(g) / 2 - .5;
      for (const u of [.2, .5]) { const x = lerp(kx, px, u), y = lerp(ky, py, u); ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * h, y - Math.sin(a) * h); ctx.lineTo(x + Math.cos(a) * h * .3, y + Math.sin(a) * h * .3); ctx.stroke(); }
    }
  }
  function tailPts(p, F) {
    const A = p.tA || tailAngles(p), pts = [F.loc(-p.rh * p.tbx, -p.rh * p.tby)];
    for (let i = 0; i < TN; i++) {
      const a = A[i] + p.tw * Math.sin(p.tp + i * .55) * (.25 + i / TN), q = pts[i];
      pts.push([q[0] + Math.cos(a) * p.tl, Math.min(-5 * K.tailW, q[1] + Math.sin(a) * p.tl)]);
    }
    return pts;
  }
  function tail(ctx, p, pts) {
    const w = i => (10 - i * .3) * K.tailW;
    ctx.strokeStyle = OL;
    for (let i = 0; i < TN; i++) { ctx.lineWidth = w(i) + LW * 2; ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i + 1]); ctx.stroke(); }
    for (let i = 0; i < TN; i++) { ctx.strokeStyle = K[K.tail[i]]; ctx.lineWidth = w(i); ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i + 1]); ctx.stroke(); }
  }

  // ---------- draw ----------
  function draw(ctx, p) {
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sh = 1 / (1 + p.lift / 30);
    ctx.fillStyle = `rgba(70,52,40,${.16 * sh})`; ell(ctx, (p.hx + p.sx) / 2 * K.size + 2, 0, 44 * sh * K.size, 5 * sh); ctx.fill();
    ctx.translate(0, -p.lift);
    ctx.scale(K.size * p.sqx, K.size * p.sqy);
    ctx.save(); ctx.scale(p.bodyFlip, 1);
    const F = bodyFrame(p), L = legs(p), tp = tailPts(p, F);
    tail(ctx, p, tp);
    legSet(ctx, [L.ff, L.hf], K.far, true);
    legStripes(ctx, [L.ff, L.hf]);
    // body + near legs as one silhouette
    const neck = () => { ctx.beginPath(); const a = F.loc(F.L - 2, -4); ctx.moveTo(...a); ctx.lineTo(p.kx - 2, p.ky + 14); };
    ctx.fillStyle = OL; ctx.strokeStyle = OL;
    bodyPath(ctx, p, F); ctx.lineWidth = LW * 2; ctx.fill(); ctx.stroke();
    neck(); ctx.lineWidth = 24 + LW * 2; ctx.stroke();
    legSet(ctx, [L.hn, L.fn], OL, true);
    ctx.fillStyle = K.base; bodyPath(ctx, p, F); ctx.fill();
    ctx.strokeStyle = K.base; neck(); ctx.lineWidth = 24; ctx.stroke();
    ctx.save(); bodyPath(ctx, p, F); ctx.clip();
    const pat = (u, v, rx, ry, col) => { const [x, y] = F.loc(u * F.L, v); ctx.fillStyle = col; ell(ctx, x, y, rx, ry, F.th); ctx.fill(); };
    pat(.5, p.rh * .95, F.L * .62, 9, K.belly);
    if (K.coat === 'calico') {
      pat(.5, -p.rh * .75, F.L * .36, 13, K.char); pat(.62, -p.rh * .95, F.L * .2, 8, K.char);
      pat(-.05, -p.rh * .55, 16, 13, K.orange); pat(.95, -p.rs * .7, 9, 7, K.orange);
    } else {
      ctx.strokeStyle = K.stripe; ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        const u = -.1 + i * .22, a = F.loc(u * F.L, -p.rh * 1.3), m = F.loc(u * F.L - 4, -p.rh * .5), b = F.loc(u * F.L - 1, p.rh * .1);
        ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(...m, ...b); ctx.stroke();
      }
      ctx.lineWidth = 5; ctx.beginPath(); const s0 = F.loc(-.1 * F.L, -p.rh * 1.02), s1 = F.loc(F.L * 1.05, -p.rs * 1.02); ctx.moveTo(...s0); ctx.lineTo(...s1); ctx.stroke();
    }
    ctx.restore();
    legSet(ctx, [L.hn, L.fn], K.base, false);
    legStripes(ctx, [L.hn, L.fn]);
    // thigh line + toes
    ctx.strokeStyle = OL; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(p.hx + 2, p.hy + 2, p.rh * .78, F.th + .35, F.th + 1.45); ctx.stroke();
    ctx.lineWidth = 1.6;
    for (const g of [L.hn, L.fn]) { const x = g.paw[0] + 1.5, y = g.paw[1] + .5; ctx.beginPath(); ctx.moveTo(x + 2, y + 1.5); ctx.lineTo(x + 2, y + 5); ctx.moveTo(x + 5.5, y + 1); ctx.lineTo(x + 5.5, y + 4.5); ctx.stroke(); }
    if (K.ruff) {
      // Maine Coon chest ruff
      ctx.fillStyle = K.belly; ctx.strokeStyle = OL; ctx.lineWidth = 2;
      const [cx, cy] = F.loc(F.L + p.rs * .55, p.rs * .1);
      ctx.beginPath(); ctx.moveTo(cx - 9, cy - 12);
      for (let i = 0; i <= 5; i++) { const yy = cy - 12 + i * 5.2; ctx.quadraticCurveTo(cx + 9, yy + 1, cx + 2 - (i % 2) * 2, yy + 5.2); }
      ctx.lineTo(cx - 9, cy + 14); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - 3, cy - 12); for (let i = 0; i <= 5; i++) { const yy = cy - 12 + i * 5.2; ctx.quadraticCurveTo(cx + 9, yy + 1, cx + 2 - (i % 2) * 2, yy + 5.2); } ctx.stroke();
    }
    ctx.restore();
    // head stays front-facing whichever way the body points
    ctx.save(); ctx.translate(p.kx * p.bodyFlip, p.ky); ctx.rotate(p.kr * p.bodyFlip); ctx.scale(.9 * p.ks * (p.faceFlip || 1), .9 * p.ks);
    Face.draw(ctx, faceStyle(p));
    ctx.restore();
    ctx.restore();
  }
  function faceStyle(p) {
    const f = Object.assign({}, FACE0, { coat: K.coat, tuft: K.tuft, fluff: K.fluff, earS: K.earS, W: K.W || 34, iris: K.iris,
      pal: { cream: K.base, char: K.char, orange: K.orange, pink: K.pink, muzzle: K.muzzle, stripe: K.stripe } }, M.face);
    if (p.blink > .5) f.eye = 'closed';
    if (p.eye) f.eye = p.eye;
    if (p.mouth) f.mouth = p.mouth;
    return f;
  }

  // ---------- movement clips ----------
  function gaitPaw(q, base, D, B, lift) {
    q = ((q % 1) + 1) % 1;
    if (q < B) return [base + D / 2 - D * (q / B), 0];
    const s = (q - B) / (1 - B);
    return [base - D / 2 + D * ease(s), -lift * Math.sin(Math.PI * s)];
  }
  const WALK = { D: 28, B: .62 }, RUN = { D: 46, B: .4 }, SNEAK = { D: 20, B: .7 };
  function walk(t) {
    const { D, B } = WALK, c = TAU * t, S = stand(), lf = M.lift;
    const [hnx, hny] = gaitPaw(t, -23, D, B, lf * .85), [fnx, fny] = gaitPaw(t - .25, 25, D, B, lf);
    const [hfx, hfy] = gaitPaw(t - .5, -32, D, B, lf * .85), [ffx, ffy] = gaitPaw(t - .75, 15, D, B, lf);
    const bob = Math.cos(2 * c) * M.bob;
    return P({ hnx, hny, fnx, fny, hfx, hfy, ffx, ffy,
      hy: S.hy - bob + .8 * Math.sin(c), sy: S.sy - bob - .8 * Math.sin(c),
      ky: S.ky - bob * 1.2 - .6 * Math.cos(2 * c + .6), kx: S.kx + .5 * Math.sin(2 * c), kr: (M === PERS.lively ? .08 : .03) * Math.sin(c),
      tw: M.wag + .06, tp: c }, S);
  }
  function run(t) {
    const { D, B } = RUN, c = TAU * t, S = stand();
    const [hnx, hny] = gaitPaw(t, -22, D, B, 10), [hfx, hfy] = gaitPaw(t - .07, -30, D, B, 10);
    const [fnx, fny] = gaitPaw(t - .5, 27, D, B, 11), [ffx, ffy] = gaitPaw(t - .57, 18, D, B, 11);
    const st = Math.sin(c), up = 2.5 + 2 * M.hop;
    return P({ hnx, hny, fnx, fny, hfx, hfy, ffx, ffy,
      hx: -27 - 4 * st, sx: 19 + 4 * st, hy: -47 - up * Math.sin(c + .9), sy: -49 - up * Math.sin(c - .9), arch: 4 - 3 * st,
      kx: 38 + 4 * st, ky: S.ky + 4 - 2.5 * Math.sin(c - .6), kr: .05,
      ta: 3.0, tc: -.03 + .05 * M.tailUp, tw: .16, tp: c }, S);
  }
  function sneak(t) {
    const { D, B } = SNEAK, c = TAU * t;
    const [hnx, hny] = gaitPaw(t, -22, D, B, 3), [fnx, fny] = gaitPaw(t - .25, 27, D, B, 4);
    const [hfx, hfy] = gaitPaw(t - .5, -30, D, B, 3), [ffx, ffy] = gaitPaw(t - .75, 19, D, B, 4);
    return P({ hnx, hny, fnx, fny, hfx, hfy, ffx, ffy, hx: -27, hy: -30, rh: 19, sx: 18, sy: -30, rs: 20, arch: 5, belly: 0,
      kwh: .6, hnkx: -32, hnky: -14, hfkx: -40, hfky: -14, kwf: .5, fnkx: 34, fnky: -14, ffkx: 26, ffky: -14,
      kx: 40, ky: -50 + .8 * Math.sin(2 * c), ta: 3.05, tc: .02, tw: .1, tp: c * 2, eye: M === PERS.lively ? 'bright' : '' });
  }
  function idle(t) {
    const S = stand(), b = Math.sin(TAU * t), c = TAU * t;
    const p = P({ hy: S.hy - .5 * b, sy: S.sy - .9 * b, ky: S.ky - 1 * b, rs: 21 + .4 * b, tw: M.wag + .05, tp: c * (M === PERS.lively ? 2 : 1),
      kr: (M === PERS.lively ? .1 : M === PERS.cool ? .03 : .05) * Math.sin(c) }, S);
    const bl = seg01(t, .6, .68); p.blink = bl > 0 && bl < 1 ? 1 : 0;
    return p;
  }
  // jump: crouch, launch, airborne arc, land with a squash
  function jump(t) {
    const S = stand(), H = 26 + 16 * M.hop;
    const CR = P({ hx: -26, hy: -34, sx: 18, sy: -36, kx: 36, ky: S.ky + 16, arch: 6,
      kwh: 1, hnkx: -30, hnky: -14, hfkx: -38, hfky: -14, kwf: .5, fnkx: 30, fnky: -16, ffkx: 22, ffky: -16, ta: 2.9, tc: .04 }, S);
    const AIR = P({ hx: -30, hy: -48, sx: 22, sy: -54, arch: -1, kx: 40, ky: S.ky - 4, kr: -.12,
      fnx: 36, fny: -14, ffx: 30, ffy: -12, kwf: 1, fnkx: 36, fnky: -34, ffkx: 30, ffky: -32,
      hnx: -40, hny: -8, hfx: -46, hfy: -6, ta: 3.1, tc: -.05 }, S);
    let p;
    if (t < .25) p = mix(S, CR, ease(t / .25));
    else if (t < .35) p = mix(CR, AIR, ease((t - .25) / .1));
    else if (t < .7) p = mix(AIR, P({ fny: 0, ffy: 0, fnx: 28, ffx: 18, kwf: .3, hny: -4, hfy: -4 }, AIR), ease((t - .35) / .35));
    else if (t < .8) p = mix(P({ fnx: 28, ffx: 18, kwf: .3 }, AIR), CR, ease((t - .7) / .1));
    else p = mix(CR, S, ease((t - .8) / .2));
    const air = seg01(t, .3, .75);
    p.lift = air > 0 && air < 1 ? H * Math.sin(Math.PI * air) : 0;
    const sq = bump(t, .72, .9) * .08 + bump(t, .12, .28) * .06;
    p.sqx = 1 + sq; p.sqy = 1 - sq;
    if (t > .3 && t < .75 && M === PERS.lively) p.mouth = 'open';
    return p;
  }
  // turn around: the body narrows through zero while the head stays facing us
  function turn(t) {
    const S = idle(t * .3), u = ease(seg01(t, .15, .85));
    const f = Math.cos(Math.PI * u);
    S.bodyFlip = Math.abs(f) < .3 ? (f < 0 ? -.3 : .3) : f;
    S.kr += .1 * Math.sin(Math.PI * u);
    return S;
  }
  const CLIPS = {
    idle: { label: '待机', n: 24, secs: () => 2.4, f: idle },
    walk: { label: '行走', n: 16, secs: () => M.walkT, f: walk, dist: WALK },
    run: { label: '小跑', n: 12, secs: () => M.runT, f: run, dist: RUN },
    sneak: { label: '潜行', n: 16, secs: () => M.walkT * 1.3, f: sneak, dist: SNEAK },
    jump: { label: '原地跳', n: 18, secs: () => 1.1 / (.7 + .3 * M.hop), f: jump, once: 1 },
    turn: { label: '转身', n: 10, secs: () => .7, f: turn, once: 1 },
  };
  function use(coat, pers) { K = COATS[coat]; M = PERS[pers]; }
  // just the head, centred on the origin: dock and panel avatars
  function portrait(ctx, o = {}) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    Face.draw(ctx, faceStyle(Object.assign({}, BASE, o)));
    ctx.restore();
  }
  function poseAt(name, t) { return CLIPS[name].f(t); }
  return { use, draw, poseAt, portrait, CLIPS, COATS, PERS, FW, FH, GY, get M() { return M; }, get K() { return K; } };
})();
export default CatKit;
