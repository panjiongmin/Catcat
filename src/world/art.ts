import { OUT } from './config';

// Building art, side view, base centred at (0, 0). Drawn at scale 1.35 on the street.
const S = `stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
export const art: Record<string, string> = {
    home: `<ellipse cx="0" cy="2" rx="118" ry="14" fill="rgba(74,59,51,.18)"/>
<rect x="38" y="-232" width="22" height="50" fill="#C9A27A" ${S}/><rect x="34" y="-240" width="30" height="10" rx="3" fill="#B07C52" ${S}/>
<rect x="-92" y="-150" width="184" height="150" rx="6" fill="#FFF1DE" ${S}/>
<path d="M-112 -140 L-84 -236 L-50 -190 L50 -190 L84 -236 L112 -140 Z" fill="#F59468" ${S}/>
<path d="M-82 -206 L-72 -170 L-60 -186 Z M82 -206 L72 -170 L60 -186 Z" fill="#FFB3C1"/>
<path d="M-100 -152 H100" stroke="#D9734A" stroke-width="6"/>
<circle cx="-46" cy="-92" r="24" fill="#CDE8F5" ${S}/><path d="M-46 -116 V-68 M-70 -92 H-22" stroke="${OUT}" stroke-width="2.5"/>
<rect x="-74" y="-64" width="56" height="14" rx="4" fill="#B07C52" ${S}/><circle cx="-62" cy="-68" r="6" fill="#FF6B8A"/><circle cx="-46" cy="-70" r="6" fill="#FFC145"/><circle cx="-30" cy="-68" r="6" fill="#FF6B8A"/>
<path d="M14 0 V-64 A26 26 0 0 1 66 -64 V0 Z" fill="#B9764A" ${S}/><circle cx="56" cy="-34" r="3" fill="#FFC145"/>
<g fill="#8A5634"><circle cx="40" cy="-44" r="5"/><circle cx="33" cy="-52" r="2.4"/><circle cx="40" cy="-55" r="2.4"/><circle cx="47" cy="-52" r="2.4"/></g>
<rect x="-30" y="-206" width="60" height="22" rx="8" fill="#FFF6E9" ${S}/><text x="0" y="-189" text-anchor="middle" font-size="14" font-weight="900" fill="${OUT}">HOME</text>`,
    shop: `<ellipse cx="0" cy="2" rx="104" ry="13" fill="rgba(74,59,51,.18)"/>
<rect x="-84" y="-118" width="168" height="118" rx="6" fill="#FFF8EC" ${S}/>
<rect x="-90" y="-60" width="180" height="22" rx="4" fill="#B07C52" ${S}/>
<path d="M-100 -118 L-90 -160 H90 L100 -118 Z" fill="#F6C86A" ${S}/>
<path d="M-100 -118 q12 16 25 0 q12 16 25 0 q12 16 25 0 q12 16 25 0 q12 16 25 0 q12 16 25 0 q12 16 25 0 q12 16 25 0" fill="#6DB5BE" ${S}/>
<path d="M-60 -160 L-66 -118 M-20 -160 L-22 -118 M20 -160 L22 -118 M60 -160 L66 -118" stroke="#FFFFFF" stroke-width="8"/>
<path d="M-62 -196 C-42 -222 22 -222 42 -196 C22 -170 -42 -170 -62 -196 Z M42 -196 L64 -212 V-180 Z" fill="#93BCD2" ${S}/><circle cx="-40" cy="-200" r="4" fill="${OUT}"/>
<rect x="-76" y="-36" width="40" height="36" rx="4" fill="#E0B07A" ${S}/><rect x="-28" y="-30" width="36" height="30" rx="4" fill="#E0B07A" ${S}/>
<path d="M-70 -24 h28 M-22 -18 h24" stroke="#B07C52" stroke-width="3"/>
<rect x="24" y="-104" width="46" height="42" rx="4" fill="#FFFFFF" ${S}/><rect x="30" y="-96" width="12" height="16" rx="2" fill="#FF9F43"/><rect x="46" y="-96" width="12" height="16" rx="2" fill="#7ED6A7"/><rect x="30" y="-78" width="28" height="10" rx="2" fill="#FFC145"/>
<rect x="-70" y="-104" width="80" height="30" rx="6" fill="#FFFFFF" ${S}/><text x="-30" y="-84" text-anchor="middle" font-size="14" font-weight="900" fill="${OUT}">鲜鱼干</text>`,
    cafe: `<ellipse cx="0" cy="2" rx="124" ry="14" fill="rgba(74,59,51,.18)"/>
