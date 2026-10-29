import CatKit from '../cats/catkit';
import type { Cat } from '../game/data';

const cache = new Map<string, string>();

/** Expression for the avatar, from how the cat is doing. */
function face(c: Cat): Record<string, string> {
  if (c.health < 40) return { eye: 'closed', mouth: 'frown' };
  if (c.mood < 40 || c.food < 25) return { mouth: 'frown' };
  if (c.mood >= 90) return { eye: 'smile' };
  return {};
}

/** A head-only avatar as an image URL, cached per look. */
export function portraitURL(c: Cat): string {
  const f = face(c), key = `${c.coat}|${c.pers}|${f.eye ?? ''}|${f.mouth ?? ''}`;
  let url = cache.get(key);
  if (!url) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 160;
    const ctx = cv.getContext('2d')!;
    CatKit.use(c.coat, c.pers);
    ctx.translate(80, 92); ctx.scale(1.6, 1.6);
    CatKit.portrait(ctx, f);
    url = cv.toDataURL();
    cache.set(key, url);
  }
  return url;
}

export const portraitImg = (c: Cat) => `<img class="pt" src="${portraitURL(c)}" alt="${c.name}">`;
