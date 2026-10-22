import { test, expect, type Page } from '@playwright/test';
async function start(page: Page, name = '小樹') {
  await page.goto('/');
  await page.getByLabel('勇士的名字').fill(name);
  await page.getByRole('button', { name: '開始冒險 →', exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: '繼續故事 →', exact: true }).click();
  await page.getByRole('button', { name: '收下地圖，出發 →', exact: true }).click();
}
test('vertical slice: identity, story, map, village discovery, saved result', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  await expect(page.getByRole('heading', { name: '循環島', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '瑞賽可村', exact: true }).click();
  for (const name of ['⌂ 收集站的村民', '↻ 忙碌的回收員', '❧ 村落的耆老'])
    await page.getByRole('button', { name, exact: true }).click();
  await expect(page.getByRole('status')).toContainText('已完成村落探索');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('recyco-legend-v1')!).visitedVillage),
  ).toBe(true);
  await expect(page.getByRole('button', { name: '前往焚山 →' })).toBeVisible();
  expect(errors).toEqual([]);
});

import { wasteItems, bossItems, shuffledDeck } from '../src/game/data/wasteItems';
import { checkFlow, checkMatches } from '../src/game/data/quizQuestions';
import { BALANCE } from '../src/game/data/balance';
const storageKey = 'recyco-legend-v1';
const baseState = () => ({
  version: 1,
  name: '小樹',
  hero: 2,
  intro: true,
  visitedVillage: true,
  visitedIncinerator: true,
  q1: true,
  q2: true,
  unlocked: true,
  cleaned: true,
  collected: wasteItems.map((i) => i.id),
  sorted: wasteItems.map((i) => i.id),
  lives: 3,
  ending: null,
  wish: '',
  scene: 'BossBattle',
});
async function checkpoint(page: Page, overrides: Record<string, unknown> = {}) {
  const s = { ...baseState(), ...overrides };
  await page.addInitScript(
    ({ key, state }) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem('seeded', 'yes');
      }
    },
    { key: storageKey, state: s },
  );
  await page.goto('/');
  await page.getByRole('button', { name: '繼續冒險', exact: true }).click();
}
async function pickForestItem(page: Page, name: string, touch = false) {
  const b = page.getByRole('button', { name: `撿起${name}`, exact: true });
  if (touch) await b.tap();
  else await b.click();
  await expect(page.getByRole('button', { name: `選取${name}`, exact: true })).toBeVisible({
    timeout: 20000,
  });
}
async function sortForestItem(page: Page, id: string, value: string, touch = false) {
  const b = page.getByRole('button', { name: `${value}回收價值`, exact: true });
  if (touch) await b.tap();
  else await b.click();
  await expect
    .poll(
      () =>
        page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key)!).sorted.includes(id), {
          key: storageKey,
          id,
        }),
      { timeout: 20000 },
    )
    .toBe(true);
}
async function learning(page: Page) {
  await page.getByRole('button', { name: '瑞賽可村', exact: true }).click();
  for (const name of ['⌂ 收集站的村民', '↻ 忙碌的回收員', '❧ 村落的耆老'])
    await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: '前往焚山 →' }).click();
  for (const name of ['☼ 廢氣／燃燒熱能', '≈ 廢水', '◇ 底渣', '⋰ 飛灰'])
    await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: '前往克林湖 →' }).click();
}
async function bossWin(page: Page, keyboard = false) {
  const deck = shuffledDeck(BALANCE.deckSeed);
  for (let i = 0; i < 8; i++) {
    const current = deck[i];
    await expect(page.locator('.battle-card h3')).toHaveText(current.name);
    await expect(page.getByRole('button', { name: '← 資源回收', exact: true })).toBeEnabled();
    if (keyboard)
      await page.keyboard.press(current.disposal === 'recycle' ? 'ArrowLeft' : 'ArrowRight');
    else
      await page
        .getByRole('button', {
          name: current.disposal === 'recycle' ? '← 資源回收' : '一般垃圾 →',
          exact: true,
        })
        .click();
  }
  await expect(page.getByRole('heading', { name: '循環島的新一天', exact: true })).toBeVisible();
}
test('complete fresh playthrough, corrective feedback, nine items, boss victory and wish', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const failedAssets: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failedAssets.push(r.url());
  });
  await start(page);
  await learning(page);
  await page.getByRole('button', { name: '請女神看看答案', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('先收集');
  for (const name of ['收集', '分類與處理', '回收再利用'])
    await page.getByRole('button', { name, exact: true }).click();
  await page.getByLabel('轉為廢棄物的原因').selectOption('回收價值不足');
  await page.getByLabel('廢棄物的後續處理').selectOption('焚化或掩埋');
  await page.getByRole('button', { name: '請女神看看答案', exact: true }).click();
  await expect(page.getByText('✦ 第一個線索：五位數', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '挑戰第二道難題 →' }).click();
  await page.getByRole('button', { name: '確認配對', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('還有配對');
  for (const [label, v] of [
    ['廢氣／燃燒熱能', 'energy'],
    ['廢水', 'water'],
    ['底渣', 'road'],
    ['飛灰', 'landfill'],
  ])
    await page.getByLabel(`${label}的去向`, { exact: true }).selectOption(v);
  await page.getByRole('button', { name: '確認配對', exact: true }).click();
  await page.getByRole('button', { name: '前往森林入口 →' }).click();
  await page.getByLabel('五位數通關密碼').fill('12345');
  await page.getByRole('button', { name: '解開封印 →' }).click();
  await expect(page.getByRole('status')).toContainText('門沒有打開');
  await page.getByLabel('五位數通關密碼').fill('16080');
  await page.getByRole('button', { name: '解開封印 →' }).click();
  await page.getByRole('button', { name: '走進森林，開始清理 →' }).click();
  await page.getByRole('button', { name: '已了解，準備好了！' }).click();
  for (const item of wasteItems) await pickForestItem(page, item.name);
  for (const [i, item] of wasteItems.entries()) {
    await page.getByRole('button', { name: `選取${item.name}`, exact: true }).click();
    await sortForestItem(page, item.id, i === 0 ? '低' : item.value);
    if (i === 0) await expect(page.getByRole('status')).toContainText('扣一條生命');
  }
  await expect(page.getByRole('heading', { name: '你讓森林重新呼吸了。' })).toBeVisible();
  await page.getByRole('button', { name: '準備好了，挑戰廢棄怪 →' }).click();
  await bossWin(page, true);
  await page.getByLabel('告訴國王，你想實現什麼願望？').fill('希望大家都不亂丟垃圾');
  await page.getByRole('button', { name: '許下願望 ✦' }).click();
  await expect(page.locator('.reward')).toContainText('希望大家都不亂丟垃圾');
  expect(errors).toEqual([]);
  expect(failedAssets).toEqual([]);
  await page.screenshot({ path: '/tmp/recyco-good-ending.png', fullPage: true });
});

test('boss defeat, replay HP reset, and button victory', async ({ page }) => {
  test.setTimeout(90000);
  await checkpoint(page);
  const deck = shuffledDeck(BALANCE.deckSeed);
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.battle-card h3')).toHaveText(deck[i].name);
    await expect(page.getByRole('button', { name: '← 資源回收', exact: true })).toBeEnabled();
    await page
      .getByRole('button', {
        name: deck[i].disposal === 'general' ? '← 資源回收' : '一般垃圾 →',
        exact: true,
      })
      .click();
  }
  await expect(page.getByRole('heading', { name: '勇士的未竟之願', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '重新挑戰廢棄怪', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: '小樹 · 勇士生命' })).toHaveAttribute(
    'value',
    '5',
  );
  await bossWin(page);
});

test('forest loses three lives, retry preserves goddess quest, reload resumes backpack', async ({
  page,
}) => {
  test.setTimeout(180000);
  await checkpoint(page, { cleaned: false, collected: [], sorted: [], scene: 'ForestCleanup' });
  await page.getByRole('button', { name: '已了解，準備好了！' }).click();
  for (const item of wasteItems.slice(0, 3)) {
    await pickForestItem(page, item.name);
    await sortForestItem(page, item.id, '低');
  }
  await expect(page.getByRole('heading', { name: '森林還在等你，再試一次吧。' })).toBeVisible();
  await page.getByRole('button', { name: '重新清理森林', exact: true }).click();
  await page.getByRole('button', { name: '已了解，準備好了！' }).click();
  await pickForestItem(page, '寶特瓶');
  await page.reload();
  await page.getByRole('button', { name: '繼續冒險', exact: true }).click();
  await page.getByRole('button', { name: '已了解，準備好了！' }).click();
  await expect(page.getByRole('button', { name: '選取寶特瓶', exact: true })).toBeVisible();
  const s = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(s.q1 && s.q2 && s.unlocked).toBe(true);
  expect(s.lives).toBe(3);
  expect(s.sorted).toEqual([]);
});

test('locked map and learning prerequisites guide player without dead ends', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: '廢棄森林（尚未解鎖）', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('先解開');
  await page.getByRole('button', { name: '克林湖', exact: true }).click();
  await expect(page.getByRole('button', { name: '前往瑞賽可村 →' })).toBeVisible();
  await page.getByRole('button', { name: '② 焚化後的去向', exact: true }).click();
  await expect(page.getByRole('button', { name: '前往焚山 →' })).toBeVisible();
});

