import { cats, online, state } from '../game/data';
import type { Cat } from '../game/types';
import { localSave } from '../game/save';
import type { C2S, S2C, Cmd, Hello, StreetInfo, Back } from './protocol';

// Talking to the street server: an anonymous account kept in this browser, then one WebSocket to our street.
const TOKEN = 'catcat.token';
const tokenGet = () => { try { return localStorage.getItem(TOKEN) ?? ''; } catch { return ''; } };
const tokenSet = (t: string) => { try { localStorage.setItem(TOKEN, t); } catch { /* private mode */ } };

export interface NetHandlers {
  /** The street's cats changed wholesale (first connect, someone moved in or out). */
  cats(): void;
  cmds(list: Cmd[]): void;
  did(m: Extract<S2C, { t: 'did' }>): void;
  co(m: Extract<S2C, { t: 'co' }>): void;
  /** Cats home from work or the clinic. */
  back(list: Back[]): void;
  /** My coins changed outside a care action. */
  wallet(): void;
  presence(): void;
  error(msg: string): void;
  /** Connection state for the HUD. */
  status(s: 'online' | 'reconnecting' | 'moved'): void;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({ error: '服务器没有响应' }));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? '请求失败');
  return d as T;
}

function remember(h: Hello) {
  tokenSet(h.token);
  Object.assign(online, { me: h.id, name: h.name, code: h.code, street: h.street });
}

/** Keep the same Cat objects (actors hold them) and copy the server's version over them. */
function mergeCats(list: Cat[]) {
  const byId = new Map(cats.map(c => [c.id, c]));
  const next = list.map(c => {
    const old = byId.get(c.id);
    if (!old) return { ...c };
    // fields the server dropped (an ended 合养) go too; msg is this tab's own
    for (const k of Object.keys(old) as (keyof Cat)[]) if (!(k in c) && k !== 'msg') delete old[k];
    return Object.assign(old, c);
  });
  cats.splice(0, cats.length, ...next);
}

let ws: WebSocket | null = null;
let handlers: NetHandlers;
let retry = 0;
const queue: C2S[] = [];

export function send(m: C2S) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m));
  else if (m.t === 'do' || m.t === 'co' || m.t === 'send') handlers?.error('正在重新连接，稍等一下');
  else if (m.t === 'vis') queue.push(m);
}

function open(firstInit?: (ok: boolean) => void) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const sock = new WebSocket(`${proto}://${location.host}/api/ws?token=${encodeURIComponent(tokenGet())}`);
  ws = sock;
  let inited = false;
  sock.onmessage = e => {
    const m = JSON.parse(e.data as string) as S2C;
    if (m.t === 'init') {
      inited = true; retry = 0;
      online.on = true;
      online.offset = m.now - Date.now();
      online.players = m.players;
      state.coins = m.you.coins; state.cap = m.you.cap; state.t = m.now;
      online.name = m.you.name;
      mergeCats(m.cats);
      handlers.cats();
      if (m.cmds.length) handlers.cmds(m.cmds);
      handlers.status('online');
      while (queue.length) sock.send(JSON.stringify(queue.shift()));
      sock.send(JSON.stringify({ t: 'vis', on: !document.hidden } satisfies C2S));
      firstInit?.(true); firstInit = undefined;
    } else if (m.t === 'presence') {
      online.players = m.players; online.driver = m.driver;
      handlers.presence();
    } else if (m.t === 'cmds') handlers.cmds(m.list);
    else if (m.t === 'cats') { online.offset = m.now - Date.now(); mergeCats(m.cats); handlers.cats(); }
    else if (m.t === 'did') handlers.did(m);
    else if (m.t === 'co') handlers.co(m);
    else if (m.t === 'back') {
      for (const b of m.list) if (b.to === online.me && b.coins != null) state.coins = b.coins;
      handlers.back(m.list);
    } else if (m.t === 'wallet') { state.coins = m.coins; handlers.wallet(); }
    else if (m.t === 'err') handlers.error(m.msg);
  };
  sock.onclose = e => {
    if (ws !== sock) return;
    ws = null;
    online.driver = false;
    if (!inited && firstInit) { firstInit(false); firstInit = undefined; return; }
    // 4000: this player moved to another street from another tab
    if (e.code === 4000) { handlers.status('moved'); return; }
    handlers.status('reconnecting');
    const wait = Math.min(30, 2 ** retry++) * 1000;
    setTimeout(() => open(), wait);
  };
}

/** Sign in (creating an anonymous player the first time) and connect. Resolves false to stay single-player. */
export async function goOnline(h: NetHandlers, timeoutMs = 5000): Promise<boolean> {
  handlers = h;
  try {
    const hello = await Promise.race([
      post<Hello>('/api/hello', { token: tokenGet(), local: tokenGet() ? null : localSave() }),
      new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), timeoutMs)),
    ]);
    remember(hello);
  } catch {
    return false;
  }
  return new Promise(res => {
    const t = setTimeout(() => res(false), timeoutMs);
    open(ok => { clearTimeout(t); res(ok); });
  });
}

export const streetInfo = (id: string) => fetch(`/api/street/${encodeURIComponent(id)}`).then(r => r.json() as Promise<StreetInfo>);
export async function joinStreet(id: string) { remember(await post<Hello>('/api/join', { token: tokenGet(), street: id })); }
export async function loginWithCode(code: string) { remember(await post<Hello>('/api/login', { code })); }
export async function rename(name: string) { remember(await post<Hello>('/api/rename', { token: tokenGet(), name })); }
export const inviteLink = () => `${location.origin}${location.pathname}?join=${online.street}`;