<rect x="-100" y="-170" width="200" height="170" rx="6" fill="#FFF8EC" ${S}/>
<rect x="-108" y="-186" width="216" height="24" rx="6" fill="#6B4A3A" ${S}/>
<path d="M-104 -150 H104 L96 -126 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 L-104 -150 Z" fill="#E0806A" ${S}/>
<path d="M-84 -150 L-86 -126 M-44 -150 L-46 -126 M-4 -150 L-6 -126 M36 -150 L36 -126 M76 -150 L76 -126" stroke="#FFFFFF" stroke-width="10"/>
<rect x="-86" y="-108" width="96" height="70" rx="8" fill="#CDE8F5" ${S}/>
<path d="M-52 -38 C-56 -56 -48 -66 -38 -66 C-28 -66 -22 -56 -26 -38 Z M-50 -62 L-50 -76 L-42 -66 Z M-26 -62 L-26 -76 L-34 -66 Z" fill="#F6A04D" stroke="${OUT}" stroke-width="2"/>
<rect x="-86" y="-38" width="96" height="8" fill="#B07C52"/>
<rect x="28" y="-96" width="52" height="96" rx="6" fill="#B9764A" ${S}/><circle cx="70" cy="-48" r="3" fill="#FFC145"/>
<circle cx="0" cy="-212" r="26" fill="#FFFFFF" ${S}/><path d="M-12 -220 h20 v12 a10 10 0 0 1 -20 0 z M8 -216 a5 5 0 0 1 0 8" fill="#B07C52" stroke="${OUT}" stroke-width="2"/><path d="M-6 -230 q3 -4 0 -8 M2 -230 q3 -4 0 -8" stroke="${OUT}" stroke-width="2" fill="none"/>
<path d="M0 -186 V-238" stroke="${OUT}" stroke-width="0"/>`,
    clinic: `<ellipse cx="0" cy="2" rx="118" ry="14" fill="rgba(74,59,51,.18)"/>
<rect x="-96" y="-150" width="192" height="150" rx="6" fill="#FFFFFF" ${S}/>
<path d="M-108 -146 L0 -206 L108 -146 Z" fill="#93BCD2" ${S}/>
<circle cx="0" cy="-160" r="22" fill="#FFFFFF" ${S}/><path d="M-6 -174 h12 v8 h8 v12 h-8 v8 h-12 v-8 h-8 v-12 h8 z" fill="#EE7D72"/>
<rect x="-80" y="-120" width="44" height="40" rx="6" fill="#CDE8F5" ${S}/><rect x="36" y="-120" width="44" height="40" rx="6" fill="#CDE8F5" ${S}/>
<rect x="-30" y="-92" width="60" height="92" rx="4" fill="#A9D8EE" ${S}/><path d="M0 -92 V0" stroke="${OUT}" stroke-width="2.5"/>
<rect x="-96" y="-34" width="56" height="10" rx="5" fill="#7ED6A7"/><rect x="40" y="-34" width="56" height="10" rx="5" fill="#7ED6A7"/>
<path d="M-70 -12 c-6 -8 4 -14 8 -6 c4 -8 14 -2 8 6 l-8 8 z" fill="#FFB3C1" stroke="${OUT}" stroke-width="2"/>`,
    murder: `<ellipse cx="0" cy="2" rx="120" ry="14" fill="rgba(74,59,51,.18)"/>
<rect x="-104" y="-240" width="44" height="240" fill="#5E4C78" ${S}/><path d="M-110 -238 L-82 -300 L-54 -238 Z" fill="#3E3253" ${S}/><circle cx="-82" cy="-210" r="10" fill="#FFD27A" ${S}/>
<rect x="-60" y="-170" width="160" height="170" fill="#6E5A8A" ${S}/>
<path d="M-74 -166 L20 -236 L114 -166 Z" fill="#3E3253" ${S}/>
<path d="M-40 -110 V-136 A12 12 0 0 1 -16 -136 V-110 Z M56 -110 V-136 A12 12 0 0 1 80 -136 V-110 Z M-92 -150 V-172 A10 10 0 0 1 -72 -172 V-150 Z" fill="#FFD27A" ${S}/>
<path d="M-6 0 V-62 A26 26 0 0 1 46 -62 V0 Z" fill="#2B2238" ${S}/><path d="M20 -88 V0" stroke="${OUT}" stroke-width="2.5"/>
<path d="M2 -216 c0 -16 36 -16 36 0 c0 14 -10 22 -18 22 c-8 0 -18 -8 -18 -22 z" fill="#FFFFFF" ${S}/><path d="M10 -214 q4 -4 8 0 M22 -214 q4 -4 8 0 M12 -202 q8 6 16 0" stroke="${OUT}" stroke-width="2" fill="none" stroke-linecap="round"/>
<rect x="-50" y="-58" width="40" height="12" rx="4" fill="#FFD27A"/><text x="-30" y="-49" text-anchor="middle" font-size="9" font-weight="900" fill="#3E3253">今晚开本</text>`,
    books: `<ellipse cx="0" cy="2" rx="128" ry="14" fill="rgba(74,59,51,.18)"/>
