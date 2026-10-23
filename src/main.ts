import Phaser from 'phaser';
import './styles/main.css';
import { Title } from './game/scenes/Title';
import { Intro } from './game/scenes/Intro';
import { IslandMap } from './game/scenes/IslandMap';
import { Village } from './game/scenes/Village';
import { Incinerator } from './game/scenes/Incinerator';
import { LakeRestoration } from './game/scenes/LakeRestoration';
import { LakeGoddess } from './game/scenes/LakeGoddess';
import { ForestEntrance } from './game/scenes/ForestEntrance';
import { ForestCleanup } from './game/scenes/ForestCleanup';
import { BossBattle } from './game/scenes/BossBattle';
import { Ending } from './game/scenes/Ending';
import { $, modal, sourceDialog } from './game/components/UI';
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'canvas-host',
  width: 1200,
  height: 440,
  backgroundColor: '#a2c2a6',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true },
  audio: { noAudio: true },
  fps: { target: 30 },
  scene: [
    Title,
    Intro,
    IslandMap,
    Village,
    Incinerator,
    LakeGoddess,
    LakeRestoration,
    ForestEntrance,
    ForestCleanup,
    BossBattle,
    Ending,
  ],
  input: { keyboard: true, touch: true },
});
$('#home').addEventListener('click', () => {
  for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
  game.scene.start('Title');
});
$('#help').addEventListener('click', () =>
  modal(
    '勇士操作手冊',
    '① 選擇名字與外觀，聽完國王的委託。\n② 點選地圖進瑞賽可村，用方向鍵／WASD 走近村民，按空白鍵交談。選擇回覆、聽完並記下三份手記，再到焚山走近四個設備、記下觀察，找工程師完成現場任務。\n③ 回答女神的排序題，再走進湖畔修復四座循環裝置，取得兩個入口線索。\n④ 森林用方向鍵／WASD 走動，空白鍵互動；手機可用螢幕方向鍵。走近九件垃圾撿拾，選背包物品後走到價值桶旁分類；點物品也能自動尋路。\n⑤ 魔王戰向左滑＝資源回收，向右滑＝一般垃圾；也能使用按鈕或鍵盤 ← →。\n\n所有按鈕都能用 Tab 選取、Enter 或空白鍵操作。沒有答題倒數，不用急！進度保存在這台裝置。',
  ),
);
$('#source-note').addEventListener('click', sourceDialog);
$<HTMLDialogElement>('#modal').addEventListener('close', () => {
  $('#modal').querySelector('form button')!.textContent = '知道了';
});
