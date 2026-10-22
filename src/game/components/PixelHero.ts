import Phaser from 'phaser';
import type { Direction } from '../data/forestMap';
export function paintPixelHero(
  graphics: Phaser.GameObjects.Graphics,
  variant: number,
  direction: Direction,
  frame: number,
): void {
  const g = graphics;
  g.clear();
  g.fillStyle(0x254631, 0.25).fillEllipse(0, 22, 38, 13);
  const stride = frame === 0 ? 0 : frame % 2 ? 3 : -3;
  g.fillStyle(0x304537)
    .fillRect(-11, 12 + stride, 8, 10)
    .fillRect(4, 12 - stride, 8, 10);
  g.fillStyle([0xb8664d, 0x55977d, 0x536f9b, 0x9272a2][variant]).fillRect(-13, -4, 26, 23);
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
}
