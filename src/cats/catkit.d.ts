// Types for the code-drawn cat engine (catkit.js).
import type { CoatId, PersId, ClipName, StageId } from '../game/types';
export type { CoatId, PersId, ClipName, StageId };

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

export interface GrowthProfile { size: number; head: number; eye: number; tail: number; pace: number }

declare const CatKit: {
  /** Pick the cat to draw next; the stage sets body size, head and eye size, tail length and pace. */
  use(coat: CoatId, pers: PersId, stage?: StageId): void;
  draw(ctx: CanvasRenderingContext2D, pose: Pose): void;
  poseAt(name: ClipName, t: number): Pose;
  portrait(ctx: CanvasRenderingContext2D, overrides?: Partial<Pose>): void;
  /** Blend two poses (tail angles take the short way round). */
  mix(a: Pose, b: Pose, t: number): Pose;
  CLIPS: Record<ClipName, Clip>;
  COATS: Record<CoatId, Record<string, unknown>>;
  PERS: Record<PersId, PersProfile>;
  FW: number; FH: number; GY: number;
  readonly M: PersProfile;
  readonly K: Record<string, unknown> & { size: number };
  STAGES: Record<StageId, GrowthProfile>;
  readonly G: GrowthProfile;
  /** Body scale of the current cat: coat size × stage size. */
  readonly scale: number;
};
export default CatKit;
