import Phaser from 'phaser';
import { AdventureScene } from './AdventureScene';
import { $, el, button, titleBlock, actions, feedback, modal } from '../components/UI';
import { itemIcon } from '../components/ItemIcon';
import { ForestWorld, center } from '../components/ForestWorld';
import { wasteItems } from '../data/wasteItems';
import { BALANCE } from '../data/balance';
import {
  FOREST,
  terrain,
  forestItems,
  forestBins,
  forestSign,
  directions,
  distance,
  walkable,
  sameCell,
  type Cell,
  type Direction,
} from '../data/forestMap';
import { adjacentCells, findPath } from '../systems/GridNavigation';
import type { ValueCategory } from '../data/types';
import { state, persist, resetForest } from '../systems/SaveSystem';
interface Destination {
  cell: Cell;
  label: string;
  action: () => void;
}
export class ForestCleanup extends AdventureScene {
  private selected: string | null = null;
  private prepared = false;
  private cell: Cell = { ...FOREST.spawn };
  private facing: Direction = 'down';
  private moving = false;
  private stride = 0;
  private held = new Set<Direction>();
  private destination: Destination | null = null;
  private world!: ForestWorld;
  private inputReady(): boolean {
    return (
      this.prepared && state.lives > 0 && !state.cleaned && !$<HTMLDialogElement>('#modal').open
    );
  }
  constructor() {
    super('ForestCleanup');
  }
  preload(): void {
    wasteItems.forEach((item) => {
      if (this.textures.exists(`forest-${item.id}`)) return;
      const svg = itemIcon(item.symbol);
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      this.load.svg(`forest-${item.id}`, `data:image/svg+xml;base64,${btoa(svg.outerHTML)}`, {
        width: 48,
        height: 48,
      });
    });
  }
  protected paint(): void {
    this.cameras.main.setBackgroundColor('#355d43');
  }
  create(): void {
    if (!state.unlocked) {
      this.go('ForestEntrance');
      return;
    }
    this.selected = null;
    this.prepared = false;
    this.cell = { ...FOREST.spawn };
    this.facing = 'down';
    this.moving = false;
    this.stride = 0;
    this.held.clear();
    this.destination = null;
    this.setup('還廢棄森林漂漂', '森林探索 · 走出自己的冒險', 'forest');
    const stage = $('#stage');
    stage.classList.add('cleanup-stage', 'walking-stage');
    stage.tabIndex = 0;
    stage.setAttribute(
      'aria-label',
      '森林探索地圖：方向鍵移動，空白鍵互動，也可使用下方操作按鈕。',
    );
    this.world = new ForestWorld(
      this,
      (id) => this.visitItem(id),
      (value) => this.visitBin(value),
      () => this.travel({ cell: forestSign, label: '森林告示牌', action: () => this.readSign() }),
    );
    this.cameras.main
      .setBounds(-48, -48, FOREST.columns * FOREST.tile + 96, FOREST.rows * FOREST.tile + 96)
      .startFollow(this.world.hero, true, 1, 1);
    const resize = new ResizeObserver(() => this.resizeView());
    resize.observe(stage);
    this.resizeView();
    const stop = () => {
      this.held.clear();
      this.destination = null;
    };
    window.addEventListener('blur', stop);
    const visibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', visibility);
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) ||
        (e.target as HTMLElement)?.isContentEditable ||
        !this.inputReady()
      )
        return;
      const keys: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        KeyW: 'up',
        KeyS: 'down',
        KeyA: 'left',
        KeyD: 'right',
      };
      const direction = keys[e.code];
      if (direction) {
        e.preventDefault();
        this.held.add(direction);
        this.destination = null;
        if (!e.repeat && !this.moving) this.step(direction);
      } else if (
        (e.code === 'Space' || e.code === 'Enter') &&
        (e.target as HTMLElement)?.tagName !== 'BUTTON'
      ) {
        e.preventDefault();
        if (!e.repeat) this.interact();
      }
    });
    this.input.keyboard?.on('keyup', (e: KeyboardEvent) => {
      const keys: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        KeyW: 'up',
        KeyS: 'down',
        KeyA: 'left',
        KeyD: 'right',
      };
      if (keys[e.code]) this.held.delete(keys[e.code]);
    });
    const groundPointer = (
      pointer: Phaser.Input.Pointer,
      over: Phaser.GameObjects.GameObject[],
    ) => {
      if (over.length || !this.inputReady()) return;
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const cell = { x: Math.floor(p.x / FOREST.tile), y: Math.floor(p.y / FOREST.tile) };
      if (walkable(cell))
        this.travel({ cell, label: '選定的位置', action: this.groundAction }, true);
    };
    this.input.on('pointerdown', groundPointer);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      resize.disconnect();
      this.input.off('pointerdown', groundPointer);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', visibility);
      stop();
      stage.removeAttribute('tabindex');
      stage.setAttribute('aria-label', '遊戲場景');
      delete stage.dataset.playerCell;
      delete stage.dataset.moving;
    });
    this.draw();
  }
  private resizeView(): void {
    const stage = $('#stage'),
      width = Math.min(
        1200,
        Math.max(260, (stage.clientWidth * 440) / Math.max(1, stage.clientHeight)),
      );
    this.cameras.main.setViewport((1200 - width) / 2, 0, width, 440);
  }
  update(): void {
    if (!this.world) return;
    this.world.hero.setDepth(this.world.hero.y + 30);
    if (!this.inputReady()) {
      this.held.clear();
      return;
    }
    if (this.moving) return;
    const direction = [...this.held].at(-1);
    if (direction) {
      this.destination = null;
      this.step(direction);
      return;
    }
    if (this.destination) {
      const target = this.destination;
      // Empty-ground clicks use an exact goal; interactive objects use adjacent cells.
      const goals =
        target.action === this.groundAction ? [target.cell] : adjacentCells(target.cell);
      const path = findPath(this.cell, goals);
      if (path === null) {
        this.destination = null;
        feedback('這裡暫時走不到，試著從另一側靠近。');
        this.updatePrompt();
        return;
      }
      if (!path.length) {
        this.destination = null;
        target.action();
        this.updatePrompt();
        return;
      }
      const next = path[0],
        delta = { x: next.x - this.cell.x, y: next.y - this.cell.y };
      const dir = (Object.keys(directions) as Direction[]).find((d) =>
        sameCell(directions[d], delta),
      )!;
      this.step(dir);
    }
  }
  private groundAction = () => this.updatePrompt();
  private travel(destination: Destination, exact = false): void {
    if (!this.inputReady()) return;
    this.held.clear();
    this.destination = exact ? { ...destination, action: this.groundAction } : destination;
    $('#stage').scrollIntoView({ block: 'nearest', behavior: 'instant' });
    $('#stage').focus({ preventScroll: true });
    this.updatePrompt();
  }
  private step(direction: Direction): void {
    if (!this.inputReady() || this.moving) return;
    this.facing = direction;
    const delta = directions[direction],
      next = { x: this.cell.x + delta.x, y: this.cell.y + delta.y };
    this.world.pose(direction, this.stride);
    if (!walkable(next)) {
      this.updatePrompt('前方有障礙物，換個方向走走吧。');
      return;
    }
    this.moving = true;
    $('#stage').dataset.moving = 'true';
    this.world.pose(direction, ++this.stride);
    const p = center(next);
    this.tweens.add({
      targets: this.world.hero,
      x: p.x,
      y: p.y,
      duration: this.reduced ? 70 : FOREST.stepMs,
      ease: 'Linear',
      onComplete: () => {
        this.cell = next;
        this.moving = false;
        $('#stage').dataset.moving = 'false';
        this.world.pose(this.facing, 0);
        this.updatePrompt();
        if (sameCell(next, FOREST.exit)) {
          this.held.clear();
          this.destination = null;
          this.go('IslandMap');
        }
      },
    });
  }
  private nearby(): Destination[] {
    const targets: Destination[] = wasteItems
      .filter((i) => !state.collected.includes(i.id))
      .map((i) => ({ cell: forestItems[i.id], label: i.name, action: () => this.pickup(i.id) }));
    (Object.keys(forestBins) as ValueCategory[]).forEach((value) =>
      targets.push({
        cell: forestBins[value],
        label: `${value}回收價值桶`,
        action: () => (this.selected ? this.deposit(value) : this.openBin(value)),
      }),
    );
    targets.push({ cell: forestSign, label: '森林告示牌', action: () => this.readSign() });
    const facingCell = {
      x: this.cell.x + directions[this.facing].x,
      y: this.cell.y + directions[this.facing].y,
    };
    return targets
      .filter((t) => distance(t.cell, this.cell) <= 1)
      .sort(
        (a, b) =>
          Number(sameCell(b.cell, facingCell)) - Number(sameCell(a.cell, facingCell)) ||
          distance(a.cell, this.cell) - distance(b.cell, this.cell),
      );
  }
  private updatePrompt(message?: string): void {
    const stage = $('#stage');
    stage.dataset.playerCell = `${this.cell.x},${this.cell.y}`;
    stage.dataset.moving = String(this.moving);
    const text =
      message ||
      (this.destination
        ? `正在前往${this.destination.label}…方向鍵可取消自動行走。`
        : this.nearby()[0]
          ? `附近：${this.nearby()[0].label} · 按空白鍵互動`
          : '方向鍵移動 · 靠近物品後按空白鍵 · 南方出口返回島嶼');
    const prompt = document.querySelector('#forest-prompt');
    if (prompt && prompt.textContent !== text) prompt.textContent = text;
    const dot = document.querySelector<SVGCircleElement>('#forest-minimap-player');
    if (dot) {
      dot.setAttribute('cx', String(this.cell.x + 0.5));
      dot.setAttribute('cy', String(this.cell.y + 0.5));
    }
  }
  private interact(): void {
    if (!this.inputReady() || this.moving) return;
    this.destination = null;
    const target = this.nearby()[0];
    if (target) target.action();
    else feedback('附近沒有可互動的物品。先走近垃圾、告示牌或分類桶。');
    this.updatePrompt();
  }
  private visitItem(id: string): void {
    const item = wasteItems.find((i) => i.id === id);
    if (item && !state.collected.includes(id))
      this.travel({ cell: forestItems[id], label: item.name, action: () => this.pickup(id) });
  }
  private pickup(id: string): void {
    const item = wasteItems.find((i) => i.id === id);
    if (!item || state.collected.includes(id) || distance(this.cell, forestItems[id]) > 1) return;
    state.collected.push(id);
    this.selected = id;
    persist();
    this.world.syncItems();
    const p = center(forestItems[id]);
    this.burst(p.x, p.y);
    feedback(`拾獲「${item.name}」！${item.hint}`);
    this.draw();
  }
  private visitBin(value: ValueCategory): void {
    this.travel({
      cell: forestBins[value],
      label: `${value}回收價值桶`,
      action: () => (this.selected ? this.deposit(value) : this.openBin(value)),
    });
  }
  private openBin(value: ValueCategory): void {
    feedback(
      `已走到${value}回收價值桶旁。${this.selected ? '可以按下方分類按鈕投入所選物品。' : '先從背包選取一件物品，再投入這個桶。'}`,
    );
    const inventory = document.querySelector<HTMLButtonElement>('.inventory-item');
    inventory?.focus({ preventScroll: true });
  }
  private readSign(): void {
    modal(
      '森林告示牌',
      '方向鍵／WASD：移動\n空白鍵：撿拾附近物品、閱讀路標或查看分類桶。\n\n點選地圖上的物品，也能自動走到旁邊撿拾。從背包選好物品，再選高／中／低回收價值桶，勇士會先走到桶旁才投入。\n\n樹木、水池、石頭與分類桶不能穿過。南方箭頭是返回島嶼的出口。',
    );
  }
  private controls(): void {
    const ui = $('#stage-ui'),
      controls = el('div', 'forest-controls');
    // Phaser also listens on window; DOM controls must not activate the canvas beneath.
    for (const type of ['touchstart', 'touchmove', 'touchend'])
      controls.addEventListener(type, (event) => event.stopPropagation());
    const dpad = el('div', 'forest-dpad');
    dpad.setAttribute('aria-label', '森林方向鍵');
    (['up', 'left', 'down', 'right'] as Direction[]).forEach((direction) => {
      const b = el(
        'button',
        `walk-direction ${direction}`,
        { up: '↑', down: '↓', left: '←', right: '→' }[direction],
      );
      b.type = 'button';
      b.setAttribute(
        'aria-label',
        `向${{ up: '上', down: '下', left: '左', right: '右' }[direction]}移動`,
      );
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (!this.inputReady()) return;
        b.setPointerCapture(e.pointerId);
        this.destination = null;
        this.held.clear();
        this.held.add(direction);
        if (!this.moving) this.step(direction);
      });
      const release = () => this.held.delete(direction);
      b.addEventListener('pointerup', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('lostpointercapture', release);
      b.addEventListener('click', (e) => {
        if (e.detail === 0) {
          this.destination = null;
          this.step(direction);
        }
      });
      dpad.append(b);
    });
    controls.append(
      dpad,
      button('互動 ␣', () => this.interact(), 'forest-interact'),
    );
    ui.append(controls);
    const prompt = el('p', 'forest-prompt');
    prompt.id = 'forest-prompt';
    prompt.setAttribute('aria-live', 'polite');
    ui.append(prompt);
    const map = el('div', 'forest-minimap');
    map.setAttribute('aria-label', '森林小地圖：黃點是勇士，淺藍是水池，三個彩色方格是分類桶。');
    const tiles = terrain
      .flatMap((row, y) =>
        [...row].map(
          (kind, x) =>
            `<rect x="${x}" y="${y}" width="1" height="1" fill="${kind === '#' ? '#315b42' : kind === '~' ? '#8bc9bf' : kind === 'o' ? '#7c856a' : '#d5d3a0'}"/>`,
        ),
      )
      .join('');
    const bins = Object.values(forestBins)
      .map(
        (p, i) =>
          `<rect x="${p.x}" y="${p.y}" width="1" height="1" fill="${['#4b8c54', '#d9ab40', '#b36850'][i]}"/>`,
      )
      .join('');
    map.innerHTML = `<svg viewBox="0 0 18 12" aria-hidden="true">${tiles}${bins}<circle id="forest-minimap-player" r=".6" fill="#ffe17d" stroke="#284d37" stroke-width=".2"/></svg><span>森林手繪圖</span>`;
    ui.append(map);
    this.updatePrompt();
  }
  private draw(): void {
    this.held.clear();
    $('#stage-ui').replaceChildren();
    this.world.syncItems();
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
    const message = $('#feedback');
    $('#game-shell').append(message);
    message.dataset.context = 'forest';
    const panel = $('#panel');
    panel.className = 'cleanup-panel';
    panel.replaceChildren();
    if (state.lives <= 0) {
      this.destination = null;
      panel.append(
        titleBlock(
          '暫時休息一下',
          '森林還在等你，再試一次吧。',
          '這次的三條生命用完了。重新挑戰會重置九件物品，但保留女神的線索和已解開的入口。',
        ),
        actions(
          button('重新清理森林', () => {
            resetForest();
            this.scene.restart();
          }),
          button('返回地圖', () => this.go('IslandMap'), 'light'),
        ),
      );
      return;
    }
    if (state.cleaned) {
      this.destination = null;
      panel.append(
        titleBlock(
          '任務完成 · 9 / 9',
          '你讓森林重新呼吸了。',
          '垃圾已經清空！廢棄怪終於現身：「沒想到你竟然找得到我，但你絕對是我的手下敗將！」',
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
          '走進森林，讓回收成為冒險。',
          '方向鍵移動，空白鍵與附近物品互動。點選地圖上的物品也能自動走過去。手機請用螢幕方向鍵。',
        ),
        el(
          'p',
          'item-guidance',
          '回收價值受材質、分離難度與成本影響，不等於現行回收規則。本關分為高／中／低三種回收價值。選錯扣一條生命，物品會留在背包，請參考提示重新分類；選對才計入完成。三條命耗盡可重試並保留前一任務。',
        ),
        actions(
          button('已了解，準備好了！', () => {
            this.prepared = true;
            this.draw();
            $('#stage').scrollIntoView({ block: 'nearest', behavior: 'instant' });
            $('#stage').focus({ preventScroll: true });
          }),
        ),
      );
      this.updatePrompt();
      return;
    }
    this.controls();
    panel.append(
      titleBlock(
        'TOP-DOWN ADVENTURE · 森林探索',
        '走進森林，拾起希望。',
        '樹木、水池和石頭會擋路。走近垃圾撿進背包，再走到價值桶旁分類。也可以直接點選地圖上的垃圾，勇士會自動走近撿拾。',
      ),
    );
    const head = el('div', 'panel-heading');
    head.append(
      el('h3', '', '勇士背包'),
      el('span', 'chip', `已拾取 ${state.collected.length} / 9`),
    );
    panel.append(head);
    const pack = el('div', 'backpack');
    pack.setAttribute('aria-label', '背包物品');
    const inventory = wasteItems.filter(
      (i) => state.collected.includes(i.id) && !state.sorted.includes(i.id),
    );
    if (!inventory.length)
      pack.append(
        el(
          'p',
          'inventory-empty',
          '背包裡暫時沒有物品。走近垃圾按空白鍵，或直接點選地圖上的垃圾自動前往。',
        ),
      );
    inventory.forEach((item) => {
      const b = button(
        '',
        () => {
          this.destination = null;
          this.selected = item.id;
          feedback('');
          this.draw();
        },
        'inventory-item',
      );
      b.setAttribute('aria-label', `選取${item.name}`);
      b.setAttribute('aria-pressed', String(this.selected === item.id));
      b.append(itemIcon(item.symbol), el('span', '', item.name));
      pack.append(b);
    });
    panel.append(pack, message);
    const selected = wasteItems.find((i) => i.id === this.selected);
    panel.append(
      el(
        'p',
        'item-guidance',
        selected
          ? `已選取 ${selected.name}：${selected.hint}`
          : '提示：選取背包物品，再選一個桶；勇士會走到桶旁才投入。',
      ),
    );
    const bins = el('div', 'bins');
    (['高', '中', '低'] as ValueCategory[]).forEach((value, i) => {
      const b = button('', () => this.visitBin(value), `bin ${['high', 'medium', 'low'][i]}`);
      b.setAttribute('aria-label', `${value}回收價值`);
      const label = el('div', '', `${value}回收價值`);
      label.append(
        el(
          'small',
          '',
          `走近投入 · ${wasteItems.filter((w) => w.value === value && state.sorted.includes(w.id)).length} 件`,
        ),
      );
      b.append(el('span', '', '♧'), label);
      b.disabled = !selected;
      bins.append(b);
    });
    panel.append(
      bins,
      el(
        'p',
        'fine-print',
        '沿著步道探索，撿拾垃圾並依回收價值分類。日常丟棄請依所在地清潔隊公告。',
      ),
    );
    this.updatePrompt();
  }
  private deposit(value: ValueCategory): void {
    const item = wasteItems.find((i) => i.id === this.selected);
    if (!item || state.sorted.includes(item.id) || distance(this.cell, forestBins[value]) > 1)
      return;
    const correct = value === item.value;
    if (!correct) state.lives--;
    if (correct) {
      state.sorted.push(item.id);
      this.selected = null;
    }
    if (state.sorted.length === 9 && state.lives > 0) state.cleaned = true;
    persist();
    const p = center(forestBins[value]);
    this.burst(p.x, p.y, correct);
    feedback(
      correct
        ? `✓ ${item.name}分類成功！本關列為${item.value}回收價值。`
        : `✕ 分類錯誤，扣一條生命。${item.name}仍留在背包，請參考下方提示，重新選擇分類桶。`,
      correct ? 'good' : 'bad',
    );
    this.draw();
    if (!correct) $('#feedback').scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
}
