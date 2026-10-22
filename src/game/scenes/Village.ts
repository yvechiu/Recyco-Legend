import { AdventureScene } from './AdventureScene';
import { $, el, button, titleBlock, actions, feedback } from '../components/UI';
import { state, persist } from '../systems/SaveSystem';
import { villageFacts } from '../data/dialogues';
export class Village extends AdventureScene {
  constructor() {
    super('Village');
  }
  create(): void {
    this.setup('瑞賽可村', '探索 01 · 垃圾也有下一站', 'village');
    this.tag('和村民聊一聊，收集冒險所需的知識');
    this.spawnHero(580, 360);
    const panel = $('#panel');
    panel.className = 'learning-panel';
    panel.append(
      titleBlock(
        '村落見聞',
        '每一件垃圾，都有一段旅程。',
        '拜訪三位村民，點開手記，幫他們找回垃圾處理的正確順序。',
      ),
    );
    const cards = el('div', 'learning-cards');
    const seen = new Set<number>();
    villageFacts.forEach(([who, copy], i) => {
      const c = el('article', 'learning-card');
      const b = button(
        `${['⌂', '↻', '❧'][i]} ${who}`,
        () => {
          seen.add(i);
          c.classList.add('read');
          body.hidden = false;
          b.setAttribute('aria-expanded', 'true');
          if (seen.size === villageFacts.length) {
            state.visitedVillage = true;
            persist();
            feedback('✓ 已完成村落探索！垃圾處理手記已收好，可以前往焚山或克林湖。', 'good');
            next.hidden = false;
          }
        },
        'light',
      );
      b.setAttribute('aria-expanded', 'false');
      const body = el('p', '', copy);
      body.hidden = true;
      c.append(b, body);
      cards.append(c);
    });
    const next = actions(
      button('前往焚山 →', () => this.go('Incinerator')),
      button('返回地圖', () => this.go('IslandMap'), 'light'),
    );
    next.hidden = !state.visitedVillage;
    panel.append(cards, next);
  }
}
