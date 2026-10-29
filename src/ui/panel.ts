import { cats, buildings, strays, state, online, nowMs, isMine, myCats, ownCats, ownerName, PERS_NAME, type Cat, type Stray } from '../game/data';
import { bump, GAIN, PRICES, PET_MAX, petGain, playGain, tryPet, stageOf, growsIn, STAGES, SICK } from '../game/rules';
import { save } from '../game/save';
import { send } from '../net/online';
import type { CareAct, S2C } from '../net/protocol';
import { cam, flyTo, isPhone, pad, view } from '../world/camera';
import { actors, hold, perform, type Actor } from '../world/streetCats';
import { portraitImg } from './portrait';
import { coAction, coControls, coTag } from './coraise';
import { awaySpot, awayText, clinicCard, workCard } from './work';
import { $, toast } from './hud';

type Sel = { cat: Cat } | { b: string } | { stray: Stray } | null;
let sel: Sel = null;

const panel = () => $('panel');
const actorOf = (c: Cat) => actors.find(a => a.cat === c) as Actor;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** Keep the focused thing clear of the panel: left of it on PC, above it on phones. */
const panelOffset = () => {
  if (panel().hidden) return { x: 0, y: 0 };
  if (view.w >= 900) { pad.bottom = 140; return { x: -190, y: 0 }; }
  pad.bottom = panel().offsetHeight + 120;
  // phones: centre in the strip between the top HUD (~70px) and the sheet, which sits 100px above the bottom
  return { x: 0, y: (70 - 100 - panel().offsetHeight) / 2 };
};

const barColor = (v: number) => v < 35 ? '#E05A4F' : v < 60 ? '#F2B33D' : '#6CC48F';
const bar = (label: string, v: number) => `<div class="bar"><span>${label}</span><div class="t"><div class="f" style="width:${v}%;background:${barColor(v)}"></div></div><b>${Math.round(v)}</b></div>`;
const bars = (c: Cat) => bar('心情', c.mood) + bar('健康', c.health) + bar('饱食', c.food) + bar('清洁', c.clean);

function statusText(c: Cat) {
  if (c.away) return awayText(c);
  if (c.msg) return c.msg;
  const a = actorOf(c);
  if (a.act === 'sleep') return `${c.name}睡得正香，肚子一起一伏。`;
  if (c.health < SICK) return `${c.name}生病了，蔫蔫地趴着。送去宠物医院住两个小时就好。`;
  if (c.health < 40) return `${c.name}没什么精神，吃饱、弄干净以后会慢慢恢复。`;
  if (c.food < 35) return `${c.name}饿了，一直盯着你看。`;
  if (c.clean < 35) return `${c.name}身上脏兮兮的，该洗洗了。`;
  if (c.mood < 40) return `${c.name}有点不开心，陪它玩一会儿吧。`;
  if (a.mode !== 'roam') return `${c.name}正在陪你玩。`;
  if (a.act === 'sit') return `${c.name}端坐在路边，看着来来往往的人。`;
  if (c.pers === 'lazy') return `${c.name}懒洋洋地趴着，尾巴拖在地上。`;
  if (c.pers === 'cool') return `${c.name}抬着头巡视小街，假装没看见你。`;
  return `${c.name}在小街上跑来跑去，停不下来。`;
}

export function refreshHud() {
  $('coins').textContent = fmt(state.coins);
  $('pop').textContent = `${ownCats().length}/${state.cap}`;
}

function clearSel() {
  if (sel && 'cat' in sel) hold(actorOf(sel.cat), false);
  sel = null;
}

export function closePanel() {
  panel().hidden = true;
  pad.bottom = 140;
  clearSel();
  renderDock();
}

const petLeft = (c: Cat) => {
  const n = PET_MAX - c.pets.filter(t => nowMs() - t < 3.6e6).length;
  return n > 0 ? `心情 +${petGain(c)} · 还能 ${n} 次` : '摸够了，过会儿再来';
};

