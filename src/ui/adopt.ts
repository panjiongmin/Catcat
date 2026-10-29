import { boxes, cats, online, nowMs, ownCats, state, strayCat, strays, PERS_NAME, type Cat } from '../game/data';
import { stageOf } from '../game/rules';
import { send } from '../net/online';
import { openCard } from './neighbours';
import { portraitImg } from './portrait';
import { esc, toast } from './hud';

// Strays: a cardboard box turns up now and then; whoever takes the cat in finds out what it is.

/** Show only the boxes that have a cat in them right now. */
export function showBoxes(nodes: Record<string, SVGGElement>) {
  for (const [id, n] of Object.entries(nodes)) n.style.display = boxes.some(b => b.id === id) ? '' : 'none';
}

export const boxAt = (id: string) => boxes.find(b => b.id === id);
export const roomLeft = () => state.cap - ownCats().length;

/** How long before the stray in this box wanders off. */
export function staysFor(id: string) {
  const b = boxAt(id);
  if (!b) return '';
  const h = Math.max(1, Math.round((b.until - nowMs()) / 3.6e6));
  return h >= 24 ? `大概还会待 1 天` : `大概还会待 ${h} 小时`;
}

/** Take the stray home: the server rolls who it is online; here otherwise. `after` adds its actor and redraws. */
export function adopt(id: string, after: (c: Cat) => void) {
  if (online.on) { send({ t: 'adopt', box: id }); return; }
  const i = boxes.findIndex(b => b.id === id);
  if (i < 0) { toast('纸箱里的猫已经走了'); return; }
  if (roomLeft() <= 0) { toast('猫位满了，暂时收养不了'); return; }
  const now = nowMs(), spot = strays.find(s => s.id === id)!;
  const c: Cat = { ...strayCat(now), x: spot.x, y: 530 };
  boxes.splice(i, 1);
  cats.push(c);
  after(c);
  reveal(c.id);
}

/** The moment of truth: who came out of the box. */
export function reveal(id: string) {
  const c = cats.find(x => x.id === id);
  if (!c) return;
  const stage = stageOf(c, nowMs()).name, sick = c.health < 25;
  openCard(`<div class="co-ask">${portraitImg(c)}<h2>是一只${stage}${esc(c.breed)}！</h2></div>
<p>它叫<b>${esc(c.name)}</b>，性格${PERS_NAME[c.pers]}。在外面流浪了一阵，${sick ? '身体很虚弱，最好先送去宠物医院。' : c.food < 35 ? '肚子饿扁了，先喂点东西吧。' : '身上有点脏，洗个香香就好。'}</p>
<button class="btn main" data-close>欢迎回家</button>`);
}
