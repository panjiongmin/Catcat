import { cats, buildings, strays, state, PERS_NAME, type Cat, type Stray } from '../game/data';
import { bump, GAIN, PRICES } from '../game/rules';
import { cam, flyTo, isPhone, pad, view } from '../world/camera';
import { actors, hold, perform, type Actor } from '../world/streetCats';
import { portraitImg } from './portrait';
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
  if (c.msg) return c.msg;
  const a = actorOf(c);
  if (c.food < 35) return `${c.name}饿了，一直盯着你看。`;
  if (a.mode !== 'roam') return `${c.name}正在陪你玩。`;
  if (c.pers === 'lazy') return `${c.name}懒洋洋地趴着，尾巴拖在地上。`;
  if (c.pers === 'cool') return `${c.name}抬着头巡视小街，假装没看见你。`;
  return `${c.name}在小街上跑来跑去，停不下来。`;
}

export function refreshHud() {
  $('coins').textContent = fmt(state.coins);
  $('pop').textContent = `${cats.length}/${state.cap}`;
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

function renderCatPanel(c: Cat) {
  panel().innerHTML = `<button class="p-close" aria-label="关闭">×</button>
<div class="p-head">${portraitImg(c)}<div><div class="p-name">${c.name}</div><div class="tags"><span class="tag t1">${PERS_NAME[c.pers]}</span><span class="tag t2">Lv.${c.lv}</span><span class="tag">${c.breed}</span></div></div></div>
<div class="p-status">${statusText(c)}</div>
<div class="bars" id="p-bars">${bars(c)}</div>
<div class="acts">
<button class="btn" data-act="pet">撸猫<small>心情 +${GAIN.pet}</small></button>
<button class="btn" data-act="feed">喂食<small>−${PRICES.feed} 猫币</small></button>
<button class="btn" data-act="play">逗猫<small>心情 +${GAIN.play}</small></button>
<button class="btn main wide" data-act="work">派去打工<small>下一版开放</small></button>
</div>`;
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
  flyTo(c.x, c.y - 45, isPhone() ? 1.15 : Math.max(cam.k, 1.3), panelOffset());
}

function catAction(c: Cat, act: string) {
  const a = actorOf(c);
  if (act === 'work') { toast('派工下一版开放：猫咖 / 剧本杀 / 密室逃脱'); return; }
  if (a.busy > 0) return;
  if (act === 'pet') {
    bump(c, 'mood', GAIN.pet);
    c.msg = c.pers === 'cool' ? `${c.name}勉强让你摸了两下，尾巴却偷偷翘了起来。` : c.pers === 'lazy' ? `${c.name}翻了个身，呼噜声越来越响。` : `${c.name}一直往你手里蹭，开心得眯起眼。`;
    perform(a, 'pet', 2.4);
  } else if (act === 'feed') {
    if (state.coins < PRICES.feed) { toast('猫币不够了'); return; }
    state.coins -= PRICES.feed; refreshHud();
    bump(c, 'food', GAIN.feed);
    c.msg = `${c.name}吃得头都不抬，吃完还舔了舔碗。`;
    perform(a, 'feed', 2.6);
  } else if (act === 'play') {
    bump(c, 'mood', GAIN.play); bump(c, 'food', -GAIN.playFood);
    c.msg = c.pers === 'lazy' ? `${c.name}看了毛线球半天，终于伸爪拍了一下。` : `${c.name}扑向毛线球，玩得停不下来。`;
    perform(a, 'play', 2.6);
  }
  renderCatPanel(c); renderDock();
}

export function openBuilding(id: string) {
  clearSel();
  const b = buildings[id];
  sel = { b: id };
  panel().innerHTML = `<button class="p-close" aria-label="关闭">×</button>
<div class="p-head"><div><div class="p-name">${b.name}</div><div class="tags"><span class="tag">${b.kind}</span></div></div></div>
<div class="p-status">${b.desc}</div>
<div class="rows">${b.info.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
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
<div class="rows"><div><span>猫位</span><b>${cats.length} / ${state.cap}</b></div></div>
<div class="acts"><button class="btn main wide" disabled>收养它<small>后面的版本开放</small></button></div>`;
  panel().hidden = false;
  renderDock();
  flyTo(s.x, s.y - 40, Math.max(cam.k, 1.4), panelOffset());
}

// ---------- dock ----------
function dockStatus(c: Cat): [string, string] {
  const a = actorOf(c);
  if (c.food < 35) return ['饿了', '#B83232'];
  if (c.mood < 40) return ['不开心', '#B83232'];
  if (a.mode === 'feed') return ['吃饭中', '#9A4A0E'];
  if (a.mode !== 'roam') return ['玩耍中', '#9A4A0E'];
  return ['开心', '#2F6B47'];
}

export function renderDock() {
  $('dock').innerHTML = cats.map(c => {
    const [t, col] = dockStatus(c);
    const on = sel && 'cat' in sel && sel.cat === c;
    return `<button class="dock-cat ${on ? 'on' : ''}" data-id="${c.id}">${portraitImg(c)}<span><span class="n">${c.name}</span><span class="s" style="color:${col}">${t}</span></span></button>`;
  }).join('');
}

/** Once a second: live bars and status in an open cat panel. */
export function refreshPanel() {
  if (!sel || !('cat' in sel) || panel().hidden) return;
  const el = document.getElementById('p-bars');
  if (el) el.innerHTML = bars(sel.cat);
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
