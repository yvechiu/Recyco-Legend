import type { ValueCategory } from './types';
export interface Cell {
  x: number;
  y: number;
}
export type Direction = 'up' | 'down' | 'left' | 'right';
export const directions: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
// New compact top-down map for the walking prototype, not an original PDF map.
export const FOREST = {
  columns: 18,
  rows: 12,
  tile: 64,
  stepMs: 120,
  spawn: { x: 2, y: 9 },
  exit: { x: 2, y: 11 },
};
export const terrain = [
  '##################',
  '#................#',
  '#.......#........#',
  '#.......#~~~.....#',
  '#..###...~~~.....#',
  '#........~~~..#..#',
  '#.........o......#',
  '#...##...........#',
  '#...##.....##....#',
  '#................#',
  '#................#',
  '##.###############',
];
export const forestItems: Record<string, Cell> = {
  'paper-cup': { x: 3, y: 9 },
  pudding: { x: 6, y: 9 },
  bottle: { x: 14, y: 9 },
  yogurt: { x: 14, y: 6 },
  marker: { x: 6, y: 6 },
  toy: { x: 2, y: 5 },
  chips: { x: 15, y: 2 },
  pencil: { x: 7, y: 2 },
  mask: { x: 13, y: 4 },
};
export const forestBins: Record<ValueCategory, Cell> = {
  高: { x: 2, y: 2 },
  中: { x: 3, y: 2 },
  低: { x: 4, y: 2 },
};
export const forestSign: Cell = { x: 1, y: 8 };
export const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;
export const distance = (a: Cell, b: Cell): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export function walkable(p: Cell): boolean {
  return (
    terrain[p.y]?.[p.x] === '.' &&
    !Object.values(forestBins).some((b) => sameCell(b, p)) &&
    !sameCell(forestSign, p)
  );
}
