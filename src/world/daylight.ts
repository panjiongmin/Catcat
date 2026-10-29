// Time of day follows the player's own clock: warm afternoon by day, lamps on at dusk, stars at night.
// Each keyframe is a full palette; in between, every colour and level is blended, so the street
// drifts from one mood to the next over an hour or so instead of switching.

interface Mood {
  /** Sky gradient, top to horizon. */
  sky: [string, string, string];
  hill: string; farWall: string; farWin: string; cloud: string;
  pave: string; paveLine: string; brick: string; brickLine: string; curb: string;
  strip: string; grass: string; grassLine: string;
  /** Window glass by day, lit window at night. */
  glass: string;
  /** Colour multiplied over the street, and how strongly. */
  tint: string; tintA: number;
  /** 0–1: window glow, lamps and fairy lights, stars and moon. */
  win: number; lamp: number; stars: number;
  /** Cats stay bright at night, just a touch dimmer. */
  cats: number;
}

const DAY: Mood = {
  sky: ['#FFE3BC', '#FFF0D6', '#FFF7E8'], hill: '#E3DDB0', farWall: '#F6E7CF', farWin: '#E8D4B8', cloud: '#FFFFFF',
  pave: '#F1DFC2', paveLine: '#DEC39C', brick: '#D9A988', brickLine: '#C48E6C', curb: '#E8C9A4',
  strip: '#C8D99A', grass: '#DCE6B0', grassLine: '#C9D898', glass: '#D4E9F0',
  tint: '#FFE2B8', tintA: .16, win: 0, lamp: 0, stars: 0, cats: 1,
};
const DAWN: Mood = { ...DAY,
  sky: ['#EDB9B4', '#F9D8C4', '#FFEEDA'], cloud: '#FFF1EA', glass: '#F2DDBE',
  tint: '#FFD3C0', tintA: .22, win: .35, lamp: .3,
};
const DUSK: Mood = {
  sky: ['#F2A47E', '#F9C99A', '#FFE0B8'], hill: '#D9C3A0', farWall: '#EBD2B4', farWin: '#FFD98A', cloud: '#FFE3CF',
  pave: '#EBCFA8', paveLine: '#D3B086', brick: '#D2A07E', brickLine: '#B98463', curb: '#E2BE98',
  strip: '#C3C78E', grass: '#D3D49F', grassLine: '#BFC388', glass: '#FFD98A',
  tint: '#FFB98C', tintA: .26, win: .85, lamp: 1, stars: 0, cats: 1,
};
const LATE: Mood = { ...DUSK,
  sky: ['#6E5A8E', '#B07A96', '#E9A88E'], cloud: '#C9A0B0', farWin: '#FFD27A',
  tint: '#B48CA8', tintA: .36, win: 1, stars: .45, cats: .95,
};
const NIGHT: Mood = {
  sky: ['#3A4275', '#55578A', '#8A7395'], hill: '#5A5878', farWall: '#6A6684', farWin: '#FFD27A', cloud: '#7A78A0',
  pave: '#C4B3A4', paveLine: '#A6958A', brick: '#9A8070', brickLine: '#7E6758', curb: '#B09B88',
  strip: '#76836C', grass: '#76826F', grassLine: '#66725F', glass: '#FFD27A',
  tint: '#6E6EB4', tintA: .44, win: 1, lamp: 1, stars: 1, cats: .9,
};

/** Hour of day → mood. The list wraps from 24 back to 0. */
const KEYS: [number, Mood][] = [
  [0, NIGHT], [4.5, NIGHT], [6, DAWN], [7.5, DAY], [16, DAY], [17.5, DUSK], [19, DUSK], [20, LATE], [21, NIGHT], [24, NIGHT],
];

const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');

function blend(a: Mood, b: Mood, t: number): Mood {
  const o = {} as Record<string, unknown>;
  for (const k in a) {
    const x = a[k as keyof Mood], y = b[k as keyof Mood];
    o[k] = typeof x === 'number' ? x + ((y as number) - x) * t
      : Array.isArray(x) ? x.map((c, i) => mixHex(c, (y as string[])[i], t))
      : mixHex(x, y as string, t);
  }
  return o as unknown as Mood;
}

export function moodAt(hour: number): Mood {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (KEYS[i + 1][0] <= h && i < KEYS.length - 2) i++;
  const [h0, a] = KEYS[i], [h1, b] = KEYS[i + 1];
  const t = (h - h0) / (h1 - h0);
  return blend(a, b, t * t * (3 - 2 * t));
}

/** What the HUD calls this part of the day. */
export function periodName(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  return h < 5 ? '深夜' : h < 8 ? '清晨' : h < 11 ? '上午' : h < 13 ? '中午' : h < 17 ? '下午' : h < 19 ? '傍晚' : h < 23 ? '夜里' : '深夜';
}

// ?hour=18.5 pins the clock (for trying the moods out); otherwise the device's local time
const pinned = Number(new URLSearchParams(location.search).get('hour'));
const hasPin = new URLSearchParams(location.search).has('hour') && Number.isFinite(pinned);
export function hourNow() {
  if (hasPin) return pinned;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

/** Push the current mood into the street's CSS variables. */
export function applyDaylight(root: HTMLElement, hour = hourNow()) {
  const m = moodAt(hour), s = root.style;
  m.sky.forEach((c, i) => s.setProperty(`--sky${i}`, c));
  const vars: (keyof Mood)[] = ['hill', 'farWall', 'farWin', 'cloud', 'pave', 'paveLine', 'brick', 'brickLine', 'curb', 'strip', 'grass', 'grassLine', 'glass', 'tint', 'tintA', 'win', 'lamp', 'stars', 'cats'];
  for (const k of vars) s.setProperty(`--${k}`, String(m[k]));
}
