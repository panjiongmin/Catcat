import { cats, state, starterCats, online, nowMs, myCats, type Cat } from './data';
import { settle, ADULT_AGE } from './rules';

// Local save. Step 3 moves the same shape to Cloudflare and takes the time from the server.
const KEY = 'catcat.save.v1';
const FIELDS = ['id', 'name', 'breed', 'coat', 'pers', 'lv', 'born', 'mood', 'health', 'food', 'clean', 'x', 'y', 'pets'] as const;
type CatSave = Pick<Cat, typeof FIELDS[number]>;
interface SaveData { v: 1; t: number; coins: number; cap: number; cats: CatSave[] }

export interface Away {
  ms: number;
  before: Record<string, Pick<Cat, 'mood' | 'health' | 'food' | 'clean'>>;
}

const SEEN = 'catcat.seen.v1';
const store = {
  get(k = KEY) { try { return localStorage.getItem(k); } catch { return null; } },
  set(v: string, k = KEY) { try { localStorage.setItem(k, v); } catch { /* private mode: play without saving */ } },
  del(k = KEY) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

/** The local single-player save, sent along when this browser first goes online so no progress is lost. */
export function localSave(): unknown {
  try { return JSON.parse(store.get() ?? 'null'); } catch { return null; }
}

/** Online, the server keeps the cats; this browser only remembers how they looked when it last saw them. */
function saveSeen() {
  store.set(JSON.stringify({ t: nowMs(), cats: Object.fromEntries(myCats().map(c => [c.id, { mood: c.mood, health: c.health, food: c.food, clean: c.clean }])) }), SEEN);
}
/** What changed since this browser last looked at the street. */
export function awaySinceSeen(): Away | null {
  try {
    const d = JSON.parse(store.get(SEEN) ?? 'null') as { t: number; cats: Away['before'] } | null;
    return d ? { ms: Math.max(0, nowMs() - d.t), before: d.cats } : null;
  } catch { return null; }
}

export function save() {
  if (online.on) return saveSeen();
  const data: SaveData = { v: 1, t: state.t, coins: state.coins, cap: state.cap,
    cats: cats.map(c => Object.fromEntries(FIELDS.map(k => [k, c[k]])) as CatSave) };
  store.set(JSON.stringify(data));
}

export function resetSave() {
  store.del();
  cats.splice(0, cats.length, ...starterCats());
  state.coins = 500; state.cap = 6; state.t = Date.now();
}

/** Bring every cat up to now. Returns what changed while the player was away. */
export function settleNow(now = nowMs()): Away {
  const ms = Math.max(0, now - state.t);
  const before: Away['before'] = {};
  for (const c of cats) {
    before[c.id] = { mood: c.mood, health: c.health, food: c.food, clean: c.clean };
    settle(c, ms / 3.6e6, now);
  }
  state.t = now;
  return { ms, before };
}

/** Load the save if there is one, then settle the time since it was written. */
export function load(): Away | null {
  const raw = store.get();
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as SaveData;
    if (d.v !== 1 || !Array.isArray(d.cats) || !d.cats.length) return null;
    state.coins = d.coins; state.cap = d.cap; state.t = d.t;
    cats.splice(0, cats.length, ...d.cats.map(c => ({ ...c, pets: c.pets ?? [], born: c.born ?? d.t - ADULT_AGE })));
    return settleNow();
  } catch {
    return null;
  }
}
