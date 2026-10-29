import CatKit, { type ClipName, type Pose } from '../cats/catkit';
import type { Cat } from '../game/data';
import { CAT_SCALE, LANE, W, OUT } from './config';
import { cam, view } from './camera';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const cycleLen = (d: { D: number; B: number }) => d.D / d.B;

export type Mode = 'roam' | 'pet' | 'feed' | 'play';
type Dir = 1 | -1;

/** A cat on the street: where it is, which clip it plays, and what it is heading for. */
export interface Actor {
  cat: Cat;
  dir: Dir;
  act: ClipName;
  /** Seconds into the current clip (timed clips) or gait cycles walked (distance clips). */
  t: number;
  phase: number;
  left: number;
  tx: number;
  ty: number;
  next: ClipName;
  turnTo: Dir;
  held: boolean;
  mode: Mode;
  busy: number;
}

export const actors: Actor[] = [];

export function addActor(cat: Cat): Actor {
  const a: Actor = { cat, dir: Math.random() < .5 ? 1 : -1, act: 'idle', t: rand(0, 2), phase: 0, left: rand(1, 3),
    tx: cat.x, ty: cat.y, next: 'walk', turnTo: 1, held: false, mode: 'roam', busy: 0 };
  actors.push(a);
  return a;
}

const scaleOf = () => CAT_SCALE * CatKit.K.size;

// pick the next thing to do; personality decides how often it naps, hops or runs
function decide(a: Actor) {
  const p = a.cat.pers, r = Math.random();
  const lazy = p === 'lazy', lively = p === 'lively';
  if (r < (lazy ? .38 : .2)) { a.act = 'idle'; a.t = 0; a.left = lazy ? rand(3, 7) : rand(1.5, 4); return; }
  if (r < (lively ? .34 : .27)) { a.act = 'jump'; a.t = 0; a.left = CatKit.CLIPS.jump.secs(); return; }
  const dist = rand(160, lazy ? 360 : 560) * (Math.random() < .5 ? -1 : 1);
  a.tx = clamp(a.cat.x + dist, 220, W - 220);
  a.ty = rand(LANE[0], LANE[1]);
  const far = Math.abs(a.tx - a.cat.x) > 300, kind = Math.random();
  a.next = far && kind < (lively ? .6 : lazy ? .05 : .3) ? 'run' : !lazy && kind > .78 ? 'sneak' : 'walk';
  const dir: Dir = a.tx >= a.cat.x ? 1 : -1;
  if (dir !== a.dir) { a.act = 'turn'; a.t = 0; a.left = CatKit.CLIPS.turn.secs(); a.turnTo = dir; }
  else { a.act = a.next; a.phase = 0; a.left = 99; }
}

/** Hold a cat in place (selected) or release it back to roaming. */
export function hold(a: Actor, on: boolean) {
  a.held = on;
  if (on && !a.busy && CatKit.CLIPS[a.act].dist) { a.act = 'idle'; a.t = 0; }
}

/** Play a short interaction (pet / feed / play) in place. */
export function perform(a: Actor, mode: Exclude<Mode, 'roam'>, secs: number) {
  // a turn cut short would leave the body mirrored, so settle the facing first
  if (a.act === 'turn') a.dir = a.turnTo;
  a.mode = mode; a.busy = secs; a.t = 0;
  a.act = mode === 'play' ? 'jump' : 'idle';
}

export function update(dt: number) {
  for (const a of actors) {
    const c = a.cat;
    CatKit.use(c.coat, c.pers);
    if (a.busy > 0) {
      a.t += dt; a.busy -= dt;
      if (a.busy <= 0) { a.busy = 0; a.mode = 'roam'; a.act = 'idle'; a.t = 0; a.left = rand(1.5, 3); }
      continue;
    }
    const cl = CatKit.CLIPS[a.act];
    if (a.held && a.act !== 'turn') { if (cl.dist) { a.act = 'idle'; a.t = 0; } a.t += dt; continue; }
    if (cl.dist) {
      // move exactly one gait stride of ground per cycle so paws stay planted
      const S = scaleOf(), stride = cycleLen(cl.dist) * S, v = stride / cl.secs();
      const dx = a.tx - c.x, dy = a.ty - c.y, d = Math.hypot(dx, dy), step = Math.min(d, v * dt);
      if (d > 0) { c.x += dx / d * step; c.y += dy / d * step; }
      a.phase += step / stride;
      if (d - step < .5) { a.act = 'idle'; a.t = 0; a.left = c.pers === 'lazy' ? rand(3, 6) : rand(1, 3); }
      continue;
    }
    a.t += dt; a.left -= dt;
    if (a.left <= 0) {
      if (a.act === 'turn') { a.dir = a.turnTo; a.act = a.next; a.phase = 0; a.left = 99; a.t = 0; }
      else decide(a);
    }
  }
}

function clipT(a: Actor) {
  const cl = CatKit.CLIPS[a.act];
  if (cl.dist) return a.phase % 1;
  if (cl.once && a.mode !== 'play') return Math.min(1, a.t / cl.secs());
  return (a.t / cl.secs()) % 1;
}

