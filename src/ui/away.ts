import { myCats, type Cat } from '../game/data';
import type { Away } from '../game/save';
import { portraitImg } from './portrait';
import { awayText, backText } from './work';
import { $ } from './hud';

/** Only worth a card after a real absence. */
const MIN_MS = 5 * 60 * 1000;

function duration(ms: number) {
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d) return `${d} 天 ${h % 24} 小时`;
  if (h) return `${h} 小时 ${m % 60} 分钟`;
  return `${m} 分钟`;
}

const delta = (label: string, a: number, b: number) => {
  const d = Math.round(b - a);
  return d ? `${label} ${d > 0 ? '+' : ''}${d}` : '';
};

function warning(c: Cat) {
  if (c.health < 40) return '没精神了，先喂饱、洗干净';
  if (c.food < 30) return '饿坏了';
  if (c.clean < 30) return '脏兮兮的';
  if (c.mood < 40) return '有点不开心';
  return '';
}

/** "While you were away" card: how long, and how each cat changed. */
export function showAway(away: Away) {
  if (away.ms < MIN_MS) return;
  const el = $('away');
  el.innerHTML = `<div class="away-card">
<h2 id="away-h">欢迎回来</h2>
<p>你离开了 ${duration(away.ms)}，猫咪们一直在小街上等你。</p>
${myCats().filter(c => away.before[c.id]).map(c => {
    const b = away.before[c.id];
    const ds = b ? [delta('饱食', b.food, c.food), delta('清洁', b.clean, c.clean), delta('心情', b.mood, c.mood), delta('健康', b.health, c.health)].filter(Boolean).join(' · ') : '';
    const home = away.back.find(x => x.cat === c.id);
    const w = c.away ? awayText(c) : home ? backText(home) : warning(c);
    return `<div class="away-row">${portraitImg(c)}<div><b>${c.name}</b><div class="d">${ds || '没什么变化'}</div>${w ? `<div class="${c.away || home ? 'd' : 'w'}">${w}</div>` : ''}</div></div>`;
  }).join('')}
<button class="btn main" id="away-ok">去看看它们</button>
</div>`;
  el.hidden = false;
  const close = () => { el.hidden = true; };
  $('away-ok').onclick = close;
  el.onclick = e => { if (e.target === el) close(); };
  $('away-ok').focus();
}
