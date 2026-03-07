// ================================================================
//  Recruit_Pick.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruits/Recruit_Pick.js
//
//  역할: Phase 3 — 3개 결과 카드 중 하나 선택
//  의존: Recruit_Data.js, Tab_Recruit.js(this)
// ================================================================

Tab_Recruit.prototype._buildPick = function () {
  this._clear();

  const { scene, W, H } = this;
  const cx    = W / 2;
  const cy    = H * 0.50;
  const cardW = W * 0.155;
  const cardH = cardW * 1.62;
  const gap   = W * 0.032;

  const positions = [cx - cardW - gap, cx, cx + cardW + gap];

  // 안내 텍스트
  this._container.add(scene.add.text(cx, cy - cardH * 0.60, '영입할 동료를 선택하십시오', {
    fontSize: this._fs(12), fill: '#4a2a10', fontFamily: FontManager.MONO,
  }).setOrigin(0.5));

  positions.forEach((x, i) => {
    const roll = this._rolls[i];
    const isF  = roll.job === 'fisher';

    // 카드 배경
    const bg = scene.add.graphics();
    const drawCard = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? 0x1e1408 : 0x120d07, 1);
      bg.lineStyle(2, hover ? (isF ? 0xc8a070 : 0x7ab0c8) : 0x3a2210, hover ? 1 : 0.8);
      bg.fillRect(x - cardW/2, cy - cardH/2, cardW, cardH);
      bg.strokeRect(x - cardW/2, cy - cardH/2, cardW, cardH);
    };
    drawCard(false);
    this._container.add(bg);

    // 직업명
    this._container.add(scene.add.text(x, cy - cardH * 0.40, RECRUIT_JOB_LABEL[roll.job], {
      fontSize: this._fs(16), fontFamily: FontManager.TITLE,
      fill: isF ? '#c8a070' : '#7ab0c8',
    }).setOrigin(0.5));

    // 일러스트 ㅁ
    const iSz = cardW * 0.72;
    const iY  = cy - cardH * 0.12;
    const iBg = scene.add.graphics();
    iBg.fillStyle(0x1a1008, 1); iBg.lineStyle(1, 0x2a1a0a, 1);
    iBg.fillRect(x - iSz/2, iY - iSz/2, iSz, iSz);
    iBg.strokeRect(x - iSz/2, iY - iSz/2, iSz, iSz);
    this._container.add(iBg);

    // Cog 등급
    this._container.add(scene.add.text(x, iY, `Cog  ${roll.cog}`, {
      fontSize: this._fs(22), fill: RECRUIT_COG_COLORS[roll.cog] || '#c8bfb0',
      fontStyle: 'bold', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    // 구분선
    const sep = scene.add.graphics();
    sep.lineStyle(1, 0x2a1a0a, 0.7);
    sep.lineBetween(x - cardW*0.38, cy + cardH*0.12, x + cardW*0.38, cy + cardH*0.12);
    this._container.add(sep);

    // 스탯합계
    this._container.add(scene.add.text(x, cy + cardH * 0.22, `합계  ${roll.statSum}`, {
      fontSize: this._fs(13), fill: '#c8bfb0', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    // 히트 영역
    const hit = scene.add.rectangle(x, cy, cardW, cardH, 0, 0)
      .setInteractive({ useHandCursor: true });
    this._container.add(hit);
    hit.on('pointerover', () => drawCard(true));
    hit.on('pointerout',  () => drawCard(false));
    hit.on('pointerdown', () => {
      this.result  = roll;
      this.rerolls = {
        stat: RECRUIT_MAX_REROLL, sprite: RECRUIT_MAX_REROLL,
        passive: RECRUIT_MAX_REROLL, skill: RECRUIT_MAX_REROLL,
      };
      this._buildCustom();
    });
  });
};
