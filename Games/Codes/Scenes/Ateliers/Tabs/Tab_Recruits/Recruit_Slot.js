// ================================================================
//  Recruit_Slot.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruits/Recruit_Slot.js
//
//  역할: Phase 2 — 3개 슬롯머신 동시 가동
//  의존: Recruit_Data.js, Tab_Recruit.js(this)
// ================================================================

Tab_Recruit.prototype._buildSlot = function () {
  this._clear();

  const { scene, W, H } = this;
  const cx    = W / 2;
  const cy    = H * 0.50;
  const cardW = W * 0.155;
  const cardH = cardW * 1.80;
  const gap   = W * 0.032;

  // 3개 최종 결과 미리 확정
  this._rolls = [_rRoll(), _rRoll(), _rRoll()];

  const positions = [cx - cardW - gap, cx, cx + cardW + gap];
  this._slotDisplays = [];

  positions.forEach((x, i) => {
    // 카드 배경
    const bg = scene.add.graphics();
    bg.fillStyle(0x120d07, 0.95);
    bg.lineStyle(1, 0x3a2210, 0.8);
    bg.fillRect(x - cardW/2, cy - cardH/2, cardW, cardH);
    bg.strokeRect(x - cardW/2, cy - cardH/2, cardW, cardH);
    this._container.add(bg);

    // 코너 장식
    const dc = scene.add.graphics();
    dc.lineStyle(1, 0x5a3018, 0.6);
    const cs = 8;
    const lx = x - cardW/2 + 6; const rx = x + cardW/2 - 6;
    const ty = cy - cardH/2 + 6; const by = cy + cardH/2 - 6;
    dc.lineBetween(lx, ty, lx+cs, ty); dc.lineBetween(lx, ty, lx, ty+cs);
    dc.lineBetween(rx, ty, rx-cs, ty); dc.lineBetween(rx, ty, rx, ty+cs);
    dc.lineBetween(lx, by, lx+cs, by); dc.lineBetween(lx, by, lx, by-cs);
    dc.lineBetween(rx, by, rx-cs, by); dc.lineBetween(rx, by, rx, by-cs);
    this._container.add(dc);

    // 카드 번호
    this._container.add(scene.add.text(x, cy - cardH * 0.44, `${i + 1}`, {
      fontSize: this._fs(10), fill: '#3a2010', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    // 직업 슬롯
    const jobTxt = scene.add.text(x, cy - cardH * 0.28, '???', {
      fontSize: this._fs(16), fill: '#7a5028', fontFamily: FontManager.TITLE,
    }).setOrigin(0.5);
    this._container.add(jobTxt);

    // 구분선
    const sep = scene.add.graphics();
    sep.lineStyle(1, 0x2a1a0a, 0.8);
    sep.lineBetween(x - cardW*0.38, cy - cardH*0.14, x + cardW*0.38, cy - cardH*0.14);
    this._container.add(sep);

    // 스탯합계 슬롯
    const numTxt = scene.add.text(x, cy + cardH * 0.02, '---', {
      fontSize: this._fs(34), fill: '#c8a070', fontStyle: 'bold', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(numTxt);

    // 라벨
    this._container.add(scene.add.text(x, cy + cardH * 0.22, '스 탯  합 계', {
      fontSize: this._fs(9), fill: '#3d2010', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    this._slotDisplays.push({ jobTxt, numTxt });
  });

  this._runSlots();
};

Tab_Recruit.prototype._runSlots = function () {
  const JOBS_DISPLAY = ['낚시꾼', '잠수부'];
  let done = 0;

  this._rolls.forEach((roll, i) => {
    let tick = 0;
    this._delay(i * 80, () => {
      const ev = this.scene.time.addEvent({
        delay: RECRUIT_SLOT_TICK,
        repeat: RECRUIT_SLOT_COUNT + i * 4 - 1,
        callback: () => {
          tick++;
          const total = RECRUIT_SLOT_COUNT + i * 4;
          const { jobTxt, numTxt } = this._slotDisplays[i];

          if (tick < total) {
            jobTxt.setText(_rFrom(JOBS_DISPLAY));
            const fake = tick > total * 0.65
              ? roll.statSum + Math.round((Math.random() - 0.5) * (total - tick) * 2.5)
              : Math.floor(Math.random() * 250);
            numTxt.setText(String(Math.max(0, Math.min(250, fake))));
          } else {
            jobTxt.setText(RECRUIT_JOB_LABEL[roll.job]);
            jobTxt.setStyle({ fill: roll.job === 'fisher' ? '#c8a070' : '#7ab0c8' });
            numTxt.setText(String(roll.statSum));
            done++;
            if (done === 3) this._delay(420, () => this._buildPick());
          }
        },
      });
      this._timers.push(ev);
    });
  });
};
