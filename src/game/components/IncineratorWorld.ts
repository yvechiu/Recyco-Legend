import Phaser from 'phaser';
import { STATION, observationPoints, engineerCell } from '../data/incinerator';
import { paintPixelHero } from './PixelHero';
import { state } from '../systems/SaveSystem';
import type { Direction } from '../data/forestMap';
export class IncineratorWorld {
  readonly hero: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Graphics;
  private markers = new Map<string, Phaser.GameObjects.Text>();
  constructor(scene: Phaser.Scene, visit: (id: string) => void) {
    const t = STATION.tile,
      g = scene.add.graphics().setDepth(-10);
    g.fillStyle(0x364f52).fillRect(-1500, -1000, 4200, 2800);
    for (let y = 0; y < STATION.rows; y++)
      for (let x = 0; x < STATION.columns; x++) {
        const edge = x === 0 || x === 17 || y === 0 || y === 11;
        g.fillStyle(edge ? 0x55716a : (x + y) % 2 ? 0xd3d8c8 : 0xdce0d0).fillRect(
          x * t,
          y * t,
          t,
          t,
        );
        g.lineStyle(1, 0xabb8aa, 0.4).strokeRect(x * t, y * t, t, t);
        if ((y === 1 || y === 11) && x !== 8) {
          g.fillStyle(0xc9ac68).fillRect(x * t, y * t + 20, t, 7);
          g.fillStyle(0x576e68).fillRect(x * t + 8, y * t + 20, 5, 30);
        }
      }
    g.fillStyle(0x839787).fillRect(2 * t, 35, 14 * t, 47);
    g.fillStyle(0x687c71).fillRect(2 * t, 47, 14 * t, 7);
    this.label(scene, 9 * t, 55, '焚山觀察站 · 參觀步道', '#fff1c9');
    observationPoints.forEach((p, i) => {
      const x = (p.cell.x + 0.5) * t,
        y = (p.cell.y + 0.5) * t;
      const machine = scene.add
        .graphics()
        .setPosition(x, y)
        .setDepth(y + 25);
      machine.fillStyle(0x617e76).fillRect(-52, -48, 104, 71);
      machine.fillStyle([0xcb9462, 0x71aead, 0xb8a07c, 0x879da3][i]).fillRect(-46, -41, 92, 51);
      machine.lineStyle(4, 0xe6cf8b).strokeRect(-53, -49, 106, 73);
      if (i === 0) {
        machine.fillStyle(0xe5bc68).fillTriangle(-20, 5, 0, -31, 20, 5);
        machine.fillStyle(0xf8df96).fillTriangle(-10, 5, 2, -16, 12, 5);
      } else if (i === 1) {
        machine.fillStyle(0xc5e9dc).fillEllipse(0, -15, 66, 19);
        machine.lineStyle(3, 0x4d857f).lineBetween(-32, -1, 32, -1);
      } else {
        for (let j = 0; j < 4; j++)
          machine
            .fillStyle(i === 2 ? 0x756d5d : 0xd6dfcf)
            .fillRect(-31 + j * 18, -22 + (j % 2) * 9, 13, 21);
      }
      const target = scene.add
        .zone(x, y, 110, 90)
        .setDepth(y + 40)
        .setInteractive({ useHandCursor: true });
      target.on('pointerdown', () => visit(p.id));
      this.label(scene, x, y + 43, p.place);
      this.markers.set(p.id, this.label(scene, x, y - 68, '!', '#ffe6a0'));
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const light = scene.add.circle(x + 38, y - 33, 4, 0xffe3a1).setDepth(y + 30);
        scene.tweens.add({
          targets: light,
          alpha: 0.25,
          duration: 900 + i * 130,
          yoyo: true,
          repeat: -1,
        });
      }
    });
    const x = (engineerCell.x + 0.5) * t,
      y = (engineerCell.y + 0.5) * t;
    const worker = scene.add
      .graphics()
      .setPosition(x, y)
      .setDepth(y + 30);
    paintPixelHero(worker, 2, 'down', 0);
    worker.fillStyle(0xf3d68b).fillRect(-15, -29, 30, 9).fillRect(-11, -37, 22, 11);
    worker.fillStyle(0xe8d88a).fillRect(-12, 0, 7, 18).fillRect(6, 0, 7, 18);
    scene.add
      .zone(x, y, 52, 72)
      .setDepth(y + 40)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => visit('engineer'));
    this.label(scene, x, y + 43, '工程師 阿燦');
    this.label(
      scene,
      (STATION.exit.x + 0.5) * t,
      (STATION.exit.y + 0.5) * t,
      '↓ 返回島嶼',
      '#fff1c9',
    );
    this.body = scene.add.graphics();
    this.hero = scene.add.container((STATION.spawn.x + 0.5) * t, (STATION.spawn.y + 0.5) * t, [
      this.body,
    ]);
    this.pose('up', 0);
    this.syncProgress();
  }
  private label(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color = '#f5f1dc',
  ): Phaser.GameObjects.Text {
    return scene.add
      .text(x, y, text, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color,
        backgroundColor: '#3d5e58',
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(y + 100);
  }
  pose(d: Direction, f: number): void {
    paintPixelHero(this.body, state.hero, d, f);
  }
  syncProgress(): void {
    for (const [id, m] of this.markers) m.setText(state.incineratorNotes.includes(id) ? '✓' : '!');
  }
}
