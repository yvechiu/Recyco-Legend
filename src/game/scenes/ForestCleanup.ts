import { AdventureScene } from './AdventureScene';
import { $, el, button, titleBlock, actions, feedback } from '../components/UI';
import { itemIcon } from '../components/ItemIcon';
import { wasteItems } from '../data/wasteItems';
import { BALANCE } from '../data/balance';
import type { ValueCategory } from '../data/types';
import { state, persist, resetForest } from '../systems/SaveSystem';
export class ForestCleanup extends AdventureScene {
  private selected: string | null = null;
  private prepared = false;
  constructor() {
    super('ForestCleanup');
  }
  create(): void {
    if (!state.unlocked) {
      this.go('ForestEntrance');
      return;
    }
    this.selected = null;
    this.prepared = false;
    this.setup('還廢棄森林漂漂', '任務二 · 把森林的顏色找回來', 'forest');
    $('#stage').classList.add('cleanup-stage');
    this.spawnHero(150, 355);
    this.draw();
  }
  private draw(): void {
    $('#stage-ui').replaceChildren();
    this.tag('點選散落物品 → 選取背包物品 → 選擇回收價值桶');
    const status = el('div', 'cleanup-status');
    status.append(
      el(
        'span',
        'chip',
        `生命 ${'♥'.repeat(state.lives)}${'♡'.repeat(BALANCE.forestLives - state.lives)}`,
      ),
      el('span', 'chip', `已分類 ${state.sorted.length} / 9`),
    );
    $('#stage-ui').append(status);
    const panel = $('#panel');
    panel.className = 'cleanup-panel';
    panel.replaceChildren();
    if (state.lives <= 0) {
      panel.append(
        titleBlock(
          '暫時休息一下',
          '森林還在等你，再試一次吧。',
          '這次的三條生命用完了。重新挑戰會重置九件物品，但保留女神的線索和已解開的入口。',
        ),
        actions(
          button('重新清理森林', () => {
            resetForest();
            this.selected = null;
            this.prepared = true;
            feedback('新的清理開始了！先看看物品提示，再選擇分類。');
            this.draw();
          }),
          button('返回地圖', () => this.go('IslandMap'), 'light'),
        ),
      );
      return;
    }
    if (state.cleaned) {
      panel.append(
        titleBlock(
          '任務完成 · 9 / 9',
          '你讓森林重新呼吸了。',
          '垃圾已經清空！廢棄怪終於現身：「沒想到你竟然找得到我，但你絕對是我的手下敗將！」（原稿）',
        ),
        actions(
          button('準備好了，挑戰廢棄怪 →', () => this.go('BossBattle')),
          button('返回地圖', () => this.go('IslandMap'), 'light'),
        ),
      );
      return;
    }
    if (!this.prepared) {
      panel.append(
        titleBlock(
          '出發前的小知識',
          '回收價值，不等於回收規則。',
          '回收價值是回收處理是否值得的概念，會受材質、分離難度與處理成本影響。這一關依原企劃，把九件物品分成高、中、低三種價值。',
        ),
      );
      const note = el(
        'div',
        'item-guidance',
        '每次撿到物品都會看到提示。答錯會扣一條生命，物品仍會被放進正確的桶；三條生命用完可重試。日常是否可回收，請查詢所在地清潔隊公告。',
      );
      note.style.marginTop = '18px';
      panel.append(
        note,
        actions(
          button('已了解，準備好了！', () => {
            this.prepared = true;
            this.draw();
          }),
        ),
      );
      return;
    }
    const positions = [
      [24, 47],
      [43, 68],
      [64, 43],
      [79, 66],
      [33, 83],
      [54, 41],
      [69, 84],
      [17, 75],
      [84, 40],
    ];
    wasteItems.forEach((item, i) => {
      if (state.collected.includes(item.id)) return;
      const [x, y] = positions[i];
      const pickup = button(
        '',
        () => {
          state.collected.push(item.id);
          this.selected = item.id;
          persist();
          this.walkTo(x * 12, y * 4.4);
          this.burst(x * 12, y * 4.4);
          feedback(`拾獲「${item.name}」！${item.hint}`);
          this.draw();
        },
        'pickup',
      );
      pickup.style.left = `${x}%`;
      pickup.style.top = `${y}%`;
      pickup.setAttribute('aria-label', `撿起${item.name}`);
      pickup.title = `撿起${item.name}`;
      pickup.append(itemIcon(item.symbol));
      $('#stage-ui').append(pickup);
    });
    const head = el('div', 'panel-heading');
    head.append(
      titleBlock(
        'BACKPACK · 勇士背包',
        '拾起一件，改變一點。',
        '先選擇背包物品，再選一個回收價值桶。',
      ),
    );
    head.append(el('span', 'chip', `已拾取 ${state.collected.length} / 9`));
    panel.append(head);
    const pack = el('div', 'backpack');
    pack.setAttribute('aria-label', '背包物品');
    const inventory = wasteItems.filter(
      (i) => state.collected.includes(i.id) && !state.sorted.includes(i.id),
    );
    if (!inventory.length)
      pack.append(el('p', 'inventory-empty', '背包裡暫時沒有物品。點選森林中的 ＋ 圖示來撿拾。'));
    inventory.forEach((item) => {
      const b = button(
        '',
        () => {
          this.selected = item.id;
          this.draw();
        },
        'inventory-item',
      );
      b.setAttribute('aria-label', `選取${item.name}`);
      b.setAttribute('aria-pressed', String(this.selected === item.id));
      b.append(itemIcon(item.symbol), el('span', '', item.name));
      pack.append(b);
    });
    panel.append(pack);
    const selected = wasteItems.find((i) => i.id === this.selected);
    panel.append(
      el(
        'p',
        'item-guidance',
        selected
          ? `已選取 ${selected.name}：${selected.hint}`
          : '提示：選取背包中的物品，就能查看回收價值線索。',
      ),
    );
    const bins = el('div', 'bins');
    (['高', '中', '低'] as ValueCategory[]).forEach((value, i) => {
      const b = button('', () => this.deposit(value), `bin ${['high', 'medium', 'low'][i]}`);
      b.setAttribute('aria-label', `${value}回收價值`);
      const label = el('div', '', `${value}回收價值`);
      label.append(
        el(
          'small',
          '',
          `原企劃價值桶 · ${wasteItems.filter((w) => w.value === value && state.sorted.includes(w.id)).length} 件`,
        ),
      );
      b.append(el('span', '', '♧'), label);
      b.disabled = !selected;
      bins.append(b);
    });
    panel.append(
      bins,
      el('p', 'fine-print', '注意：這些是原企劃的回收價值分類，不是現在所在地的強制垃圾分類規則。'),
    );
  }
  private deposit(value: ValueCategory): void {
    const item = wasteItems.find((i) => i.id === this.selected);
    if (!item || state.sorted.includes(item.id)) return;
    const correct = value === item.value;
    if (!correct) state.lives--;
    state.sorted.push(item.id);
    this.selected = null;
    if (state.sorted.length === 9 && state.lives > 0) state.cleaned = true;
    persist();
    this.burst(600, 320, correct);
    feedback(
      correct
        ? `✓ ${item.name}分類成功！原企劃列為${item.value}回收價值。`
        : `✕ 扣一條生命。原企劃中，${item.name}是${item.value}回收價值；已幫你放進正確的桶。`,
      correct ? 'good' : 'bad',
    );
    this.draw();
  }
}
