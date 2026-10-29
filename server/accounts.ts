import { DurableObject } from 'cloudflare:workers';

export interface Player { id: string; token: string; code: string; name: string; street: string }

// No 0/O/1/I so a save code survives being read aloud or typed on a phone.
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const randomId = (n = 10, abc = 'abcdefghijkmnpqrstuvwxyz23456789') => {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b, x => abc[x % abc.length]).join('');
};

/** Every player account, in one small SQLite-backed object: id, secret token, save code, home street. */
export class Accounts extends DurableObject {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, street TEXT NOT NULL, created INTEGER NOT NULL)`);
  }

  private one(q: string, ...args: unknown[]): Player | null {
    const rows = this.sql.exec<Record<string, string>>(q, ...args).toArray();
    return rows.length ? (rows[0] as unknown as Player) : null;
  }

  create(name: string): Player {
    for (;;) {
      const p: Player = { id: randomId(10), token: randomId(32), code: randomId(6, CODE_ABC), name, street: randomId(8) };
      try {
        this.sql.exec('INSERT INTO players (id, token, code, name, street, created) VALUES (?, ?, ?, ?, ?, ?)',
          p.id, p.token, p.code, p.name, p.street, Date.now());
        return p;
      } catch {
        // a code collision: roll again
      }
    }
  }

  byToken(token: string) { return this.one('SELECT * FROM players WHERE token = ?', token); }
  byCode(code: string) { return this.one('SELECT * FROM players WHERE code = ?', code.toUpperCase().replace(/\s/g, '')); }

  setStreet(id: string, street: string) { this.sql.exec('UPDATE players SET street = ? WHERE id = ?', street, id); }
  rename(id: string, name: string) { this.sql.exec('UPDATE players SET name = ? WHERE id = ?', name, id); }
}
