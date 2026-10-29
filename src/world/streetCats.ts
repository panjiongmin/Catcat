import CatKit, { type ClipName, type Pose } from '../cats/catkit';
import { nowMs, type Cat } from '../game/data';
import { stageOf } from '../game/rules';
import type { Cmd } from '../net/protocol';
import { CAT_SCALE, LANE, W, OUT } from './config';
import { cam, view } from './camera';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => t * t * (3 - 2 * t);
const cycleLen = (d: { D: number; B: number }) => d.D / d.B;

export type Mode = 'roam' | 'pet' | 'feed' | 'play' | 'clean';
type Dir = 1 | -1;

/** A cat on the street: where it is, which clip it plays, and what it is heading for. */
export interface Actor {
  cat: Cat;
  dir: Dir;
  act: ClipName;
  /** Seconds into the current clip (timed clips); `phase` counts gait cycles walked (distance clips). */
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
  /** Pose drawn last frame, and the snapshot the current clip blends in from. */
  last: Pose | null;
  from: Pose | null;
  blend: number;
  blendDur: number;
  /** Leftover offset after a correction from the network, eased away so cats never visibly jump. */
  ox: number;
  oy: number;
}

export const actors: Actor[] = [];

export function addActor(cat: Cat): Actor {
  const a: Actor = { cat, dir: Math.random() < .5 ? 1 : -1, act: 'idle', t: rand(0, 2), phase: 0, left: rand(1, 3),
    tx: cat.x, ty: cat.y, next: 'walk', turnTo: 1, held: false, mode: 'roam', busy: 0,
    last: null, from: null, blend: 0, blendDur: 0, ox: 0, oy: 0 };
  actors.push(a);
  return a;
}

/** Match the actors to a cat list: new cats get an actor, departed ones lose theirs. */
export function syncActors(list: Cat[]) {
  for (let i = actors.length - 1; i >= 0; i--) if (!list.includes(actors[i].cat)) actors.splice(i, 1);
  for (const c of list) if (!actors.some(a => a.cat === c)) addActor(c);
}

// ---------- who decides ----------
// Offline, this tab decides for every cat. Online, one tab (the street's driver) decides and the
// others replay its commands, so everyone sees the same cat doing the same thing.
let driving = true;
let emit: ((c: Cmd) => void) | null = null;
export const setDriver = (on: boolean) => { driving = on; };
export const onDecide = (f: ((c: Cmd) => void) | null) => { emit = f; };
/** Text on a cat's name tag (online streets add the owner). */
let tagOf = (c: Cat) => c.name;
export const setTag = (f: (c: Cat) => string) => { tagOf = f; };

const scaleOf = () => CAT_SCALE * CatKit.scale;
/** Point the engine at this cat: coat, personality and how grown up it is. */
const useCat = (c: Cat) => CatKit.use(c.coat, c.pers, stageOf(c, nowMs()).id);

// getting down and up again takes longer than a change of gait
const BLEND: Partial<Record<ClipName, number>> = { sit: .45, sleep: .8, eat: .35, pet: .35 };

/** Switch clip, easing in from whatever pose the cat was last drawn in. */
function setAct(a: Actor, act: ClipName, dur?: number) {
  if (a.act === act) return;
  const leaving = a.act;
  a.from = a.last; a.blend = 0;
  a.blendDur = dur ?? Math.max(BLEND[act] ?? .25, leaving === 'sleep' ? .7 : leaving === 'sit' ? .4 : 0);
  a.act = act; a.t = 0; a.phase = 0;
}

/** Face the other way; the snapshot is mirrored too so the blend does not swing the body round again. */
function setDir(a: Actor, dir: Dir) {
  if (dir === a.dir) return;
  a.dir = dir;
  if (a.last) a.last.bodyFlip = -a.last.bodyFlip;
}

// pick the next thing to do; personality decides how often it naps, sits, hops or runs
function decide(a: Actor) {
  const c = a.cat, p = c.pers, r = Math.random();
  const lazy = p === 'lazy', lively = p === 'lively';
  const tired = c.mood < 40 || c.health < 40;
  const odds = { sleep: lazy ? .28 : tired ? .2 : lively ? .04 : .1, sit: lazy ? .18 : p === 'cool' ? .24 : .1, idle: .12, jump: lively && !tired ? .12 : .05 };
  const base = { id: c.id, x: c.x, y: c.y, dir: a.dir };
  let cmd: Cmd, acc = odds.sleep;
  if (r < acc) cmd = { ...base, act: 'sleep', left: lazy ? rand(14, 30) : rand(8, 18) };
  else if (r < (acc += odds.sit)) cmd = { ...base, act: 'sit', left: rand(4, 10) };
  else if (r < (acc += odds.idle)) cmd = { ...base, act: 'idle', left: rand(1.5, 4) };
  else if (r < (acc += odds.jump)) cmd = { ...base, act: 'jump', left: CatKit.CLIPS.jump.secs() };
  else {
    const dist = rand(160, lazy ? 360 : 560) * (Math.random() < .5 ? -1 : 1);
    const tx = clamp(c.x + dist, 220, W - 220), ty = rand(LANE[0], LANE[1]);
    const far = Math.abs(tx - c.x) > 300, kind = Math.random();
    const next: ClipName = far && !tired && kind < (lively ? .6 : lazy ? .05 : .3) ? 'run' : !lazy && kind > .78 ? 'sneak' : 'walk';
    const dir: Dir = tx >= c.x ? 1 : -1;
    cmd = dir !== a.dir ? { ...base, act: 'turn', left: CatKit.CLIPS.turn.secs(), tx, ty, next, turnTo: dir }
      : { ...base, act: next, left: 99, tx, ty };
  }
  applyCmd(a, cmd);
  emit?.(cmd);
}