function poseFor(a: Actor): Pose {
  const p = CatKit.poseAt(a.act, clipT(a));
  p.faceFlip = a.dir; // keep the face un-mirrored so calico patches never swap sides
  if (a.mode === 'pet') { p.eye = 'smile'; p.mouth = 'w'; p.kr += .08 * Math.sin(a.t * 5); }
  if (a.mode === 'feed') { p.ky += 18 + 2.5 * Math.sin(a.t * 14); p.kx += 6; p.eye = 'closed'; p.mouth = 'w'; }
  return p;
}

// ---------- drawing ----------
const heart = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  ctx.beginPath(); ctx.moveTo(x, y + 3 * s);
  ctx.bezierCurveTo(x - 7 * s, y - 2 * s, x - 3 * s, y - 8 * s, x, y - 4 * s);
  ctx.bezierCurveTo(x + 3 * s, y - 8 * s, x + 7 * s, y - 2 * s, x, y + 3 * s);
  ctx.fill();
};
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function drawProps(ctx: CanvasRenderingContext2D, a: Actor, S: number) {
  const { x, y } = a.cat;
  ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.lineJoin = 'round';
  if (a.mode === 'feed') {
    const bx = x + a.dir * 44 * S;
    ctx.fillStyle = '#FF9F43';
    ctx.beginPath(); ctx.moveTo(bx - 15, y - 11); ctx.lineTo(bx + 15, y - 11); ctx.lineTo(bx + 11, y + 1); ctx.lineTo(bx - 11, y + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#B5763C'; ctx.beginPath(); ctx.ellipse(bx, y - 11, 13, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (a.mode === 'play') {
    const yx = x + a.dir * (70 + 10 * Math.sin(a.t * 3)) * S, yy = y - 9 - Math.abs(Math.sin(a.t * 4)) * 10;
    ctx.fillStyle = '#FF8FAB'; ctx.beginPath(); ctx.arc(yx, yy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
    const r = a.t * 6;
    ctx.beginPath(); ctx.arc(yx, yy, 5, r, r + 2); ctx.stroke(); ctx.beginPath(); ctx.arc(yx, yy, 5, r + 3, r + 4.6); ctx.stroke();
  }
}

function drawAbove(ctx: CanvasRenderingContext2D, a: Actor, top: number) {
  const { x } = a.cat;
  if (a.mode === 'pet') {
    ctx.fillStyle = '#FF6B8A';
    for (let i = 0; i < 3; i++) {
      const u = (a.t * .7 + i / 3) % 1;
      ctx.globalAlpha = 1 - u; heart(ctx, x + (i - 1) * 16 + Math.sin(u * 6 + i) * 4, top - 10 - u * 30, 1.3 - i * .15);
    }
    ctx.globalAlpha = 1;
  }
  // name tag
  const name = a.cat.name;
  ctx.font = '900 13px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  const w = ctx.measureText(name).width + 18, ty = top - (a.mode === 'pet' ? 48 : 8) - 22;
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  roundRect(ctx, x - w / 2, ty, w, 22, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name, x, ty + 11.5);
}

/** Height of the cat above its feet in world units, for tags and hit tests. */
const catTop = (S: number) => 122 * S;

export function draw(cv: HTMLCanvasElement, time: number) {
  const r = devicePixelRatio || 1, w = Math.round(view.w * r), h = Math.round(view.h * r);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h);
  ctx.setTransform(r * cam.k, 0, 0, r * cam.k, r * cam.x, r * cam.y);
  const left = -cam.x / cam.k - 150, right = (view.w - cam.x) / cam.k + 150;
  const order = [...actors].sort((p, q) => p.cat.y - q.cat.y);
  for (const a of order) {
    const { x, y } = a.cat;
    if (x < left || x > right) continue;
    CatKit.use(a.cat.coat, a.cat.pers);
    const S = scaleOf();
    if (a.held) {
      ctx.strokeStyle = '#E8781F'; ctx.lineWidth = 3; ctx.globalAlpha = .55 + .35 * Math.sin(time * 5);
      ctx.beginPath(); ctx.ellipse(x, y + 1, 52 * S, 12 * S, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (a.mode === 'feed') drawProps(ctx, a, S);
    ctx.save(); ctx.translate(x, y); ctx.scale(CAT_SCALE * a.dir, CAT_SCALE);
    CatKit.draw(ctx, poseFor(a));
    ctx.restore();
    if (a.mode === 'play') drawProps(ctx, a, S);
    drawAbove(ctx, a, y - catTop(S));
  }
}

/** Front-most cat under a world point. */
export function actorAt(wx: number, wy: number): Actor | null {
  const order = [...actors].sort((p, q) => q.cat.y - p.cat.y);
  for (const a of order) {
    CatKit.use(a.cat.coat, a.cat.pers);
    const S = scaleOf(), { x, y } = a.cat;
    if (Math.abs(wx - x) < 62 * S && wy < y + 10 && wy > y - catTop(S) - 30) return a;
  }
  return null;
}
