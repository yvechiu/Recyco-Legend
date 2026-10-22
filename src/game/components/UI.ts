import { state, objective, saveStatus } from '../systems/SaveSystem';
import { sourceNotice } from '../data/dialogues';
export const $ = <T extends HTMLElement = HTMLElement>(selector: string): T =>
  document.querySelector<T>(selector)!;
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}
export function button(text: string, onClick: () => void, style = 'primary'): HTMLButtonElement {
  const b = el('button', `button ${style}`, text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}
export function modal(title: string, body: string): void {
  const root = $('#modal-body');
  root.replaceChildren(el('h2', '', title), el('p', '', body));
  const d = $<HTMLDialogElement>('#modal');
  if (!d.open) d.showModal();
}
export function feedback(message: string, kind: 'good' | 'bad' | 'info' = 'info'): void {
  const f = $('#feedback');
  f.className = kind;
  f.textContent = message;
}
export function clearUI(title: string, chapter: string, map?: () => void): void {
  $('#stage-ui').replaceChildren();
  $('#panel').replaceChildren();
  feedback('');
  const hud = $('#hud');
  hud.replaceChildren();
  const heading = el('div', 'scene-heading');
  heading.append(el('span', 'eyebrow', chapter), el('h1', '', title));
  hud.append(heading);
  if (state.name) {
    const quest = el('div', 'quest');
    quest.append(el('span', 'eyebrow', '目前任務'), el('span', '', objective()));
    hud.append(quest);
  }
  if (map) hud.append(button('↗ 地圖', map, 'light compact'));
  $('#stage').className = '';
  document.title = `${title} · 瑞賽可傳奇`;
}
export function titleBlock(kicker: string, title: string, desc: string): HTMLElement {
  const box = el('div', 'title-block');
  box.append(el('span', 'eyebrow', kicker), el('h2', '', title), el('p', '', desc));
  return box;
}
export function actions(...nodes: HTMLElement[]): HTMLElement {
  const row = el('div', 'actions');
  row.append(...nodes);
  return row;
}
export function art(kind: 'king' | 'sage' | 'goddess' | 'monster', extra = ''): HTMLElement {
  const figure = el('div', `original-art ${kind} ${extra}`);
  const img = el('img');
  img.alt = {
    king: '原企劃角色：國王溫',
    sage: '原企劃角色：智者慧',
    goddess: '原企劃角色：湖中女神',
    monster: '原企劃角色：廢棄怪',
  }[kind];
  img.src = `${import.meta.env.BASE_URL}assets/original/${kind === 'king' || kind === 'sage' ? 'king-sage' : kind}.png`;
  figure.append(img);
  return figure;
}
export function sourceDialog(): void {
  modal(
    '關於這段冒險',
    `${sourceNotice}\n\n原創企劃：邱郁棻（Yu-Fen Chiu）。角色圖像直接擷取自使用者提供的 22 頁企劃 PDF；場景繪圖、簡化對話、線索呈現與平衡數值為本次網頁實作。原企劃不是已發行的數位遊戲。聲音預設關閉，本版本未附音效。`,
  );
}
export function saveLabel(): HTMLElement {
  return el('p', 'save-note', saveStatus);
}
