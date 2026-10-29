// Plain data shapes shared by the game, the save and the server (no DOM types here).
export type CoatId = 'calico' | 'maine' | 'lihua';
export type PersId = 'lively' | 'cool' | 'lazy';
export type StageId = 'kitten' | 'junior' | 'adult' | 'senior';
/** Places a cat can be sent: three jobs and the pet clinic. */
export type AwayKind = 'cafe' | 'murder' | 'mystery' | 'clinic';
export type ClipName = 'idle' | 'walk' | 'run' | 'sneak' | 'jump' | 'turn' | 'sit' | 'sleep' | 'eat' | 'pet';

/** A cardboard box with a stray in it, at one of the street's box spots, until the cat wanders off. */
export interface Box { id: string; until: number }

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
  /** Out at work or in the clinic until `end` (ms); off the street meanwhile. */
  away?: { kind: AwayKind; start: number; end: number; pay: number; by?: string };
  /** One-off status line shown in the panel after an action. */
  msg?: string;
}
