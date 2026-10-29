import { Accounts, randomId, type Player } from './accounts';
import { Street } from './street';
import { starterCats } from '../src/game/data';
import type { Cat } from '../src/game/types';
import type { Hello, StreetInfo } from '../src/net/protocol';

export { Accounts, Street };

interface Env {
  ACCOUNTS: DurableObjectNamespace<Accounts>;
  STREETS: DurableObjectNamespace<Street>;
  ASSETS: Fetcher;
}

const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
const accounts = (env: Env) => env.ACCOUNTS.get(env.ACCOUNTS.idFromName('all'));
const street = (env: Env, id: string) => env.STREETS.get(env.STREETS.idFromName(id));
const hello = (p: Player): Hello => ({ id: p.id, token: p.token, code: p.code, name: p.name, street: p.street });
const NAMES = ['路过的铲屎官', '猫薄荷爱好者', '小鱼干供应商', '早起喂猫人', '梳毛专家', '逗猫棒大师'];
const COAT_OK = new Set(['calico', 'maine', 'lihua']), PERS_OK = new Set(['lively', 'cool', 'lazy']);
const n100 = (v: unknown, d: number) => Math.max(0, Math.min(100, Number.isFinite(Number(v)) ? Number(v) : d));

/** A first-time player may bring the cats from their local save; keep only sane fields. */
function adoptLocal(pid: string, local: unknown): { cats: Cat[]; coins: number } {
  const base = starterCats();
  const l = local as { coins?: number; cats?: Partial<Cat>[] } | null;
  const src = Array.isArray(l?.cats) && l!.cats!.length ? l!.cats!.slice(0, 6) : base;
  const cats = src.map((c, i) => {
    const b = base[i % base.length];
    return {
      ...b, id: `${pid}-${i}`, name: String(c.name ?? b.name).slice(0, 8), breed: String(c.breed ?? b.breed).slice(0, 8),
      coat: COAT_OK.has(String(c.coat)) ? c.coat! : b.coat, pers: PERS_OK.has(String(c.pers)) ? c.pers! : b.pers,
      lv: Math.max(1, Math.min(99, Number(c.lv) || b.lv)),
      mood: n100(c.mood, b.mood), health: n100(c.health, b.health), food: n100(c.food, b.food), clean: n100(c.clean, b.clean),
      x: 300 + Math.random() * 2800, y: 500 + Math.random() * 48, pets: [],
    } as Cat;
  });
  const coins = Math.max(0, Math.min(100000, Math.round(Number(l?.coins) || 500)));
  return { cats, coins };
}

async function api(req: Request, env: Env, path: string): Promise<Response> {
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) as Record<string, unknown> : {};
  const acc = accounts(env);

  // first visit creates an anonymous player on a street of their own; later visits just identify
  if (path === '/api/hello' && req.method === 'POST') {
    const token = typeof body.token === 'string' ? body.token : '';
    const known = token ? await acc.byToken(token) : null;
    if (known) return json(hello(known));
    const p = await acc.create(NAMES[Math.floor(Math.random() * NAMES.length)] + randomId(2, '0123456789'));
    const { cats, coins } = adoptLocal(p.id, body.local);
    await street(env, p.street).addResident({ id: p.id, name: p.name }, cats, coins);
    return json(hello(p));
  }
  if (path === '/api/login' && req.method === 'POST') {
    const p = await acc.byCode(String(body.code ?? ''));
    return p ? json(hello(p)) : json({ error: '没有找到这个存档码' }, 404);
  }

  const me = await acc.byToken(String(body.token ?? new URL(req.url).searchParams.get('token') ?? ''));
  if (path.startsWith('/api/street/') && req.method === 'GET') {
    const id = path.slice('/api/street/'.length);
    const info = await street(env, id).info();
    return json({ id, ...info } satisfies StreetInfo);
  }
  if (!me) return json({ error: '请先登录' }, 401);

  if (path === '/api/ws') {
    const h = new Headers(req.headers);
    h.set('x-pid', me.id); h.set('x-street', me.street);
    return street(env, me.street).fetch(new Request(req, { headers: h }));
  }
  if (path === '/api/join' && req.method === 'POST') {
    const to = String(body.street ?? '');
    if (!to || to === me.street) return json(hello(me));
    const target = street(env, to);
    const info = await target.info();
    if (!info.residents.length) return json({ error: '这条街不存在' }, 404);
    if (info.full) return json({ error: '这条街已经住满了' }, 409);
    const moved = await street(env, me.street).removeResident(me.id);
    const ok = await target.addResident({ id: me.id, name: me.name }, moved.cats, moved.coins);
    if (!ok) { await street(env, me.street).addResident({ id: me.id, name: me.name }, moved.cats, moved.coins); return json({ error: '这条街已经住满了' }, 409); }
    await acc.setStreet(me.id, to);
    return json(hello({ ...me, street: to }));
  }
  if (path === '/api/rename' && req.method === 'POST') {
    const name = String(body.name ?? '').trim().slice(0, 10);
    if (!name) return json({ error: '名字不能为空' }, 400);
    await acc.rename(me.id, name);
    await street(env, me.street).rename(me.id, name);
    return json(hello({ ...me, name }));
  }
  return json({ error: 'not found' }, 404);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const path = new URL(req.url).pathname;
    if (path.startsWith('/api/')) return api(req, env, path);
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response('not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
