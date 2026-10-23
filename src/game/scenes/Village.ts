import Phaser from 'phaser';
import { AdventureScene } from './AdventureScene';
import { $, el, button, titleBlock, actions, feedback } from '../components/UI';
import { state, persist, objective } from '../systems/SaveSystem';
import { WalkingController } from '../systems/WalkingController';
import { VillageWorld } from '../components/VillageWorld';
import { npcPortrait } from '../components/NpcPortrait';
import {
  villageNpcs,
  VILLAGE,
  villageTerrain,
  villageWalkable,
  type VillageNpc,
} from '../data/village';
import { directions, distance, sameCell } from '../data/forestMap';
import type { VillageNpcId } from '../data/types';
export class Village extends AdventureScene {
  private walker!: WalkingController;
  private world!: VillageWorld;
  private dialog!: HTMLDialogElement;
  private conversation: VillageNpc | null = null;
  private pages: string[] = [];
  private page = 0;
  private alive = false;
  constructor() {
    super('Village');
  }
  preload(): void {
    for (const n of villageNpcs) {
      if (this.textures.exists(`npc-${n.id}`)) continue;
      this.load.svg(`npc-${n.id}`, `data:image/svg+xml;base64,${btoa(npcPortrait(n).outerHTML)}`, {
        width: 64,
        height: 80,
      });
    }
  }
  protected paint(): void {
    this.cameras.main.setBackgroundColor('#426647');
  }
  create(): void {
    this.alive = true;
    this.conversation = null;
    this.pages = [];
    this.page = 0;
    this.setup('瑞賽可村', '村落探索 · 和居民一起守護循環島', 'village');
    const stage = $('#stage');
    stage.classList.add('village-stage');
    stage.setAttribute('aria-label', '瑞賽可村：方向鍵走動，靠近村民按空白鍵交談。');
    this.dialog = el('dialog', 'npc-dialog');
    this.dialog.id = 'npc-dialog';
    this.dialog.setAttribute('aria-labelledby', 'npc-title');
    this.dialog.setAttribute('aria-describedby', 'npc-speech');
    document.body.append(this.dialog);
    this.world = new VillageWorld(this, (id) => this.visit(id));
    this.walker = new WalkingController({
      scene: this,
      hero: this.world.hero,
      ...VILLAGE,
      canWalk: villageWalkable,
      ready: () => this.alive && !this.conversation,
      pose: (direction, frame) => this.world.pose(direction, frame),
      onInteract: () => this.interact(),
      onExit: () => this.go('IslandMap'),
      prompt: () => this.prompt(),
      prefix: 'village',
    });
    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.closeDialogue();
    });
    this.dialog.addEventListener('close', () => {
      // Ignore a queued close event if a new conversation has already opened.
      if (!this.alive || this.dialog.open || !this.conversation) return;
      this.conversation = null;
      this.walker.stop();
      this.render();
      $('#stage').focus({ preventScroll: true });
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.alive = false;
      this.conversation = null;
      if (this.dialog.open) this.dialog.close();
      this.dialog.remove();
    });
    this.render();
  }
  update(): void {
    this.walker?.update();
  }
  private nearest(): VillageNpc | undefined {
    if (!this.walker) return undefined;
    const at = this.walker.cell,
      delta = directions[this.walker.facing],
      front = { x: at.x + delta.x, y: at.y + delta.y };
    return villageNpcs
      .filter((n) => distance(n.cell, at) <= 1)
      .sort((a, b) => Number(sameCell(b.cell, front)) - Number(sameCell(a.cell, front)))[0];
  }
  private prompt(): string {
    const n = this.nearest();
    return n
      ? `附近：${n.name} · 按空白鍵交談${state.villageTalks.includes(n.id) ? '（可複習）' : ''}`
      : '方向鍵走動 · 靠近村民按空白鍵 · 南方出口返回島嶼';
  }
  private interact(): void {
    const npc = this.nearest();
    if (npc) this.begin(npc);
    else feedback('先走到村民身旁，再按空白鍵交談；也可以用下方尋訪按鈕。');
  }
  private visit(id: VillageNpcId): void {
    const n = villageNpcs.find((n) => n.id === id)!;
    this.walker.travel(n.cell, n.name, () => this.begin(n));
  }
  private begin(npc: VillageNpc): void {
    if (this.conversation || this.walker.moving || distance(this.walker.cell, npc.cell) > 1) return;
    this.walker.stop();
    this.conversation = npc;
    this.pages = [];
    this.page = 0;
    this.renderDialogue();
    this.dialog.showModal();
    this.dialog.querySelector<HTMLButtonElement>('.npc-reply')?.focus();
  }
  private renderDialogue(): void {
    const n = this.conversation;
    if (!n) return;
    const dialog = this.dialog;
    dialog.replaceChildren();
    const header = el('div', 'npc-dialog-header');
    header.append(npcPortrait(n));
    const name = el('div');
    const heading = el('h2', '', n.name);
    heading.id = 'npc-title';
    name.append(el('span', 'eyebrow', `${n.location} · ${n.role}`), heading);
    header.append(
      name,
      el('span', 'chip', state.villageTalks.includes(n.id) ? '已留下手記 ✓' : '新的相遇'),
    );
    dialog.append(header);
    const speech = el('p', 'npc-speech', this.pages.length ? this.pages[this.page] : n.greeting);
    speech.id = 'npc-speech';
    speech.setAttribute('aria-live', 'polite');
    dialog.append(speech);
    if (!this.pages.length) {
      const replies = el('div', 'npc-replies');
      n.replies.forEach((reply) => {
        const b = button(
          reply.label,
          () => {
            this.pages = [reply.text, ...n.lesson];
            this.page = 0;
            this.renderDialogue();
          },
          'light npc-reply',
        );
        replies.append(b);
      });
      dialog.append(replies);
    } else {
      const footer = el('div', 'npc-dialog-footer');
      footer.append(
        el(
          'span',
          'eyebrow',
          `${this.page + 1} / ${this.pages.length} · ${this.page === this.pages.length - 1 ? '記下重點，帶進下一段冒險' : '慢慢聊，不用急'}`,
        ),
      );
      const next = button(
        this.page === this.pages.length - 1 ? '記下手記 ✓' : '繼續聽 →',
        () => {
          if (this.page < this.pages.length - 1) {
            this.page++;
            this.renderDialogue();
          } else this.finish(n);
        },
        'primary npc-next',
      );
      footer.append(next);
      dialog.append(footer);
      next.focus({ preventScroll: true });
    }
    dialog.append(button('先告辭，晚點再聊', () => this.closeDialogue(), 'text small npc-cancel'));
  }
  private closeDialogue(): void {
    if (!this.alive) return;
    this.conversation = null;
    this.walker.stop();
    this.dialog.close();
    this.render();
    $('#stage').focus({ preventScroll: true });
  }
  private finish(n: VillageNpc): void {
    if (!state.villageTalks.includes(n.id)) state.villageTalks.push(n.id);
    state.visitedVillage = villageNpcs.every((n) => state.villageTalks.includes(n.id));
    persist();
    this.world.syncProgress();
    const quest = document.querySelector('#hud .quest>span:last-child');
    if (quest) quest.textContent = objective();
    this.closeDialogue();
    feedback(
      state.visitedVillage
        ? '✓ 已完成村落探索！三位村民的手記已收好，接著前往焚山收齊四份觀察紀錄，再到克林湖挑戰女神。'
        : `✓ 已記下${n.name}的分享（${state.villageTalks.length} / 3）。再找找其他村民吧！`,
      'good',
    );
  }
  private render(): void {
    const ui = $('#stage-ui');
    ui.replaceChildren();
    const status = el('div', 'village-status');
    status.append(
      el('span', 'chip', `村民手記 ${state.villageTalks.length} / ${villageNpcs.length}`),
    );
    ui.append(status);
    this.walker.mountControls(ui);
    const mini = el('div', 'forest-minimap');
    mini.setAttribute('aria-label', '村莊小地圖：黃點是勇士，三位村民標在各自的位置。');
    const tiles = villageTerrain
      .flatMap((row, y) =>
        [...row].map(
          (kind, x) =>
            `<rect x="${x}" y="${y}" width="1" height="1" fill="${kind === '#' ? '#537a49' : kind === 'H' ? '#b47e60' : kind === '~' ? '#89bcb4' : '#d8d6ac'}"/>`,
        ),
      )
      .join('');
    const dots = villageNpcs
      .map(
        (n) =>
          `<circle cx="${n.cell.x + 0.5}" cy="${n.cell.y + 0.5}" r=".5" fill="${state.villageTalks.includes(n.id) ? '#3e825a' : '#b66e4e'}"/>`,
      )
      .join('');
    mini.innerHTML = `<svg viewBox="0 0 18 12" aria-hidden="true">${tiles}${dots}<circle id="village-minimap-player" r=".6" fill="#ffe17d" stroke="#35583b" stroke-width=".2"/></svg><span>瑞賽可村手繪圖</span>`;
    ui.append(mini);
    this.walker.refresh();
    const panel = $('#panel');
    panel.className = 'village-panel';
    panel.replaceChildren(
      titleBlock(
        'VILLAGE STORIES · 村莊裡的相遇',
        '每位居民，都有一段故事。',
        '用方向鍵／WASD 走近村民，按空白鍵交談。也可以點選尋訪按鈕自動走到身旁；聽完並記下手記，才算完成拜訪。',
      ),
    );
    const directory = el('div', 'npc-directory');
    villageNpcs.forEach((n) => {
      const done = state.villageTalks.includes(n.id),
        card = el('article', `npc-card ${done ? 'visited' : ''}`);
      const info = el('div', 'npc-card-info');
      info.append(npcPortrait(n));
      const details = el('div');
      details.append(el('span', 'eyebrow', n.location), el('h3', '', n.name), el('p', '', n.role));
      info.append(details);
      card.append(
        info,
        button(`和${n.name}交談`, () => this.visit(n.id), done ? 'light' : 'primary'),
        el('span', 'npc-visit-mark', done ? '✓ 已記下，可再聊聊' : '！等待你的拜訪'),
      );
      directory.append(card);
    });
    panel.append(directory);
    const journal = el('section', 'village-journal');
    journal.setAttribute('aria-label', '村民手記');
    journal.append(el('h3', '', '勇士手記'));
    if (!state.villageTalks.length)
      journal.append(
        el('p', 'inventory-empty', '手記還是空白的。先和居民聊聊，聽完後把重點記下來。'),
      );
    villageNpcs
      .filter((n) => state.villageTalks.includes(n.id))
      .forEach((n) => {
        const entry = el('details', 'village-entry');
        entry.open = true;
        entry.append(el('summary', '', `✓ ${n.name} · ${n.role}`), el('p', '', n.journal));
        journal.append(entry);
      });
    panel.append(journal);
    panel.append(
      state.visitedVillage
        ? actions(
            button('前往焚山 →', () => this.go('Incinerator')),
            button('返回地圖', () => this.go('IslandMap'), 'light'),
          )
        : actions(button('返回地圖', () => this.go('IslandMap'), 'light')),
    );
  }
}
