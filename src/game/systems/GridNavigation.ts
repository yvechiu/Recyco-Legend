import { directions, sameCell, walkable, type Cell } from '../data/forestMap';
// Breadth-first paths never cut diagonally through water, trunks, bins or rocks.
// Returns steps excluding the starting cell, null when no route exists.
export function findPath(
  start: Cell,
  goals: Cell[],
  canWalk: (p: Cell) => boolean = walkable,
): Cell[] | null {
  if (goals.some((g) => sameCell(g, start))) return [];
  const key = (p: Cell) => `${p.x},${p.y}`;
  const queue = [start],
    previous = new Map<string, Cell | null>([[key(start), null]]);
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const delta of Object.values(directions)) {
      const next = { x: current.x + delta.x, y: current.y + delta.y };
      if (!canWalk(next) || previous.has(key(next))) continue;
      previous.set(key(next), current);
      if (goals.some((g) => sameCell(g, next))) {
        const path: Cell[] = [];
        let node: Cell | null = next;
        while (node && !sameCell(node, start)) {
          path.unshift(node);
          node = previous.get(key(node)) ?? null;
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}
export function adjacentCells(target: Cell, canWalk: (p: Cell) => boolean = walkable): Cell[] {
  return Object.values(directions)
    .map((d) => ({ x: target.x + d.x, y: target.y + d.y }))
    .filter(canWalk);
}
