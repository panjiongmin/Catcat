import { online, myCats } from '../game/data';
import { inviteLink, joinStreet, loginWithCode, rename, streetInfo } from '../net/online';
import { STREET_MAX } from '../net/protocol';
import { $, toast } from './hud';

// The 街坊 chip in the HUD, the street card behind it, and the "move to a friend's street" card.
const esc = (s: string) => s.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
const modal = () => $('modal');
const reload = () => location.replace(location.pathname);

function open(html: string) {
  const el = modal();
  el.innerHTML = `<div class="away-card">${html}</div>`;
  el.hidden = false;
  el.onclick = e => { if (e.target === el || (e.target as HTMLElement).closest('[data-close]')) close(); };
}
const close = () => { modal().hidden = true; };

/** Chip text: how many neighbours are around right now. */
export function updateNeighbours(status?: 'online' | 'reconnecting' | 'moved' | 'offline') {
  const chip = $('nb');
  if (status === 'offline') { chip.innerHTML = '<i class="dot off"></i>单机'; chip.title = '没连上服务器，先在本机玩'; return; }
  if (status === 'reconnecting') { chip.innerHTML = '<i class="dot wait"></i>重连中'; return; }
  if (status === 'moved') { chip.innerHTML = '<i class="dot off"></i>已搬走'; return; }
  notePresence();
  const on = online.players.filter(p => p.online).length;
  // alone on the street: the chip turns into the way to bring friends over
  const alone = online.players.length <= 1;
  chip.classList.toggle('invite', alone);
  chip.innerHTML = alone ? '<span class="plus" aria-hidden="true">+</span>邀请朋友' : `<i class="dot"></i>街坊 ${on}/${online.players.length}`;
  chip.title = alone ? '这条街只有你，邀请朋友搬过来一起玩' : '看看这条街上住着谁';
  if (!modal().hidden && modal().querySelector('#nb-list')) $('nb-list').innerHTML = list();
}

/** Who was here last time, so arrivals and neighbours coming online get a toast. */
let seen: Map<string, boolean> | null = null;
/** When each newcomer moved in: their page connects right after, which is not worth a second toast. */
const movedIn = new Map<string, number>();
function notePresence() {
  const now = new Map(online.players.map(p => [p.id, p.online]));
  if (seen) for (const p of online.players) {
    if (p.id === online.me) continue;
    if (!seen.has(p.id)) { movedIn.set(p.id, Date.now()); toast(`${p.name}搬到这条街了，带着猫一起来的`); }
    else if (p.online && !seen.get(p.id) && Date.now() - (movedIn.get(p.id) ?? 0) > 30000) toast(`${p.name}来街上了`);
  }
  seen = now;
}

/** Share sheet on phones (WeChat etc.), clipboard elsewhere. */
async function shareInvite() {
  const link = inviteLink();
  const text = `来猫猫小街当我的街坊吧，打开链接就能带着猫搬过来：`;
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ title: '猫猫小街', text, url: link }); return; } catch { /* cancelled: fall back to copying */ }
  }
  try { await navigator.clipboard.writeText(`${text}${link}`); toast('邀请链接已复制，发给朋友吧'); }
  catch { prompt('复制这个链接发给朋友', link); }
}

const list = () => online.players.map(p => `<li><i class="dot ${p.online ? '' : 'off'}"></i><b>${esc(p.name)}</b>${p.id === online.me ? '<span class="me">我</span>' : ''}<span class="st">${p.online ? '在线' : '不在'}</span></li>`).join('');

function showStreet() {
  if (!online.on) {
    open(`<h2>单机模式</h2><p>暂时连不上小街服务器，猫咪先存在这台设备上。网络恢复后刷新一下就能和街坊一起玩。</p><button class="btn main" data-close>好的</button>`);
    return;
  }
  const full = online.players.length >= STREET_MAX, alone = online.players.length <= 1;
  open(`<h2 id="away-h">${alone ? '邀请朋友来当街坊' : '樱花街的街坊'}</h2>
${alone ? `<p>每个人第一次来都会住进一条自己的小街。把邀请链接发给朋友，对方打开后点「带着猫搬过去」，你们就住在同一条街上，能看到彼此的猫，还能互相撸猫、喂猫、一起养猫。</p>` : `<ul class="nb-list" id="nb-list">${list()}</ul>`}
${full ? '<p>这条街住满了。</p>' : `${alone ? '' : `<p>还能再住 ${STREET_MAX - online.players.length} 户。把链接发给朋友，打开就能搬过来，猫咪一起带上。</p>`}<button class="btn main" id="nb-invite">发邀请链接给朋友</button>`}
<div class="nb-me">
  <label>我的名字<input id="nb-name" maxlength="10" value="${esc(online.name)}"></label>
  <button class="btn" id="nb-rename">改名</button>
</div>
<p class="nb-code">存档码 <b>${online.code}</b><br><small>换手机或清了浏览器数据，用它找回你的猫。别发给别人。</small></p>
<details class="nb-restore"><summary>用存档码找回</summary>
  <div class="nb-me"><input id="nb-code" maxlength="8" placeholder="6 位存档码" autocapitalize="characters"><button class="btn" id="nb-login">找回</button></div>
</details>
<button class="btn" data-close>关闭</button>`);
  const inv = document.getElementById('nb-invite');
  if (inv) inv.onclick = shareInvite;
  $('nb-rename').onclick = async () => {
    const v = $<HTMLInputElement>('nb-name').value.trim();
    if (!v || v === online.name) return;
    try { await rename(v); toast('改好了'); } catch (e) { toast((e as Error).message); }
  };
  $('nb-login').onclick = async () => {
    const v = $<HTMLInputElement>('nb-code').value.trim();
    if (!v) return;
    try { await loginWithCode(v); reload(); } catch (e) { toast((e as Error).message); }
  };
}

/** Opened through someone's invite link: show whose street it is and move in on confirm. */
export async function offerJoin(id: string) {
  history.replaceState(null, '', location.pathname);
  if (!online.on) { toast('连不上小街服务器，邀请暂时用不了'); return; }
  if (id === online.street) { toast('你已经住在这条街了'); return; }
  let info;
  try { info = await streetInfo(id); } catch { toast('打不开这条街，稍后再试'); return; }
  if (!info.residents.length) { toast('这条街不存在，链接可能抄错了'); return; }
  const who = info.residents.map(esc).join('、');
  if (info.full) { open(`<h2>这条街住满了</h2><p>${who} 已经把这条街住满了（最多 ${STREET_MAX} 户）。</p><button class="btn main" data-close>好吧</button>`); return; }
  const n = myCats().length;
  open(`<h2 id="away-h">搬去新的小街？</h2>
<p>${who} 邀请你搬过去做街坊。你的 ${n} 只猫和猫币会一起搬走，以后大家能在同一条街上看到彼此的猫，还能互相撸猫、喂猫。</p>
<p>一个人同时只能住一条街，现在这条街上的街坊会看不到你了。</p>
<button class="btn main" id="join-ok">带着猫搬过去</button>
<button class="btn" data-close>先不搬</button>`);
  $('join-ok').onclick = async () => {
    try { await joinStreet(id); reload(); } catch (e) { toast((e as Error).message); close(); }
  };
}

export function bindNeighbours() {
  $('nb').onclick = showStreet;
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal().hidden) close(); });
}