function span(ms: number) {
  const h = Math.ceil(ms / 3.6e6);
  return h >= 48 ? `${Math.round(h / 24)} 天` : h >= 24 ? `1 天 ${h - 24} 小时` : `${h} 小时`;
}
/** Growth line: what this stage means and how long until the next one. */
function growText(c: Cat) {
  const now = nowMs(), s = stageOf(c, now), i = STAGES.indexOf(s), left = growsIn(c, now);
  const next = left ? `再过 ${span(left)}长成${STAGES[i + 1].name}` : '';
  return [next, s.note].filter(Boolean).join(' · ');
}

function renderCatPanel(c: Cat) {
  const mine = isMine(c);
  panel().innerHTML = `<button class="p-close" aria-label="关闭">×</button>
<div class="p-head">${portraitImg(c)}<div><div class="p-name">${c.name}</div><div class="tags">${coTag(c)}<span class="tag t4">${stageOf(c, nowMs()).name}</span><span class="tag t1">${PERS_NAME[c.pers]}</span><span class="tag t2">Lv.${c.lv}</span><span class="tag">${c.breed}</span></div></div></div>
<div class="p-status" id="p-status">${statusText(c)}</div>
<div class="bars" id="p-bars">${bars(c)}</div>
<div class="p-grow" id="p-grow">${growText(c)}</div>
${c.away ? '' : `<div class="acts">
<button class="btn" data-act="pet">撸猫<small>${petLeft(c)}</small></button>
${mine ? `<button class="btn" data-act="play">逗猫<small>心情 +${playGain(c, nowMs())}</small></button>` : ''}
<button class="btn" data-act="feed">喂食<small>−${PRICES.feed} 猫币</small></button>
${mine ? `<button class="btn" data-act="clean">洗香香<small>−${PRICES.clean} 猫币</small></button>
<button class="btn main wide" data-act="work">派去打工<small>猫咖 · 剧本杀 · 密室逃脱</small></button>
${c.health < 60 ? `<button class="btn wide" data-act="clinic">送去宠物医院<small>${c.health < SICK ? '生病了 · ' : ''}−80 猫币</small></button>` : ''}` : `<p class="p-note">逗猫、洗澡和派去打工只有主人能做。你撸它、喂它，${ownerName(c)}都会收到提示。</p>`}
</div>${coControls(c)}`}`;
}

const MODE_SECS: Record<CareAct, number> = { pet: 2.4, feed: 3, play: 2.6, clean: 2.6 };
/** What the panel says after a care action, from the point of view of whoever did it. */
function careLine(c: Cat, act: CareAct) {
  if (act === 'pet') return c.pers === 'cool' ? `${c.name}勉强让你摸了两下，尾巴却偷偷翘了起来。` : c.pers === 'lazy' ? `${c.name}翻了个身，呼噜声越来越响。` : `${c.name}一直往你手里蹭，开心得眯起眼。`;
  if (act === 'feed') return `${c.name}吃得头都不抬，吃完还舔了舔碗。`;
  if (act === 'play') return c.pers === 'lazy' ? `${c.name}看了毛线球半天，终于伸爪拍了一下。` : `${c.name}扑向毛线球，玩得停不下来。`;
  return c.pers === 'cool' ? `${c.name}一脸嫌弃地洗完了澡，毛却蓬松得发亮。` : `${c.name}被洗得香喷喷的，毛都蓬起来了。`;
}
const VERB: Record<CareAct, string> = { pet: '摸了摸', feed: '喂了', play: '陪玩了', clean: '洗了' };

