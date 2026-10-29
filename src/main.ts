import '@fontsource/zcool-kuaile/400.css';
import './style.css';
import { cats, buildings, online, isMine, ownerName } from './game/data';
import { load, resetSave, save, settleNow, awaySinceSeen } from './game/save';
import { goOnline, send } from './net/online';
import type { Cmd } from './net/protocol';
import { W } from './world/config';
import { buildScene } from './world/scene';
import { applyDaylight, hourNow, periodName } from './world/daylight';
import { cam, view, applyCam, onCamera, setView, initCam, zoomAt, flyTo, stopFly, toWorld } from './world/camera';
import { actors, addActor, update, draw, actorAt, syncActors, applyCmd, setDriver, onDecide, setTag } from './world/streetCats';
import { mountHud, $, toast } from './ui/hud';
import { showAway } from './ui/away';
import { bindPanel, closePanel, onDid, openBuilding, openStray, pruneSel, refreshHud, refreshPanel, renderDock, rerenderCat, selectCat } from './ui/panel';
import { checkAsks, onCo } from './ui/coraise';
import { bindNeighbours, offerJoin, updateNeighbours } from './ui/neighbours';

mountHud($('app'));
const world = $('world');
const backSvg = document.getElementById('back') as unknown as SVGSVGElement;
const frontSvg = document.getElementById('front') as unknown as SVGSVGElement;
const catCv = $<HTMLCanvasElement>('cats');
const lightsSvg = document.getElementById('lights') as unknown as SVGSVGElement;
const scene = buildScene(backSvg, frontSvg, lightsSvg);
applyDaylight(world);

// ?reset starts over (handy while testing); ?join=<street> comes from a neighbour's invite link
const params = new URLSearchParams(location.search);
if (params.has('reset')) { resetSave(); history.replaceState(null, '', location.pathname); }
const joinId = params.get('join');
const hadAccount = (() => { try { return !!localStorage.getItem('catcat.token'); } catch { return false; } })();
// A returning online player waits for the street; everyone else sees their local cats straight away.
let away = hadAccount ? null : load();
if (hadAccount) cats.length = 0;
for (const c of cats) addActor(c);

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
onCamera(() => {
  const t = `translate(${cam.x.toFixed(1)} ${cam.y.toFixed(1)}) scale(${cam.k.toFixed(4)})`;
  scene.back.setAttribute('transform', t);
  scene.front.setAttribute('transform', t);
  scene.lights.setAttribute('transform', t);
  scene.far.setAttribute('transform', `translate(${(-cam.x / cam.k * 0.5).toFixed(1)} 0)`);
  const cx = (view.w / 2 - cam.x) / cam.k;
  $('coord').textContent = `樱花街 ${clamp(Math.round(cx / 100), 1, Math.round(W / 100))} 号 · ${periodName(hourNow())}`;
});

function resize() {
  const r = world.getBoundingClientRect();
  setView(r.width, r.height);
}
window.addEventListener('resize', resize);

// ---------- input: drag to pan, wheel / pinch to zoom, tap to pick ----------
const hint = $('hint');
const hideHint = () => (hint.hidden = true);
const ptrs = new Map<number, { x: number; y: number }>();
let drag: { sx: number; sy: number; cx: number; cy: number; moved: boolean; target: Element | null } | null = null;
let pinch: { d0: number; k0: number; mx: number; my: number; x0: number; y0: number } | null = null;

world.addEventListener('pointerdown', e => {
  world.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  stopFly();
  if (ptrs.size === 1) {
    drag = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false, target: e.target as Element };
  } else if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], r = world.getBoundingClientRect();
    pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), k0: cam.k, mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top, x0: cam.x, y0: cam.y };
    if (drag) drag.moved = true;
  }
});
world.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()], r = world.getBoundingClientRect();
    const k = pinch.k0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0;
    const wx = (pinch.mx - pinch.x0) / pinch.k0, wy = (pinch.my - pinch.y0) / pinch.k0;
    const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
    zoomAt(mx, my, k);
    cam.x = mx - wx * cam.k; cam.y = my - wy * cam.k; applyCam();
  } else if (drag) {
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; world.classList.add('dragging'); }
    if (drag.moved) { cam.x = drag.cx + dx; cam.y = drag.cy + dy; applyCam(); }
  }
});
const endPtr = (e: PointerEvent) => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = null;
  if (ptrs.size === 0) {
    if (drag && !drag.moved && e.type === 'pointerup') tap(e.clientX, e.clientY, drag.target);
    drag = null; world.classList.remove('dragging');
  } else if (ptrs.size === 1) {
    const [p] = [...ptrs.values()];
    drag = { sx: p.x, sy: p.y, cx: cam.x, cy: cam.y, moved: true, target: null };
  }
};
world.addEventListener('pointerup', endPtr);
world.addEventListener('pointercancel', endPtr);
world.addEventListener('wheel', e => {
  e.preventDefault();
  const r = world.getBoundingClientRect();
  zoomAt(e.clientX - r.left, e.clientY - r.top, cam.k * Math.exp(-e.deltaY * 0.0016));
}, { passive: false });

