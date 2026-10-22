import { AdventureScene } from './AdventureScene';
import { $, el, button, actions, art, titleBlock, feedback } from '../components/UI';
import { state, persist } from '../systems/SaveSystem';
import {
  flowChoices,
  flowBranch,
  checkFlow,
  outputPairs,
  outputOptions,
  checkMatches,
} from '../data/quizQuestions';
export class LakeGoddess extends AdventureScene {
  private question: 1 | 2 = 1;
  private order: string[] = [];
  private matches: Record<string, string> = {};
  constructor() {
    super('LakeGoddess');
  }
  create(): void {
    this.question = state.q1 && !state.q2 ? 2 : 1;
    this.order = [];
    this.matches = {};
    this.setup('湖中女神的難題', '任務一 · 以智慧交換線索', 'lake');
    $('#stage-ui').append(art('goddess'));
    this.tag('「別再把你們的金銀寶石丟到我家了！」 · 改寫自原稿');
    this.draw();
  }
  private draw(): void {
    const panel = $('#panel');
    panel.className = 'quiz-panel';
    panel.replaceChildren();
    const tabs = el('div', 'quiz-tabs');
    ([1, 2] as const).forEach((n) => {
      const b = button(
        `${n === 1 ? '① 垃圾的旅程' : '② 焚化後的去向'} ${(n === 1 ? state.q1 : state.q2) ? '✓' : ''}`,
        () => {
          this.question = n;
          feedback('');
          this.draw();
        },
        'light',
      );
      b.setAttribute('aria-pressed', String(this.question === n));
      tabs.append(b);
    });
    panel.append(tabs);
    if (this.question === 1) {
      panel.append(
        titleBlock(
          '女神的第一道難題',
          '幫資源找到回家的路。',
          '選擇詞卡排出可回收物的處理順序，再補上另一條處理支線。按已選詞卡可移除，後方詞卡會向前補位。',
        ),
      );
      if (!state.visitedVillage) {
        panel.append(
          el('p', 'fine-print', '女神：「先到瑞賽可村向三位村民收集知識，再回來試試吧！」'),
          actions(button('前往瑞賽可村 →', () => this.go('Village'))),
        );
        return;
      }
      if (state.q1) {
        this.reward(panel, 1);
        return;
      }
      const board = el('div', 'flow-board');
      const slots = el('div', 'flow-slots');
      slots.setAttribute('aria-label', '已排列的處理流程');
      slots.append(el('span', 'chip', '生活垃圾'));
      const choices = el('div', 'flow-choices');
      const drawOrder = () => {
        slots.querySelectorAll('.flow-slot,.flow-arrow').forEach((n) => n.remove());
        for (let i = 0; i < 3; i++) {
          slots.append(el('span', 'flow-arrow', '→'));
          const b = button(
            this.order[i] || `第 ${i + 1} 步：？`,
            () => {
              if (this.order[i]) {
                this.order.splice(i, 1);
                drawOrder();
              }
            },
            'flow-slot',
          );
          b.setAttribute('aria-label', `步驟 ${i + 1}：${this.order[i] || '尚未選擇'}`);
          slots.append(b);
        }
        choices.replaceChildren();
        flowChoices.forEach((t) => {
          const b = button(
            t,
            () => {
              if (!this.order.includes(t)) {
                this.order.push(t);
                drawOrder();
              }
            },
            'light',
          );
          b.disabled = this.order.includes(t);
          choices.append(b);
        });
      };
      drawOrder();
      board.append(slots, choices);
      const branch = el('div', 'flow-branch');
      const reasonLabel = el('label', '', '可回收體系也可能分出廢棄物，原因是？');
      const reason = el('select');
      reason.setAttribute('aria-label', '轉為廢棄物的原因');
      flowBranch.reasonOptions.forEach(([v, t]) => {
        const o = el('option', '', t);
        o.value = v;
        reason.append(o);
      });
      reasonLabel.append(reason);
      const treatmentLabel = el('label', '', '原企劃中，廢棄物接著會？');
      const treatment = el('select');
      treatment.setAttribute('aria-label', '廢棄物的後續處理');
      flowBranch.treatmentOptions.forEach(([v, t]) => {
        const o = el('option', '', t);
        o.value = v;
        treatment.append(o);
      });
      treatmentLabel.append(treatment);
      branch.append(reasonLabel, treatmentLabel);
      board.append(branch);
      panel.append(board);
      panel.append(
        actions(
          button('請女神看看答案', () => {
            const result = checkFlow(this.order, reason.value, treatment.value);
            feedback(result.message, result.correct ? 'good' : 'bad');
            if (result.correct) {
              state.q1 = true;
              persist();
              this.burst(600, 240);
              this.draw();
            }
          }),
          button(
            '重新排列',
            () => {
              this.order = [];
              drawOrder();
            },
            'light',
          ),
        ),
      );
    } else {
      panel.append(
        titleBlock(
          '女神的第二道難題',
          '焚化後的產物，該去哪裡？',
          '將四種產物配對到各自的再利用或處理方式。沒有時間限制，錯了可以調整後再試。',
        ),
      );
      if (!state.visitedIncinerator) {
        panel.append(
          el('p', 'fine-print', '女神：「先到焚山看完四種產物的導覽，再來挑戰配對吧！」'),
          actions(button('前往焚山 →', () => this.go('Incinerator'))),
        );
        return;
      }
      if (state.q2) {
        this.reward(panel, 2);
        return;
      }
      const board = el('div', 'match-board');
      outputPairs.forEach((p) => {
        const row = el('div', 'match-row');
        const label = el('label', '', p.label);
        const select = el('select');
        select.setAttribute('aria-label', `${p.label}的去向`);
        const placeholder = el('option', '', '請選擇處理方式');
        placeholder.value = '';
        select.append(placeholder);
        outputOptions.forEach((o) => {
          const option = el('option', '', o.detail);
          option.value = o.answer;
          select.append(option);
        });
        select.value = this.matches[p.id] || '';
        select.addEventListener('change', () => (this.matches[p.id] = select.value));
        label.append(select);
        row.append(label);
        board.append(row);
      });
      panel.append(
        board,
        el(
          'p',
          'fine-print',
          '科學補充：原稿簡寫為「廢氣發電」；本遊戲以燃燒熱能回收發電、廢氣淨化的概念呈現。',
        ),
      );
      panel.append(
        actions(
          button('確認配對', () => {
            const result = checkMatches(this.matches);
            feedback(result.message, result.correct ? 'good' : 'bad');
            if (result.correct) {
              state.q2 = true;
              persist();
              this.burst(600, 240);
              this.draw();
            }
          }),
          button('回焚山複習', () => this.go('Incinerator'), 'light'),
        ),
      );
    }
  }
  private reward(panel: HTMLElement, n: 1 | 2): void {
    const card = el('div', 'clue-card');
    card.append(
      el('strong', '', n === 1 ? '✦ 第一個線索：五位數' : '✦ 第二個線索：魔法地圖'),
      el(
        'p',
        '',
        n === 1
          ? '女神：「我說話算話！通關密語是五位數。」（原稿線索）'
          : '地圖星號位在橫軸 160、縱軸 80。慧的補充提示：先讀橫軸，再接上縱軸，將兩個數字連在一起。',
      ),
    );
    panel.append(card);
    if (state.q1 && state.q2)
      panel.append(
        actions(
          button('前往森林入口 →', () => this.go('ForestEntrance')),
          button('返回地圖', () => this.go('IslandMap'), 'light'),
        ),
      );
    else
      panel.append(
        actions(
          button(n === 1 ? '挑戰第二道難題 →' : '挑戰第一道難題 →', () => {
            this.question = n === 1 ? 2 : 1;
            feedback('');
            this.draw();
          }),
          button('返回地圖', () => this.go('IslandMap'), 'light'),
        ),
      );
  }
}