test('corrupt and obsolete saves recover; reset deletes progress', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), storageKey);
  await page.goto('/');
  await expect(page.getByText('舊版或損壞的進度已略過，可以安心開始新冒險。')).toBeVisible();
  await page.getByLabel('勇士的名字').fill('測試勇士');
  await page.getByRole('button', { name: '開始冒險 →' }).click();
  await page.getByRole('button', { name: '首頁', exact: true }).click();
  await page.getByRole('button', { name: '重設所有進度', exact: true }).click();
  await page.getByRole('button', { name: '確認清除', exact: true }).click();
  await expect(page.getByLabel('勇士的名字')).toHaveValue('');
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
});

test('unavailable storage still supports a session adventure', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', {
      value() {
        throw new Error('Blocked');
      },
    });
    Object.defineProperty(Storage.prototype, 'setItem', {
      value() {
        throw new Error('Blocked');
      },
    });
  });
  await start(page);
  await expect(page.getByRole('heading', { name: '循環島', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '首頁', exact: true }).click();
  await expect(page.locator('.save-note')).toContainText('無法儲存');
});

test('keyboard identity and map navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('勇士的名字').fill('鍵盤勇士');
  await page.getByLabel('紫月旅人').focus();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('紫月旅人')).toBeChecked();
  await page.getByRole('button', { name: '開始冒險 →', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '國王的委託', exact: true })).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: '繼續故事 →' }).focus();
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: '收下地圖，出發 →' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '瑞賽可村', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '瑞賽可村', exact: true })).toBeVisible();
});

