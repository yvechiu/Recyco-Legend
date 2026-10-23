import Phaser from 'phaser';
import { $, el, button } from '../components/UI';
import { directions, sameCell, type Cell, type Direction } from '../data/forestMap';
import { findPath, adjacentCells } from './GridNavigation';
interface WalkingOptions {
  scene: Phaser.Scene;
  hero: Phaser.GameObjects.Container;
  spawn: Cell;
  exit: Cell;
  columns: number;
  rows: number;
  tile: number;
  stepMs: number;
  canWalk: (p: Cell) => boolean;
  ready: () => boolean;
  pose: (direction: Direction, frame: number) => void;
  onInteract: () => void;
  onExit: () => void;
  prompt: () => string;
  prefix: string;
}
export class WalkingController {
  cell: Cell;
  facing: Direction = 'down';
  moving = false;
  private held = new Set<Direction>();
  private destination: { cell: Cell; label: string; action: () => void; exact: boolean } | null =
    null;
  private stride = 0;
  private options: WalkingOptions;
  constructor(options: WalkingOptions) {
    this.options = options;
    this.cell = { ...options.spawn };
    const { scene, hero, tile, columns, rows } = options;
    const stage = $('#stage');
    stage.classList.add('walking-stage');
    stage.tabIndex = 0;
    scene.cameras.main
      .setBounds(-48, -48, columns * tile + 96, rows * tile + 96)
      .startFollow(hero, true, 1, 1);
    const resize = () => {
      const width = Math.min(
        1200,
        Math.max(260, (stage.clientWidth * 440) / Math.max(1, stage.clientHeight)),
      );
      scene.cameras.main.setViewport((1200 - width) / 2, 0, width, 440);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
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
    const keyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(target?.tagName) ||
        target?.isContentEditable ||
        !this.ready()
      )
        return;
      const d = keys[e.code];
      if (d) {
        e.preventDefault();
        this.destination = null;
        this.held.add(d);
        if (!e.repeat) this.step(d);
      } else if ((e.code === 'Space' || e.code === 'Enter') && target?.tagName !== 'BUTTON') {
        e.preventDefault();
        if (!e.repeat) this.interact();
      }
    };
    const keyUp = (e: KeyboardEvent) => {
      if (keys[e.code]) this.held.delete(keys[e.code]);
    };
    scene.input.keyboard?.on('keydown', keyDown);
    scene.input.keyboard?.on('keyup', keyUp);
    const ground = (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || !this.ready()) return;
      const p = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const cell = { x: Math.floor(p.x / tile), y: Math.floor(p.y / tile) };
      if (options.canWalk(cell)) this.travel(cell, '選定的位置', () => this.refresh(), true);
    };
    scene.input.on('pointerdown', ground);
    const blur = () => this.stop(),
      hidden = () => {
        if (document.hidden) this.stop();
      };
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', hidden);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stop();
      observer.disconnect();
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', hidden);
      scene.input.off('pointerdown', ground);
      scene.input.keyboard?.off('keydown', keyDown);
      scene.input.keyboard?.off('keyup', keyUp);
      stage.removeAttribute('tabindex');
      stage.setAttribute('aria-label', '遊戲場景');
      delete stage.dataset.playerCell;
      delete stage.dataset.moving;
    });
    this.refresh();
  }
  private ready(): boolean {
    return this.options.ready() && !document.querySelector('dialog[open]');
  }
  stop(): void {
    this.held.clear();
    this.destination = null;
  }
  interact(): void {
    if (!this.ready() || this.moving) return;
    this.stop();
    this.options.onInteract();
    this.refresh();
  }
  travel(cell: Cell, label: string, action: () => void, exact = false): void {
    if (!this.ready()) return;
    this.held.clear();
    this.destination = { cell, label, action, exact };
    $('#stage').scrollIntoView({ block: 'nearest', behavior: 'instant' });
    $('#stage').focus({ preventScroll: true });
    this.refresh();
  }
  update(): void {
    const { hero, canWalk } = this.options;
    hero.setDepth(hero.y + 30);
    if (!this.ready()) {
      this.held.clear();
      return;
    }
    if (this.moving) return;
    const d = [...this.held].at(-1);
    if (d) {
      this.destination = null;
      this.step(d);
      return;
    }
    if (!this.destination) return;
    const target = this.destination,
      path = findPath(
        this.cell,
        target.exact ? [target.cell] : adjacentCells(target.cell, canWalk),
        canWalk,
      );
    if (path === null) {
      this.destination = null;
      this.refresh('暫時走不到那裡，換個方向試試吧。');
      return;
    }
    if (!path.length) {
      this.destination = null;
      target.action();
      this.refresh();
      return;
    }
    const delta = { x: path[0].x - this.cell.x, y: path[0].y - this.cell.y };
    const dir = (Object.keys(directions) as Direction[]).find((d) =>
      sameCell(directions[d], delta),
    )!;
    this.step(dir);
  }
  private step(direction: Direction): void {
    if (!this.ready() || this.moving) return;
    const { canWalk, hero, tile, scene, stepMs, pose } = this.options;
    this.facing = direction;
    pose(direction, 0);
    const delta = directions[direction],
      next = { x: this.cell.x + delta.x, y: this.cell.y + delta.y };
    if (!canWalk(next)) {
      this.refresh('前方有障礙物，換個方向走走吧。');
      return;
    }
    this.moving = true;
    $('#stage').dataset.moving = 'true';
    pose(direction, ++this.stride);
    scene.tweens.add({
      targets: hero,
      x: (next.x + 0.5) * tile,
      y: (next.y + 0.5) * tile,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 70 : stepMs,
      ease: 'Linear',
      onComplete: () => {
        this.cell = next;
        this.moving = false;
        pose(this.facing, 0);
        this.refresh();
        if (sameCell(next, this.options.exit)) {
          this.stop();
          this.options.onExit();
        }
      },
    });
  }
  refresh(message?: string): void {
    const stage = $('#stage');
    stage.dataset.playerCell = `${this.cell.x},${this.cell.y}`;
    stage.dataset.moving = String(this.moving);
    const prompt = document.getElementById(`${this.options.prefix}-prompt`),
      text =
        message ||
        (this.destination
          ? `正在前往${this.destination.label}…方向鍵可取消自動行走。`
          : this.options.prompt());
    if (prompt && prompt.textContent !== text) prompt.textContent = text;
    const dot = document.getElementById(`${this.options.prefix}-minimap-player`);
    if (dot) {
      dot.setAttribute('cx', String(this.cell.x + 0.5));
      dot.setAttribute('cy', String(this.cell.y + 0.5));
    }
  }
  mountControls(parent: HTMLElement): void {
    const controls = el('div', 'forest-controls'),
      pad = el('div', 'forest-dpad');
    pad.setAttribute('aria-label', '探索方向鍵');
    (['up', 'left', 'down', 'right'] as Direction[]).forEach((d) => {
      const b = el(
        'button',
        `walk-direction ${d}`,
        { up: '↑', down: '↓', left: '←', right: '→' }[d],
      );
      b.type = 'button';
      b.setAttribute('aria-label', `向${{ up: '上', down: '下', left: '左', right: '右' }[d]}移動`);
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (!this.ready()) return;
        b.setPointerCapture(e.pointerId);
        this.held.clear();
        this.destination = null;
        this.held.add(d);
        this.step(d);
      });
      const release = () => this.held.delete(d);
      b.addEventListener('pointerup', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('lostpointercapture', release);
      b.addEventListener('click', (e) => {
        if (!e.detail) {
          this.destination = null;
          this.step(d);
        }
      });
      pad.append(b);
    });
    controls.append(
      pad,
      button('交談 ␣', () => this.interact(), 'forest-interact'),
    );
    parent.append(controls);
    const prompt = el('p', 'forest-prompt');
    prompt.id = `${this.options.prefix}-prompt`;
    prompt.setAttribute('aria-live', 'polite');
    parent.append(prompt);
    this.refresh();
  }
}
