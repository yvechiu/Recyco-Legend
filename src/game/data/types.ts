export type SceneId =
  | 'Title'
  | 'Intro'
  | 'IslandMap'
  | 'Village'
  | 'Incinerator'
  | 'LakeGoddess'
  | 'ForestEntrance'
  | 'ForestCleanup'
  | 'BossBattle'
  | 'Ending';
export type ValueCategory = '高' | '中' | '低';
export type Disposal = 'recycle' | 'general';
export type QuizResult = { correct: boolean; message: string };
export interface SavedState {
  version: 1;
  name: string;
  hero: number;
  intro: boolean;
  visitedVillage: boolean;
  visitedIncinerator: boolean;
  q1: boolean;
  q2: boolean;
  unlocked: boolean;
  cleaned: boolean;
  collected: string[];
  sorted: string[];
  lives: number;
  ending: 'good' | 'bad' | null;
  wish: string;
  scene: SceneId;
}
