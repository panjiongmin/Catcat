import { W, H } from './config';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Screen = world * k + (x, y). */
export const cam = { k: 1, x: 0, y: 0 };
/** Screen space kept free at the bottom (dock, or the phone sheet when it is open). */
export const pad = { bottom: 140 };
export const view = { w: 0, h: 0 };

type Listener = () => void;
const listeners: Listener[] = [];
export const onCamera = (f: Listener) => listeners.push(f);

const minK = () => Math.max(view.w / W, (view.h / H) * 0.55);
const maxK = () => 2.6;

/** Clamp to the street and notify layers. */
export function applyCam() {
  const k = cam.k, sw = W * k, sh = H * k;
  cam.x = sw < view.w ? (view.w - sw) / 2 : clamp(cam.x, view.w - sw - 60, 60);
  cam.y = sh < view.h ? (view.h - sh) / 2 : clamp(cam.y, view.h - sh - pad.bottom, 90);
  for (const f of listeners) f();
}

export const toWorld = (sx: number, sy: number) => ({ x: (sx - cam.x) / cam.k, y: (sy - cam.y) / cam.k });

export function zoomAt(px: number, py: number, k2: number) {
  k2 = clamp(k2, minK(), maxK());
  const w = toWorld(px, py);
  cam.k = k2; cam.x = px - w.x * k2; cam.y = py - w.y * k2;
  applyCam();
}

export function setView(w: number, h: number) { view.w = w; view.h = h; applyCam(); }

let flyAnim = 0;
export const stopFly = () => cancelAnimationFrame(flyAnim);
/** Ease the camera so (wx, wy) lands at the view centre, nudged by `off` to clear an open panel. */
export function flyTo(wx: number, wy: number, k2 = cam.k, off = { x: 0, y: 0 }) {
  k2 = clamp(k2, minK(), maxK());
  const from = { ...cam };
  const to = { k: k2, x: view.w / 2 + off.x - wx * k2, y: view.h / 2 + off.y - wy * k2 };
  const t0 = performance.now();
  stopFly();
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / 520), e = 1 - Math.pow(1 - p, 3);
    cam.k = from.k + (to.k - from.k) * e; cam.x = from.x + (to.x - from.x) * e; cam.y = from.y + (to.y - from.y) * e;
    applyCam();
    if (p < 1) flyAnim = requestAnimationFrame(step);
  };
  flyAnim = requestAnimationFrame(step);
}

export function initCam(focusX: number) {
  const phone = view.w < 700;
  cam.k = clamp(phone ? 0.85 : clamp((view.h / H) * 0.95, 0.7, 1.2), minK(), maxK());
  const fy = phone ? 420 : 400;
  cam.x = view.w / 2 - focusX * cam.k; cam.y = view.h / 2 - fy * cam.k;
  applyCam();
}

export const isPhone = () => view.w < 700;
