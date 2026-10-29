// Plain data shapes shared by the game, the save and the server (no DOM types here).
export type CoatId = 'calico' | 'maine' | 'lihua';
export type PersId = 'lively' | 'cool' | 'lazy';
export type StageId = 'kitten' | 'junior' | 'adult' | 'senior';
export type ClipName = 'idle' | 'walk' | 'run' | 'sneak' | 'jump' | 'turn' | 'sit' | 'sleep' | 'eat' | 'pet';

export interface Cat {
  id: string;
  name: string;
  breed: string;
  coat: CoatId;
  pers: PersId;
  lv: number;
  /** Birth time (ms); the growth stage follows from it. */
  born: number;
  mood: number;
  health: number;
  food: number;
  clean: number;
  /** Street position (world units). */
  x: number;
  y: number;
  /** Times (ms) of recent pets, for the hourly limit. */
  pets: number[];
  /** Player who owns the cat (online streets only). */
  owner?: string;
  /** Neighbour raising the cat together with its owner (合养). */
  co?: string;
  /** Pending ask from the owner to a neighbour to raise it together. */
  ask?: { to: string; at: number };
  /** One-off status line shown in the panel after an action. */
  msg?: string;
}