test('historical dataset and deterministic deck preserve authored rules', () => {
  expect(wasteItems).toHaveLength(9);
  expect(bossItems).toHaveLength(15);
  expect(wasteItems.filter((i) => i.value === '高').map((i) => i.name)).toEqual([
    '紙飲料杯',
    '布丁杯',
    '寶特瓶',
  ]);
  expect(wasteItems.filter((i) => i.value === '中').map((i) => i.name)).toEqual([
    '養樂多',
    '彩色筆',
  ]);
  expect(bossItems.filter((i) => i.disposal === 'recycle').map((i) => i.name)).toEqual([
    '紙（飲料）杯',
    '布丁杯的塑膠杯',
    '寶特瓶',
    '養樂多的塑膠瓶',
    '彩色筆的筆桿',
  ]);
  expect(bossItems.every((i) => i.reviewRequired)).toBe(true);
  expect(new Set(shuffledDeck(16080).map((i) => i.id)).size).toBe(15);
  expect(shuffledDeck(16080)).toEqual(shuffledDeck(16080));
  expect(shuffledDeck(16081)).not.toEqual(shuffledDeck(16080));
  expect(
    checkFlow(['收集', '分類與處理', '回收再利用'], '回收價值不足', '焚化或掩埋').correct,
  ).toBe(true);
  expect(
    checkFlow(['分類與處理', '收集', '回收再利用'], '回收價值不足', '焚化或掩埋').correct,
  ).toBe(false);
  expect(
    checkMatches({ gas: 'energy', water: 'water', bottom: 'road', fly: 'landfill' }).correct,
  ).toBe(true);
  expect(
    checkMatches({ gas: 'water', water: 'energy', bottom: 'road', fly: 'landfill' }).correct,
  ).toBe(false);
});

