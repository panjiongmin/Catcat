import type { AwayKind, Box, Cat, PersId, StageId } from './types';

// Starting numbers from the plan, per real hour.
export const DECAY = { food: 4, clean: 2, mood: 3 };
export const PRICES = { feed: 20, clean: 10 };
export const GAIN = { feed: 35, clean: 40, pet: 8, play: 12, playFood: 5 };
/** Pets that still count towards mood, per cat per hour. */
export const PET_MAX = 5;
/** Offline time is settled up to this many hours. */
const MAX_AWAY_H = 24 * 14;

const clamp100 = (v: number) => Math.max(0, Math.min(100, v));

const DAY = 864e5;
/** Growth stages by real age: when each one ends (days). */
export const STAGES: { id: StageId; name: string; until: number; note: string }[] = [
  { id: 'kitten', name: '幼崽', until: 2, note: '长身体，饿得快；逗它玩格外开心' },
  { id: 'junior', name: '少年', until: 7, note: '精力旺盛，心情掉得慢一点' },
  { id: 'adult', name: '成年', until: 60, note: '' },
  { id: 'senior', name: '老年', until: Infinity, note: '性子淡定，生病了恢复得慢' },
];
/** A cat from a save that predates growth counts as grown up. */
export const ADULT_AGE = 10 * DAY;
export const stageOf = (c: Cat, now = Date.now()) => STAGES.find(s => now - c.born < s.until * DAY) ?? STAGES[STAGES.length - 1];
/** Time left until the next stage, or 0 for seniors. */
export function growsIn(c: Cat, now = Date.now()) {
  const s = stageOf(c, now);
  return Number.isFinite(s.until) ? Math.max(0, c.born + s.until * DAY - now) : 0;
}

// ---------- work and the clinic ----------
export type JobId = Exclude<AwayKind, 'clinic'>;
/** Shifts: how long, base pay, and which temperament does it best (building ids match data.ts). */
export const JOBS: Record<JobId, { name: string; hours: number; pay: number; fit?: PersId }> = {
  cafe: { name: '猫咖', hours: 1, pay: 60, fit: 'lively' },
  murder: { name: '剧本杀', hours: 3, pay: 200, fit: 'cool' },
  mystery: { name: '密室逃脱', hours: 8, pay: 500 },
};
export const CLINIC = { hours: 2, price: 80, health: 80 };
/** Below this a cat is ill: no work until the clinic has seen it. */
export const SICK = 25;
/** Working burns food half again as fast (−6 an hour instead of −4). */
const WORK_HUNGER = 1.5;

/** Pay for one shift, decided when the cat sets off: +20% at the job that suits it, lazy −10%, glum −40%. */
export function payFor(c: Cat, job: JobId) {
  const j = JOBS[job];
  let p = j.pay * (j.fit === c.pers ? 1.2 : 1) * (c.pers === 'lazy' ? .9 : 1);
  if (c.mood < 40) p *= .6;
  return Math.round(p);
}

/** Why this cat can't go to work right now, or '' if it can. */
export function cantWork(c: Cat, now = Date.now()) {
  if (c.away) return `${c.name}还没回来`;
  if (stageOf(c, now).id === 'kitten') return `${c.name}还是幼崽，长成少年才能打工`;
  if (c.health < SICK) return `${c.name}生病了，先送去宠物医院`;
  if (c.health < 40) return `${c.name}身体不太舒服，养一养再去`;
  if (c.food < 30) return `${c.name}饿着肚子没法上班，先喂饱它`;
  return '';
}

export function sendAway(c: Cat, kind: AwayKind, now: number, by?: string) {
  const hours = kind === 'clinic' ? CLINIC.hours : JOBS[kind].hours;
  c.away = { kind, start: now, end: now + hours * 3.6e6, pay: kind === 'clinic' ? 0 : payFor(c, kind), by };
}

