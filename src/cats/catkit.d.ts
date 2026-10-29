// Types for the code-drawn cat engine (catkit.js).
export type CoatId = 'calico' | 'maine' | 'lihua';
export type PersId = 'lively' | 'cool' | 'lazy';
export type ClipName = 'idle' | 'walk' | 'run' | 'sneak' | 'jump' | 'turn';

/** A pose is a flat bag of numbers (body, legs, head, tail) plus a few face overrides. */
export interface Pose {
  [k: string]: number | string | number[] | undefined;
  lift: number;
  kx: number;
  ky: number;
  kr: number;
  bodyFlip: number;
  faceFlip?: number;
  eye?: string;
  mouth?: string;
  blink?: number;
}

export interface Gait { D: number; B: number }

export interface Clip {
  label: string;
  n: number;
  secs(): number;
  dist?: Gait;
  once?: number;
}

export interface PersProfile {
  walkT: number; runT: number; lift: number; bob: number; headY: number;
  tailUp: number; wag: number; hop: number;
  face: Record<string, number | string>;
}

declare const CatKit: {
  use(coat: CoatId, pers: PersId): void;
  draw(ctx: CanvasRenderingContext2D, pose: Pose): void;
  poseAt(name: ClipName, t: number): Pose;
  portrait(ctx: CanvasRenderingContext2D, overrides?: Partial<Pose>): void;
  CLIPS: Record<ClipName, Clip>;
  COATS: Record<CoatId, Record<string, unknown>>;
  PERS: Record<PersId, PersProfile>;
  FW: number; FH: number; GY: number;
  readonly M: PersProfile;
  readonly K: Record<string, unknown> & { size: number };
};
export default CatKit;