function tap(sx: number, sy: number, target: Element | null) {
  hideHint();
  const r = world.getBoundingClientRect(), p = toWorld(sx - r.left, sy - r.top);
  const a = actorAt(p.x, p.y);
  if (a) return selectCat(a.cat.id);
  const b = target?.closest<SVGElement>('[data-b]'), s = target?.closest<SVGElement>('[data-stray]');
  if (s) openStray(s.dataset.stray!);
  else if (b) openBuilding(b.dataset.b!);
  else closePanel();
}

$('zin').onclick = () => zoomAt(view.w / 2, view.h / 2, cam.k * 1.3);
$('zout').onclick = () => zoomAt(view.w / 2, view.h / 2, cam.k / 1.3);
$('zhome').onclick = () => flyTo(buildings.home.x, buildings.home.y - 120, Math.max(cam.k, 1));
// PC: arrow keys / A D pan, + - zoom, Esc closes the panel
window.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement) return;
  const pan = { ArrowLeft: 1, a: 1, A: 1, ArrowRight: -1, d: -1, D: -1 }[e.key];
  if (pan) { stopFly(); cam.x += pan * 160; applyCam(); }
  else if (e.key === '+' || e.key === '=') zoomAt(view.w / 2, view.h / 2, cam.k * 1.2);
  else if (e.key === '-') zoomAt(view.w / 2, view.h / 2, cam.k / 1.2);
  else if (e.key === 'Escape') closePanel();
});
bindPanel(hideHint);
bindNeighbours();

// ---------- loop ----------
let last = performance.now(), acc = 0, saveAcc = 0, skyAcc = 0, time = 0;
function tick(t: number) {
  const dt = Math.min(0.1, (t - last) / 1000); last = t; time += dt;
  update(dt);
  draw(catCv, time);
  // a lamp post fades while a cat stands right behind it
  for (const l of scene.lamps) l.node.classList.toggle('see', actors.some(a => Math.abs(a.cat.x - l.x) < 50));
  acc += dt; saveAcc += dt; skyAcc += dt;
  // the sky moves on with the clock
  if (skyAcc >= 30) { skyAcc = 0; applyDaylight(world); applyCam(); }
  if (acc >= 1) {
    settleNow();
    acc = 0;
    refreshPanel();
    if (!$('dock').matches(':hover')) renderDock();
  }
  if (saveAcc >= 15) { saveAcc = 0; save(); }
  if (online.on) flushCmds(dt);
  requestAnimationFrame(tick);
}

resize();
initCam(cats[0]?.x + 260 || buildings.home.x);
refreshHud();
renderDock();
if (!hadAccount) save();
if (away) showAway(away);
requestAnimationFrame(t => { last = t; tick(t); });

// ---------- the shared street ----------
// The driver tab sends what it decided once a frame, plus everyone's position every few seconds.
let outbox: Cmd[] = [], posAcc = 0;
function flushCmds(dt: number) {
  if (outbox.length) { send({ t: 'cmds', list: outbox }); outbox = []; }
  posAcc += dt;
  if (online.driver && posAcc >= 10) {
    posAcc = 0;
    send({ t: 'pos', list: cats.map(c => ({ id: c.id, x: Math.round(c.x), y: Math.round(c.y) })) });
  }
}

let firstInit = true;
goOnline({
  cats() {
    syncActors(cats); pruneSel();
    onDecide(c => outbox.push(c));
    setTag(c => isMine(c) ? (c.co ? `${c.name} ♥` : c.name) : `${c.name}·${ownerName(c).slice(0, 4)}`);
    refreshHud(); renderDock(); rerenderCat(); updateNeighbours();
    if (firstInit) {
      firstInit = false;
      if (hadAccount) { const me = cats.find(isMine) ?? cats[0]; if (me) initCam(me.x + 260); }
      const seen = awaySinceSeen();
      save();
      if (seen) showAway(seen);
    }
    checkAsks();
  },
  cmds(list) {
    for (const c of list) { const a = actors.find(x => x.cat.id === c.id); if (a) applyCmd(a, c); }
  },
  did: onDid,
  co: onCo,
  presence() { setDriver(online.driver); updateNeighbours(); },
  error: toast,
  status(s) {
    updateNeighbours(s);
    if (s === 'moved') toast('你在别的页面搬去了新的小街，刷新一下就能看到');
  },
}).then(ok => {
  if (!ok) {
    // no server (or it is down): keep playing on this device
    updateNeighbours('offline');
    if (hadAccount && !cats.length) {
      away = load();
      if (!cats.length) resetSave();
      syncActors(cats); refreshHud(); renderDock(); initCam(cats[0].x + 260);
      if (away) showAway(away);
    }
    if (joinId) toast('连不上小街服务器，邀请暂时用不了');
    return;
  }
  if (joinId) offerJoin(joinId);
});

// stats follow the real clock: save when the page goes away, settle the gap when it comes back
document.addEventListener('visibilitychange', () => {
  if (online.on) send({ t: 'vis', on: !document.hidden });
  if (document.hidden) { settleNow(); save(); return; }
  const gap = settleNow();
  save(); refreshHud(); renderDock(); refreshPanel();
  showAway(gap);
});
window.addEventListener('pagehide', () => { settleNow(); save(); });