/** The server confirmed a care action (ours or a neighbour's): update the cat and play it everywhere. */
export function onDid(m: Extract<S2C, { t: 'did' }>) {
  const c = cats.find(x => x.id === m.cat);
  if (!c) return;
  Object.assign(c, m.stats);
  if (m.by === online.me) {
    if (m.coins != null) state.coins = m.coins;
    c.msg = careLine(c, m.act);
    refreshHud();
  } else if (isMine(c)) {
    toast(`${m.byName}${VERB[m.act]}你的${c.name}`);
    c.msg = `${m.byName}刚刚${VERB[m.act]}${c.name}。`;
  }
  perform(actorOf(c), m.act, MODE_SECS[m.act]);
  if (sel && 'cat' in sel && sel.cat === c) renderCatPanel(c);
  renderDock();
}

/** Redraw the open cat panel (after a 合养 change). */
export function rerenderCat() { if (sel && 'cat' in sel && !panel().hidden) renderCatPanel(sel.cat); }

/** A cat in the open panel may have moved away with its owner. */
export function pruneSel() {
  if (sel && 'cat' in sel && !cats.includes(sel.cat)) { sel = null; panel().hidden = true; pad.bottom = 140; }
}

export function selectCat(id: string) {
  clearSel();
  const c = cats.find(x => x.id === id)!;
  sel = { cat: c };
  c.msg = '';
  hold(actorOf(c), true);
  panel().hidden = false;
  renderCatPanel(c);
  renderDock();
  // a cat that is out: look at the place it went
  if (c.away) { const b = awaySpot(c); flyTo(b.x, b.y - 170, Math.max(cam.k, 1), panelOffset()); }
  else flyTo(c.x, c.y - 45, isPhone() ? 1.15 : Math.max(cam.k, 1.3), panelOffset());
}

function catAction(c: Cat, act: string) {
  const a = actorOf(c);
  if (act.startsWith('co-')) return coAction(c, act);
  const after = () => { save(); refreshHud(); renderCatPanel(c); renderDock(); };
  if (act === 'work') return workCard(c, after);
  if (act === 'clinic') return clinicCard(c, after);
  if (c.away) return;
  if (a.busy > 0) return;
  // online: the street server checks and applies it, then everyone sees it through onDid
  if (online.on) { if (act === 'pet' || act === 'feed' || act === 'play' || act === 'clean') send({ t: 'do', cat: c.id, act }); return; }
  if (act === 'pet') {
    if (!tryPet(c)) {
      toast(`${c.name}被摸烦了，过一会儿再来吧`);
      c.msg = c.pers === 'cool' ? `${c.name}甩了甩尾巴，转过头不理你。` : `${c.name}躲开了你的手，今天已经摸够啦。`;
      renderCatPanel(c); return;
    }
    bump(c, 'mood', petGain(c));
    c.msg = careLine(c, 'pet');
    perform(a, 'pet', MODE_SECS.pet);
  } else if (act === 'feed') {
    if (c.food >= 95) { toast(`${c.name}吃不下了`); return; }
    if (state.coins < PRICES.feed) { toast('猫币不够了'); return; }
    state.coins -= PRICES.feed; refreshHud();
    bump(c, 'food', GAIN.feed);
    c.msg = careLine(c, 'feed');
    perform(a, 'feed', MODE_SECS.feed);
  } else if (act === 'play') {
    bump(c, 'mood', playGain(c, nowMs())); bump(c, 'food', -GAIN.playFood);
    c.msg = careLine(c, 'play');
    perform(a, 'play', MODE_SECS.play);
  } else if (act === 'clean') {
    if (c.clean >= 95) { toast(`${c.name}已经很干净了`); return; }
    if (state.coins < PRICES.clean) { toast('猫币不够了'); return; }
    state.coins -= PRICES.clean; refreshHud();
    bump(c, 'clean', GAIN.clean);
    c.msg = careLine(c, 'clean');
    perform(a, 'clean', MODE_SECS.clean);
  }
  save();
  renderCatPanel(c); renderDock();
}

