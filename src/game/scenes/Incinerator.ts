import { AdventureScene } from './AdventureScene';
import { $, el, button, titleBlock, actions, feedback } from '../components/UI';
import { state, persist } from '../systems/SaveSystem';
import { outputPairs } from '../data/quizQuestions';
export class Incinerator extends AdventureScene {
  constructor() {
    super('Incinerator');
  }
  create(): void {
    this.setup('焚山觀察站', '探索 02 · 看見焚化的另一面', 'fire');
    this.tag('先秤重、做輻射檢測，再接受適當處理');
    const panel = $('#panel');
    panel.className = 'learning-panel';
    panel.append(
      titleBlock(
        '跟著導覽員看一看',
        '燒完以後，垃圾沒有憑空消失。',
        '焚化前需要檢查。不適合焚燒的垃圾可能造成污染並損傷設備；減量與分類仍是最重要的第一步。',
      ),
    );
    const cards = el('div', 'learning-cards four');
    const seen = new Set<string>();
    const next = actions(
      button('前往克林湖 →', () => this.go('LakeGoddess')),
      button('返回地圖', () => this.go('IslandMap'), 'light'),
    );
    next.hidden = !state.visitedIncinerator;
    outputPairs.forEach((p, i) => {
      const card = el('article', 'learning-card');
      const body = el('p', '', `${p.detail}。${p.note}`);
      body.hidden = true;
      const b = button(
        `${['☼', '≈', '◇', '⋰'][i]} ${p.label}`,
        () => {
          body.hidden = false;
          card.classList.add('read');
          b.setAttribute('aria-expanded', 'true');
          seen.add(p.id);
          if (seen.size === 4) {
            state.visitedIncinerator = true;
            persist();
            next.hidden = false;
            feedback('✓ 已記下四種產物！現在有足夠的知識回答女神的配對題了。', 'good');
          }
        },
        'light',
      );
      b.setAttribute('aria-expanded', 'false');
      card.append(b, body);
      cards.append(card);
    });
    panel.append(
      cards,
      el(
        'p',
        'fine-print',
        '科學補充：發電利用燃燒的熱能，廢氣本身仍須淨化。原企劃的「廢氣發電」文字已在此澄清；各產物處理仍須符合當地規範。',
      ),
      next,
    );
  }
}
