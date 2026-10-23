import { AdventureScene } from './AdventureScene';
import { $, el, button, art, feedback } from '../components/UI';
import { itemIcon } from '../components/ItemIcon';
import { state, persist } from '../systems/SaveSystem';
import { BALANCE } from '../data/balance';
import { shuffledDeck, type BossItem } from '../data/wasteItems';
import type { Disposal } from '../data/types';
export class BossBattle extends AdventureScene {
  private hp: number = BALANCE.heroHP;
  private bossHP: number = BALANCE.bossHP;
  private deck: BossItem[] = [];
  private index = 0;
  private cycle = 0;
  private busy = false;
  private downX: number | null = null;
  private downY = 0;
  constructor() {
    super('BossBattle');
  }
  create(): void {
    if (!state.cleaned) {
      this.go('ForestCleanup');
      return;
    }
    this.hp = BALANCE.heroHP;
    this.bossHP = BALANCE.bossHP;
    this.index = 0;
    this.cycle = 0;
    this.busy = false;
    this.deck = shuffledDeck(BALANCE.deckSeed);
    this.downX = null;
    this.setup('擊敗廢棄怪', '最終任務 · 分類就是你的力量', 'dark');
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (
        e.repeat ||
        $<HTMLDialogElement>('#modal').open ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      )
        return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.answer(e.key === 'ArrowLeft' ? 'recycle' : 'general');
      }
    });
    this.draw();
  }
  private draw(): void {
    const stage = $('#stage-ui');
    stage.replaceChildren();
    const health = el('div', 'health-row');
    [
      [`${state.name} · 勇士`, this.hp, BALANCE.heroHP, 'hero'],
      ['廢棄怪', this.bossHP, BALANCE.bossHP, 'boss'],
    ].forEach(([name, hp, max, kind]) => {
      const wrap = el('div', `health ${kind}`);
      const label = el('label', '', String(name));
      label.append(el('span', '', `${hp} / ${max}`));
      const bar = el('progress');
      bar.max = Number(max);
      bar.value = Number(hp);
      bar.setAttribute('aria-label', `${name}生命`);
      wrap.append(label, bar);
      health.append(wrap);
    });
    stage.append(health, art('monster', 'battle-art'));
    stage.append(el('div', `battle-hero hero-${state.hero}`));
    const item = this.deck[this.index];
    const card = el('div', 'battle-card');
    card.setAttribute('aria-label', '可左右滑動的垃圾卡');
    card.append(
      itemIcon(item.symbol),
      el('h3', '', item.name),
      el('small', '', '← 資源回收 · 一般垃圾 →'),
    );
    card.addEventListener('pointerdown', (e) => {
      if (this.busy) return;
      this.downX = e.clientX;
      this.downY = e.clientY;
      card.setPointerCapture(e.pointerId);
    });
    card.addEventListener('pointerup', (e) => {
      if (this.downX === null) return;
      const dx = e.clientX - this.downX,
        dy = e.clientY - this.downY;
      this.downX = null;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy))
        this.answer(dx < 0 ? 'recycle' : 'general');
    });
    card.addEventListener('pointercancel', () => (this.downX = null));
    stage.append(card);
    const panel = $('#panel');
    panel.className = 'battle-panel';
    panel.replaceChildren();
    const summary = el('div', 'battle-summary');
    summary.append(
      el('span', 'eyebrow', '最後一戰 · 不用急，想清楚再出招'),
      el('h2', '', '用細分類，破解廢棄怪。'),
      el('p', '', '分類正確：魔王 −1　｜　分類錯誤：勇士 −1'),
    );
    panel.append(summary);
    const controls = el('div', 'battle-instructions');
    const left = button('← 資源回收', () => this.answer('recycle'), 'primary');
    const right = button('一般垃圾 →', () => this.answer('general'), 'secondary');
    left.disabled = this.busy;
    right.disabled = this.busy;
    const middle = el('div', 'battle-middle');
    middle.append(
      el('strong', '', this.busy ? '招式發動中…' : '滑動中間的物品卡'),
      el('span', '', '也能用按鈕或鍵盤 ← →'),
    );
    controls.append(left, middle, right);
    panel.append(
      controls,
      el(
        'p',
        'fine-print',
        '本關使用遊戲分類規則；日常丟棄請依所在地清潔隊公告。重新進入戰鬥會重置雙方血量。',
      ),
    );
  }
  private answer(disposal: Disposal): void {
    if (this.busy || $<HTMLDialogElement>('#modal').open) return;
    this.busy = true;
    const item = this.deck[this.index],
      correct = item.disposal === disposal;
    if (correct) this.bossHP = Math.max(0, this.bossHP - BALANCE.damage);
    else this.hp = Math.max(0, this.hp - BALANCE.damage);
    feedback(
      correct ? `✓ 攻擊成功！${item.explanation}` : `✕ 勇士受傷了。${item.explanation}`,
      correct ? 'good' : 'bad',
    );
    this.burst(correct ? 930 : 220, 260, correct);
    this.draw();
    const beam = this.add.rectangle(correct ? 250 : 950, 285, 12, 6, correct ? 0xffdd8d : 0xbc8a75);
    this.tweens.add({
      targets: beam,
      x: correct ? 930 : 250,
      duration: this.reduced ? 0 : 350,
      onComplete: () => beam.destroy(),
    });
    this.time.delayedCall(BALANCE.transitionMs, () => {
      if (this.bossHP === 0 || this.hp === 0) {
        state.ending = this.bossHP === 0 ? 'good' : 'bad';
        persist();
        this.go('Ending');
        return;
      }
      this.index++;
      if (this.index >= this.deck.length) {
        this.index = 0;
        this.deck = shuffledDeck(BALANCE.deckSeed + ++this.cycle);
      }
      this.busy = false;
      this.draw();
    });
  }
}
