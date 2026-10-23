import type { Disposal, ValueCategory } from './types';
export interface WasteItem {
  id: string;
  name: string;
  value: ValueCategory;
  symbol: string;
  hint: string;
}
// SOURCE-DEFINED historical design data: original PDF pp. 21–22. Not current disposal advice.
// All mappings require future environmental expert review before use as local guidance.
export const wasteItems: WasteItem[] = [
  {
    id: 'paper-cup',
    name: '紙飲料杯',
    value: '高',
    symbol: 'cup',
    hint: '本關將它列為高回收價值；杯身與吸管、封膜的材質不同。',
  },
  {
    id: 'pudding',
    name: '布丁杯',
    value: '高',
    symbol: 'pudding',
    hint: '本關將塑膠杯列為高回收價值；杯子與封膜要分開思考。',
  },
  {
    id: 'bottle',
    name: '寶特瓶',
    value: '高',
    symbol: 'bottle',
    hint: '在循環島上，這種材質較單純的容器具有高回收價值。',
  },
  {
    id: 'yogurt',
    name: '養樂多',
    value: '中',
    symbol: 'yogurt',
    hint: '本關列為中回收價值；鋁製封膜和塑膠瓶是不同部件。',
  },
  {
    id: 'marker',
    name: '彩色筆',
    value: '中',
    symbol: 'marker',
    hint: '本關列為中回收價值；筆蓋、筆桿、筆芯可以再細分。',
  },
  {
    id: 'toy',
    name: '玩具',
    value: '低',
    symbol: 'toy',
    hint: '混合材質較難處理，本關將它列為低回收價值。',
  },
  {
    id: 'chips',
    name: '袋裝洋芋片',
    value: '低',
    symbol: 'chips',
    hint: '複合材質包裝難以分離，本關將它列為低回收價值。',
  },
  {
    id: 'pencil',
    name: '鉛筆',
    value: '低',
    symbol: 'pencil',
    hint: '木頭和筆芯混合，本關列為低回收價值。',
  },
  {
    id: 'mask',
    name: '口罩',
    value: '低',
    symbol: 'mask',
    hint: '多層材質加上使用後的污染，本關列為低回收價值。',
  },
];
export interface BossItem {
  id: string;
  name: string;
  disposal: Disposal;
  symbol: string;
  explanation: string;
  reviewRequired: true;
}
const component = (
  id: string,
  name: string,
  disposal: Disposal,
  symbol: string,
  explanation: string,
): BossItem => ({ id, name, disposal, symbol, explanation, reviewRequired: true });
export const bossItems: BossItem[] = [
  component('straw', '紙飲料杯的吸管', 'general', 'straw', '本關中，吸管屬於一般垃圾。'),
  component('cup-film', '紙飲料杯的封膜', 'general', 'film', '本關中，飲料杯的封膜屬於一般垃圾。'),
  component('cup-body', '紙（飲料）杯', 'recycle', 'cup', '本關中，紙杯杯身屬於資源回收。'),
  component('pudding-film', '布丁杯的封膜', 'general', 'film', '本關中，布丁杯封膜屬於一般垃圾。'),
  component(
    'pudding-body',
    '布丁杯的塑膠杯',
    'recycle',
    'pudding',
    '本關中，布丁杯的塑膠杯身屬於資源回收。',
  ),
  component('pet', '寶特瓶', 'recycle', 'bottle', '本關中，寶特瓶屬於資源回收。'),
  component(
    'yogurt-film',
    '養樂多的鋁製封膜',
    'general',
    'film',
    '本關中，養樂多的鋁製封膜屬於一般垃圾；日常丟棄請依所在地清潔隊公告。',
  ),
  component(
    'yogurt-body',
    '養樂多的塑膠瓶',
    'recycle',
    'yogurt',
    '本關中，養樂多塑膠瓶屬於資源回收。',
  ),
  component(
    'marker-cap',
    '彩色筆的筆蓋',
    'general',
    'cap',
    '本關中，彩色筆筆蓋屬於一般垃圾；日常丟棄請依所在地清潔隊公告。',
  ),
  component(
    'marker-body',
    '彩色筆的筆桿',
    'recycle',
    'marker',
    '本關中，彩色筆筆桿屬於資源回收；實際規則依材質與所在地而異。',
  ),
  component('marker-core', '彩色筆的筆芯', 'general', 'marker', '本關中，彩色筆筆芯屬於一般垃圾。'),
  component('toy', '玩具', 'general', 'toy', '本關中，這件混合材質玩具屬於一般垃圾。'),
  component('chips', '袋裝洋芋片', 'general', 'chips', '本關中，洋芋片包裝屬於一般垃圾。'),
  component('pencil', '鉛筆', 'general', 'pencil', '本關中，鉛筆屬於一般垃圾。'),
  component('mask', '口罩', 'general', 'mask', '本關中，口罩屬於一般垃圾。'),
];
export function shuffledDeck(seed: number): BossItem[] {
  const deck = [...bossItems];
  let n = seed >>> 0;
  for (let i = deck.length - 1; i > 0; i--) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    const j = n % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
