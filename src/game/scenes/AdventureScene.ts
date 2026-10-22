import Phaser from 'phaser';
import { state, persist } from '../systems/SaveSystem';
import type { SceneId } from '../data/types';
import { clearUI, $, el } from '../components/UI';
export class AdventureScene extends Phaser.Scene {
  protected hero?: Phaser.GameObjects.Container;
  protected reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  go(scene: SceneId): void {
    state.scene = scene;
    if (state.name) persist();
    this.scene.start(scene);
  }
  setup(
    title: string,
    chapter: string,
    theme: 'island' | 'forest' | 'lake' | 'village' | 'palace' | 'fire' | 'dark' = 'forest',
    map = true,
  ): void {
    clearUI(title, chapter, map ? () => this.go('IslandMap') : undefined);
    this.paint(theme);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
      this.hero = undefined;
    });
    const heading = document.querySelector<HTMLHeadingElement>('#hud h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  protected tag(text: string): void {
    $('#stage-ui').append(el('div', 'stage-tag', text));
  }
  protected paint(theme: string): void {
    const g = this.add.graphics();
    const dark = theme === 'dark';
    if (theme === 'island') {
      g.fillStyle(0x78b9b4).fillRect(0, 0, 1200, 440);
      g.lineStyle(1, 0xecf8e7, 0.18);
      for (let y = 30; y < 440; y += 44)
        for (let x = 20; x < 1200; x += 120) g.strokeEllipse(x + (y % 3) * 10, y, 48, 7);
      const points = [
        new Phaser.Math.Vector2(335, 85),
        new Phaser.Math.Vector2(530, 25),
        new Phaser.Math.Vector2(720, 45),
        new Phaser.Math.Vector2(830, 125),
        new Phaser.Math.Vector2(795, 215),
        new Phaser.Math.Vector2(910, 330),
        new Phaser.Math.Vector2(740, 399),
        new Phaser.Math.Vector2(580, 365),
        new Phaser.Math.Vector2(410, 414),
        new Phaser.Math.Vector2(267, 330),
        new Phaser.Math.Vector2(300, 220),
        new Phaser.Math.Vector2(242, 162),
      ];
      const smooth = new Phaser.Curves.Spline([...points, points[0]]).getPoints(90);
      g.fillStyle(0x276c66, 0.3).fillPoints(smooth, true);
      g.lineStyle(25, 0xe6d6a1).strokePoints(smooth, true);
      g.fillStyle(0x91ad63).fillPoints(smooth, true);
      g.lineStyle(3, 0x557f50).strokePoints(smooth, true);
      g.lineStyle(13, 0xd8ce94, 0.8);
      g.beginPath();
      g.moveTo(530, 95);
      g.lineTo(470, 240);
      g.lineTo(380, 300);
      g.moveTo(470, 240);
      g.lineTo(750, 310);
      g.moveTo(530, 140);
      g.lineTo(745, 150);
      g.strokePath();
      g.fillStyle(0x83c8c4).fillEllipse(775, 290, 130, 74);
      g.lineStyle(4, 0xdad699).strokeEllipse(775, 290, 130, 74);
      for (let i = 0; i < 22; i++)
        this.tree(g, 650 + (i % 6) * 24, 85 + Math.floor(i / 6) * 36, 0.6, 0x385f45);
      this.castle(g, 510, 90);
      this.house(g, 475, 220);
      this.house(g, 430, 250);
      this.mountain(g, 350, 300);
      const compass = this.add.text(1100, 330, 'N\n✧', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#245953',
        align: 'center',
      });
      compass.setOrigin(0.5);
    } else {
      g.fillGradientStyle(
        dark ? 0x243c42 : 0xc5ded1,
        dark ? 0x243c42 : 0xdbe8ca,
        dark ? 0x42605a : 0x8eb8a0,
        dark ? 0x42605a : 0xa8c5a6,
      ).fillRect(0, 0, 1200, 440);
      g.fillStyle(dark ? 0x5c7360 : 0xf5e7a4, 0.8).fillCircle(935, 95, 48);
      for (let i = 0; i < 5; i++) {
        g.fillStyle(dark ? 0x2c514b : 0x729d83, 0.35 + i * 0.08);
        g.fillEllipse(100 + i * 290, 315 + (i % 2) * 20, 650, 260);
      }
      g.fillStyle(dark ? 0x486a56 : 0x92b080).fillEllipse(600, 535, 1500, 370);
      g.fillStyle(dark ? 0x829174 : 0xd6d0a2).fillTriangle(550, 285, 345, 440, 890, 440);
      if (theme === 'lake') {
        g.fillStyle(0x5baca7).fillEllipse(690, 360, 1010, 185);
        g.lineStyle(2, 0xc9e8d2, 0.6);
        for (let i = 0; i < 8; i++)
          g.strokeEllipse(590 + i * 28, 350 + i * 9, 80 + i * 55, 9 + i * 5);
      }
      if (theme === 'palace') this.castle(g, 600, 270, 3.2);
      if (theme === 'village') {
        this.house(g, 370, 290, 2);
        this.house(g, 850, 290, 1.8);
        this.house(g, 630, 225, 1.3);
      }
      if (theme === 'fire') {
        this.mountain(g, 750, 320, 2.5);
        this.house(g, 390, 320, 1.4);
        g.fillStyle(0x779485).fillRoundedRect(420, 190, 22, 100, 3);
      }
      for (let i = 0; i < 17; i++) {
        if (theme === 'palace' && i > 4 && i < 12) continue;
        const x = i * 83 - 50;
        const y = 285 + (i % 3) * 24;
        const scale = 0.9 + ((i * 7) % 5) * 0.12;
        if (theme === 'forest' || dark || i < 3 || i > 12)
          this.tree(g, x, y, scale, dark ? 0x214c40 : 0x366e51);
      }
      for (let i = 0; i < 45; i++) {
        const x = (i * 167 + 93) % 1200,
          y = 335 + ((i * 59) % 100);
        g.fillStyle(i % 4 === 0 ? 0xe9cf86 : 0x648d62, 0.8).fillCircle(x, y, (i % 3) + 1);
      }
    }
    if (!this.reduced)
      for (let i = 0; i < 12; i++) {
        const p = this.add.circle(
          (i * 157 + 67) % 1200,
          70 + ((i * 53) % 300),
          2,
          i % 2 ? 0xffe5a0 : 0xe7f2ce,
          0.55,
        );
        this.tweens.add({
          targets: p,
          y: p.y - 25,
          x: p.x + 14,
          alpha: 0.15,
          duration: 2300 + i * 190,
          yoyo: true,
          repeat: -1,
        });
      }
    g.lineStyle(1, 0x194939, 0.15).strokeRect(0, 0, 1200, 440);
  }
  protected tree(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    s = 1,
    color = 0x366e51,
  ): void {
    g.fillStyle(0x6d7051).fillRoundedRect(x - 6 * s, y - 40 * s, 12 * s, 80 * s, 4);
    g.fillStyle(color).fillTriangle(x, y - 155 * s, x - 55 * s, y - 30 * s, x + 55 * s, y - 30 * s);
    g.fillStyle(color).fillTriangle(x, y - 115 * s, x - 66 * s, y + 8 * s, x + 66 * s, y + 8 * s);
    g.fillStyle(0xb8ce80, 0.18).fillTriangle(
      x,
      y - 155 * s,
      x - 55 * s,
      y - 30 * s,
      x - 4 * s,
      y - 30 * s,
    );
  }
  private house(g: Phaser.GameObjects.Graphics, x: number, y: number, s = 1): void {
    g.fillStyle(0xf4deb0).fillRoundedRect(x - 32 * s, y - 32 * s, 64 * s, 60 * s, 5);
    g.fillStyle(0xa46249).fillTriangle(
      x,
      y - 76 * s,
      x - 47 * s,
      y - 26 * s,
      x + 47 * s,
      y - 26 * s,
    );
    g.fillStyle(0x557368).fillRoundedRect(x - 9 * s, y, 18 * s, 29 * s, 4);
    g.fillStyle(0xf3bf68).fillRect(x + 15 * s, y - 14 * s, 10 * s, 12 * s);
  }
  private castle(g: Phaser.GameObjects.Graphics, x: number, y: number, s = 1): void {
    g.fillStyle(0xe8dfbb).fillRoundedRect(x - 38 * s, y - 45 * s, 76 * s, 80 * s, 5);
    g.fillStyle(0xdfd1ab)
      .fillRect(x - 60 * s, y - 65 * s, 26 * s, 100 * s)
      .fillRect(x + 34 * s, y - 65 * s, 26 * s, 100 * s);
    g.fillStyle(0x477d70)
      .fillTriangle(x - 47 * s, y - 103 * s, x - 68 * s, y - 62 * s, x - 26 * s, y - 62 * s)
      .fillTriangle(x + 47 * s, y - 103 * s, x + 26 * s, y - 62 * s, x + 68 * s, y - 62 * s);
    g.fillStyle(0x628b72).fillRoundedRect(x - 14 * s, y + 2 * s, 28 * s, 33 * s, 12);
    g.fillStyle(0xe4ba67).fillTriangle(x, y - 85 * s, x, y - 56 * s, x + 25 * s, y - 72 * s);
  }
  private mountain(g: Phaser.GameObjects.Graphics, x: number, y: number, s = 1): void {
    g.fillStyle(0x7d8067).fillTriangle(
      x,
      y - 96 * s,
      x - 67 * s,
      y + 30 * s,
      x + 67 * s,
      y + 30 * s,
    );
    g.fillStyle(0xbd946b).fillTriangle(
      x,
      y - 96 * s,
      x - 22 * s,
      y - 53 * s,
      x + 24 * s,
      y - 53 * s,
    );
    g.fillStyle(0xd9d6b6, 0.7).fillEllipse(x + 8 * s, y - 115 * s, 48 * s, 22 * s);
  }
  protected spawnHero(x = 140, y = 360): void {
    const g = this.add.graphics();
    g.fillStyle(0x163f36).fillTriangle(0, -34, -19, 12, 19, 12);
    g.fillStyle([0xb8664d, 0x55977d, 0x536f9b, 0x9272a2][state.hero]).fillRoundedRect(
      -11,
      -21,
      22,
      25,
      7,
    );
    g.fillStyle(0xf2cd9b).fillCircle(0, -30, 11);
    g.fillStyle(0x314c3c).fillEllipse(0, 14, 43, 10);
    this.hero = this.add.container(x, y, [g]);
  }
  protected walkTo(x: number, y: number): void {
    if (this.hero)
      this.tweens.add({
        targets: this.hero,
        x,
        y,
        duration: this.reduced ? 0 : 400,
        ease: 'Sine.easeOut',
      });
  }
  burst(x: number, y: number, good = true): void {
    for (let i = 0; i < 10; i++) {
      const p = this.add.circle(x, y, 3 + (i % 3), good ? 0xffdc88 : 0xc17462);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(i * 0.65) * 65,
        y: y + Math.sin(i * 0.65) * 50,
        alpha: 0,
        scale: 0.1,
        duration: this.reduced ? 50 : 650,
        onComplete: () => p.destroy(),
      });
    }
  }
}