test.describe('mobile touch', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
  test('touch exploration, narrow layout and pointer swipe in both directions', async ({
    page,
  }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await checkpoint(page);
    await expect(page.locator('.battle-card')).toBeVisible();
    const card = page.locator('.battle-card');
    let bossHP = 8,
      heroHP = 5;
    const deck = shuffledDeck(BALANCE.deckSeed);
    for (const [i, dx] of [-70, 70].entries()) {
      await expect(page.getByRole('button', { name: '← 資源回收', exact: true })).toBeEnabled();
      await card.scrollIntoViewIfNeeded();
      const box = (await card.boundingBox())!;
      const x = box.x + box.width / 2,
        y = box.y + box.height / 2;
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + dx, y: y + 1 }],
      });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
      const answer = dx < 0 ? 'recycle' : 'general';
      if (deck[i].disposal === answer) bossHP--;
      else heroHP--;
      await expect(page.getByRole('progressbar', { name: '廢棄怪生命' })).toHaveAttribute(
        'value',
        String(bossHP),
      );
      await expect(page.getByRole('progressbar', { name: '小樹 · 勇士生命' })).toHaveAttribute(
        'value',
        String(heroHP),
      );
      await expect(page.locator('.battle-card h3')).toHaveText(deck[i + 1].name);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: '/tmp/recyco-mobile-boss.png', fullPage: true });
    await page.getByRole('button', { name: '↗ 地圖', exact: true }).tap();
    await page.getByRole('button', { name: '瑞賽可村', exact: true }).tap();
    await page.getByRole('button', { name: '⌂ 收集站的村民', exact: true }).tap();
    await expect(page.getByText(/先把生活垃圾「收集」起來/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test('obsolete save schema is discarded rather than partially restoring', async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, JSON.stringify({ version: 0, name: '過期勇士' })),
    storageKey,
  );
  await page.goto('/');
  await expect(page.getByLabel('勇士的名字')).toHaveValue('');
  await expect(page.getByRole('button', { name: '繼續冒險', exact: true })).toHaveCount(0);
});

test('modal pauses arrow input and leaving mid-attack cancels the battle callback', async ({
  page,
}) => {
  await checkpoint(page);
  await page.getByRole('button', { name: '玩法說明 ?' }).click();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('progressbar', { name: '小樹 · 勇士生命' })).toHaveAttribute(
    'value',
    '5',
  );
  await expect(page.getByRole('progressbar', { name: '廢棄怪生命' })).toHaveAttribute('value', '8');
  await page.getByRole('button', { name: '知道了', exact: true }).click();
  await page.keyboard.press('ArrowLeft');
  await page.getByRole('button', { name: '↗ 地圖', exact: true }).click();
  await expect(page.getByRole('heading', { name: '循環島', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '挑戰廢棄怪 →', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: '小樹 · 勇士生命' })).toHaveAttribute(
    'value',
    '5',
  );
  await expect(page.getByRole('progressbar', { name: '廢棄怪生命' })).toHaveAttribute('value', '8');
});

