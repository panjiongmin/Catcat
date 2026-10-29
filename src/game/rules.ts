import type { Cat } from './data';

// Starting numbers from the plan, per real hour.
export const DECAY = { food: 4, clean: 2, mood: 3 };
export const PRICES = { feed: 20, clean: 10 };
export const GAIN = { feed: 35, clean: 40, pet: 8, play: 12, playFood: 5 };
/** Pets that still count towards mood, per cat per hour. */
export const PET_MAX = 5;
/** Offline time is settled up to this many hours. */
const MAX_AWAY_H = 24 * 14;

const clamp100 = (v: number) => Math.max(0, Math.min(100, v));

// one slice of time: hunger and dirt build up, a hungry cat sulks twice as fast,
// health slides while it is starving or filthy and recovers slowly when all is well
function step(c: Cat, h: number) {
  c.food = clamp100(c.food - DECAY.food * h);
  c.clean = clamp100(c.clean - DECAY.clean * h);
  c.mood = clamp100(c.mood - DECAY.mood * h * (c.food < 30 ? 2 : 1));
  if (c.food < 20 || c.clean < 20) c.health = clamp100(c.health - 2 * h);
  else if (c.food >= 50 && c.clean >= 50 && c.mood >= 50) c.health = clamp100(c.health + h);
}

/** Advance a cat's stats by real elapsed hours, in quarter-hour slices so thresholds bite at the right time. */
export function settle(c: Cat, hours: number) {
  let h = Math.min(Math.max(0, hours), MAX_AWAY_H);
  while (h > 0) { const d = Math.min(.25, h); step(c, d); h -= d; }
}

export function bump(c: Cat, key: 'mood' | 'food' | 'clean' | 'health', by: number) {
  c[key] = clamp100(c[key] + by);
}

/** Record a pet; false once the cat has had enough for this hour. */
export function tryPet(c: Cat, now = Date.now()) {
  c.pets = c.pets.filter(t => now - t < 3.6e6);
  if (c.pets.length >= PET_MAX) return false;
  c.pets.push(now);
  return true;
}
