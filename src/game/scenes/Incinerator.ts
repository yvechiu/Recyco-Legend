import Phaser from 'phaser';
import { AdventureScene } from './AdventureScene';
import { $, el, button, titleBlock, actions, feedback } from '../components/UI';
import { state, persist, objective } from '../systems/SaveSystem';
import { WalkingController } from '../systems/WalkingController';
import { IncineratorWorld } from '../components/IncineratorWorld';
import { STATION, observationPoints, engineerCell, stationWalkable } from '../data/incinerator';
import { distance } from '../data/forestMap';
export class Incinerator extends AdventureScene {
  private walker!: WalkingController;
  private world!: IncineratorWorld;
  private dialog!: HTMLDialogElement;
  private alive = false;
  constructor() {
    super('Incinerator');
  }
  protected paint(): void {
    this.cameras.main.setBackgroundColor('#364f52');
  }
  create(): void {
    this.alive = true;
    this.setup('焚山觀察站', '探索 02 · 沿著步道追蹤垃圾的去向', 'fire');
    $('#stage').setAttribute('aria-label', '焚山觀察站：方向鍵走動，靠近設備或工程師按空白鍵。');
    this.dialog = el('dialog', 'npc-dialog');
    this.dialog.id = 'station-dialog';
    this.dialog.setAttribute('aria-labelledby', 'station-title');
    document.body.append(this.dialog);
    this.world = new IncineratorWorld(this, (id) => this.visit(id));
    this.walker = new WalkingController({
      scene: this,
      hero: this.world.hero,
      ...STATION,
      canWalk: stationWalkable,
      ready: () => this.alive && !this.dialog.open,
      pose: (d, f) => this.world.pose(d, f),
      onInteract: () => {
        const n = this.nearest();
        if (n) this.open(n.id);
      },
      onExit: () => this.go('IslandMap'),
      prompt: () => {
        const n = this.nearest();
        return n
          ? `附近：${n.label} · 空白鍵觀察／交談`
          : '方向鍵／WASD 探索 · 點設備可自動走近 · 南方出口返回島嶼';
      },
      prefix: 'station',
    });
    this.dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.close();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.alive = false;
      this.dialog.remove();
    });
    this.render();
  }
  update(): void {
    this.walker?.update();
  }
  private targets() {
    return [
      ...observationPoints.map((p) => ({ id: p.id, cell: p.cell, label: p.place })),
      { id: 'engineer', cell: engineerCell, label: '工程師 阿燦' },
    ];
  }
  private nearest() {
    if (!this.walker) return undefined;
    return this.targets().find((p) => distance(this.walker.cell, p.cell) <= 1);
  }
  private visit(id: string): void {
    const p = this.targets().find((p) => p.id === id)!;
    this.walker.travel(p.cell, p.label, () => this.open(id));
  }
  private close(): void {
    this.dialog.close();
    this.walker.stop();
    $('#stage').focus({ preventScroll: true });
  }
  private open(id: string): void {
    const p = this.targets().find((p) => p.id === id);
    if (!p || this.dialog.open || this.walker.moving || distance(this.walker.cell, p.cell) > 1)
      return;
    this.walker.stop();
    this.dialog.replaceChildren();
    const heading = el('h2', '', p.label);
    heading.id = 'station-title';
    this.dialog.append(el('span', 'eyebrow', '焚山觀察站 · 現場紀錄'), heading);
    if (id === 'engineer') this.engineer();
    else {
      const note = observationPoints.find((p) => p.id === id)!;
      this.dialog.append(
        el('p', 'npc-speech', `${note.detail}。${note.note}`),
        button('記下觀察 ✓', () => {
          if (!state.incineratorNotes.includes(id)) state.incineratorNotes.push(id);
          persist();
          this.world.syncProgress();
          this.close();
          this.render();
          feedback(
            `✓ 已記下 ${state.incineratorNotes.length} / 4 種產物。收齊後找工程師完成現場任務。`,
            'good',
          );
        }),
      );
    }
    this.dialog.append(button('先離開', () => this.close(), 'text small'));
    this.dialog.showModal();
  }
  private engineer(): void {
    this.dialog.append(
      el(
        'p',
        'npc-speech',
        '我是工程師阿燦。垃圾進廠前要先秤重、做輻射檢測，並確認是否適合焚化。沿著參觀步道看四個觀察點：焚化能減少體積，也能回收熱能，但產物仍要妥善處理。減量和分類，才是第一步。',
      ),
    );
    if (state.incineratorNotes.length < 4) {
      this.dialog.append(
        el(
          'p',
          '',
          `先到四個設備旁觀察，記下產物的去向，再回來找我吧！（${state.incineratorNotes.length} / 4）`,
        ),
      );
      return;
    }
    this.dialog.append(el('h3', '', '現場任務：哪一句可以寫進導覽手冊？'));
    const result = el('p');
    result.setAttribute('role', 'status');
    this.dialog.append(result);
    [
      '燒完之後，所有垃圾都會消失',
      '燃燒熱能可用於發電，廢氣仍須淨化',
      '飛灰不用處理就能直接鋪路',
    ].forEach((answer, i) => {
      this.dialog.append(
        button(
          answer,
          () => {
            if (i !== 1) {
              result.textContent = '再想想：焚化後還有產物；發電利用的是燃燒熱能。可以再試一次。';
              return;
            }
            state.visitedIncinerator = true;
            persist();
            this.close();
            this.render();
            const quest = document.querySelector('#hud .quest>span:last-child');
            if (quest) quest.textContent = objective();
            feedback('✓ 現場任務完成！帶著四份觀察紀錄，前往克林湖回答女神的配對題吧。', 'good');
          },
          'light',
        ),
      );
    });
  }
  private render(): void {
    const ui = $('#stage-ui');
    ui.replaceChildren(
      el(
        'span',
        'chip',
        `觀察紀錄 ${state.incineratorNotes.length} / 4${state.visitedIncinerator ? ' · 任務完成 ✓' : ''}`,
      ),
    );
    this.walker.mountControls(ui);
    const panel = $('#panel');
    panel.className = 'village-panel';
    panel.replaceChildren(
      titleBlock(
        'INCINERATOR WALK · 焚山探索',
        '燒完以後，垃圾去了哪裡？',
        '沿著參觀步道走近設備，按空白鍵觀察。也可以點下方按鈕自動走近；記下四份紀錄後，和工程師完成現場任務。',
      ),
    );
    panel.append(button('和工程師阿燦交談', () => this.visit('engineer'), 'light'));
    const cards = el('div', 'learning-cards four');
    observationPoints.forEach((p) => {
      const card = el(
        'article',
        `learning-card ${state.incineratorNotes.includes(p.id) ? 'read' : ''}`,
      );
      card.append(
        button(`${p.symbol} ${p.label}`, () => this.visit(p.id), 'light'),
        el('p', '', p.place),
      );
      if (state.incineratorNotes.includes(p.id))
        card.append(el('p', '', `✓ ${p.detail}。${p.note}`));
      cards.append(card);
    });
    panel.append(
      cards,
      el(
        'p',
        'fine-print',
        '科學補充：發電利用燃燒熱能，廢氣本身仍須淨化。設備與工程師為本次遊戲改編；底渣、飛灰與廢水的處理須符合當地規範。',
      ),
    );
    panel.append(
      state.visitedIncinerator
        ? actions(
            button('前往克林湖 →', () => this.go('LakeGoddess')),
            button('返回地圖', () => this.go('IslandMap'), 'light'),
          )
        : actions(button('返回地圖', () => this.go('IslandMap'), 'light')),
    );
  }
}
