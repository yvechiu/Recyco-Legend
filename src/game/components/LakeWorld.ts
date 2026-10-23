import Phaser from 'phaser';
import { LAKE, lakeDevices } from '../data/lake';
import { state } from '../systems/SaveSystem';
import { paintPixelHero } from './PixelHero';
import type { Direction } from '../data/forestMap';
export class LakeWorld {
  readonly hero: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Graphics;
  private water: Phaser.GameObjects.Graphics;
  private repairedPath: Phaser.GameObjects.Graphics;
  private markers = new Map<string, Phaser.GameObjects.Text>();
  private lamps = new Map<string, Phaser.GameObjects.Arc>();
  constructor(
    private scene: Phaser.Scene,
    visit: (id: string) => void,
  ) {
    const t = LAKE.tile,
      g = scene.add.graphics().setDepth(-20);
    g.fillStyle(0x426b57).fillRect(-1500, -1000, 4200, 2800);
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 18; x++) {
        const edge = x === 0 || x === 17 || y === 0 || y === 11;
        g.fillStyle(edge ? 0x739762 : (x + y) % 2 ? 0xe4dab2 : 0xd9d1a8).fillRect(
          x * t,
          y * t,
          t,
          t,
        );
        if (edge && (x + y) % 3 === 0) {
          g.fillStyle(0x427453).fillCircle(x * t + 32, y * t + 20, 26);
          g.fillStyle(0x8c7b54).fillRect(x * t + 28, y * t + 38, 8, 22);
        }
      }
    g.fillStyle(0x9bb59b).fillRoundedRect(6 * t - 14, 2 * t - 14, 6 * t + 28, 7 * t + 28, 26);
    this.water = scene.add.graphics().setDepth(-15);
    this.repairedPath = scene.add.graphics().setDepth(-12);
    for (let i = 0; i < 8; i++) {
      g.lineStyle(2, 0xd1ece0, 0.6).strokeEllipse(
        6 * t + 45 + (i % 3) * 95,
        2 * t + 45 + i * 48,
        56,
        8,
      );
    }
    lakeDevices.forEach((d, i) => {
      const x = (d.cell.x + 0.5) * t,
        y = (d.cell.y + 0.5) * t;
      g.lineStyle(8, 0x92a58d).lineBetween(x, y, i % 2 ? 12 * t : 6 * t, y);
      const prop = scene.add
        .graphics()
        .setPosition(x, y)
        .setDepth(y + 25);
      prop.fillStyle(0x557d6b).fillRoundedRect(-30, -36, 60, 60, 5);
      prop.fillStyle(d.color).fillRect(-24, -29, 48, 36);
      if (i === 0) {
        prop
          .fillStyle(0xffe7a1)
          .fillTriangle(3, -26, -10, -7, 5, -7)
          .fillTriangle(-4, 3, 10, -16, -3, -16);
      } else if (i === 1) {
        prop.fillStyle(0xd8f4e2).fillEllipse(0, -11, 40, 13);
      } else if (i === 2) {
        prop.fillStyle(0x826e53).fillRect(-19, -22, 15, 12).fillRect(2, -9, 18, 12);
      } else {
        prop.fillStyle(0xe0e3db).fillRoundedRect(-14, -24, 28, 29, 4);
        prop.lineStyle(3, 0x7c8490).lineBetween(-16, -15, 16, -15);
      }
      scene.add
        .zone(x, y, 64, 76)
        .setDepth(y + 30)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => visit(d.id));
      scene.add
        .text(x, y + 40, d.name, {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: '#35543e',
          backgroundColor: '#fff6d8',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(y + 45);
      this.markers.set(
        d.id,
        scene.add
          .text(x, y - 55, '!', {
            fontSize: '20px',
            color: '#fff8dc',
            backgroundColor: '#967a4d',
            padding: { x: 5, y: 2 },
          })
          .setOrigin(0.5)
          .setDepth(y + 50),
      );
      this.lamps.set(d.id, scene.add.circle(x + 29, y - 29, 7, 0x837b65).setDepth(y + 40));
    });
    const goddess = scene.add
      .image(9 * t, 4.5 * t, 'lake-goddess')
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDisplaySize(100, 130)
      .setDepth(400);
    scene.add
      .text(9 * t, 5.8 * t, '克林湖女神', {
        fontSize: '18px',
        color: '#fff9d8',
        backgroundColor: '#527d70',
      })
      .setOrigin(0.5)
      .setDepth(401);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      scene.tweens.add({
        targets: goddess,
        y: goddess.y - 8,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    scene.add
      .text(8.5 * t, 11.5 * t, '↓ 返回島嶼', {
        fontSize: '17px',
        color: '#fff6d8',
        backgroundColor: '#426b57',
      })
      .setOrigin(0.5);
    this.body = scene.add.graphics();
    this.hero = scene.add.container(8.5 * t, 10.5 * t, [this.body]);
    this.pose('up', 0);
    this.sync();
  }
  activate(id: string): void {
    this.sync();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lamp = this.lamps.get(id)!;
    this.scene.tweens.add({ targets: lamp, scale: 1.8, duration: 350, yoyo: true, repeat: 2 });
    const d = lakeDevices.find((d) => d.id === id)!;
    const symbol = {
      gas: '☼ 熱能回收',
      water: '≈ 處理後回用',
      bottom: '◇ 合格建材',
      fly: '✓ 密閉處理',
    }[id as 'gas' | 'water' | 'bottom' | 'fly'];
    const text = this.scene.add
      .text((d.cell.x + 0.5) * 64, (d.cell.y + 0.5) * 64 - 60, symbol, {
        fontSize: '16px',
        color: '#fff7d2',
        backgroundColor: '#426b57',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(2000);
    this.scene.tweens.add({
      targets: text,
      y: text.y - 45,
      alpha: 0,
      duration: 1800,
      onComplete: () => text.destroy(),
    });
  }
  pose(d: Direction, f: number): void {
    paintPixelHero(this.body, state.hero, d, f);
  }
  sync(): void {
    const n = state.lakeRepairs.length;
    this.water
      .clear()
      .fillStyle([0x728c7b, 0x709b8c, 0x6da99c, 0x63b5af, 0x63c3bf][n])
      .fillRoundedRect(6 * 64, 2 * 64, 6 * 64, 7 * 64, 20);
    this.water.lineStyle(2, 0xcde7d9, 0.5);
    for (let i = 0; i < 8; i++)
      this.water.strokeEllipse(6 * 64 + 45 + (i % 3) * 95, 2 * 64 + 45 + i * 48, 56, 8);
    this.repairedPath.clear();
    if (state.lakeRepairs.includes('bottom'))
      for (let i = 0; i < 8; i++)
        this.repairedPath
          .fillStyle(i % 2 ? 0xb1ad94 : 0xc3bfa6)
          .fillRoundedRect(6 * 64 + i * 44, 9 * 64 + 13, 38, 34, 4);
    for (const d of lakeDevices) {
      const done = state.lakeRepairs.includes(d.id);
      this.markers.get(d.id)!.setText(done ? '✓' : '!');
      this.lamps.get(d.id)!.setFillStyle(done ? 0xffe499 : 0x837b65);
    }
  }
}
