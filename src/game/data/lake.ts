import { sameCell, type Cell } from './forestMap';
export const LAKE = {
  columns: 18,
  rows: 12,
  tile: 64,
  stepMs: 150,
  spawn: { x: 8, y: 10 },
  exit: { x: 8, y: 11 },
};
export const lakeDevices = [
  {
    id: 'gas',
    name: '熱能發電機',
    cell: { x: 4, y: 3 },
    color: 0xe6ba66,
    hint: '發電機需要燃燒釋放的熱能；廢氣應送往另一條淨化管線。',
    success: '熱能帶動發電機，湖邊的燈亮起來了！廢氣仍沿獨立管線送去淨化。',
  },
  {
    id: 'water',
    name: '水處理槽',
    cell: { x: 13, y: 3 },
    color: 0x83c6c6,
    hint: '先把需要淨化的水送進槽裡，處理後才能在廠內再利用。',
    success: '廢水經過處理，沿著回用管線流回設備。',
  },
  {
    id: 'bottom',
    name: '建材處理台',
    cell: { x: 4, y: 7 },
    color: 0xc8ab86,
    hint: '尋找留在爐底的產物；先經處理與檢驗合格，才能作為建材摻配料。',
    success: '底渣完成處理與合格檢查，變成道路或建材的摻配料。步道修好了！',
  },
  {
    id: 'fly',
    name: '飛灰處理站',
    cell: { x: 13, y: 7 },
    color: 0xb5b6c6,
    hint: '這裡收集隨廢氣帶出的細小灰粒，經處理後送去掩埋。',
    success: '飛灰送入密閉設備妥善處理，再送往掩埋場。',
  },
];
export const lakeMaterials = [
  { id: 'water', label: '廢水', symbol: '≈' },
  { id: 'fly', label: '飛灰', symbol: '⋰' },
  { id: 'gas', label: '燃燒熱能', symbol: '☼' },
  { id: 'flue', label: '未淨化的廢氣', symbol: '☁' },
  { id: 'bottom', label: '底渣', symbol: '◇' },
];
export function lakeWalkable(p: Cell): boolean {
  return (
    sameCell(p, LAKE.exit) ||
    (p.x >= 1 &&
      p.x <= 16 &&
      p.y >= 1 &&
      p.y <= 10 &&
      !(p.x >= 6 && p.x <= 11 && p.y >= 2 && p.y <= 8) &&
      !lakeDevices.some((d) => sameCell(d.cell, p)))
  );
}
