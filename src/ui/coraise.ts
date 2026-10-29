import { cats, online, nowMs, isMine, ownerName, partnerName, playerName, type Cat } from '../game/data';
import { send } from '../net/online';
import { ASK_TTL, type S2C } from '../net/protocol';
import { closeCard, openCard } from './neighbours';
import { portraitImg } from './portrait';
import { $, esc, toast } from './hud';

// 合养: two neighbours on one street raise a cat together. The owner asks, the neighbour says yes or no,
// and either of them can end it; the cat always stays with its owner.

const asking = (c: Cat) => !!c.ask && nowMs() - c.ask.at < ASK_TTL;
const others = () => online.players.filter(p => p.id !== online.me);

/** Whose cat this is, as a tag in the cat panel. */
export function coTag(c: Cat) {
  if (isMine(c)) return c.co ? `<span class="tag t5">和${esc(partnerName(c))}一起养</span>` : '';
  return `<span class="tag t3">${esc(ownerName(c))}${c.co ? `和${esc(playerName(c.co))}` : ''}的猫</span>`;
}

/** The 合养 line under the care buttons. */
export function coControls(c: Cat) {
  if (!online.on || !isMine(c)) return '';
  if (c.co) return `<div class="p-co"><span>你们一起照顾${esc(c.name)}，谁动手谁付猫币。</span><button class="btn" data-act="co-end">不合养了</button></div>`;
  if (c.owner !== online.me) return '';
  if (asking(c)) return `<div class="p-co"><span>在等${esc(playerName(c.ask!.to))}回复要不要一起养。</span><button class="btn" data-act="co-end">撤回</button></div>`;
  if (!others().length) return '';
  return `<div class="p-co"><span>和街坊一起养，对方也能陪它玩、给它洗香香。</span><button class="btn" data-act="co-ask">找人合养</button></div>`;
}

export function coAction(c: Cat, act: string) {
  if (act === 'co-ask') return pickNeighbour(c);
  if (act === 'co-end') {
    if (!c.co) return send({ t: 'co', cat: c.id, op: 'end' });
    openCard(`<h2>不再一起养${esc(c.name)}？</h2>
<p>${esc(c.name)}会留在${c.owner === online.me ? '你' : esc(ownerName(c))}家，${esc(partnerName(c))}以后就不能陪它玩、给它洗澡了。</p>
<button class="btn main" id="co-end-ok">不合养了</button>
<button class="btn" data-close>再想想</button>`);
    $('co-end-ok').onclick = () => { send({ t: 'co', cat: c.id, op: 'end' }); closeCard(); };
  }
}

function pickNeighbour(c: Cat) {
  openCard(`<h2>找谁一起养${esc(c.name)}？</h2>
<p>对方答应以后，你们俩都能陪它玩、给它洗香香，谁动手谁付猫币。${esc(c.name)}还是住在你家，只占你的猫位。</p>
<ul class="nb-list co-pick">${others().map(p => `<li><button data-pid="${esc(p.id)}"><i class="dot ${p.online ? '' : 'off'}"></i><b>${esc(p.name)}</b><span class="st">${p.online ? '在线' : '不在'}</span></button></li>`).join('')}</ul>
<button class="btn" data-close>先不了</button>`);
  for (const b of $('modal').querySelectorAll<HTMLButtonElement>('.co-pick button')) {
    b.onclick = () => { send({ t: 'co', cat: c.id, op: 'ask', to: b.dataset.pid! }); closeCard(); };
  }
}

/** Asks shown in this tab already, so a card pops up once per ask. */
const shown = new Set<string>();

/** Someone asked me to raise their cat with them: show it once, now or the next time I open the game. */
export function checkAsks() {
  if (!$('modal').hidden) return;
  const c = cats.find(x => x.ask?.to === online.me && asking(x) && !shown.has(`${x.id}:${x.ask.at}`));
  if (!c) return;
  shown.add(`${c.id}:${c.ask!.at}`);
  const who = esc(ownerName(c));
  openCard(`<div class="co-ask">${portraitImg(c)}<h2>${who}想和你一起养${esc(c.name)}</h2></div>
<p>答应以后，你也能陪${esc(c.name)}玩、给它洗香香，它会出现在你的头像栏里。${esc(c.name)}还是住在${who}家，不占你的猫位，随时可以不合养。</p>
<button class="btn main" id="co-yes">一起养</button>
<button class="btn" id="co-no">先不了</button>`);
  $('co-yes').onclick = () => { send({ t: 'co', cat: c.id, op: 'yes' }); closeCard(); };
  $('co-no').onclick = () => { send({ t: 'co', cat: c.id, op: 'no' }); closeCard(); };
}

/** A 合养 change on the street; arrives just before the new cat list, so the cat still shows how it was. */
export function onCo(m: Extract<S2C, { t: 'co' }>) {
  const c = cats.find(x => x.id === m.cat);
  if (!c) return;
  const me = online.me, by = m.byName, name = c.name;  // toasts are plain text
  const involved = c.owner === me || c.co === me || c.ask?.to === me || m.to === me;
  if (!involved) return;
  if (m.op === 'ask') { if (m.by === me) toast(`问过${playerName(m.to)}了，等对方回复`); }
  else if (m.op === 'yes') toast(m.by === me ? `现在你和${ownerName(c)}一起养${name}了` : `${by}答应和你一起养${name}了`);
  else if (m.op === 'no') { if (m.by !== me) toast(`${by}这次没答应一起养${name}`); }
  else if (m.op === 'end') {
    if (!c.co) { if (m.by === me) toast('邀请撤回了'); else if (c.ask?.to === me && !$('modal').hidden && $('modal').querySelector('#co-yes')) closeCard(); }
    else toast(m.by === me ? `不再合养${name}了` : `${by}和你不再一起养${name}了`);
  }
}
