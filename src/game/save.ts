import { cats, state, starterCats, online, nowMs, myCats, buildings, boxes, STRAY_SPOTS, type Cat } from './data';
import { settle, comeBack, tickBoxes, newBox, ADULT_AGE } from './rules';
import type { Box } from './types';
import type { Back } from '../net/protocol';

// Local save. Step 3 moves the same shape to Cloudflare and takes the time from the server.
const KEY = 'catcat.save.v1';
const FIELDS = ['id', 'name', 'breed', 'coat', 'pers', 'lv', 'born', 'mood', 'health', 'food', 'clean', 'x', 'y', 'pets', 'away'] as const;
type CatSave = Pick<Cat, typeof FIELDS[number]>;
interface SaveData { v: 1; t: number; coins: number; cap: number; cats: CatSave[]; boxes?: Box[] }

export interface Away {
  ms: number;
  /** Cats that came home from work or the clinic in this stretch (single-player; online the server says so). */
  back: Back[];
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
    return d ? { ms: Math.max(0, nowMs() - d.t), before: d.cats, back: [] } : null;
  } catch { return null; }
}

export function save() {
  if (online.on) return saveSeen();
  const data: SaveData = { v: 1, t: state.t, coins: state.coins, cap: state.cap, boxes,
    cats: cats.map(c => Object.fromEntries(FIELDS.map(k => [k, c[k]])) as CatSave) };
  store.set(JSON.stringify(data));
}

export function resetSave() {
  store.del();
  cats.splice(0, cats.length, ...starterCats());
  boxes.splice(0, boxes.length, newBox('s1', Date.now())); // a new game starts with a stray to find
  state.coins = 500; state.cap = 6; state.t = Date.now();
}

/** Bring every cat up to now. Returns what changed while the player was away. */
export function settleNow(now = nowMs()): Away {
  const ms = Math.max(0, now - state.t);
  const before: Away['before'] = {}, back: Back[] = [];
  for (const c of cats) {
    before[c.id] = { mood: c.mood, health: c.health, food: c.food, clean: c.clean };
    settle(c, ms / 3.6e6, now);
    const a = !online.on && c.away && comeBack(c, now, buildings[c.away.kind].x);
    if (a) { state.coins += a.pay; back.push({ cat: c.id, kind: a.kind, pay: a.pay }); }
  }
  if (!online.on) tickBoxes(boxes, STRAY_SPOTS, ms / 3.6e6, now);
  state.t = now;
  return { ms, before, back };
}

/** Load the save if there is one, then settle the time since it was written. */
export function load(): Away | null {
  const raw = store.get();
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as SaveData;
    if (d.v !== 1 || !Array.isArray(d.cats) || !d.cats.length) return null;
    state.coins = d.coins; state.cap = d.cap; state.t = d.t;
    boxes.splice(0, boxes.length, ...(d.boxes ?? [newBox('s1', d.t)]));
    cats.splice(0, cats.length, ...d.cats.map(c => ({ ...c, pets: c.pets ?? [], born: c.born ?? d.t - ADULT_AGE })));
    return settleNow();
  } catch {
    return null;
  }
}
