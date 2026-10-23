import type { QuizResult } from './types';
// Original PDF flowchart (pp. 9, 13); UI compresses it into ordering plus a branch.
export const flow = ['收集', '分類與處理', '回收再利用'];
export const flowChoices = ['回收再利用', '收集', '分類與處理'];
export const flowBranch = {
  reason: '回收價值不足',
  treatment: '焚化或掩埋',
  reasonOptions: [
    ['', '請選擇原因'],
    ['外觀不漂亮', '外觀不漂亮'],
    ['回收價值不足', '回收價值不足'],
    ['顏色太多', '顏色太多'],
  ],
  treatmentOptions: [
    ['', '請選擇去向'],
    ['丟進湖裡', '丟進湖裡'],
    ['焚化或掩埋', '焚化或掩埋'],
    ['直接消失', '直接消失'],
  ],
};
export function checkFlow(order: string[], branch: string, treatment: string): QuizResult {
  const correct =
    order.join('|') === flow.join('|') &&
    branch === flowBranch.reason &&
    treatment === flowBranch.treatment;
  return {
    correct,
    message: correct
      ? '答對了！先收集，再分類與處理，讓可回收的資源再利用。'
      : '再想想：先收集 → 分類與處理 → 回收再利用；回收價值不足的廢棄物，會送往焚化或掩埋。可以重排再試！',
  };
}
// Original pairs in PDF p. 13. The source abbreviates energy recovery as 廢氣→發電.
// Explicit science clarification: combustion HEAT generates power; flue gas requires cleaning.
export const outputPairs = [
  {
    id: 'gas',
    label: '廢氣／燃燒熱能',
    answer: 'energy',
    detail: '燃燒熱能發電；廢氣須淨化',
    note: '發電利用的是燃燒熱能；廢氣必須經過淨化，不能直接排放。',
  },
  {
    id: 'water',
    label: '廢水',
    answer: 'water',
    detail: '處理後供焚化廠再次利用',
    note: '廢水需要先經過適當處理，才能再利用。',
  },
  {
    id: 'bottom',
    label: '底渣',
    answer: 'road',
    detail: '處理合格後作道路或建材摻配料',
    note: '不是直接把底渣鋪到地上，必須先處理並符合規範。',
  },
  {
    id: 'fly',
    label: '飛灰',
    answer: 'landfill',
    detail: '處理後送去掩埋',
    note: '本關中，飛灰經處理後掩埋。',
  },
];
export const outputOptions = [outputPairs[2], outputPairs[0], outputPairs[3], outputPairs[1]];
export function checkMatches(matches: Record<string, string>): QuizResult {
  const correct = outputPairs.every((p) => matches[p.id] === p.answer);
  return {
    correct,
    message: correct
      ? '全部配對成功！熱能可回收，其餘產物也要妥善處理。'
      : '還有配對需要調整。熱能 → 發電；廢水 → 處理後再利用；底渣 → 合格建材；飛灰 → 處理後掩埋。',
  };
}