test('mobile cleanup touch targets, backpack, sorting and original clue image', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  test.setTimeout(180000);
  await checkpoint(page, { cleaned: false, collected: [], sorted: [], scene: 'ForestCleanup' });
  await page.getByRole('button', { name: '已了解，準備好了！' }).tap();
  for (const item of wasteItems) {
    await pickForestItem(page, item.name, true);
    await sortForestItem(page, item.id, item.value, true);
  }
  await expect(page.getByRole('heading', { name: '你讓森林重新呼吸了。' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: '↗ 地圖', exact: true }).tap();
  const locations = page.locator('.map-node');
  const boxes = await locations.evaluateAll((nodes) =>
    nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i],
        b = boxes[j];
      expect(
        Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
          Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)),
      ).toBe(0);
    }
  await page.screenshot({ path: '/tmp/recyco-mobile-map.png', fullPage: true });
  await page.getByRole('button', { name: '查看已取得的線索' }).tap();
  await page.getByRole('button', { name: '展開原稿魔法地圖' }).tap();
  const image = page.getByRole('img', { name: '原稿魔法地圖：森林星號位於橫軸 160、縱軸 80。' });
  await expect(image).toBeVisible();
  expect(await image.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(
    true,
  );
  await context.close();
});

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
test('production assets and original art load from a static deployment subpath', async ({
  page,
}) => {
  const prefix = '/Recyco-Legend/';
  const root = resolve('dist');
  const mime: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };
  const server = createServer(async (req, res) => {
    const relative =
      decodeURIComponent((req.url || '').split('?')[0]).slice(prefix.length) || 'index.html';
    const file = resolve(root, relative);
    if (!(req.url || '').startsWith(prefix) || !file.startsWith(root + '/')) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  const failures: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failures.push(r.url());
  });
  try {
    await page.goto(
      `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}${prefix}`,
    );
    await expect(page.getByRole('heading', { name: '瑞賽可傳奇', exact: true })).toBeVisible();
    await page.getByLabel('紫月旅人').check();
    await page.screenshot({ path: '/tmp/recyco-title.png', fullPage: true });
    const background = await page
      .locator('.portrait.hero-3')
      .evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(background).toContain('/Recyco-Legend/assets/original/heroes.png');
    await page.getByLabel('勇士的名字').fill('子路徑勇士');
    await page.getByRole('button', { name: '開始冒險 →', exact: true }).click();
    await expect(page.getByRole('img', { name: '原企劃角色：國王溫' })).toBeVisible();
    expect(
      await page
        .getByRole('img', { name: '原企劃角色：國王溫' })
        .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
    ).toBe(true);
    expect(failures).toEqual([]);
  } finally {
    await new Promise<void>((done, reject) => server.close((err) => (err ? reject(err) : done())));
  }
});

