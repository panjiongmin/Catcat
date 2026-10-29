// Static page chrome: the street layers, top HUD, zoom buttons, panel, dock and toast.
export function mountHud(root: HTMLElement) {
  root.innerHTML = `
<div id="world" role="application" aria-label="猫猫小街，可左右拖动和缩放">
  <svg id="back"></svg>
  <canvas id="cats"></canvas>
  <svg id="front"></svg>
</div>
<div class="hud-top">
  <div class="place"><b>猫猫小街</b><span id="coord">樱花街 8 号 · 晴</span></div>
  <div class="res">
    <div class="chip" title="猫币"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#FFC145" stroke="#C98A12" stroke-width="2"/><path d="M8 13c1.5 2 6.5 2 8 0" stroke="#7A4E05" stroke-width="2" stroke-linecap="round" fill="none"/></svg><span id="coins">0</span></div>
    <div class="chip pop">猫口 <span id="pop">0/0</span></div>
  </div>
</div>
<div class="hint" id="hint">左右拖动街道 · 滚轮或双指缩放 · 点猫咪和建筑</div>
<section class="panel" id="panel" hidden aria-live="polite"></section>
<div class="zoom">
  <button id="zin" aria-label="放大">+</button>
  <button id="zout" aria-label="缩小">−</button>
  <button id="zhome" aria-label="回到我的家"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C8620F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg></button>
</div>
<div class="dock"><div class="dock-inner" id="dock"></div></div>
<div class="toast" id="toast" hidden></div>
<div class="away" id="away" hidden role="dialog" aria-modal="true" aria-labelledby="away-h"></div>`;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
export { $ };

let toastT = 0;
export function toast(msg: string) {
  const t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT);
  toastT = window.setTimeout(() => (t.hidden = true), 2600);
}
