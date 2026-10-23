import { sameCell, type Cell } from './forestMap';
import { outputPairs } from './quizQuestions';
export const STATION = {
  columns: 18,
  rows: 12,
  tile: 64,
  stepMs: 160,
  spawn: { x: 8, y: 9 },
  exit: { x: 8, y: 11 },
};
// Equipment bays are separated from the connected visitor walkway by railings.
export const observationPoints = outputPairs.map((pair, i) => ({
  ...pair,
  cell: [
    { x: 4, y: 3 },
    { x: 13, y: 3 },
    { x: 4, y: 7 },
    { x: 13, y: 7 },
  ][i],
  symbol: ['☼', '≈', '◇', '⋰'][i],
  place: ['熱能與廢氣觀察窗', '水處理控制台', '底渣檢查台', '飛灰密閉處理區'][i],
}));
export const engineerCell = { x: 8, y: 5 };
export function stationWalkable(p: Cell): boolean {
  if (sameCell(p, STATION.exit)) return true;
  return (
    p.x >= 1 &&
    p.x <= 16 &&
    p.y >= 2 &&
    p.y <= 10 &&
    !sameCell(p, engineerCell) &&
    !observationPoints.some((n) => sameCell(n.cell, p)) &&
    !(p.y === 2 && (p.x < 7 || p.x > 10))
  );
}
