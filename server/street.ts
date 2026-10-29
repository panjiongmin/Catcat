import { DurableObject } from 'cloudflare:workers';
import type { Cat } from '../src/game/types';
import type { C2S, S2C, Cmd, CareAct, PlayerInfo } from '../src/net/protocol';
import { STREET_MAX } from '../src/net/protocol';
import { settle, bump, tryPet, petGain, playGain, GAIN, PRICES, ADULT_AGE } from '../src/game/rules';

interface Resident { id: string; name: string; coins: number; cap: number }
/** What each open socket carries across hibernation. */
interface Conn { cid: string; pid: string; vis: boolean; at: number }

const clampXY = (x: number, y: number) => ({ x: Math.max(100, Math.min(3350, x)), y: Math.max(500, Math.min(548, y)) });

/**
 * One street: the residents, every cat living there, and the live sockets of whoever has it open.
 * All stats are settled here on the server clock; one visible client (the driver) decides where cats walk.
 */
export class Street extends DurableObject {
  private sql: SqlStorage;
  private residents = new Map<string, Resident>();
  private cats = new Map<string, Cat>();
  /** Server time (ms) the stats were last settled to. */
  private t = Date.now();
  /** Latest command per cat, so a tab that joins mid-walk sees the same thing. Memory only. */
  private lastCmd = new Map<string, Cmd>();

  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS residents (id TEXT PRIMARY KEY, name TEXT, coins INTEGER, cap INTEGER, joined INTEGER);
        CREATE TABLE IF NOT EXISTS cats (id TEXT PRIMARY KEY, owner TEXT, data TEXT);
        CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);`);
      for (const r of this.sql.exec<Record<string, string | number>>('SELECT id, name, coins, cap FROM residents ORDER BY joined'))
        this.residents.set(String(r.id), { id: String(r.id), name: String(r.name), coins: Number(r.coins), cap: Number(r.cap) });
      for (const r of this.sql.exec<{ data: string }>('SELECT data FROM cats')) { const c = JSON.parse(r.data) as Cat; c.born ??= Date.now() - ADULT_AGE; this.cats.set(c.id, c); }
      const m = this.sql.exec<{ v: string }>("SELECT v FROM meta WHERE k = 't'").toArray();
      if (m.length) this.t = Number(m[0].v);
    });
  }

  // ---------- storage ----------
  private saveCat(c: Cat) {
    const { msg: _msg, ...data } = c;
    this.sql.exec('INSERT OR REPLACE INTO cats (id, owner, data) VALUES (?, ?, ?)', c.id, c.owner ?? '', JSON.stringify(data));
  }
  private saveResident(r: Resident) {
    this.sql.exec('INSERT INTO residents (id, name, coins, cap, joined) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, coins = excluded.coins, cap = excluded.cap',
      r.id, r.name, r.coins, r.cap, Date.now());
  }
  /** Bring every cat up to the server clock. */
  private settleAll(now = Date.now()) {
    const h = (now - this.t) / 3.6e6;
    if (h <= 0) return now;
    for (const c of this.cats.values()) { settle(c, h, now); this.saveCat(c); }
    this.t = now;
    this.sql.exec("INSERT OR REPLACE INTO meta (k, v) VALUES ('t', ?)", String(now));
    return now;
  }

  // ---------- residents (called from the Worker) ----------
  info() { return { residents: [...this.residents.values()].map(r => r.name), full: this.residents.size >= STREET_MAX }; }

  /** Move a player and their cats in. False when the street is full. */
  addResident(p: { id: string; name: string }, cats: Cat[], coins: number, cap = 6): boolean {
    if (!this.residents.has(p.id) && this.residents.size >= STREET_MAX) return false;
    this.settleAll();
    const r: Resident = { id: p.id, name: p.name, coins, cap };
    this.residents.set(p.id, r); this.saveResident(r);
    for (const c of cats) {
      const cat: Cat = { ...c, owner: p.id, ...clampXY(c.x, c.y) };
      this.cats.set(cat.id, cat); this.saveCat(cat);
    }
    this.broadcast({ t: 'cats', cats: [...this.cats.values()], now: Date.now() });
    this.presence();
    return true;
  }

  /** Move a player out, handing back their cats and coins for the new street. */
  removeResident(pid: string): { cats: Cat[]; coins: number } {
    const now = this.settleAll();
    const r = this.residents.get(pid);
    const mine = [...this.cats.values()].filter(c => c.owner === pid);
    for (const c of mine) { this.cats.delete(c.id); this.lastCmd.delete(c.id); }
    this.sql.exec('DELETE FROM cats WHERE owner = ?', pid);
    this.sql.exec('DELETE FROM residents WHERE id = ?', pid);
    this.residents.delete(pid);
    for (const ws of this.ctx.getWebSockets()) if (this.conn(ws).pid === pid) ws.close(4000, 'moved');
    this.broadcast({ t: 'cats', cats: [...this.cats.values()], now });
    this.presence();
    return { cats: mine, coins: r?.coins ?? 0 };
  }

  rename(pid: string, name: string) {
    const r = this.residents.get(pid);
    if (r) { r.name = name; this.saveResident(r); this.presence(); }
  }

  // ---------- sockets ----------
  async fetch(req: Request): Promise<Response> {
    const pid = req.headers.get('x-pid') ?? '';
    const me = this.residents.get(pid);
    if (!me || req.headers.get('Upgrade') !== 'websocket') return new Response('not a resident', { status: 403 });
    const pair = new WebSocketPair();
    const ws = pair[1];
    this.ctx.acceptWebSocket(ws);
    const conn: Conn = { cid: crypto.randomUUID(), pid, vis: true, at: Date.now() };
    ws.serializeAttachment(conn);
    const now = this.settleAll();
    this.send(ws, { t: 'init', now, you: { id: me.id, name: me.name, coins: me.coins, cap: me.cap }, street: req.headers.get('x-street') ?? '',
      players: this.players(), cats: [...this.cats.values()], cmds: [...this.lastCmd.values()], driver: false });
    this.presence();
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    let m: C2S;
    try { m = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); } catch { return; }
    const conn = this.conn(ws);
    if (m.t === 'vis') {
      ws.serializeAttachment({ ...conn, vis: !!m.on });
      this.presence();
    } else if (m.t === 'cmds') {
      // only the driver steers; positions ride along so the server knows where everyone is
      if (this.driverCid() !== conn.cid) return;
      const list = m.list.filter(c => this.cats.has(c.id)).slice(0, 64);
      for (const c of list) { this.lastCmd.set(c.id, c); Object.assign(this.cats.get(c.id)!, clampXY(c.x, c.y)); }
      if (list.length) this.broadcast({ t: 'cmds', list }, ws);
    } else if (m.t === 'pos') {
      if (this.driverCid() !== conn.cid) return;
      for (const p of m.list) { const c = this.cats.get(p.id); if (c) { Object.assign(c, clampXY(p.x, p.y)); this.saveCat(c); } }
    } else if (m.t === 'do') {
      this.care(ws, conn.pid, m.cat, m.act);
    }
  }

  async webSocketClose(ws: WebSocket) { ws.close(); this.presence(); }
  async webSocketError() { this.presence(); }

  // ---------- care ----------
  private care(ws: WebSocket, pid: string, catId: string, act: CareAct) {
    const c = this.cats.get(catId), me = this.residents.get(pid);
    if (!c || !me) return this.send(ws, { t: 'err', msg: '找不到这只猫' });
    const own = c.owner === pid;
    if ((act === 'play' || act === 'clean') && !own) return this.send(ws, { t: 'err', msg: '只有主人能这样做' });
    const now = this.settleAll();
    if (act === 'pet') {
      if (!tryPet(c, now)) return this.send(ws, { t: 'err', msg: `${c.name}被摸烦了，过一会儿再来吧` });
      bump(c, 'mood', petGain(c));
    } else if (act === 'feed') {
      if (c.food >= 95) return this.send(ws, { t: 'err', msg: `${c.name}吃不下了` });
      if (me.coins < PRICES.feed) return this.send(ws, { t: 'err', msg: '猫币不够了' });
      me.coins -= PRICES.feed; bump(c, 'food', GAIN.feed);
    } else if (act === 'play') {
      bump(c, 'mood', playGain(c, now)); bump(c, 'food', -GAIN.playFood);
    } else if (act === 'clean') {
      if (c.clean >= 95) return this.send(ws, { t: 'err', msg: `${c.name}已经很干净了` });
      if (me.coins < PRICES.clean) return this.send(ws, { t: 'err', msg: '猫币不够了' });
      me.coins -= PRICES.clean; bump(c, 'clean', GAIN.clean);
    } else return;
    this.saveCat(c); this.saveResident(me);
    const stats = { mood: c.mood, health: c.health, food: c.food, clean: c.clean, pets: c.pets };
    this.broadcast({ t: 'did', cat: c.id, act, by: pid, byName: me.name, stats, now, coins: me.coins });
  }

  // ---------- presence & driver ----------
  private conn(ws: WebSocket) { return ws.deserializeAttachment() as Conn; }
  private live() { return this.ctx.getWebSockets().filter(ws => ws.readyState === WebSocket.OPEN); }
  /** The tab that decides where cats walk: the longest-connected visible one, else any. */
  private driverCid(): string | null {
    const cs = this.live().map(ws => this.conn(ws)).sort((a, b) => a.at - b.at);
    return (cs.find(c => c.vis) ?? cs[0])?.cid ?? null;
  }
  private players(): PlayerInfo[] {
    const on = new Set(this.live().map(ws => this.conn(ws).pid));
    return [...this.residents.values()].map(r => ({ id: r.id, name: r.name, online: on.has(r.id) }));
  }
  private presence() {
    const players = this.players(), d = this.driverCid();
    for (const ws of this.live()) this.send(ws, { t: 'presence', players, driver: this.conn(ws).cid === d });
  }

  private send(ws: WebSocket, m: S2C) { try { ws.send(JSON.stringify(m)); } catch { /* closing */ } }
  private broadcast(m: S2C, except?: WebSocket) {
    const s = JSON.stringify(m);
    for (const ws of this.live()) if (ws !== except) { try { ws.send(s); } catch { /* closing */ } }
  }
}