/** Start a decided action, whether this tab decided it or it came from the street's driver. */
export function applyCmd(a: Actor, cmd: Cmd) {
  const c = a.cat;
  // pick up from where the driver saw the cat, easing out any difference
  a.ox += c.x - cmd.x; a.oy += c.y - cmd.y;
  c.x = cmd.x; c.y = cmd.y;
  if (a.busy > 0) return;
  setDir(a, cmd.dir);
  if (cmd.tx != null && cmd.ty != null) { a.tx = cmd.tx; a.ty = cmd.ty; }
  if (cmd.next) a.next = cmd.next;
  if (cmd.turnTo) a.turnTo = cmd.turnTo;
  setAct(a, cmd.act);
  a.left = cmd.left;
}

/** Hold a cat in place (selected) or release it back to roaming. A sleeping or sitting cat stays put.
 *  On an online street the ring is only a highlight: the cat keeps doing what everyone else sees. */
export function hold(a: Actor, on: boolean) {
  a.held = on;
  if (on && !emit && !a.busy && CatKit.CLIPS[a.act].dist) setAct(a, 'idle');
}
const pinned = (a: Actor) => a.held && !emit;

const MODE_CLIP: Record<Exclude<Mode, 'roam'>, ClipName> = { pet: 'pet', feed: 'eat', play: 'jump', clean: 'sit' };
/** Play a short interaction in place. */
export function perform(a: Actor, mode: Exclude<Mode, 'roam'>, secs: number) {
  // a turn cut short would leave the body mirrored, so settle the facing first
  if (a.act === 'turn') setDir(a, a.turnTo);
  a.mode = mode; a.busy = secs;
  setAct(a, MODE_CLIP[mode]);
}

