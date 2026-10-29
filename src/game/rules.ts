import type { Cat } from './data';

// Starting numbers from the plan (per real hour). Step 2 settles these from timestamps on load.
export const DECAY = { food: 4, clean: 2, mood: 3 };
export const PRICES = { feed: 20 };
export const GAIN = { feed: 35, pet: 8, play: 12, playFood: 5 };

const clamp100 = (v: number) => Math.max(0, Math.min(100, v));

export function decay(c: Cat, hours: number) {
  c.food = clamp100(c.food - DECAY.food * hours);
  c.clean = clamp100(c.clean - DECAY.clean * hours);
  c.mood = clamp100(c.mood - DECAY.mood * hours * (c.food < 30 ? 2 : 1));
}

export function bump(c: Cat, key: 'mood' | 'food' | 'clean' | 'health', by: number) {
  c[key] = clamp100(c[key] + by);
}
