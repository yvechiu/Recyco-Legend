import { AdventureScene } from './AdventureScene';
import { $, el, button, art, titleBlock, actions, feedback } from '../components/UI';
import { state, persist, reset } from '../systems/SaveSystem';
export class Ending extends AdventureScene {
  constructor() {
    super('Ending');
  }
  create(): void {
    if (!state.ending) {
      this.go('IslandMap');
      return;
    }
    const good = state.ending === 'good';
    this.setup(
      good ? '循環島的新一天' : '勇士的未竟之願',
      good ? '冒險完成 · GOOD ENDING' : '待續的傳奇 · BAD ENDING',
      good ? 'palace' : 'dark',
      false,
    );
    $('#stage').classList.add('ending-stage');
    $('#stage-ui').append(art(good ? 'king' : 'monster'));
    const ribbon = el('div', 'ending-ribbon');
    ribbon.append(
      el('span', 'eyebrow', good ? '謝謝你，守護循環島的勇士' : '休息一下，智慧會陪你再出發'),
      el('h2', '', good ? '讓美麗，\n再次循環。' : '每一次嘗試，\n都是新的希望。'),
    );
    $('#stage-ui').append(ribbon);
    const panel = $('#panel');
    panel.className = 'ending-panel';
    panel.append(
      titleBlock(
        good ? '國王 · 溫' : '廢棄怪',
        good ? `${state.name}，你做到了！` : '這段傳奇，還沒寫下最後一頁。',
        good
          ? '「不愧是我國最強勇士！感謝你為我國的付出！說吧！勇士你想實現什麼願望？」（節錄原稿）'
          : '「就說吧…你們人類絕對不是我的對手…還肖想打敗我？」（原稿）你奮力一搏，卻未能擊敗廢棄怪，乾淨循環島的夢想只能交由後代完成……也可以現在重新挑戰！',
      ),
    );
    if (good) {
      const stats = el('div', 'ending-stats');
      ['✓ 女神的兩道難題', '✓ 九件垃圾回收價值分類', '✓ 擊敗廢棄怪'].forEach((t) =>
        stats.append(el('span', 'chip done', t)),
      );
      panel.append(stats);
      const form = el('form', 'wish-form');
      const label = el('label', '', '告訴國王，你想實現什麼願望？');
      const input = el('input');
      input.maxLength = 80;
      input.placeholder = '例如：希望大家都不再亂丟垃圾';
      input.value = state.wish;
      label.append(input);
      const b = el('button', 'button secondary', '許下願望 ✦');
      b.type = 'submit';
      form.append(label, b);
      const reward = el(
        'p',
        'reward',
        state.wish ? `國王實現了你的願望：「${state.wish}」。循環島也恢復了往日乾淨的模樣。` : '',
      );
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const wish = input.value.trim();
        if (!wish) {
          feedback('寫下一個願望，讓國王聽見你的心意。');
          return;
        }
        state.wish = wish;
        persist();
        reward.textContent = `國王實現了你的願望：「${wish}」。循環島也恢復了往日乾淨的模樣。`;
        this.burst(600, 230);
        feedback('✦ 願望已寫進這段傳奇。', 'good');
      });
      panel.append(form, reward);
    }
    panel.append(
      actions(
        button(good ? '再戰廢棄怪' : '重新挑戰廢棄怪', () => this.go('BossBattle')),
        button('回到循環島', () => this.go('IslandMap'), 'light'),
        button(
          '從頭開始新冒險',
          () => {
            const body = $('#modal-body');
            body.replaceChildren(
              el('h2', '', '重新展開傳奇？'),
              el('p', '', '這會清除這次的名字、線索與通關紀錄。'),
              button('確認新冒險', () => {
                reset();
                $<HTMLDialogElement>('#modal').close();
                this.go('Title');
              }),
            );
            $('#modal').querySelector('form button')!.textContent = '保留進度';
            $<HTMLDialogElement>('#modal').showModal();
          },
          'text',
        ),
      ),
    );
  }
}
