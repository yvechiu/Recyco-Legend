import Phaser from 'phaser';
import { AdventureScene } from './AdventureScene';
import { $, el, button, actions, titleBlock, feedback } from '../components/UI';
import { state, persist, objective, incineratorReminder } from '../systems/SaveSystem';
import { WalkingController } from '../systems/WalkingController';
import { LakeWorld } from '../components/LakeWorld';
import { LAKE, lakeDevices, lakeMaterials, lakeWalkable } from '../data/lake';
import { distance } from '../data/forestMap';
export class LakeRestoration extends AdventureScene {
  private walker!: WalkingController;
  private world!: LakeWorld;
  private dialog!: HTMLDialogElement;
  constructor() {
    super('LakeRestoration');
  }
  preload(): void {
    if (!this.textures.exists('lake-goddess'))
      this.load.image('lake-goddess', `${import.meta.env.BASE_URL}assets/original/goddess.png`);
  }
  protected paint(): void {
    this.cameras.main.setBackgroundColor('#426b57');
  }
  create(): void {
    this.setup('克林湖的循環裝置', '女神的第二道難題 · 讓湖水重新流動', 'lake');
    if (!state.visitedIncinerator) {
      $('#panel').append(
        titleBlock('女神的提醒', '先去焚山觀察產物吧。', incineratorReminder()),
        actions(button('前往焚山 →', () => this.go('Incinerator'))),
      );
      return;
    }
    $('#stage').setAttribute('aria-label', '克林湖：方向鍵移動，靠近裝置按空白鍵修復。');
    this.dialog = el('dialog', 'npc-dialog');
    this.dialog.id = 'lake-dialog';
    this.dialog.setAttribute('aria-labelledby', 'lake-device-title');
    document.body.append(this.dialog);
    this.world = new LakeWorld(this, (id) => this.visit(id));
    this.walker = new WalkingController({
      scene: this,
      hero: this.world.hero,
      ...LAKE,
      canWalk: lakeWalkable,
      ready: () => !this.dialog.open,
      pose: (d, f) => this.world.pose(d, f),
      onInteract: () => {
        const d = this.nearest();
        if (d) this.open(d.id);
      },
      onExit: () => this.go('IslandMap'),
      prompt: () => {
        const d = this.nearest();
        return d
          ? `附近：${d.name} · 空白鍵操作裝置`
          : '方向鍵／WASD 走動 · 找到湖畔四座裝置 · 南方出口返回島嶼';
      },
      prefix: 'lake',
    });
    this.dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.close();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dialog.remove());
    this.render();
  }
  update(): void {
    this.walker?.update();
  }
  private nearest() {
    if (!this.walker) return undefined;
    return lakeDevices.find((d) => distance(this.walker.cell, d.cell) <= 1);
  }
  private visit(id: string): void {
    const d = lakeDevices.find((d) => d.id === id)!;
    this.walker.travel(d.cell, d.name, () => this.open(id));
  }
  private close(): void {
    this.dialog.close();
    this.walker.stop();
    $('#stage').focus({ preventScroll: true });
  }
  private open(id: string): void {
    const d = lakeDevices.find((d) => d.id === id)!;
    if (this.dialog.open || this.walker.moving || distance(this.walker.cell, d.cell) > 1) return;
    this.walker.stop();
    const title = el('h2', '', d.name);
    title.id = 'lake-device-title';
    this.dialog.replaceChildren(title);
    if (state.lakeRepairs.includes(id)) this.dialog.append(el('p', 'npc-speech', `✓ ${d.success}`));
    else {
      this.dialog.append(
        el(
          'p',
          'npc-speech',
          '女神：「這座裝置停止運轉了。請把適合的產物送到這裡，讓它重新工作！」',
        ),
      );
      const status = el('p');
      status.setAttribute('role', 'status');
      this.dialog.append(status);
      const choices = el('div', 'lake-materials');
      lakeMaterials.forEach((m) =>
        choices.append(
          button(
            `${m.symbol} 送入${m.label}`,
            () => {
              if (m.id !== id) {
                status.textContent =
                  m.id === 'flue'
                    ? '未淨化的廢氣要先經過廢氣淨化設備，不能直接送進這些裝置。'
                    : d.hint;
                return;
              }
              state.lakeRepairs.push(id);
              state.q2 = lakeDevices.every((d) => state.lakeRepairs.includes(d.id));
              persist();
              this.world.activate(id);
              this.close();
              this.render();
              this.burst((d.cell.x + 0.5) * 64, (d.cell.y + 0.5) * 64);
              const quest = document.querySelector('#hud .quest>span:last-child');
              if (quest) quest.textContent = objective();
              feedback(
                state.q2
                  ? `✓ ${d.success} 四座裝置恢復運轉，湖水重新清澈了！女神交給你魔法地圖。`
                  : `✓ ${d.success}（${state.lakeRepairs.length} / 4）`,
                'good',
              );
            },
            'light',
          ),
        ),
      );
      this.dialog.append(choices);
    }
    this.dialog.append(button('先離開裝置', () => this.close(), 'text small'));
    this.dialog.showModal();
  }
  private firstQuestion(): void {
    state.scene = 'LakeGoddess';
    persist();
    this.scene.start('LakeGoddess', { question: 1 });
  }
  private render(): void {
    const ui = $('#stage-ui');
    ui.replaceChildren(
      el(
        'span',
        'chip',
        `循環裝置 ${state.lakeRepairs.length} / 4${state.q2 ? ' · 湖水恢復清澈 ✓' : ''}`,
      ),
    );
    this.walker.mountControls(ui);
    const panel = $('#panel');
    panel.className = 'village-panel';
    panel.replaceChildren(
      actions(button(`① 垃圾的旅程${state.q1 ? ' ✓' : ''}`, () => this.firstQuestion(), 'light')),
      titleBlock(
        'LAKE RESTORATION · 湖畔修復',
        '幫女神修復循環裝置。',
        '走近裝置按空白鍵，選擇適合的產物。也能點下方按鈕自動走近。沒有時間限制，選錯可以再試；已修好的設備會保留進度。',
      ),
    );
    const cards = el('div', 'learning-cards four');
    lakeDevices.forEach((d) => {
      const card = el('article', 'learning-card');
      const done = state.lakeRepairs.includes(d.id);
      card.append(
        button(`操作${d.name}`, () => this.visit(d.id), done ? 'light' : 'primary'),
        el('p', '', done ? `✓ ${d.success}` : '！等待修復'),
      );
      cards.append(card);
    });
    panel.append(cards);
    if (state.q2)
      panel.append(
        el(
          'p',
          'clue-card',
          '✦ 第二個線索：魔法地圖。女神：「謝謝你讓湖畔恢復生氣！帶著地圖，繼續你的冒險吧。」',
        ),
        actions(
          button(state.q1 ? '前往森林入口 →' : '挑戰第一道難題 →', () =>
            state.q1 ? this.go('ForestEntrance') : this.firstQuestion(),
          ),
          button('返回地圖', () => this.go('IslandMap'), 'light'),
        ),
      );
    panel.append(
      el(
        'p',
        'fine-print',
        '這是湖畔的教學裝置：廢水處理後回用於廠內，底渣須處理合格才能作建材摻配料，飛灰妥善處理後送往掩埋。燃燒熱能可發電，廢氣走獨立的淨化管線。',
      ),
      actions(button('回焚山複習', () => this.go('Incinerator'), 'light')),
    );
  }
}