import {
  FOREST,
  forestItems,
  forestBins,
  terrain,
  walkable,
  sameCell,
  type Cell,
} from '../src/game/data/forestMap';
import { findPath, adjacentCells } from '../src/game/systems/GridNavigation';
async function prepareWalking(page: Page) {
  await checkpoint(page, { cleaned: false, collected: [], sorted: [], scene: 'ForestCleanup' });
  await page.getByRole('button', { name: '已了解，準備好了！' }).click();
}
async function walkKeyboard(page: Page, from: Cell, to: Cell) {
  const path = findPath(from, [to]);
  expect(path).not.toBeNull();
  let current = from;
  for (const next of path!) {
    const key =
      next.x > current.x
        ? 'ArrowRight'
        : next.x < current.x
          ? 'ArrowLeft'
          : next.y > current.y
            ? 'ArrowDown'
            : 'ArrowUp';
    await page.keyboard.press(key);
    await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', `${next.x},${next.y}`);
    current = next;
  }
}
test('walking forest: arrow movement, nearby Space pickup, tree and water collision, exit', async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await prepareWalking(page);
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', '2,9');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', '3,9');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '選取紙飲料杯', exact: true })).toBeVisible();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', '3,8');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', '3,8');
  await expect(page.locator('#forest-prompt')).toContainText('障礙物');
  await walkKeyboard(page, { x: 3, y: 8 }, { x: 9, y: 2 });
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', '9,2');
  await expect(page.locator('#forest-prompt')).toContainText('障礙物');
  // At a bin, Space deposits only a selected item and uses the same life/progress rules.
  await walkKeyboard(page, { x: 9, y: 2 }, { x: 2, y: 3 });
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Space');
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('recyco-legend-v1')!).sorted.includes('paper-cup'),
      ),
    )
    .toBe(true);
  await page.screenshot({ path: '/tmp/recyco-walking-desktop.png', fullPage: true });
  await walkKeyboard(page, { x: 2, y: 3 }, { x: 2, y: 10 });
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('heading', { name: '循環島', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('forest navigation routes all nine items and bins without crossing blocked terrain', () => {
  expect(terrain).toHaveLength(FOREST.rows);
  expect(terrain.every((r) => r.length === FOREST.columns)).toBe(true);
  for (const target of [...Object.values(forestItems), ...Object.values(forestBins)]) {
    const path = findPath(FOREST.spawn, adjacentCells(target));
    expect(path).not.toBeNull();
    let current: Cell = FOREST.spawn;
    for (const step of path!) {
      expect(walkable(step)).toBe(true);
      expect(Math.abs(step.x - current.x) + Math.abs(step.y - current.y)).toBe(1);
      current = step;
    }
  }
  expect(walkable({ x: 4, y: 8 })).toBe(false);
  expect(walkable({ x: 9, y: 3 })).toBe(false);
  expect(walkable({ x: 10, y: 6 })).toBe(false);
  expect(walkable({ x: -1, y: 0 })).toBe(false);
  expect(findPath(FOREST.spawn, [{ x: 9, y: 3 }])).toBeNull();
  expect(sameCell(FOREST.spawn, FOREST.exit)).toBe(false);
});

test('walking forest: held direction releases, modal and blur stop input, scene re-entry cleans controls', async ({
  page,
}) => {
  await prepareWalking(page);
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.locator('#stage').getAttribute('data-player-cell')).not.toBe('2,9');
  await page.keyboard.up('ArrowRight');
  await expect(page.locator('#stage')).toHaveAttribute('data-moving', 'false');
  const stopped = await page.locator('#stage').getAttribute('data-player-cell');
  await page.waitForTimeout(350);
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', stopped!);
  await page.getByRole('button', { name: '玩法說明 ?' }).click();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', stopped!);
  await page.getByRole('button', { name: '知道了', exact: true }).click();
  await page.locator('#stage').focus();
  await page.keyboard.down('ArrowRight');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#stage')).toHaveAttribute('data-moving', 'false');
  const blurred = await page.locator('#stage').getAttribute('data-player-cell');
  await page.waitForTimeout(350);
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', blurred!);
  await page.keyboard.up('ArrowRight');
  await page.getByRole('button', { name: '↗ 地圖', exact: true }).click();
  await page.getByRole('button', { name: '廢棄森林', exact: true }).click();
  await page.getByRole('button', { name: '走進森林，開始清理 →' }).click();
  await page.getByRole('button', { name: '已了解，準備好了！' }).click();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', '3,9');
});

test('mobile walking: touch direction pad and interact, no drift after release', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await prepareWalking(page);
  await page.getByRole('button', { name: '向右移動', exact: true }).tap();
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', '3,9');
  await expect(page.locator('#stage')).toHaveAttribute('data-moving', 'false');
  await page.getByRole('button', { name: '互動 ␣', exact: true }).tap();
  await expect(page.getByRole('button', { name: '選取紙飲料杯', exact: true })).toBeVisible();
  await page.waitForTimeout(350);
  await expect(page.locator('#stage')).toHaveAttribute('data-player-cell', '3,9');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: '/tmp/recyco-walking-mobile.png', fullPage: true });
  await context.close();
});

test('walking replay preserves clues and canvas click walks to an item before pickup', async ({
  page,
}) => {
  await checkpoint(page, { scene: 'IslandMap', ending: 'good', wish: '守護森林' });
  await page.getByRole('button', { name: '重玩森林步行關', exact: true }).click();
  await page.getByRole('button', { name: '已了解，準備好了！' }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('recyco-legend-v1')!));
  expect(saved.q1 && saved.q2 && saved.unlocked).toBe(true);
  expect(saved.ending).toBeNull();
  expect(saved.collected).toEqual([]);
  expect(saved.wish).toBe('守護森林');
  const stage = page.locator('#stage');
  await stage.scrollIntoViewIfNeeded();
  const box = (await stage.boundingBox())!;
  // Initial camera is clamped to x=-48, y=376. Pudding is at world (416,608).
  await page.mouse.click(
    box.x + ((416 + 48) / 1200) * box.width,
    box.y + ((608 - 376) / 440) * box.height,
  );
  await expect(page.getByRole('button', { name: '選取布丁杯', exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(stage).toHaveAttribute('data-player-cell', '5,9');
});
