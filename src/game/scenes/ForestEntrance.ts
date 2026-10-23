import { AdventureScene } from './AdventureScene';
import { $, el, button, titleBlock, actions, feedback } from '../components/UI';
import { state, persist } from '../systems/SaveSystem';
import { showMagicMap, mapHint } from '../components/MagicMap';
export class ForestEntrance extends AdventureScene {
  constructor() {
    super('ForestEntrance');
  }
  create(): void {
    this.setup('廢棄森林入口', '兩個線索 · 一扇魔法之門', 'forest');
    this.tag('「給了你這兩個線索，應該能找到正確入口了吧？」');
    this.spawnHero(580, 365);
    const panel = $('#panel');
    panel.className = 'entrance-panel';
    panel.append(
      titleBlock(
        '勇士手記 · 拼湊線索',
        '森林的門，等著你的答案。',
        '回想女神的提示，找出入口密碼。先讀魔法地圖上的橫軸，再讀縱軸。',
      ),
    );
    const clues = el('div', 'clue-grid');
    const first = el('article', 'clue-card');
    first.append(
      el('strong', '', state.q1 ? '✦ 線索一：五位數' : '⌑ 線索一：尚未取得'),
      el('p', '', state.q1 ? '女神告訴你：森林的通關密語是五位數。' : '完成女神的垃圾流程排序題。'),
    );
    const second = el('article', 'clue-card');
    second.append(
      el('strong', '', state.q2 ? '✦ 線索二：魔法地圖' : '⌑ 線索二：尚未取得'),
      el(
        'p',
        '',
        state.q2
          ? state.mapHintUnlocked
            ? mapHint
            : '地圖上有通往森林的星號。展開地圖，試著解讀它的位置；需要協助時可請教智者。'
          : '完成女神的焚化產物配對題。',
      ),
    );
    if (state.q2)
      second.append(
        button(
          '展開魔法地圖',
          () =>
            showMagicMap(() => {
              second.querySelector('p')!.textContent = mapHint;
            }),
          'text small',
        ),
      );
    clues.append(first, second);
    panel.append(clues);
    if (!(state.q1 && state.q2)) {
      panel.append(actions(button('回克林湖取得線索 →', () => this.go('LakeGoddess'))));
      return;
    }
    if (state.unlocked) {
      this.opened(panel);
      return;
    }
    const form = el('form', 'password-form');
    const label = el('label', '', '輸入五位數通關密碼');
    const input = el('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.pattern = '[0-9]{5}';
    input.maxLength = 5;
    input.placeholder = '· · · · ·';
    input.autocomplete = 'off';
    input.required = true;
    input.setAttribute('aria-label', '五位數通關密碼');
    label.append(input);
    const submit = el('button', 'button primary', '解開封印 →');
    submit.type = 'submit';
    form.append(label, submit);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value === '16080') {
        state.unlocked = true;
        persist();
        this.burst(600, 270);
        feedback('✓ 魔法封印解開了！入口就在這裡。', 'good');
        form.remove();
        this.opened(panel);
      } else {
        feedback(
          state.mapHintUnlocked
            ? `門沒有打開。${mapHint}`
            : '門沒有打開。再看看地圖的星號與格線；需要協助時，可以在地圖中請教智者。',
          'bad',
        );
        input.focus();
      }
    });
    panel.append(form);
  }
  private opened(panel: HTMLElement): void {
    panel.append(
      el('p', 'dialogue', '森林深處傳來廢棄怪的聲音：「想打敗我？我看你連找到我都很難吧！」'),
      actions(
        button(state.cleaned ? '前往挑戰廢棄怪 →' : '走進森林，開始清理 →', () =>
          this.go(state.cleaned ? 'BossBattle' : 'ForestCleanup'),
        ),
      ),
    );
  }
}
