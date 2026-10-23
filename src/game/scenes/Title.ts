import { AdventureScene } from './AdventureScene';
import { $, el, button, actions, titleBlock, saveLabel, feedback } from '../components/UI';
import { state, reset, persist } from '../systems/SaveSystem';
export class Title extends AdventureScene {
  constructor() {
    super('Title');
  }
  create(): void {
    this.setup('瑞賽可傳奇', '循環島冒險手記 · RECYCO LEGEND', 'forest', false);
    $('#stage').classList.add('title-stage');
    const hero = el('div', 'title-hero');
    hero.append(
      el('span', 'eyebrow', '一點智慧，一起改變世界'),
      el('h2', '', '讓美麗，\n再次循環。'),
      el('p', '', '循環島正等待一位勇士。\n探索、學習、分類，找回森林原本的模樣。'),
    );
    $('#stage-ui').append(hero);
    const seal = el('div', 'adventure-seal');
    seal.innerHTML =
      '<span>THE ISLAND NEEDS YOU</span><strong>↻</strong><small>一場有意義的冒險</small>';
    $('#stage-ui').append(seal);
    const panel = $('#panel');
    panel.className = 'title-panel';
    panel.append(
      titleBlock(
        '你的冒險，從這裡開始',
        '成為循環島的勇士',
        '選擇你的模樣，帶上名字出發。進度會在這台裝置自動保存。',
      ),
    );
    const form = el('form', 'creation');
    const label = el('label', '', '勇士的名字');
    label.htmlFor = 'hero-name';
    const input = el('input');
    input.id = 'hero-name';
    input.name = 'hero-name';
    input.placeholder = '請輸入名字（1–12 字）';
    input.maxLength = 24;
    input.required = true;
    input.setAttribute('autocomplete', 'nickname');
    input.value = state.name;
    label.append(input);
    form.append(label);
    const fieldset = el('fieldset', 'portraits');
    fieldset.append(el('legend', '', '選擇勇士外觀'));
    let choice = state.hero;
    // Appearance labels are new UI copy, not names assigned by the source author.
    const names = ['赤焰勇士', '綠風遊俠', '藍海守衛', '紫月旅人'];
    names.forEach((name, i) => {
      const l = el('label', 'portrait-option');
      const radio = el('input');
      radio.type = 'radio';
      radio.name = 'hero';
      radio.value = String(i);
      radio.checked = i === choice;
      radio.addEventListener('change', () => (choice = i));
      const image = el('span', `portrait hero-${i}`);
      image.setAttribute('aria-hidden', 'true');
      l.append(radio, image, el('span', '', name));
      fieldset.append(l);
    });
    form.append(fieldset);
    const start = el('button', 'button primary', '開始冒險 →');
    start.type = 'submit';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name || [...name].length > 12) {
        feedback('請輸入 1–12 字的勇士名字。', 'bad');
        input.focus();
        return;
      }
      if (state.name) {
        const root = $('#modal-body');
        root.replaceChildren(
          el('h2', '', '開始新的冒險？'),
          el('p', '', '這會取代原本的進度。你也可以關閉視窗並選擇「繼續冒險」。'),
          button('確認重新開始', () => {
            reset();
            state.name = name;
            state.hero = choice;
            persist();
            $<HTMLDialogElement>('#modal').close();
            this.go('Intro');
          }),
        );
        $('#modal').querySelector('form button')!.textContent = '保留原有進度';
        $<HTMLDialogElement>('#modal').showModal();
        return;
      }
      state.name = name;
      state.hero = choice;
      persist();
      this.go('Intro');
    });
    form.append(
      actions(
        start,
        ...(state.name
          ? [
              button(
                '繼續冒險',
                () =>
                  this.go(
                    state.intro ? (state.scene === 'Title' ? 'IslandMap' : state.scene) : 'Intro',
                  ),
                'secondary',
              ),
            ]
          : []),
      ),
    );
    panel.append(form, saveLabel());
    if (state.name)
      panel.append(
        button(
          '重設所有進度',
          () => {
            const root = $('#modal-body');
            root.replaceChildren(
              el('h2', '', '重設冒險進度？'),
              el('p', '', '勇士名字、線索與通關紀錄都會清除。'),
              button(
                '確認清除',
                () => {
                  reset();
                  $<HTMLDialogElement>('#modal').close();
                  this.scene.restart();
                },
                'danger',
              ),
            );
            $('#modal').querySelector('form button')!.textContent = '取消';
            $<HTMLDialogElement>('#modal').showModal();
          },
          'text small',
        ),
      );
  }
}
