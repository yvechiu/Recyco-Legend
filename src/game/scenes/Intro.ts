import { AdventureScene } from './AdventureScene';
import { intro } from '../data/dialogues';
import { $, el, art, button, actions } from '../components/UI';
import { state, persist } from '../systems/SaveSystem';
export class Intro extends AdventureScene {
  private step = 0;
  constructor() {
    super('Intro');
  }
  create(): void {
    this.step = 0;
    this.setup('國王的委託', '序章 · 勇氣與智慧', 'palace', false);
    this.draw();
  }
  private draw(): void {
    const line = intro[this.step];
    $('#stage-ui').replaceChildren(art(line.art));
    const panel = $('#panel');
    panel.className = 'dialogue-panel';
    panel.replaceChildren(
      el('span', 'eyebrow', `${this.step + 1} / ${intro.length} · ${line.speaker}`),
      el('h2', '', this.step === 1 ? `${state.name}，循環島的未來就靠你了。` : line.speaker),
      el('p', 'dialogue', line.text),
    );
    panel.append(
      actions(
        button(this.step === intro.length - 1 ? '收下地圖，出發 →' : '繼續故事 →', () => {
          if (this.step < intro.length - 1) {
            this.step++;
            this.draw();
          } else {
            state.intro = true;
            persist();
            this.go('IslandMap');
          }
        }),
        ...(this.step > 0
          ? [
              button(
                '上一段',
                () => {
                  this.step--;
                  this.draw();
                },
                'light',
              ),
            ]
          : []),
      ),
    );
  }
}
