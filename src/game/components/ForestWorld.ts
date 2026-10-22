import Phaser from 'phaser';
import {
  FOREST,
  terrain,
  forestItems,
  forestBins,
  forestSign,
  type Cell,
  type Direction,
} from '../data/forestMap';
import { wasteItems } from '../data/wasteItems';
import { state } from '../systems/SaveSystem';
import type { ValueCategory } from '../data/types';
export const center = (p: Cell): Cell => ({
  x: (p.x + 0.5) * FOREST.tile,
  y: (p.y + 0.5) * FOREST.tile,
});
export class ForestWorld {
  readonly hero: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Graphics;
  private items = new Map<string, Phaser.GameObjects.Container>();
  constructor(
    private scene: Phaser.Scene,
    onItem: (id: string) => void,
    onBin: (value: ValueCategory) => void,
    onSign: () => void,
  ) {
    const tile = FOREST.tile;
    const ground = scene.add.graphics().setDepth(-10);
    ground.fillStyle(0x355d43).fillRect(-1500, -1000, 4200, 2800);
    terrain.forEach((row, y) =>
      [...row].forEach((kind, x) => {
        const px = x * tile,
          py = y * tile;
        const path = kind === '.' && (y === 9 || y === 2 || x === 2 || y === 6);
        ground
          .fillStyle(kind === '~' ? 0x73b7b1 : path ? 0xd9ce9e : (x + y) % 2 ? 0x8eaf72 : 0x94b476)
          .fillRect(px, py, tile, tile);
        if (kind === '~') {
          ground.lineStyle(2, 0xb0d8c6, 0.7);
          ground.lineBetween(px + 12, py + 23, px + 35, py + 23);
          ground.lineBetween(px + 29, py + 46, px + 51, py + 46);
        } else if (kind === '#') {
          const g = scene.add
            .graphics()
            .setPosition(px + 32, py + 49)
            .setDepth(py + 64);
          g.fillStyle(0x376444, 0.25).fillEllipse(0, 9, 60, 20);
          g.fillStyle(0x786847).fillRect(-7, -14, 14, 27);
          g.fillStyle(0x2d6245)
            .fillRoundedRect(-29, -44, 58, 42, 5)
            .fillRoundedRect(-21, -62, 42, 28, 5);
          g.fillStyle(0x477c51).fillRect(-24, -45, 43, 10).fillRect(-16, -59, 28, 9);
          g.fillStyle(0x68955b).fillRect(-17, -53, 10, 5);
        } else if (kind === 'o') {
          const g = scene.add
            .graphics()
            .setPosition(px + 32, py + 32)
            .setDepth(py + 64);
          g.fillStyle(0x7d8972).fillRoundedRect(-25, -20, 50, 43, 10);
          g.fillStyle(0xb5bca0).fillRoundedRect(-22, -20, 35, 13, 6);
        } else {
          for (let i = 0; i < 3; i++) {
            const sx = px + 8 + ((x * 17 + y * 13 + i * 19) % 48),
              sy = py + 9 + ((y * 7 + x * 11 + i * 17) % 45);
            ground.fillStyle(path ? 0xbdb78a : 0x769d63, 0.65).fillRect(sx, sy, 3, 3);
          }
          if (!path && (x * 3 + y) % 9 === 0) {
            ground.fillStyle(0xf0dc99).fillCircle(px + 22, py + 35, 3);
          }
        }
      }),
    );
    const exit = center(FOREST.exit);
    scene.add
      .text(exit.x, exit.y - 12, '↓', { fontSize: '34px', color: '#f5e5af' })
      .setOrigin(0.5)
      .setDepth(20);
    const exitLabel = scene.add
      .text(exit.x, exit.y + 15, '回到島嶼', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#fff7d7',
      })
      .setOrigin(0.5)
      .setDepth(20);
    exitLabel.setBackgroundColor('#3b6247');
    (Object.entries(forestBins) as [ValueCategory, Cell][]).forEach(([value, pos], i) => {
      const p = center(pos),
        g = scene.add
          .graphics()
          .setPosition(p.x, p.y)
          .setDepth(p.y + 32);
      g.fillStyle(0x31503d, 0.2).fillEllipse(0, 22, 51, 15);
      g.fillStyle([0x659d6a, 0xd1af5b, 0xb97b60][i]).fillRoundedRect(-23, -20, 46, 44, 4);
      g.lineStyle(3, 0x35583d).strokeRoundedRect(-23, -20, 46, 44, 4);
      g.fillStyle(0x365741).fillRoundedRect(-26, -26, 52, 10, 2);
      scene.add
        .text(p.x, p.y + 1, value, { fontFamily: 'sans-serif', fontSize: '22px', color: '#fff9db' })
        .setOrigin(0.5)
        .setDepth(p.y + 34);
      scene.add
        .zone(p.x, p.y, 58, 64)
        .setDepth(p.y + 40)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => onBin(value));
    });
    const sign = center(forestSign);
    const sg = scene.add
      .graphics()
      .setPosition(sign.x, sign.y)
      .setDepth(sign.y + 32);
    sg.fillStyle(0x7e6b48).fillRect(-4, -4, 8, 33);
    sg.fillStyle(0xe7d49d).fillRoundedRect(-25, -22, 50, 32, 3);
    sg.lineStyle(3, 0x8a7751).strokeRoundedRect(-25, -22, 50, 32, 3);
    scene.add
      .text(sign.x, sign.y - 6, 'i', { fontFamily: 'Georgia', fontSize: '25px', color: '#52704b' })
      .setOrigin(0.5)
      .setDepth(sign.y + 33);
    scene.add
      .zone(sign.x, sign.y, 56, 64)
      .setDepth(sign.y + 40)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onSign);
    wasteItems.forEach((item) => {
      if (state.collected.includes(item.id)) return;
      const p = center(forestItems[item.id]);
      const shadow = scene.add.ellipse(0, 18, 40, 12, 0x39533f, 0.22);
      const halo = scene.add.rectangle(0, 0, 49, 49, 0xfff3d3, 0.8).setStrokeStyle(1, 0xdbc785);
      const icon = scene.add.image(0, 0, `forest-${item.id}`).setDisplaySize(43, 43);
      const group = scene.add
        .container(p.x, p.y, [shadow, halo, icon])
        .setDepth(p.y + 20)
        .setSize(54, 54)
        .setInteractive({ useHandCursor: true });
      group.on('pointerdown', () => onItem(item.id));
      this.items.set(item.id, group);
    });
    const at = center(FOREST.spawn);
    this.body = scene.add.graphics();
    this.hero = scene.add.container(at.x, at.y, [this.body]);
    this.pose('down', 0);
  }
  syncItems(): void {
    for (const [id, sprite] of this.items)
      if (state.collected.includes(id)) {
        sprite.destroy();
        this.items.delete(id);
      }
  }
  pose(direction: Direction, frame: number): void {
    const g = this.body;
    g.clear();
    g.fillStyle(0x254631, 0.25).fillEllipse(0, 22, 38, 13);
    const stride = frame === 0 ? 0 : frame % 2 ? 3 : -3;
    g.fillStyle(0x304537)
      .fillRect(-11, 12 + stride, 8, 10)
      .fillRect(4, 12 - stride, 8, 10);
    g.fillStyle([0xb8664d, 0x55977d, 0x536f9b, 0x9272a2][state.hero]).fillRect(-13, -4, 26, 23);
    g.fillStyle(0xe5bf8f).fillRect(-17, 0, 5, 12).fillRect(13, 0, 5, 12).fillRect(-11, -24, 22, 22);
    g.fillStyle(0x414738)
      .fillRect(-13, -28, 26, 10)
      .fillRect(-13, -21, 5, 10)
      .fillRect(9, -21, 4, 10);
    if (direction === 'up') {
      g.fillStyle(0x414738).fillRect(-11, -22, 22, 18);
      g.fillStyle(0xcfb778).fillRect(-9, 0, 18, 15);
    } else {
      g.fillStyle(0x324438);
      if (direction !== 'right') g.fillRect(-7, -14, 3, 4);
      if (direction !== 'left') g.fillRect(5, -14, 3, 4);
      g.fillStyle(0xc18d6d).fillRect(
        direction === 'left' ? -14 : direction === 'right' ? 11 : -2,
        -9,
        4,
        4,
      );
    }
    this.hero.setDepth(this.hero.y + 30);
  }
}