<rect x="-110" y="-150" width="110" height="150" rx="4" fill="#E2F0E6" ${S}/><rect x="0" y="-150" width="110" height="150" rx="4" fill="#FFE6EC" ${S}/>
<path d="M-122 -146 L-100 -196 H100 L122 -146 Z" fill="#A86B4C" ${S}/>
<rect x="-96" y="-182" width="80" height="22" rx="6" fill="#7FB08F" ${S}/><text x="-56" y="-166" text-anchor="middle" font-size="13" font-weight="900" fill="#FFFFFF">书店</text>
<rect x="16" y="-182" width="80" height="22" rx="6" fill="#F28FAB" ${S}/><text x="56" y="-166" text-anchor="middle" font-size="13" font-weight="900" fill="#FFFFFF">花店</text>
<rect x="-96" y="-124" width="80" height="62" rx="4" fill="#FFF8EC" ${S}/>
<g><rect x="-90" y="-114" width="8" height="24" fill="#E0806A"/><rect x="-80" y="-110" width="7" height="20" fill="#6DB5BE"/><rect x="-71" y="-116" width="9" height="26" fill="#FFC145"/><rect x="-60" y="-112" width="7" height="22" fill="#7FB08F"/><rect x="-51" y="-114" width="8" height="24" fill="#9C7BD1"/><rect x="-41" y="-110" width="7" height="20" fill="#E0806A"/><rect x="-32" y="-115" width="10" height="25" fill="#6DB5BE"/></g>
<path d="M-96 -88 H-16" stroke="#B07C52" stroke-width="4"/>
<path d="M-60 -30 V0 M-40 -30 V0" stroke="${OUT}" stroke-width="0"/>
<rect x="-80" y="-56" width="44" height="56" rx="4" fill="#7FB08F" ${S}/>
<rect x="16" y="-124" width="80" height="62" rx="4" fill="#FFFFFF" ${S}/>
<g stroke="${OUT}" stroke-width="2"><rect x="24" y="-80" width="16" height="14" rx="3" fill="#C9805A"/><rect x="48" y="-80" width="16" height="14" rx="3" fill="#C9805A"/><rect x="72" y="-80" width="16" height="14" rx="3" fill="#C9805A"/></g>
<circle cx="32" cy="-90" r="8" fill="#FF6B8A"/><circle cx="56" cy="-92" r="8" fill="#FFC145"/><circle cx="80" cy="-90" r="8" fill="#9C7BD1"/><circle cx="44" cy="-104" r="7" fill="#FFB3C1"/><circle cx="68" cy="-104" r="7" fill="#F59468"/>
<rect x="36" y="-56" width="44" height="56" rx="4" fill="#F28FAB" ${S}/>
<rect x="-6" y="-44" width="12" height="44" fill="#A86B4C"/>`,
    mystery: `<ellipse cx="0" cy="2" rx="100" ry="13" fill="rgba(74,59,51,.18)"/>
<rect x="-74" y="-236" width="148" height="236" rx="4" fill="#B3ADBF" ${S}/>
<path d="M-74 -236 v-22 h22 v12 h20 v-12 h22 v12 h20 v-12 h22 v12 h20 v-12 h22 v22" fill="#9D96AB" ${S}/>
<g stroke="#8E879C" stroke-width="2"><path d="M-74 -200 H74 M-74 -160 H74 M-74 -120 H74 M-74 -80 H74 M-74 -40 H74"/><path d="M-30 -236 V-200 M30 -236 V-200 M0 -200 V-160 M-50 -160 V-120 M40 -160 V-120 M-10 -120 V-80 M-46 -80 V-40 M50 -80 V-40"/></g>
<path d="M-40 -150 V-176 A10 10 0 0 1 -20 -176 V-150 Z M20 -150 V-176 A10 10 0 0 1 40 -176 V-150 Z" fill="#3E3253" ${S}/>
<path d="M-34 0 V-70 A34 34 0 0 1 34 -70 V0 Z" fill="#6B4A3A" ${S}/>
<path d="M-34 -50 H34 M-34 -22 H34" stroke="#3A2B22" stroke-width="3"/>
<rect x="-14" y="-62" width="28" height="22" rx="4" fill="#FFC145" ${S}/><path d="M-8 -62 v-8 a8 8 0 0 1 16 0 v8" fill="none" stroke="${OUT}" stroke-width="3"/><circle cx="0" cy="-53" r="3" fill="${OUT}"/>
<path d="M60 -10 q-14 -40 4 -80 q10 -24 -2 -50" stroke="#5E9E48" stroke-width="4" fill="none"/><circle cx="58" cy="-60" r="6" fill="#8CC56E"/><circle cx="66" cy="-110" r="6" fill="#8CC56E"/>
<circle cx="0" cy="-212" r="18" fill="#FFF6E9" ${S}/><circle cx="0" cy="-216" r="5" fill="${OUT}"/><path d="M-3 -213 L-5 -202 H5 L3 -213 Z" fill="${OUT}"/>`
};
