import { W, GROUND, OUT } from './config';
import { art } from './art';
import { buildings, strays } from '../game/data';

const NS = 'http://www.w3.org/2000/svg';
export const el = (tag: string, attrs: Record<string, string | number> = {}, html?: string) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  if (html != null) n.innerHTML = html;
  return n as SVGGElement;
};

export interface Scene {
  /** Camera groups: the street behind the cats, and the lamp posts in front of them. */
  back: SVGGElement;
  front: SVGGElement;
  far: SVGGElement;
  bNodes: Record<string, SVGGElement>;
  strayNodes: Record<string, SVGGElement>;
  lamps: { x: number; node: SVGGElement }[];
}

// The street is two SVG layers with the cat canvas sandwiched between them:
// everything whose base is above the cats' lane goes behind, the lamps on the kerb go in front.
export function buildScene(backSvg: SVGSVGElement, frontSvg: SVGSVGElement): Scene {
  backSvg.appendChild(el('defs', {}, `
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE3F5"/><stop offset=".75" stop-color="#E8F3F0"/><stop offset="1" stop-color="#FFF1DC"/></linearGradient>
<pattern id="pave" width="48" height="23" patternUnits="userSpaceOnUse"><rect width="48" height="23" fill="#EBDDC6"/><path d="M0 22.5 H48 M24 0 V11 M0 11.5 H48 M12 11.5 V23 M36 11.5 V23" stroke="#D9C6A8" stroke-width="2"/></pattern>
<pattern id="grass" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#CFE6B4"/><path d="M8 12 l2 -5 2 5 M28 30 l2 -5 2 5" stroke="#B5D396" stroke-width="2" fill="none"/></pattern>`));
  const back = el('g');
  backSvg.appendChild(back);
  back.appendChild(el('rect', { x: -3000, y: -1600, width: W + 6000, height: GROUND + 1600, fill: 'url(#sky)' }));

  // far layer scrolls at half speed for depth
  const far = el('g');
  back.appendChild(far);
  const cloud = (x: number, y: number, k: number, cls: string) => `<g transform="translate(${x} ${y}) scale(${k})"><path class="cloud ${cls}" d="M0 0 h120 a22 22 0 0 0 -14 -40 a30 30 0 0 0 -52 -14 a26 26 0 0 0 -46 16 a20 20 0 0 0 -8 38 z" fill="#FFFFFF" opacity=".9"/></g>`;
  let farHtml = '';
  for (let x = -700; x < 3300; x += 520) farHtml += cloud(x + (x % 3) * 40, 90 + ((x / 520) % 2) * 70, 0.8 + ((x / 520) % 3) * 0.2, (x / 520) % 2 ? 'c2' : '');
  farHtml += `<path d="M-900 ${GROUND} C-700 300 -420 300 -200 380 C0 300 300 290 520 370 C760 280 1040 300 1260 380 C1480 300 1760 290 1980 370 C2200 300 2460 290 2700 370 C2900 300 3120 310 3400 380 L3400 ${GROUND} Z" fill="#CFE3BE"/>`;
  let fx = -800;
  const roofs = ['#E9C9B6', '#DCCBE0', '#D2DEE9', '#EED8BC'];
  while (fx < 3300) {
    const w = 70 + (Math.abs(fx) % 5) * 14, h = 40 + (Math.abs(fx) % 7) * 9, r = roofs[Math.abs(Math.round(fx / 90)) % 4];
    farHtml += `<rect x="${fx}" y="${GROUND - h}" width="${w}" height="${h}" fill="#F1E5D4"/><path d="M${fx - 6} ${GROUND - h} L${fx + w / 2} ${GROUND - h - 26} L${fx + w + 6} ${GROUND - h} Z" fill="${r}"/><rect x="${fx + w / 2 - 7}" y="${GROUND - h + 12}" width="14" height="12" rx="2" fill="#E4D3BC"/>`;
    fx += w + 30 + (Math.abs(fx) % 4) * 18;
  }
  far.innerHTML = farHtml;

  back.appendChild(el('g', {}, `
<rect x="-3000" y="${GROUND - 14}" width="${W + 6000}" height="16" fill="#B9D7A0"/>
<rect x="-3000" y="${GROUND}" width="${W + 6000}" height="92" fill="url(#pave)"/>
<path d="M-3000 ${GROUND} H${W + 3000}" stroke="#CDB794" stroke-width="3"/>
<rect x="-3000" y="${GROUND + 92}" width="${W + 6000}" height="12" fill="#D8CDBD" stroke="${OUT}" stroke-width="2.5"/>
<rect x="-3000" y="${GROUND + 104}" width="${W + 6000}" height="104" fill="#A9A39B"/>
<path d="M-3000 ${GROUND + 156} H${W + 3000}" stroke="#F4EEE4" stroke-width="5" stroke-dasharray="40 34"/>
<rect x="-3000" y="${GROUND + 208}" width="${W + 6000}" height="10" fill="#D8CDBD"/>
<rect x="-3000" y="${GROUND + 218}" width="${W + 6000}" height="1600" fill="url(#grass)"/>
${[120, 2830, 3340].map(x => `<g transform="translate(${x} ${GROUND})"><rect x="-74" y="-170" width="148" height="170" fill="#B98D6B" stroke="${OUT}" stroke-width="3"/><path d="M-74 -140 H74 M-74 -110 H74 M-74 -80 H74 M-74 -50 H74 M-74 -20 H74" stroke="#9E7354" stroke-width="2"/><path d="M-30 0 V-120 A30 30 0 0 1 30 -120 V0 Z" fill="#5B4A44" stroke="${OUT}" stroke-width="3"/><rect x="34" y="-46" width="30" height="46" rx="4" fill="#7F9A8C" stroke="${OUT}" stroke-width="2.5"/><rect x="30" y="-52" width="38" height="8" rx="3" fill="#6B8578" stroke="${OUT}" stroke-width="2"/><text x="0" y="-146" text-anchor="middle" font-family="ZCOOL KuaiLe, sans-serif" font-size="15" fill="#FFF6E9">小巷</text></g>`).join('')}`));

  // objects behind the lane, painted back to front
  const objs: [number, SVGGElement][] = [];
  const add = (y: number, node: SVGGElement) => { objs.push([y, node]); return node; };
  const tree = (x: number, r: number, c: string) => add(GROUND - 1, el('g', { transform: `translate(${x} ${GROUND - 1})` }, `<rect x="-8" y="-${r * 1.6}" width="16" height="${r * 1.6}" rx="5" fill="#A0714A" stroke="${OUT}" stroke-width="3"/><g class="leaf"><circle cx="0" cy="-${r * 2}" r="${r}" fill="${c}" stroke="${OUT}" stroke-width="3"/><circle cx="-${r * .6}" cy="-${r * 1.55}" r="${r * .62}" fill="${c}" stroke="${OUT}" stroke-width="3"/><circle cx="${r * .6}" cy="-${r * 1.6}" r="${r * .66}" fill="${c}" stroke="${OUT}" stroke-width="3"/><circle cx="-${r * .3}" cy="-${r * 2.3}" r="${r * .3}" fill="rgba(255,255,255,.25)"/></g>`));
  ([[610, 40, '#8CC56E'], [1020, 34, '#F2A7B8'], [1500, 48, '#7FBF68'], [1640, 38, '#9BD07A'], [2420, 36, '#8CC56E'], [3200, 40, '#9BD07A'], [-40, 44, '#8CC56E']] as [number, number, string][]).forEach(([x, r, c]) => tree(x, r, c));
  const hedge = (x: number, w: number) => add(GROUND - 2, el('g', { transform: `translate(${x} ${GROUND})` }, `<path d="M${-w / 2} 0 v-26 q${w / 8} -20 ${w / 4} 0 q${w / 8} -20 ${w / 4} 0 q${w / 8} -20 ${w / 4} 0 q${w / 8} -20 ${w / 4} 0 v26 z" fill="#9BD07A" stroke="${OUT}" stroke-width="3"/><circle cx="${-w / 4}" cy="-24" r="4" fill="#FF8FAB"/><circle cx="${w / 6}" cy="-28" r="4" fill="#FFC145"/>`));
  ([[1010, 80], [1560, 150], [2060, 70], [2420, 80]] as [number, number][]).forEach(([x, w]) => hedge(x, w));
  // park bench between the cafe and the clinic
  add(GROUND + 14, el('g', { transform: `translate(1560 ${GROUND + 14})` }, `<rect x="-60" y="-26" width="120" height="12" rx="6" fill="#B07C52" stroke="${OUT}" stroke-width="3"/><rect x="-54" y="-14" width="8" height="18" fill="#8A5634"/><rect x="46" y="-14" width="8" height="18" fill="#8A5634"/><rect x="-60" y="-50" width="120" height="10" rx="5" fill="#C9A27A" stroke="${OUT}" stroke-width="3"/><text x="0" y="-62" text-anchor="middle" font-family="ZCOOL KuaiLe, sans-serif" font-size="18" fill="#5E7A45">小公园</text>`));

  const bNodes: Record<string, SVGGElement> = {};
  for (const id in buildings) {
    const b = buildings[id];
    const w = b.name.length * 18 + 36;
    bNodes[id] = add(b.y, el('g', { transform: `translate(${b.x} ${b.y}) scale(1.35)`, 'data-b': id, class: 'hit' },
      `<rect x="-130" y="-300" width="260" height="300" fill="transparent"/>${art[id].replace(/^\s*<ellipse[^>]*\/>\s*/, '')}
<g><rect x="${-w / 2}" y="14" width="${w}" height="32" rx="16" fill="#FFFFFF" stroke="${OUT}" stroke-width="2.5"/><text x="0" y="37" text-anchor="middle" font-family="ZCOOL KuaiLe, sans-serif" font-size="20" fill="${OUT}">${b.name}</text></g><g class="badge"></g>`));
  }

  const strayNodes: Record<string, SVGGElement> = {};
  for (const s of strays) {
    strayNodes[s.id] = add(s.y, el('g', { transform: `translate(${s.x} ${s.y})`, 'data-stray': s.id, class: 'hit' }, `<rect x="-40" y="-90" width="80" height="96" fill="transparent"/>
<ellipse cx="0" cy="2" rx="34" ry="5" fill="rgba(74,59,51,.2)"/>
<path d="M-28 0 V-30 H28 V0 Z" fill="#D9A066" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
<path d="M-28 -30 L-38 -42 H18 L28 -30 Z" fill="#E8B983" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
<path d="M-12 -30 l3 -7 l4 6 M6 -30 l3 -7 l4 6" fill="#3B3434" stroke="${OUT}" stroke-width="2"/>
<g class="stray-q"><circle cx="0" cy="-66" r="17" fill="#FFFFFF" stroke="#E8781F" stroke-width="3" stroke-dasharray="5 4"/><text x="0" y="-59" text-anchor="middle" font-size="20" font-weight="900" fill="#B4531A">?</text></g>`));
  }
  objs.sort((a, b) => a[0] - b[0]).forEach(([, n]) => back.appendChild(n));

  // lamp posts stand on the kerb, in front of every cat
  const front = el('g');
  frontSvg.appendChild(front);
  const lamps: Scene['lamps'] = [];
  for (const x of [260, 1010, 1700, 2420, 3200]) {
    lamps.push({ x, node: front.appendChild(el('g', { class: 'lamp', transform: `translate(${x} ${GROUND + 86})` }, `<circle class="lamp-glow" cx="0" cy="-150" r="30" fill="#FFE2A8" opacity=".6"/><rect x="-4" y="-146" width="8" height="146" fill="#6B5648" stroke="${OUT}" stroke-width="2.5"/><rect x="-10" y="-8" width="20" height="10" rx="3" fill="#6B5648" stroke="${OUT}" stroke-width="2.5"/><path d="M-13 -146 L-9 -166 H9 L13 -146 Z" fill="#FFD27A" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>`)) });
  }
  return { back, front, far, bNodes, strayNodes, lamps };
}
