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
  /** Window glow and lamp light, drawn over the night tint but under the cats. */
  lights: SVGGElement;
  bNodes: Record<string, SVGGElement>;
  strayNodes: Record<string, SVGGElement>;
  lamps: { x: number; node: SVGGElement }[];
}

// The street is two SVG layers with the cat canvas sandwiched between them:
// everything whose base is above the cats' lane goes behind, the lamps on the kerb go in front.
// Colours that change with the time of day are CSS variables set by daylight.ts.
export function buildScene(backSvg: SVGSVGElement, frontSvg: SVGSVGElement, lightsSvg: SVGSVGElement): Scene {
  backSvg.appendChild(el('defs', {}, `
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky0)"/><stop offset=".7" style="stop-color:var(--sky1)"/><stop offset="1" style="stop-color:var(--sky2)"/></linearGradient>
<pattern id="pave" width="48" height="23" patternUnits="userSpaceOnUse"><rect width="48" height="23" style="fill:var(--pave)"/><path d="M0 22.5 H48 M24 0 V11 M0 11.5 H48 M12 11.5 V23 M36 11.5 V23" style="stroke:var(--paveLine)" stroke-width="2"/></pattern>
<pattern id="brick" width="56" height="26" patternUnits="userSpaceOnUse"><rect width="56" height="26" style="fill:var(--brick)"/><path d="M0 25 H56 M28 0 V12.5 M0 12.5 H56 M14 12.5 V26 M42 12.5 V26" style="stroke:var(--brickLine)" stroke-width="2.4"/></pattern>
<pattern id="grass" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" style="fill:var(--grass)"/><path d="M8 12 l2 -5 2 5 M28 30 l2 -5 2 5" style="stroke:var(--grassLine)" stroke-width="2" fill="none"/></pattern>
<pattern id="bloom" width="64" height="22" patternUnits="userSpaceOnUse"><path d="M6 22 q4 -10 8 0 M30 22 q5 -12 10 0 M50 22 q3 -8 7 0" style="fill:var(--strip)"/><circle cx="10" cy="11" r="4.5" fill="#FF9FB2"/><circle cx="35" cy="8" r="5" fill="#FFD27A"/><circle cx="53" cy="13" r="4" fill="#C9A6E8"/><circle cx="10" cy="11" r="1.6" fill="#FFF3D6"/><circle cx="35" cy="8" r="1.8" fill="#FFF3D6"/><circle cx="53" cy="13" r="1.4" fill="#FFF3D6"/></pattern>`));
  const back = el('g');
  backSvg.appendChild(back);
  back.appendChild(el('rect', { x: -3000, y: -1600, width: W + 6000, height: GROUND + 1600, fill: 'url(#sky)' }));

  // stars and a crescent moon fade in after dusk
  let stars = '';
  for (let i = 0; i < 110; i++) stars += `<circle cx="${-900 + (i * 397) % 5200}" cy="${-500 + (i * 131) % 760}" r="${1.1 + (i % 3) * .7}" fill="#FFF6D8" opacity="${.45 + (i % 4) * .14}"/>`;
  back.appendChild(el('g', { class: 'stars' }, `${stars}<circle cx="2300" cy="40" r="36" fill="#FFF3C4"/><circle cx="2316" cy="28" r="31" style="fill:var(--sky0)"/>`));

  // far layer scrolls at half speed for depth
  const far = el('g');
  back.appendChild(far);
  const cloud = (x: number, y: number, k: number, cls: string) => `<g transform="translate(${x} ${y}) scale(${k})"><path class="cloud ${cls}" d="M0 0 h120 a22 22 0 0 0 -14 -40 a30 30 0 0 0 -52 -14 a26 26 0 0 0 -46 16 a20 20 0 0 0 -8 38 z" style="fill:var(--cloud)" opacity=".9"/></g>`;
  let farHtml = '';
  for (let x = -700; x < 3300; x += 520) farHtml += cloud(x + (x % 3) * 40, 90 + ((x / 520) % 2) * 70, 0.8 + ((x / 520) % 3) * 0.2, (x / 520) % 2 ? 'c2' : '');
  farHtml += `<path d="M-900 ${GROUND} C-700 300 -420 300 -200 380 C0 300 300 290 520 370 C760 280 1040 300 1260 380 C1480 300 1760 290 1980 370 C2200 300 2460 290 2700 370 C2900 300 3120 310 3400 380 L3400 ${GROUND} Z" style="fill:var(--hill)"/>`;
  let fx = -800;
  const roofs = ['#E9C9B6', '#DCCBE0', '#D2DEE9', '#EED8BC'];
  while (fx < 3300) {
    const w = 70 + (Math.abs(fx) % 5) * 14, h = 40 + (Math.abs(fx) % 7) * 9, r = roofs[Math.abs(Math.round(fx / 90)) % 4];
    farHtml += `<rect x="${fx}" y="${GROUND - h}" width="${w}" height="${h}" style="fill:var(--farWall)"/><path d="M${fx - 6} ${GROUND - h} L${fx + w / 2} ${GROUND - h - 26} L${fx + w + 6} ${GROUND - h} Z" fill="${r}"/><rect x="${fx + w / 2 - 7}" y="${GROUND - h + 12}" width="14" height="12" rx="2" style="fill:var(--farWin)"/>`;
    fx += w + 30 + (Math.abs(fx) % 4) * 18;
  }
  far.innerHTML = farHtml;

  back.appendChild(el('g', {}, `
<rect x="-3000" y="${GROUND - 14}" width="${W + 6000}" height="16" style="fill:var(--strip)"/>
<rect x="-3000" y="${GROUND}" width="${W + 6000}" height="92" fill="url(#pave)"/>
<path d="M-3000 ${GROUND} H${W + 3000}" style="stroke:var(--paveLine)" stroke-width="3"/>
<rect x="-3000" y="${GROUND + 92}" width="${W + 6000}" height="12" style="fill:var(--curb)" stroke="${OUT}" stroke-width="2.5"/>
<rect x="-3000" y="${GROUND + 104}" width="${W + 6000}" height="104" fill="url(#brick)"/>
<rect x="-3000" y="${GROUND + 208}" width="${W + 6000}" height="10" style="fill:var(--curb)"/>
<rect x="-3000" y="${GROUND + 218}" width="${W + 6000}" height="1600" fill="url(#grass)"/>
<rect x="-3000" y="${GROUND + 214}" width="${W + 6000}" height="22" fill="url(#bloom)"/>
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

  // signs of life: flower pots by the doors, a blanket and basket at home, a letterbox, chimney smoke
  const pot = (x: number, c: string) => add(GROUND + 4, el('g', { transform: `translate(${x} ${GROUND + 4})` }, `<ellipse cx="0" cy="1" rx="17" ry="4" fill="rgba(74,59,51,.18)"/><path d="M-12 0 L-15 -20 H15 L12 0 Z" fill="#D9895A" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-15 -20 H15" stroke="#B86E45" stroke-width="3"/><circle cx="-6" cy="-28" r="7" fill="#8CC56E" stroke="${OUT}" stroke-width="2"/><circle cx="7" cy="-30" r="7" fill="#8CC56E" stroke="${OUT}" stroke-width="2"/><circle cx="0" cy="-37" r="6" fill="${c}" stroke="${OUT}" stroke-width="2"/>`));
  ([[668, '#FF9FB2'], [936, '#FFD27A'], [1060, '#C9A6E8'], [1362, '#FF9FB2'], [1772, '#FFD27A'], [2030, '#FF9FB2'], [2392, '#C9A6E8'], [2466, '#FFD27A'], [2742, '#FF9FB2'], [2958, '#C9A6E8'], [3124, '#FFD27A']] as [number, string][]).forEach(([x, c]) => pot(x, c));
  add(GROUND + 20, el('g', { transform: `translate(856 ${GROUND + 20})` }, `<ellipse cx="0" cy="0" rx="52" ry="11" fill="#F6B3C2" stroke="${OUT}" stroke-width="2.5"/><path d="M-36 -1 h72" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/><path d="M-40 -2 q0 -16 18 -18 h44 q18 2 18 18 z" fill="#D9A066" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round" transform="translate(68 -2) scale(.55)"/><path d="M-30 -10 h60" stroke="#B9814A" stroke-width="3" transform="translate(68 -2) scale(.55)"/>`));
  add(GROUND + 2, el('g', { transform: `translate(978 ${GROUND + 2})` }, `<rect x="-3" y="-44" width="6" height="44" fill="#8A5634" stroke="${OUT}" stroke-width="2"/><path d="M-14 -44 v-14 a14 12 0 0 1 28 0 v14 z" fill="#E86F51" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/><rect x="-8" y="-54" width="16" height="4" rx="2" fill="${OUT}"/><path d="M14 -56 v-12 h10 v6 h-10" fill="#FFD27A" stroke="${OUT}" stroke-width="2"/>`));
  back.appendChild(el('g', { class: 'smoke' }, `<circle cx="866" cy="132" r="11"/><circle cx="866" cy="132" r="11"/><circle cx="866" cy="132" r="11"/>`));

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

  lightsSvg.appendChild(el('defs', {}, `
<radialGradient id="halo"><stop offset="0" stop-color="#FFE7A6" stop-opacity=".85"/><stop offset=".55" stop-color="#FFD27A" stop-opacity=".35"/><stop offset="1" stop-color="#FFC56A" stop-opacity="0"/></radialGradient>
<radialGradient id="pool"><stop offset="0" stop-color="#FFE0A0" stop-opacity=".55"/><stop offset="1" stop-color="#FFD08A" stop-opacity="0"/></radialGradient>`));
  const lights = el('g');
  lightsSvg.appendChild(lights);
  const wins = el('g', { class: 'wins' });
  lights.appendChild(wins);
  const GLASS = new Set(['#CDE8F5', '#A9D8EE']), LIT = new Set(['#FFD27A']);
  for (const id in bNodes) {
    const node = bNodes[id], halos: string[] = [];
    node.querySelectorAll<SVGGraphicsElement>('rect, circle, path').forEach(n => {
      const f = (n.getAttribute('fill') ?? '').toUpperCase();
      if (!GLASS.has(f) && !LIT.has(f)) return;
      if (GLASS.has(f)) n.style.fill = 'var(--glass)';
      const b = n.getBBox();
      if (b.width < 12 || b.height < 12) return;
      halos.push(`<ellipse cx="${b.x + b.width / 2}" cy="${b.y + b.height / 2}" rx="${b.width * .95 + 14}" ry="${b.height * .95 + 14}" fill="url(#halo)"/>`);
    });
    wins.appendChild(el('g', { transform: node.getAttribute('transform')! }, halos.join('')));
  }

  // lamp posts stand on the kerb, in front of every cat; fairy lights hang between them, behind the cats
  const LAMPS = [260, 1010, 1700, 2420, 3200];
  lights.appendChild(el('g', { class: 'pools' }, LAMPS.map(x => `<ellipse cx="${x}" cy="${GROUND + 66}" rx="150" ry="40" fill="url(#pool)"/>`).join('')));
  const front = el('g');
  frontSvg.appendChild(front);
  frontSvg.appendChild(el('defs', {}, `<radialGradient id="lampHalo"><stop offset="0" stop-color="#FFE7A6" stop-opacity=".9"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>`));
  let fairy = '';
  const BULB = ['#FFD27A', '#FF9F8A', '#9FD8C9', '#FFE9A8'];
  for (let j = 0; j < LAMPS.length - 1; j++) {
    const x1 = LAMPS[j], x2 = LAMPS[j + 1], y = GROUND + 86 - 156, sag = 52;
    fairy += `<path d="M${x1} ${y} Q${(x1 + x2) / 2} ${y + sag * 2} ${x2} ${y}" fill="none" stroke="#6B5648" stroke-width="2"/>`;
    const n = Math.round((x2 - x1) / 44);
    for (let i = 1; i < n; i++) {
      const t = i / n, bx = x1 + (x2 - x1) * t, by = y + 2 * (1 - t) * t * sag * 2 + 6, c = BULB[i % 4];
      fairy += `<circle class="bulb-glow" cx="${bx}" cy="${by}" r="13" fill="${c}"/><circle cx="${bx}" cy="${by}" r="5" fill="${c}" stroke="#6B5648" stroke-width="1.5"/>`;
    }
  }
  // behind the cats, over the night tint so the bulbs stay bright
  lights.appendChild(el('g', { class: 'fairy' }, fairy));
  // petals drifting down across the street
  let petals = '';
  for (let i = 0; i < 34; i++) petals += `<ellipse class="petal" style="--px:${(i * 211) % W}px;--d:${9 + (i % 5) * 2.2}s;--dl:-${(i * 1.7) % 12}s;--sw:${(i % 2 ? 1 : -1) * (30 + (i % 4) * 14)}px" cx="0" cy="0" rx="5" ry="3" fill="${i % 3 ? '#FFC2CF' : '#FFDDE4'}"/>`;
  front.appendChild(el('g', { class: 'petals' }, petals));
  const lamps: Scene['lamps'] = [];
  for (const x of LAMPS) {
    lamps.push({ x, node: front.appendChild(el('g', { class: 'lamp', transform: `translate(${x} ${GROUND + 86})` }, `<circle class="lamp-glow" cx="0" cy="-150" r="64" fill="url(#lampHalo)"/><rect x="-4" y="-146" width="8" height="146" fill="#6B5648" stroke="${OUT}" stroke-width="2.5"/><rect x="-10" y="-8" width="20" height="10" rx="3" fill="#6B5648" stroke="${OUT}" stroke-width="2.5"/><path d="M-13 -146 L-9 -166 H9 L13 -146 Z" fill="#FFD27A" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>`)) });
  }
  return { back, front, far, lights, bNodes, strayNodes, lamps };
}
