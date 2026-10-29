// Messages between the game and the street server (one WebSocket per open tab).
import type { AwayKind, Box, Cat, ClipName } from '../game/types';

export type Dir = 1 | -1;
/** What a cat does next, decided by the street's driver and replayed by every client. */
export interface Cmd {
  id: string;
  act: ClipName;
  x: number;
  y: number;
  dir: Dir;
  left: number;
  tx?: number;
  ty?: number;
  next?: ClipName;
  turnTo?: Dir;
}

export type CareAct = 'pet' | 'feed' | 'play' | 'clean';
/** 合养: the owner asks a neighbour, who says yes or no; either side can end it later. */
export type CoOp = 'ask' | 'yes' | 'no' | 'end';
/** An unanswered ask lapses after this long. */
export const ASK_TTL = 3 * 24 * 3.6e6;
export interface PlayerInfo { id: string; name: string; online: boolean }
export interface Stats { mood: number; health: number; food: number; clean: number; pets: number[] }

export type C2S =
  | { t: 'vis'; on: boolean }
  | { t: 'cmds'; list: Cmd[] }
  | { t: 'pos'; list: { id: string; x: number; y: number }[] }
  | { t: 'do'; cat: string; act: CareAct }
  | { t: 'co'; cat: string; op: CoOp; to?: string }
  | { t: 'send'; cat: string; to: AwayKind }
  | { t: 'adopt'; box: string };

export type S2C =
  | { t: 'init'; now: number; you: { id: string; name: string; coins: number; cap: number }; street: string;
      players: PlayerInfo[]; cats: Cat[]; cmds: Cmd[]; driver: boolean; boxes: Box[] }
  | { t: 'presence'; players: PlayerInfo[]; driver: boolean }
  | { t: 'cmds'; list: Cmd[] }
  | { t: 'cats'; cats: Cat[]; now: number }
  | { t: 'did'; cat: string; act: CareAct; by: string; byName: string; stats: Stats; now: number; coins?: number }
  /** A 合养 change; the new cat list follows in a 'cats' message. */
  | { t: 'co'; cat: string; op: CoOp; by: string; byName: string; to?: string }
  /** Cats back from work or the clinic; `coins` is the new wallet of whoever `to` names. */
  | { t: 'back'; list: Back[] }
  | { t: 'wallet'; coins: number }
  | { t: 'boxes'; list: Box[] }
  /** You just took this cat home: show who it turned out to be. */
  | { t: 'adopted'; cat: string }
  | { t: 'err'; msg: string };
export interface Back { cat: string; kind: AwayKind; pay: number; to?: string; coins?: number }

/** HTTP API answers. */
export interface Hello { id: string; token: string; code: string; name: string; street: string }
export interface StreetInfo { id: string; residents: string[]; full: boolean }
export const STREET_MAX = 4;
