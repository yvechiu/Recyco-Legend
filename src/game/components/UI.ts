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
    king: '國王溫',
    sage: '智者慧',
    goddess: '湖中女神',
    monster: '廢棄怪',
  }[kind];
  img.src = `${import.meta.env.BASE_URL}assets/original/${kind === 'king' || kind === 'sage' ? 'king-sage' : kind}.png`;
  figure.append(img);
  return figure;
}
export function sourceDialog(): void {
  modal(
    '關於這段冒險',
    `${sourceNotice}\n\n一起守護循環島：先減量、重複使用，再做好分類，讓資源繼續循環。\n\n© 邱郁棻（Yu-Fen Chiu）。聲音預設關閉，本版本未附音效。`,
  );
}
export function saveLabel(): HTMLElement {
  return el('p', 'save-note', saveStatus);
}
