// Each line is labelled: verbatim quotations vs adapted/implementation copy.
export const intro = [
  {
    speaker: '循環島的故事',
    art: 'king',
    provenance: 'adapted',
    text: '瑞賽可族與布雷賽爾族曾為土地而戰。國王溫讓兩族和平共處，但被流放的鞍太找來巫師，召喚了由垃圾組成的廢棄怪。',
  },
  {
    speaker: '國王 · 溫',
    art: 'king',
    provenance: 'adapted-excerpt',
    text: '「勇士，瑞賽可王國的未來就靠你了！這位是智者——慧，他將協助你的討伐之旅。」',
  },
  {
    speaker: '智者 · 慧',
    art: 'sage',
    provenance: 'adapted',
    text: '要討伐廢棄怪，先找到森林入口。只有克林湖的女神知道位置！先到瑞賽可村和焚山收集知識，再去請教她。',
  },
  {
    speaker: '智者 · 慧',
    art: 'sage',
    provenance: 'implementation',
    text: '還有，別再把寶物丟進湖裡了！女神最討厭亂丟東西。用尊重和智慧來贏得她的信任吧。',
  },
] as const;
export const sourceNotice =
  '本遊戲沿用邱郁棻原企劃的歷史分類資料，並非現行臺灣通用回收指引。回收價值不等於能否回收；日常丟棄請查詢所在地清潔隊公告。所有分類項目仍待環境教育專家複核。';

// Adapted village teaching copy, grounded in the PDF; not verbatim dialogue.
export const villageFacts = [
  [
    '收集站的村民',
    '先把生活垃圾「收集」起來，再「分類與處理」。分類正確，資源才能「回收再利用」。',
  ],
  [
    '忙碌的回收員',
    '原企劃中，「回收價值不足」的物品會進入廢棄物處理，送往「焚化或掩埋」。價值低，不代表現實中就不能回收喔！',
  ],
  [
    '村落的耆老',
    '兩族現在一起守護循環島。讓用過的東西有機會再利用，也能減輕土地負擔。分類能提升處理效率，減量與重複使用也很重要。',
  ],
];
