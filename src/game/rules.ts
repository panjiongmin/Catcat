import type { Cat, StageId } from './types';

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

// one slice of time: hunger and dirt build up, a hungry cat sulks twice as fast,
// health slides while it is starving or filthy and recovers slowly when all is well
// kittens get hungry 30% faster, juniors' mood drops 20% slower, seniors' mood 20% slower but health comes back at half speed
function step(c: Cat, h: number, stage: StageId) {
  if (c.pers === 'lazy') h *= .8; // lazy cats run down 20% slower
  c.food = clamp100(c.food - DECAY.food * h * (stage === 'kitten' ? 1.3 : 1));
  c.clean = clamp100(c.clean - DECAY.clean * h);
  c.mood = clamp100(c.mood - DECAY.mood * h * (c.food < 30 ? 2 : 1) * (stage === 'junior' || stage === 'senior' ? .8 : 1));
  if (c.food < 20 || c.clean < 20) c.health = clamp100(c.health - 2 * h);
  else if (c.food >= 50 && c.clean >= 50 && c.mood >= 50) c.health = clamp100(c.health + h * (stage === 'senior' ? .5 : 1));
}

/** Advance a cat's stats by real elapsed hours up to `now`, in quarter-hour slices so thresholds bite at the right time. */
export function settle(c: Cat, hours: number, now = Date.now()) {
  let h = Math.min(Math.max(0, hours), MAX_AWAY_H);
  let t = now - h * 3.6e6;
  while (h > 0) { const d = Math.min(.25, h); t += d * 3.6e6; step(c, d, stageOf(c, t).id); h -= d; }
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
