import { cats, online, nowMs, state, buildings, isMine, type Cat } from '../game/data';
import { CLINIC, JOBS, SICK, cantWork, payFor, sendAway, type JobId } from '../game/rules';
import type { AwayKind } from '../game/types';
import { send } from '../net/online';
import type { Back } from '../net/protocol';
import { closeCard, openCard } from './neighbours';
import { $, esc, toast } from './hud';

// Sending cats out: three jobs that pay when the shift ends, and the clinic for a cat that is unwell.
// Single-player applies it here; online the street server does and everyone sees the cat leave.

const PLACE: Record<AwayKind, string> = { cafe: '猫咖', murder: '剧本杀', mystery: '密室逃脱', clinic: '宠物医院' };
const FIT_NOTE: Record<JobId, string> = { cafe: '活泼的猫 +20%', murder: '高冷的猫 +20%', mystery: '最累，记得下班后让它吃饱' };

function left(ms: number) {
  const m = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(m / 60);
  return h ? `${h} 小时${m % 60 ? ` ${m % 60} 分` : ''}` : `${m} 分钟`;
}

/** Panel / dock line for a cat that is out. */
export function awayText(c: Cat, short = false) {
  const a = c.away!, rest = left(a.end - nowMs());
  if (short) return a.kind === 'clinic' ? '住院中' : '打工中';
  if (a.kind === 'clinic') return `${c.name}在宠物医院住院，还要 ${rest}，出院后健康回到 ${CLINIC.health}。`;
  return `${c.name}在${PLACE[a.kind]}打工，还有 ${rest}下班，能带回 ${a.pay} 猫币。`;
}

/** What a homecoming says, for toasts and the welcome-back card. */
export function backText(b: Back) {
  const c = cats.find(x => x.id === b.cat);
  const name = c?.name ?? '猫咪';
  if (b.kind === 'clinic') return `${name}出院回家了，精神好多了`;
  return b.to && b.to !== online.me ? `${name}从${PLACE[b.kind]}下班回来了` : `${name}从${PLACE[b.kind]}下班回来，赚了 ${b.pay} 猫币`;
}

export function onBack(list: Back[]) {
  const mine = list.filter(b => { const c = cats.find(x => x.id === b.cat); return c && isMine(c); });
  if (mine.length) toast(mine.map(backText).join('；'));
}

/** Leave now (single-player) or ask the server to. `after` refreshes the HUD, panel and dock. */
function go(c: Cat, kind: AwayKind, after: () => void) {
  closeCard();
  if (online.on) { send({ t: 'send', cat: c.id, to: kind }); return; }
  if (kind === 'clinic') state.coins -= CLINIC.price;
  sendAway(c, kind, nowMs());
  toast(kind === 'clinic' ? `${c.name}住院了，${CLINIC.hours} 小时后回家` : `${c.name}去${PLACE[kind]}上班了`);
  after();
}

export function workCard(c: Cat, after: () => void) {
  const why = cantWork(c, nowMs());
  const rows = (Object.keys(JOBS) as JobId[]).map(id => {
    const j = JOBS[id], pay = payFor(c, id);
    return `<li><button data-job="${id}" ${why ? 'disabled' : ''}><b>${j.name}</b><span class="jt">${j.hours} 小时 · ${FIT_NOTE[id]}</span><span class="jp">+${pay}</span></button></li>`;
  }).join('');
  openCard(`<h2>派${esc(c.name)}去哪儿打工？</h2>
<p>${why ? esc(why) + '。' : `打工时${esc(c.name)}不在街上，饿得比平时快。下班后自动回家，猫币直接到账。`}${c.mood < 40 ? ' 它现在心情不好，工钱只有六成。' : ''}</p>
<ul class="nb-list jobs">${rows}</ul>
<button class="btn" data-close>先不去</button>`);
  for (const b of $('modal').querySelectorAll<HTMLButtonElement>('[data-job]')) b.onclick = () => go(c, b.dataset.job as JobId, after);
}

export function clinicCard(c: Cat, after: () => void) {
  const sick = c.health < SICK, poor = state.coins < CLINIC.price;
  openCard(`<h2>送${esc(c.name)}去宠物医院？</h2>
<p>${sick ? `${esc(c.name)}生病了，不能打工。` : `${esc(c.name)}的健康只有 ${Math.round(c.health)}。`}住院 ${CLINIC.hours} 小时，医生会照顾它吃饭、洗澡，出院时健康回到 ${CLINIC.health}。猫咪不会死掉，只是会一直没精神。</p>
<button class="btn main" id="clinic-ok" ${poor ? 'disabled' : ''}>住院<small>−${CLINIC.price} 猫币${poor ? ' · 猫币不够' : ''}</small></button>
<button class="btn" data-close>再等等</button>`);
  $('clinic-ok').onclick = () => go(c, 'clinic', after);
}

/** Where the camera should go for a cat that is out: the door of the place it went. */
export const awaySpot = (c: Cat) => buildings[c.away!.kind];
