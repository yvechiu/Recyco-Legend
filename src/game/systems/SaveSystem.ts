import type { SavedState, SceneId } from '../data/types';
import { BALANCE } from '../data/balance';
import { wasteItems } from '../data/wasteItems';
import { outputPairs } from '../data/quizQuestions';
import { villageNpcs } from '../data/village';
export const SAVE_KEY = 'recyco-legend-v1';
export const freshState = (): SavedState => ({
  version: 1,
  name: '',
  hero: 0,
  intro: false,
  visitedVillage: false,
  villageTalks: [],
  visitedIncinerator: false,
  incineratorNotes: [],
  q1: false,
  q2: false,
  unlocked: false,
  cleaned: false,
  collected: [],
  sorted: [],
  lives: BALANCE.forestLives,
  ending: null,
  wish: '',
  scene: 'Title',
});
const scenes: SceneId[] = [
  'Title',
  'Intro',
  'IslandMap',
  'Village',
  'Incinerator',
  'LakeGoddess',
  'ForestEntrance',
  'ForestCleanup',
  'BossBattle',
  'Ending',
];
export let saveStatus = '冒險進度會自動儲存在這台裝置';
export function parseSave(raw: string | null): SavedState {
  if (!raw) return freshState();
  try {
    const s = JSON.parse(raw) as SavedState;
    const ids = wasteItems.map((i) => i.id);
    const validList = (a: unknown): a is string[] =>
      Array.isArray(a) &&
      a.every((i) => typeof i === 'string' && ids.includes(i)) &&
      new Set(a).size === a.length;
    if (
      !s ||
      s.version !== 1 ||
      typeof s.name !== 'string' ||
      !s.name.trim() ||
      [...s.name].length > 12 ||
      !Number.isInteger(s.hero) ||
      s.hero < 0 ||
      s.hero > 3 ||
      !scenes.includes(s.scene) ||
      !validList(s.collected) ||
      !validList(s.sorted) ||
      !s.sorted.every((i) => s.collected.includes(i)) ||
      !Number.isInteger(s.lives) ||
      s.lives < 0 ||
      s.lives > BALANCE.forestLives ||
      typeof s.wish !== 'string' ||
      [...s.wish].length > 80 ||
      ![null, 'good', 'bad'].includes(s.ending)
    )
      throw Error('Invalid save');
    for (const k of [
      'intro',
      'visitedVillage',
      'visitedIncinerator',
      'q1',
      'q2',
      'unlocked',
      'cleaned',
    ] as const)
      if (typeof s[k] !== 'boolean') throw Error('Invalid flag');
    if (
      (s.q1 && !s.visitedVillage) ||
      (s.q2 && !s.visitedIncinerator) ||
      (s.unlocked && !(s.q1 && s.q2)) ||
      (s.cleaned && (!s.unlocked || s.sorted.length !== 9)) ||
      (s.ending && !s.cleaned)
    )
      throw Error('Invalid progression');
    // Version-1 saves predate per-NPC journals; preserve already-earned village credit.
    const npcIds = villageNpcs.map((n) => n.id);
    const talks =
      s.villageTalks === undefined ? (s.visitedVillage ? [...npcIds] : []) : s.villageTalks;
    if (
      !Array.isArray(talks) ||
      !talks.every((id) => npcIds.includes(id)) ||
      new Set(talks).size !== talks.length ||
      s.visitedVillage !== (talks.length === npcIds.length)
    )
      throw Error('Invalid village progress');
    const outputIds = outputPairs.map((p) => p.id);
    const notes =
      s.incineratorNotes === undefined
        ? s.visitedIncinerator
          ? [...outputIds]
          : []
        : s.incineratorNotes;
    if (
      !Array.isArray(notes) ||
      !notes.every((id) => outputIds.includes(id)) ||
      new Set(notes).size !== notes.length ||
      (s.visitedIncinerator && notes.length !== 4)
    )
      throw Error('Invalid observation notes');
    return { ...freshState(), ...s, villageTalks: talks, incineratorNotes: notes };
  } catch {
    saveStatus = '舊版或損壞的進度已略過，可以安心開始新冒險。';
    return freshState();
  }
}
export function load(): SavedState {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY));
  } catch {
    saveStatus = '無法使用本機儲存；這次冒險仍可遊玩。';
    return freshState();
  }
}
export const state = load();
export function persist(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    saveStatus = '無法儲存進度，請勿關閉此頁直到冒險結束。';
  }
}
export function reset(): void {
  Object.assign(state, freshState());
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* session-only remains playable */
  }
}
export function resetForest(): void {
  state.collected = [];
  state.sorted = [];
  state.lives = BALANCE.forestLives;
  state.cleaned = false;
  state.ending = null;
  persist();
}
export function objective(): string {
  if (!state.intro) return '接受國王的委託，成為循環島的勇士';
  if (!state.visitedVillage) return '前往瑞賽可村，向村民學習垃圾處理流程';
  if (!state.visitedIncinerator) return '前往焚山，了解焚化後的四種產物';
  if (!state.q1 || !state.q2) return '前往克林湖，解開女神的兩道難題';
  if (!state.unlocked) return '拼湊兩個線索，解開廢棄森林入口';
  if (!state.cleaned) return '撿起九件垃圾，依原企劃的回收價值分類';
  if (state.ending === 'good') return '循環島恢復美麗了！把分類的心意帶回生活';
  return '挑戰廢棄怪！用細分類守護循環島';
}