/** Back from work or the clinic once its time is up. Returns what happened, for the coins and the toast. */
export function comeBack(c: Cat, now: number, x: number) {
  const a = c.away;
  if (!a || now < a.end) return null;
  delete c.away;
  if (a.kind === 'clinic') { c.health = Math.max(c.health, CLINIC.health); c.mood = Math.max(c.mood, 50); }
  c.x = x;
  return a;
}

// ---------- strays ----------
/** A stray turns up about every 8 hours, at most 2 boxes at once, and wanders off after 18–36 hours. */
export const STRAY = { perHour: 1 / 8, stayH: 36, max: 2 };
/** Move the boxes along by `hours`: expired strays leave, maybe a new one arrives. True if anything changed. */
export function tickBoxes(boxes: Box[], spots: string[], hours: number, now: number, rand = Math.random) {
  let changed = false;
  for (let i = boxes.length - 1; i >= 0; i--) if (boxes[i].until <= now) { boxes.splice(i, 1); changed = true; }
  const free = spots.filter(s => !boxes.some(b => b.id === s));
  if (boxes.length < STRAY.max && free.length && rand() < 1 - Math.exp(-STRAY.perHour * Math.min(hours, STRAY.stayH))) {
    boxes.push(newBox(free[Math.floor(rand() * free.length)], now, rand));
    changed = true;
  }
  return changed;
}
export const newBox = (id: string, now: number, rand = Math.random): Box => ({ id, until: now + STRAY.stayH * 3.6e6 * (.5 + rand() * .5) });

// one slice of time: hunger and dirt build up, a hungry cat sulks twice as fast,
// health slides while it is starving or filthy and recovers slowly when all is well
// kittens get hungry 30% faster, juniors' mood drops 20% slower, seniors' mood 20% slower but health comes back at half speed
function step(c: Cat, h: number, stage: StageId, t: number) {
  const away = c.away && t <= c.away.end ? c.away.kind : null;
  if (away === 'clinic') return; // the clinic feeds and grooms it
  if (c.pers === 'lazy') h *= .8; // lazy cats run down 20% slower
  c.food = clamp100(c.food - DECAY.food * h * (stage === 'kitten' ? 1.3 : 1) * (away ? WORK_HUNGER : 1));
  c.clean = clamp100(c.clean - DECAY.clean * h);
  c.mood = clamp100(c.mood - DECAY.mood * h * (c.food < 30 ? 2 : 1) * (stage === 'junior' || stage === 'senior' ? .8 : 1));
  if (c.food < 20 || c.clean < 20) c.health = clamp100(c.health - 2 * h);
  else if (c.food >= 50 && c.clean >= 50 && c.mood >= 50) c.health = clamp100(c.health + h * (stage === 'senior' ? .5 : 1));
}

/** Advance a cat's stats by real elapsed hours up to `now`, in quarter-hour slices so thresholds bite at the right time. */
export function settle(c: Cat, hours: number, now = Date.now()) {
  let h = Math.min(Math.max(0, hours), MAX_AWAY_H);
  let t = now - h * 3.6e6;
  while (h > 0) { const d = Math.min(.25, h); t += d * 3.6e6; step(c, d, stageOf(c, t).id, t); h -= d; }
}

export function bump(c: Cat, key: 'mood' | 'food' | 'clean' | 'health', by: number) {
  c[key] = clamp100(c[key] + by);
}

/** Aloof cats only take half the mood from a pet. */
export const petGain = (c: Cat) => c.pers === 'cool' ? GAIN.pet / 2 : GAIN.pet;
/** Kittens love a game: half again as much mood from play. */
export const playGain = (c: Cat, now = Date.now()) => stageOf(c, now).id === 'kitten' ? GAIN.play * 1.5 : GAIN.play;

/** Record a pet; false once the cat has had enough for this hour. */
export function tryPet(c: Cat, now = Date.now()) {
  c.pets = c.pets.filter(t => now - t < 3.6e6);
  if (c.pets.length >= PET_MAX) return false;
  c.pets.push(now);
  return true;
}
