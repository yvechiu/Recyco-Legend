import type { VillageNpcId } from './types';
import { villageFacts } from './dialogues';
import { sameCell, type Cell } from './forestMap';
export interface VillageNpc {
  id: VillageNpcId;
  name: string;
  role: string;
  location: string;
  cell: Cell;
  skin: string;
  clothes: string;
  hair: string;
  accessory: 'hat' | 'cap' | 'glasses';
  greeting: string;
  replies: { label: string; text: string }[];
  lesson: string[];
  journal: string;
  provenance: 'adapted';
}
// New named villagers, art and conversational wording. Teaching topics follow the PDF.
export const villageNpcs: VillageNpc[] = [
  {
    id: 'collector',
    name: '阿禾',
    role: '收集站的村民',
    location: '收集站前',
    cell: { x: 4, y: 6 },
    skin: '#e7be92',
    clothes: '#6b9568',
    hair: '#5d4938',
    accessory: 'hat',
    greeting:
      '嘿，你就是國王找來的勇士吧？我正忙著整理大家送來的垃圾。別急著去打怪，先來看看這些東西接下來要去哪裡！',
    replies: [
      {
        label: '這些垃圾接下來會去哪裡？',
        text: '問得好！把垃圾放進收集站，只是旅程的開始。跟著我把順序想一遍吧。',
      },
      {
        label: '全部裝進同一袋不就好了？',
        text: '那可會讓回收員很傷腦筋！不同物品要用不同方法處理，我們得先分清楚。',
      },
    ],
    lesson: [
      '第一步是「收集」：把生活垃圾集中到適當的地方，別讓它們散落在路邊和湖裡。',
      '接著要「分類與處理」，確認材質、分開處理。可以回收的資源，才有機會「回收再利用」。',
      '記住這條路：收集 → 分類與處理 → 回收再利用。等你見到女神，這段旅程一定幫得上忙。',
    ],
    journal: villageFacts[0][1],
    provenance: 'adapted',
  },
  {
    id: 'recycler',
    name: '阿青',
    role: '忙碌的回收員',
    location: '回收工坊旁',
    cell: { x: 13, y: 5 },
    skin: '#bd8b69',
    clothes: '#558998',
    hair: '#3e4140',
    accessory: 'cap',
    greeting: '呼，這個包裝又有好幾種材質！勇士，你看，一件物品也可能讓回收變得很費工夫。',
    replies: [
      {
        label: '為什麼有些東西比較難回收？',
        text: '因為材質可能混在一起，分離和處理都需要人力與成本。這就是我們談「回收價值」時會考慮的事。',
      },
      {
        label: '回收價值低就一定不能回收嗎？',
        text: '不能這樣畫上等號！價值和所在地的回收規則是不同的事，這點一定要記住。',
      },
    ],
    lesson: [
      '我們把「回收價值不足」的物品轉入廢棄物處理，再送往「焚化或掩埋」。這是女神會問到的另一條支線。',
      '不過，遊戲中的回收價值，不等於現在生活中的回收規則。實際怎麼丟，要查所在地清潔隊的公告。',
      '你在分類前多看一眼、想一想材質，就能減少後面處理的困難。少用一次性用品、重複使用，也能幫上忙。',
    ],
    journal: villageFacts[1][1],
    provenance: 'adapted',
  },
  {
    id: 'elder',
    name: '榕伯',
    role: '村落的耆老',
    location: '老樹廣場',
    cell: { x: 11, y: 9 },
    skin: '#dbba94',
    clothes: '#9b8260',
    hair: '#e2e0cb',
    accessory: 'glasses',
    greeting:
      '孩子，走累了嗎？來老樹下歇歇腳吧。我年輕的時候，瑞賽可族和布雷賽爾族還不像現在這樣一起生活呢。',
    replies: [
      {
        label: '兩族後來怎麼一起生活的？',
        text: '國王溫讓兩族人民享有同等權益，大家才慢慢把這座島當成共同的家。',
      },
      {
        label: '為什麼大家這麼在意分類？',
        text: '因為土地是大家一起住的地方。多一點照顧，下一代才有乾淨的家可以生活。',
      },
    ],
    lesson: [
      '用過的東西，如果妥善分類，就可能再被利用。不同的垃圾有合適的處理方式，分清楚也能提升處理效率。',
      '但守護島嶼，不只是在丟垃圾時選對桶。減少不必要的使用、把還能用的東西留久一點，也很重要。',
      '把這些重點記在手記裡，再到焚山看看焚化後留下什麼。帶著知識去拜訪女神，她會看見你的用心。',
    ],
    journal: villageFacts[2][1],
    provenance: 'adapted',
  },
];
export const VILLAGE = {
  columns: 18,
  rows: 12,
  tile: 64,
  stepMs: 120,
  spawn: { x: 4, y: 9 },
  exit: { x: 4, y: 11 },
};
export const villageTerrain = [
  '##################',
  '#................#',
  '#..HHH......HHH..#',
  '#..HHH......HHH..#',
  '#................#',
  '#..o.o..~~.......#',
  '#.......~~.......#',
  '#................#',
  '#.........o.#....#',
  '#................#',
  '#................#',
  '####.#############',
];
export function villageWalkable(p: Cell): boolean {
  return villageTerrain[p.y]?.[p.x] === '.' && !villageNpcs.some((n) => sameCell(n.cell, p));
}
