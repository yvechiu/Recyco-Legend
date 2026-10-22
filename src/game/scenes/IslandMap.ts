import { AdventureScene } from './AdventureScene';
import { $, el, button, titleBlock, actions, feedback } from '../components/UI';
import { state, objective } from '../systems/SaveSystem';
import type { SceneId } from '../data/types';
export class IslandMap extends AdventureScene {
  constructor() {
    super('IslandMap');
  }
  create(): void {
    this.setup('循環島', '冒險地圖 · 選擇一處探索', 'island', false);
    $('#stage').classList.add('map-stage');
    this.tag('點選地標，前往下一段冒險');
    const places: {
      name: string;
      sub: string;
      scene: SceneId;
      x: number;
      y: number;
      icon: string;
      locked?: boolean;
      done?: boolean;
    }[] = [
      {
        name: '王宮',
        sub: '國王溫與智者慧',
        scene: 'Intro',
        x: 44,
        y: 19,
        icon: '♜',
        done: state.intro,
      },
      {
        name: '瑞賽可村',
        sub: '垃圾的旅程',
        scene: 'Village',
        x: 39,
        y: 52,
        icon: '⌂',
        done: state.visitedVillage,
      },
      {
        name: '焚山',
        sub: '焚化之後呢？',
        scene: 'Incinerator',
        x: 26,
        y: 74,
        icon: '△',
        done: state.visitedIncinerator,
      },
      {
        name: '克林湖',
        sub: '湖中女神的難題',
        scene: 'LakeGoddess',
        x: 67,
        y: 75,
        icon: '≈',
        done: state.q1 && state.q2,
      },
      {
        name: '廢棄森林',
        sub: state.unlocked ? '尋找廢棄怪' : '需要女神的兩個線索',
        scene: 'ForestEntrance',
        x: 69,
        y: 27,
        icon: state.q1 && state.q2 ? '♠' : '⌑',
        locked: !(state.q1 && state.q2),
        done: state.cleaned,
      },
    ];
    places.forEach((p) => {
      const b = button(
        '',
        () => {
          if (p.locked) {
            feedback('森林入口被魔法封住了。先解開湖中女神的兩道難題，取得線索。');
            return;
          }
          this.go(p.scene);
        },
        `map-node ${p.locked ? 'locked' : ''}`,
      );
      b.style.left = `${p.x}%`;
      b.style.top = `${p.y}%`;
      b.setAttribute('aria-label', `${p.name}${p.locked ? '（尚未解鎖）' : ''}`);
      b.innerHTML = `<span class="location-icon">${p.icon}</span><strong>${p.name} ${p.done ? '✓' : ''}</strong><small>${p.sub}</small>`;
      $('#stage-ui').append(b);
    });
    const panel = $('#panel');
    panel.className = 'map-panel';
    panel.append(titleBlock('勇士手記', `你好，${state.name}。`, objective()));
    const steps = el('ol', 'quest-steps');
    [
      ['01', '探索村落', state.visitedVillage && state.visitedIncinerator],
      ['02', '女神的線索', state.q1 && state.q2],
      ['03', '還森林漂漂', state.cleaned],
      ['04', '守護循環島', state.ending === 'good'],
    ].forEach(([n, t, done]) => {
      const li = el('li', done ? 'complete' : '');
      li.append(el('span', '', done ? '✓' : String(n)), el('strong', '', String(t)));
      steps.append(li);
    });
    panel.append(steps);
    if (state.q1 || state.q2)
      panel.append(
        actions(button('查看已取得的線索', () => this.go('ForestEntrance'), 'secondary')),
      );
    if (state.cleaned) panel.append(actions(button('挑戰廢棄怪 →', () => this.go('BossBattle'))));
  }
}
