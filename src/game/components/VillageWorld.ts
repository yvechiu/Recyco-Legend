import Phaser from 'phaser';
import { VILLAGE, villageTerrain, villageNpcs } from '../data/village';
import { state } from '../systems/SaveSystem';
import { paintPixelHero } from './PixelHero';
import type { VillageNpcId } from '../data/types';
import type { Direction } from '../data/forestMap';
export class VillageWorld {
  readonly hero: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Graphics;
  private markers = new Map<VillageNpcId, Phaser.GameObjects.Text>();
  constructor(scene: Phaser.Scene, onNpc: (id: VillageNpcId) => void) {
    const t = VILLAGE.tile,
      g = scene.add.graphics().setDepth(-10);
    g.fillStyle(0x426647).fillRect(-1500, -1000, 4200, 2800);
    villageTerrain.forEach((row, y) =>
      [...row].forEach((kind, x) => {
        const px = x * t,
          py = y * t,
          path = kind === '.' && (x === 4 || y === 7 || y === 9 || x === 13 || y === 4);
        g.fillStyle(
          kind === '~' ? 0x86bdb3 : path ? 0xe1d4aa : (x + y) % 2 ? 0xa5be80 : 0xadc58b,
        ).fillRect(px, py, t, t);
        if (kind === '#') {
          const tree = scene.add
            .graphics()
            .setPosition(px + 32, py + 43)
            .setDepth(py + 64);
          tree.fillStyle(0x365d3d, 0.15).fillEllipse(0, 18, 63, 21);
          tree.fillStyle(0x8a7852).fillRect(-7, -10, 14, 35);
          tree
            .fillStyle(0x4a7a48)
            .fillRoundedRect(-29, -43, 58, 52, 9)
            .fillRoundedRect(-22, -59, 44, 40, 10);
          tree.fillStyle(0x719554).fillRoundedRect(-23, -51, 41, 24, 7);
        } else if (kind === '~') {
          g.lineStyle(2, 0xc8e0c0, 0.7)
            .lineBetween(px + 10, py + 27, px + 40, py + 27)
            .lineBetween(px + 25, py + 48, px + 52, py + 48);
        } else if (kind === 'o') {
          const prop = scene.add
            .graphics()
            .setPosition(px + 32, py + 32)
            .setDepth(py + 60);
          prop.fillStyle(y === 8 ? 0x987a51 : 0x719779).fillRoundedRect(-22, -16, 44, 38, 5);
          prop.lineStyle(3, 0x5f7855).lineBetween(-18, -6, 18, -6);
        } else if (kind !== 'H') {
          for (let i = 0; i < 3; i++)
            g.fillStyle(path ? 0xc7bd92 : 0x8bad6c).fillRect(
              px + 8 + ((x * 13 + i * 17) % 47),
              py + 8 + ((y * 11 + i * 13) % 47),
              3,
              3,
            );
          if (!path && (x + y * 3) % 7 === 0) {
            g.fillStyle(0xf4e0a0).fillCircle(px + 24, py + 28, 3);
            g.fillStyle(0xdb9b7f).fillCircle(px + 43, py + 40, 3);
          }
        }
      }),
    );
    [
      { x: 3, name: '收集站', roof: 0xb9785b },
      { x: 12, name: '回收工坊', roof: 0x618d85 },
    ].forEach((h) => {
      const x = h.x * t,
        y = 2 * t,
        house = scene.add
          .graphics()
          .setPosition(x, y)
          .setDepth(4 * t);
      house.fillStyle(0xc2af82, 0.3).fillRoundedRect(-8, 70, 210, 62, 5);
      house.fillStyle(0xf0dfb5).fillRect(0, 0, 192, 120);
      house.fillStyle(h.roof).fillTriangle(-14, 20, 96, -46, 206, 20);
      house.fillStyle(0xe9cf95).fillRoundedRect(75, 64, 42, 56, 4);
      house.fillStyle(0x5c8072).fillRect(20, 48, 35, 31).fillRect(137, 48, 35, 31);
      house.lineStyle(3, 0xd7c493).lineBetween(37, 48, 37, 79).lineBetween(154, 48, 154, 79);
      scene.add
        .text(x + 96, y + 36, h.name, {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#5a6848',
          backgroundColor: '#fff0cc',
        })
        .setOrigin(0.5)
        .setDepth(4 * t + 2);
    });
    villageNpcs.forEach((n) => {
      const x = (n.cell.x + 0.5) * t,
        y = (n.cell.y + 0.5) * t;
      scene.add.ellipse(x, y + 23, 44, 15, 0x3e613c, 0.2).setDepth(y - 1);
      scene.add
        .image(x, y + 24, `npc-${n.id}`)
        .setDisplaySize(48, 60)
        .setOrigin(0.5, 1)
        .setDepth(y + 30)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => onNpc(n.id));
      scene.add
        .text(x, y + 35, n.name, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#35533a',
          backgroundColor: '#fff9e4',
        })
        .setOrigin(0.5)
        .setDepth(y + 40);
      const marker = scene.add
        .text(x, y - 49, '!', {
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
          fontSize: '20px',
          color: '#fff7d6',
          backgroundColor: '#a67d45',
          padding: { x: 6, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(y + 45);
      this.markers.set(n.id, marker);
    });
    const exit = VILLAGE.exit;
    scene.add
      .text((exit.x + 0.5) * t, (exit.y + 0.5) * t, '↓ 返回島嶼', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        color: '#f8efcf',
        backgroundColor: '#426647',
      })
      .setOrigin(0.5)
      .setDepth(10);
    const spawn = VILLAGE.spawn;
    this.body = scene.add.graphics();
    this.hero = scene.add.container((spawn.x + 0.5) * t, (spawn.y + 0.5) * t, [this.body]);
    this.pose('up', 0);
    this.syncProgress();
  }
  pose(direction: Direction, frame: number): void {
    paintPixelHero(this.body, state.hero, direction, frame);
    this.hero.setDepth(this.hero.y + 30);
  }
  syncProgress(): void {
    for (const [id, m] of this.markers) {
      const done = state.villageTalks.includes(id);
      m.setText(done ? '✓' : '!');
      m.setBackgroundColor(done ? '#567b4e' : '#a67d45');
    }
  }
}
