import { $, el, button } from './UI';
import { state, persist } from '../systems/SaveSystem';
export const mapHint =
  '讀取星號位置：橫軸 160、縱軸 80。將橫軸與縱軸數字相接，符合五位數的第一個線索。';
// Optional assistance: identify the landmark and interpret the axes before revealing coordinates.
export function showMagicMap(onHint: () => void): void {
  const body = $('#modal-body');
  const viewport = el('div', 'magic-map-viewport');
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', '魔法地圖，可捲動查看放大後的細節');
  const img = el('img');
  img.alt = '魔法地圖：請觀察森林中的星號與座標格線。';
  img.src = `${import.meta.env.BASE_URL}assets/original/clue-map.png`;
  let enlarged = false;
  const toggle = () => {
    enlarged = !enlarged;
    viewport.classList.toggle('enlarged', enlarged);
    picture.setAttribute('aria-label', enlarged ? '縮小魔法地圖' : '放大魔法地圖');
    picture.setAttribute('aria-pressed', String(enlarged));
    zoom.textContent = enlarged ? '縮回全圖' : '放大查看';
    zoom.setAttribute('aria-pressed', String(enlarged));
    if (!enlarged) {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
  };
  const picture = button('', toggle, 'magic-map-picture');
  picture.setAttribute('aria-label', '放大魔法地圖');
  picture.setAttribute('aria-pressed', 'false');
  picture.append(img);
  const zoom = button('放大查看', toggle, 'light compact');
  zoom.setAttribute('aria-pressed', 'false');
  viewport.append(picture);
  const help = el('section', 'map-help');
  help.setAttribute('aria-label', '智者的解圖挑戰');
  const reveal = () =>
    help.replaceChildren(el('h3', '', '✓ 已獲得智者的解圖提示'), el('p', '', mapHint));
  let step = 0;
  const questions = [
    {
      title: '觀察 1 / 2：星號標記在哪一種地形？',
      choices: ['湖泊', '森林', '火山'],
      correct: '森林',
      hint: '找找地圖上的小星號，它旁邊有密集的樹木。',
    },
    {
      title: '解讀 2 / 2：要把位置變成密語，應該怎麼讀？',
      choices: ['先橫軸，再接縱軸', '先縱軸，再接橫軸', '把兩個座標相加'],
      correct: '先橫軸，再接縱軸',
      hint: '依入口手記的順序讀橫軸、縱軸，並保留兩個數字的順序。',
    },
  ];
  const challenge = () => {
    const q = questions[step];
    const status = el('p');
    status.setAttribute('role', 'status');
    const choices = el('div', 'actions');
    help.replaceChildren(el('h3', '', q.title), status, choices);
    q.choices.forEach((answer) =>
      choices.append(
        button(
          answer,
          () => {
            if (answer !== q.correct) {
              status.textContent = q.hint;
              return;
            }
            step++;
            if (step < questions.length) challenge();
            else {
              state.mapHintUnlocked = true;
              persist();
              onHint();
              reveal();
            }
            const heading = help.querySelector('h3');
            if (heading) {
              heading.tabIndex = -1;
              heading.focus({ preventScroll: true });
            }
          },
          'light',
        ),
      ),
    );
  };
  if (state.mapHintUnlocked) reveal();
  else
    help.append(
      el(
        'p',
        '',
        '先自己找找星號並讀取格線。若需要協助，完成兩個解圖步驟，就能獲得智者的詳細提示。',
      ),
      button('請智者協助解圖', challenge, 'light'),
    );
  body.replaceChildren(
    el('h2', '', '女神的魔法地圖'),
    viewport,
    el(
      'p',
      'fine-print',
      '點擊地圖可以放大／縮小。放大後可拖動捲軸或滑動查看，也可用鍵盤在地圖區域捲動。',
    ),
    zoom,
    help,
  );
  $<HTMLDialogElement>('#modal').showModal();
}