export function update(dt: number) {
  for (const a of actors) {
    const c = a.cat;
    useCat(c);
    a.blend += dt;
    if (a.busy > 0) {
      a.t += dt; a.busy -= dt;
      if (a.busy <= 0) { a.busy = 0; a.mode = 'roam'; setAct(a, a.held ? 'sit' : 'idle'); a.left = rand(1.5, 3); }
      continue;
    }
    const k = Math.min(1, dt * 8); a.ox -= a.ox * k; a.oy -= a.oy * k;
    const cl = CatKit.CLIPS[a.act];
    if (pinned(a) && a.act !== 'turn') { if (cl.dist) setAct(a, 'idle'); a.t += dt; continue; }
    if (cl.dist) {
      // move exactly one gait stride of ground per cycle so paws stay planted
      const S = scaleOf(), stride = cycleLen(cl.dist) * S, v = stride / cl.secs();
      const dx = a.tx - c.x, dy = a.ty - c.y, d = Math.hypot(dx, dy), step = Math.min(d, v * dt);
      if (d > 0) { c.x += dx / d * step; c.y += dy / d * step; }
      a.phase += step / stride;
      if (d - step < .5) { setAct(a, 'idle'); a.left = c.pers === 'lazy' ? rand(2, 4) : rand(1, 3); }
      continue;
    }
    a.t += dt; a.left -= dt;
    if (a.left <= 0) {
      if (a.act === 'turn') { setDir(a, a.turnTo); setAct(a, a.next, .15); a.left = 99; }
      else if (driving) decide(a);
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
  let p = CatKit.poseAt(a.act, clipT(a));
  const c = a.cat;
  if (a.mode === 'clean') { p.eye = 'closed'; p.mouth = 'w'; }
  else if (a.mode === 'roam' && a.act !== 'sleep') {
    // how it feels shows on its face
    if (c.health < 40) p.eye = 'sleepy';
    if (c.mood < 40 || c.food < 25) p.mouth = 'frown';
  }
  if (a.from && a.blend < a.blendDur) p = CatKit.mix(a.from, p, ease(a.blend / a.blendDur));
  p.faceFlip = a.dir; // keep the face un-mirrored so calico patches never swap sides
  a.last = p;
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

function drawBowl(ctx: CanvasRenderingContext2D, a: Actor, S: number) {
  const { y } = a.cat, bx = a.cat.x + a.dir * 46 * S;
  ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.lineJoin = 'round';
  ctx.fillStyle = '#FF9F43';
  ctx.beginPath(); ctx.moveTo(bx - 15, y - 11); ctx.lineTo(bx + 15, y - 11); ctx.lineTo(bx + 11, y + 1); ctx.lineTo(bx - 11, y + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#B5763C'; ctx.beginPath(); ctx.ellipse(bx, y - 11, 13, 3.4, 0, 0, Math.PI * 2); ctx.fill();
}

function drawYarn(ctx: CanvasRenderingContext2D, a: Actor, S: number) {
  const { y } = a.cat, yx = a.cat.x + a.dir * (70 + 10 * Math.sin(a.t * 3)) * S, yy = y - 9 - Math.abs(Math.sin(a.t * 4)) * 10;
  ctx.lineWidth = 2.5; ctx.strokeStyle = OUT;
  ctx.fillStyle = '#FF8FAB'; ctx.beginPath(); ctx.arc(yx, yy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
  const r = a.t * 6;
  ctx.beginPath(); ctx.arc(yx, yy, 5, r, r + 2); ctx.stroke(); ctx.beginPath(); ctx.arc(yx, yy, 5, r + 3, r + 4.6); ctx.stroke();
}

function drawBubbles(ctx: CanvasRenderingContext2D, a: Actor, S: number) {
  const { x, y } = a.cat;
  ctx.lineWidth = 1.6; ctx.strokeStyle = '#7FB8D8'; ctx.fillStyle = 'rgba(205,232,245,.75)';
  for (let i = 0; i < 7; i++) {
    const u = (a.t * .5 + i / 7) % 1, ang = i * 2.4;
    const bx = x + Math.cos(ang) * 46 * S * (.6 + u * .5), by = y - 40 * S - Math.sin(ang) * 30 * S - u * 26;
    ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.arc(bx, by, 3 + (i % 3) * 1.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawAbove(ctx: CanvasRenderingContext2D, a: Actor, x: number, top: number) {
  let lift = 0;
  if (a.mode === 'pet') {
    ctx.fillStyle = '#FF6B8A';
    for (let i = 0; i < 3; i++) {
      const u = (a.t * .7 + i / 3) % 1;
      ctx.globalAlpha = 1 - u; heart(ctx, x + (i - 1) * 16 + Math.sin(u * 6 + i) * 4, top - 10 - u * 30, 1.3 - i * .15);
    }
    ctx.globalAlpha = 1; lift = 40;
  } else if (a.act === 'sleep') {
    ctx.fillStyle = '#7A6558'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < 2; i++) {
      const u = (a.t * .35 + i * .5) % 1;
      ctx.globalAlpha = Math.min(1, (1 - u) * 1.6);
      ctx.font = `${16 - i * 4}px "ZCOOL KuaiLe", sans-serif`;
      ctx.fillText('Z', x + a.dir * (22 + u * 14) + i * 6 * a.dir, top - u * 26);
    }
    ctx.globalAlpha = 1;
  }
  // name tag
  const name = tagOf(a.cat);
  ctx.font = '900 13px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  const w = ctx.measureText(name).width + 18, ty = top - 8 - lift - 22;
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  roundRect(ctx, x - w / 2, ty, w, 22, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name, x, ty + 11.5);
}

/** Height of a standing cat above its feet in world units, for hit tests. */
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
    const x = a.cat.x + a.ox, y = a.cat.y + a.oy;
    if (x < left || x > right) continue;
    useCat(a.cat);
    const S = scaleOf();
    if (a.held) {
      ctx.strokeStyle = '#E8781F'; ctx.lineWidth = 3; ctx.globalAlpha = .55 + .35 * Math.sin(time * 5);
      ctx.beginPath(); ctx.ellipse(x, y + 1, 52 * S, 12 * S, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    const p = poseFor(a);
    ctx.save(); ctx.translate(x, y); ctx.scale(CAT_SCALE * a.dir, CAT_SCALE);
    CatKit.draw(ctx, p);
    ctx.restore();
    if (a.mode === 'feed') drawBowl(ctx, a, S);
    if (a.mode === 'play') drawYarn(ctx, a, S);
    if (a.mode === 'clean') drawBubbles(ctx, a, S);
    // the tag rides just above the head, wherever the pose puts it
    drawAbove(ctx, a, x, y + (p.ky - p.lift - 40 * CatKit.G.head) * S);
  }
}

/** Front-most cat under a world point. */
export function actorAt(wx: number, wy: number): Actor | null {
  const order = [...actors].sort((p, q) => q.cat.y - p.cat.y);
  for (const a of order) {
    useCat(a.cat);
    const S = scaleOf(), { x, y } = a.cat;
    if (Math.abs(wx - x) < 62 * S && wy < y + 10 && wy > y - catTop(S) - 30) return a;
  }
  return null;
}