export function openBuilding(id: string) {
  clearSel();
  const b = buildings[id];
  sel = { b: id };
  panel().innerHTML = `<button class="p-close" aria-label="关闭">×</button>
<div class="p-head"><div><div class="p-name">${b.name}</div><div class="tags"><span class="tag">${b.kind}</span></div></div></div>
<div class="p-status">${b.desc}</div>
<div class="rows">${b.info.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}${cats.filter(c => c.away?.kind === id).map(c => `<div><span>${isMine(c) ? '在这里' : `${ownerName(c)}的猫`}</span><b>${c.name} · ${awayText(c, true)}</b></div>`).join('')}</div>`;
  panel().hidden = false;
  renderDock();
  flyTo(b.x, b.y - 170, Math.max(cam.k, 1), panelOffset());
}

export function openStray(id: string) {
  clearSel();
  const s = strays.find(x => x.id === id)!;
  sel = { stray: s };
  panel().innerHTML = `<button class="p-close" aria-label="关闭">×</button>
<div class="p-head"><div class="pt mystery">?</div><div><div class="p-name">纸箱里的猫</div><div class="tags"><span class="tag">流浪猫</span><span class="tag">属性未知</span></div></div></div>
<div class="p-status">纸箱里探出一双眼睛。收养前看不到它的品种、性格和健康状况，只有带回家才知道是什么猫。</div>
<div class="rows"><div><span>猫位</span><b>${ownCats().length} / ${state.cap}</b></div></div>
<div class="acts"><button class="btn main wide" disabled>收养它<small>后面的版本开放</small></button></div>`;
  panel().hidden = false;
  renderDock();
  flyTo(s.x, s.y - 40, Math.max(cam.k, 1.4), panelOffset());
}

// ---------- dock ----------
function dockStatus(c: Cat): [string, string] {
  if (c.away) return [awayText(c, true), '#6B5648'];
  const a = actorOf(c);
  if (a.mode === 'feed') return ['吃饭中', '#9A4A0E'];
  if (a.mode === 'clean') return ['洗澡中', '#9A4A0E'];
  if (a.mode === 'pet') return ['撒娇中', '#9A4A0E'];
  if (a.mode !== 'roam') return ['玩耍中', '#9A4A0E'];
  if (c.health < SICK) return ['生病了', '#B83232'];
  if (c.health < 40) return ['没精神', '#B83232'];
  if (c.food < 35) return ['饿了', '#B83232'];
  if (c.clean < 35) return ['脏了', '#B83232'];
  if (c.mood < 40) return ['不开心', '#B83232'];
  if (a.act === 'sleep') return ['睡觉中', '#6B5648'];
  return ['开心', '#2F6B47'];
}

export function renderDock() {
  $('dock').innerHTML = myCats().map(c => {
    const [t, col] = dockStatus(c);
    const on = sel && 'cat' in sel && sel.cat === c;
    return `<button class="dock-cat ${on ? 'on' : ''}" data-id="${c.id}">${portraitImg(c)}${c.co ? '<i class="co-mark" title="合养">♥</i>' : ''}<span><span class="n">${c.name}</span><span class="s" style="color:${col}">${t}</span></span></button>`;
  }).join('');
}

/** Once a second: live bars and status in an open cat panel. */
export function refreshPanel() {
  if (!sel || !('cat' in sel) || panel().hidden) return;
  const el = document.getElementById('p-bars'), st = document.getElementById('p-status');
  if (el) el.innerHTML = bars(sel.cat);
  if (st) st.innerHTML = statusText(sel.cat);
  const gr = document.getElementById('p-grow');
  if (gr) gr.textContent = growText(sel.cat);
}

export function bindPanel(onHint: () => void) {
  panel().addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest('button');
    if (!btn) return;
    if (btn.classList.contains('p-close')) return closePanel();
    if (sel && 'cat' in sel && btn.dataset.act) catAction(sel.cat, btn.dataset.act);
  });
  $('dock').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.dock-cat');
    if (b) { onHint(); selectCat(b.dataset.id!); }
  });
}
