// ================================================================
//  Recruit_Custom.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruits/Recruit_Custom.js
//
//  역할: Phase 4 — 커스터마이징 (스탯/외형/패시브/스킬 재설정 + 확정)
//  의존: Recruit_Data.js, Recruit_Popup.js, Tab_Recruit.js(this)
// ================================================================

Tab_Recruit.prototype._buildCustom = function () {
  this._clear();

  const { W, H } = this;
  const bW    = W * 0.22;
  const bH    = bW * 1.55;
  const gapX  = W * 0.04;
  const leftX = W / 2 - (bW * 2 + gapX) / 2 + bW / 2;
  const rightX = leftX + bW + gapX;
  const cy    = H * 0.50;

  this._buildResultBox(leftX, cy, bW, bH);
  this._buildCustomBox(rightX, cy, bW, bH);
};

// ── 왼쪽: 결과 요약 + 이름 편집 + 스탯 ──────────────────────────

Tab_Recruit.prototype._buildResultBox = function (cx, cy, bw, bh) {
  const { scene, result } = this;
  const isF = result.job === 'fisher';

  const bg = scene.add.graphics();
  bg.fillStyle(0x120d07, 0.95); bg.lineStyle(1, 0x3a2210, 0.8);
  bg.fillRect(cx-bw/2, cy-bh/2, bw, bh); bg.strokeRect(cx-bw/2, cy-bh/2, bw, bh);
  this._container.add(bg);

  this._container.add(scene.add.text(cx, cy - bh*0.43, RECRUIT_JOB_LABEL[result.job], {
    fontSize: this._fs(16), fill: isF ? '#c8a070' : '#7ab0c8', fontFamily: FontManager.TITLE,
  }).setOrigin(0.5));

  this._container.add(scene.add.text(cx, cy - bh*0.33, `Cog  ${result.cog}`, {
    fontSize: this._fs(15), fill: '#a05018', fontStyle: 'bold', fontFamily: FontManager.MONO,
  }).setOrigin(0.5));

  this._container.add(scene.add.text(cx, cy - bh*0.23, `합계  ${result.statSum}`, {
    fontSize: this._fs(11), fill: '#4a2a10', fontFamily: FontManager.MONO,
  }).setOrigin(0.5));

  const sep = scene.add.graphics();
  sep.lineStyle(1, 0x2a1a0a, 0.8);
  sep.lineBetween(cx - bw*0.38, cy - bh*0.16, cx + bw*0.38, cy - bh*0.16);
  this._container.add(sep);

  // 이름 필드 (스탯 위)
  this._buildNameField(cx, cy - bh*0.10, bw);

  // 스탯 목록
  this._statTexts = [];
  RECRUIT_STAT_LABELS.forEach((label, i) => {
    const y = cy - bh*0.01 + i * (bh * 0.088);
    const t = scene.add.text(cx, y, `${label}  ${result.stats[i]}`, {
      fontSize: this._fs(11), fill: '#c8bfb0', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(t);
    this._statTexts.push(t);
  });
};

// ── 오른쪽: 외형/스탯/패시브/스킬 재설정 + 확정 버튼 ─────────────

Tab_Recruit.prototype._buildCustomBox = function (cx, cy, bw, bh) {
  const { scene, result } = this;

  const bg = scene.add.graphics();
  bg.fillStyle(0x120d07, 0.95); bg.lineStyle(1, 0x3a2210, 0.8);
  bg.fillRect(cx-bw/2, cy-bh/2, bw, bh); bg.strokeRect(cx-bw/2, cy-bh/2, bw, bh);
  this._container.add(bg);

  // 외형 이미지 박스
  const iSz = bw * 0.40; const iY = cy - bh * 0.29;
  const iBg = scene.add.graphics();
  iBg.fillStyle(0x1e1008, 1); iBg.lineStyle(1, 0x3d2010, 1);
  iBg.fillRect(cx-iSz/2, iY-iSz/2, iSz, iSz); iBg.strokeRect(cx-iSz/2, iY-iSz/2, iSz, iSz);
  this._container.add(iBg);
  this._spriteBoxX = cx; this._spriteBoxY = iY; this._spriteBoxSz = iSz;
  this._spriteImg = null; this._spriteKeyTxt = null;
  this._renderSpriteBox(result.spriteKey);

  this._spriteBtn = this._makeRerollBtn(cx, iY + iSz*0.58, bw*0.70,
    `외형  🎲  ${this.rerolls.sprite}`, () => this._rerollSprite());

  this._statBtn = this._makeRerollBtn(cx, cy - bh*0.03, bw*0.82,
    `스탯 재설정  🎲  ${this.rerolls.stat}`, () => this._rerollStats());

  // 패시브
  const pvY = cy + bh * 0.13;
  this._container.add(scene.add.text(cx, pvY - 13, '패 시 브', {
    fontSize: this._fs(10), fill: '#4a2a10', fontFamily: FontManager.MONO,
  }).setOrigin(0.5));
  this._passiveTxt = scene.add.text(cx, pvY + 4, result.passive, {
    fontSize: this._fs(11), fill: '#c8bfb0', fontFamily: FontManager.MONO,
  }).setOrigin(0.5);
  this._container.add(this._passiveTxt);
  this._passiveBtn = this._makeRerollBtn(cx, pvY + 22, bw*0.55,
    `🎲  ${this.rerolls.passive}`, () => this._rerollPassive());

  // 스킬
  const skY = cy + bh * 0.30;
  this._container.add(scene.add.text(cx, skY - 13, '스  킬', {
    fontSize: this._fs(10), fill: '#4a2a10', fontFamily: FontManager.MONO,
  }).setOrigin(0.5));
  this._skillTxt = scene.add.text(cx, skY + 4, result.skill, {
    fontSize: this._fs(11), fill: '#c8bfb0', fontFamily: FontManager.MONO,
  }).setOrigin(0.5);
  this._container.add(this._skillTxt);
  this._skillBtn = this._makeRerollBtn(cx, skY + 22, bw*0.55,
    `🎲  ${this.rerolls.skill}`, () => this._rerollSkill());

  // 확정 버튼
  const cfY = cy + bh*0.44; const cfW = bw*0.78; const cfH = 26;
  const cfBg = scene.add.graphics();
  const drawCf = (h) => {
    cfBg.clear();
    cfBg.fillStyle(h ? 0xa05018 : 0x3d2010, 1); cfBg.lineStyle(1, 0xa05018, 1);
    cfBg.fillRect(cx-cfW/2, cfY-cfH/2, cfW, cfH); cfBg.strokeRect(cx-cfW/2, cfY-cfH/2, cfW, cfH);
  };
  drawCf(false);
  this._container.add(cfBg);
  this._container.add(scene.add.text(cx, cfY, '영 입  확 정', {
    fontSize: this._fs(12), fill: '#c8a070', fontFamily: FontManager.MONO,
  }).setOrigin(0.5));
  const cfHit = scene.add.rectangle(cx, cfY, cfW, cfH, 0, 0).setInteractive({ useHandCursor: true });
  this._container.add(cfHit);
  cfHit.on('pointerover', () => drawCf(true));
  cfHit.on('pointerout',  () => drawCf(false));
  cfHit.on('pointerdown', () => this._confirmHire());
};

// ── 스프라이트 박스 렌더링 ────────────────────────────────────────

Tab_Recruit.prototype._renderSpriteBox = function (spriteKey) {
  const { scene } = this;
  const cx = this._spriteBoxX; const iY = this._spriteBoxY; const iSz = this._spriteBoxSz;

  if (this._spriteImg)    { this._spriteImg.destroy();    this._spriteImg    = null; }
  if (this._spriteKeyTxt) { this._spriteKeyTxt.destroy(); this._spriteKeyTxt = null; }

  if (spriteKey && scene.textures.exists(spriteKey)) {
    const img = scene.add.image(cx, iY, spriteKey).setOrigin(0.5);
    const sc  = Math.min(iSz / img.width, iSz / img.height) * 0.92;
    img.setScale(sc);
    this._spriteImg = img;
    this._container.add(img);
  } else {
    const num = parseInt(spriteKey.replace('char_', '')) + 1;
    this._spriteKeyTxt = scene.add.text(cx, iY, `#${num}`, {
      fontSize: this._fs(11), fill: '#3d2010', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(this._spriteKeyTxt);
  }
};

// ── 재설정 버튼 공통 ─────────────────────────────────────────────

Tab_Recruit.prototype._makeRerollBtn = function (cx, y, w, label, cb) {
  const { scene } = this;
  const h = 22;
  const bg = scene.add.graphics();
  const draw = (hover, disabled) => {
    bg.clear();
    bg.fillStyle(disabled ? 0x0a0806 : hover ? 0x2a1a0a : 0x1e1008, 1);
    bg.lineStyle(1, disabled ? 0x1a1008 : hover ? 0xa05018 : 0x3d2010, 1);
    bg.fillRect(cx-w/2, y-h/2, w, h); bg.strokeRect(cx-w/2, y-h/2, w, h);
  };
  draw(false, false);
  this._container.add(bg);
  const txt = scene.add.text(cx, y, label, {
    fontSize: this._fs(10), fill: '#7a5028', fontFamily: FontManager.MONO,
  }).setOrigin(0.5);
  this._container.add(txt);
  const hit = scene.add.rectangle(cx, y, w, h, 0, 0).setInteractive({ useHandCursor: true });
  this._container.add(hit);
  hit.on('pointerover', () => draw(true,  false));
  hit.on('pointerout',  () => draw(false, false));
  hit.on('pointerdown', () => cb());
  return { bg, txt, hit, draw };
};

Tab_Recruit.prototype._disableBtn = function (btn, newLabel) {
  btn.hit.disableInteractive();
  btn.draw(false, true);
  btn.txt.setStyle({ fill: '#2a1a0a' });
  btn.txt.setText(newLabel);
};

// ── 재설정 로직 ──────────────────────────────────────────────────

Tab_Recruit.prototype._rerollStats = function () {
  if (this.rerolls.stat <= 0) { this._toast('재설정 횟수 소진'); return; }
  const prev = [...this.result.stats];
  const next = _rDist(this.result.statSum);
  this._showStatPopup(prev, next, (chosen) => {
    this.result.stats = chosen; this.rerolls.stat--;
    chosen.forEach((v, i) => this._statTexts[i].setText(`${RECRUIT_STAT_LABELS[i]}  ${v}`));
    if (this.rerolls.stat <= 0) this._disableBtn(this._statBtn, '스탯 재설정  ✕');
    else this._statBtn.txt.setText(`스탯 재설정  🎲  ${this.rerolls.stat}`);
  });
};

Tab_Recruit.prototype._rerollSprite = function () {
  if (this.rerolls.sprite <= 0) { this._toast('재설정 횟수 소진'); return; }
  const prev = this.result.spriteKey;
  const next = _rSpriteKey();
  this._showChoicePopup('외형  재설정',
    `외형  #${parseInt(prev.replace('char_', '')) + 1}`,
    `외형  #${parseInt(next.replace('char_', '')) + 1}`,
    (chosen) => {
      this.result.spriteKey = chosen; this.rerolls.sprite--;
      this._renderSpriteBox(chosen);
      if (this.rerolls.sprite <= 0) this._disableBtn(this._spriteBtn, '외형  ✕');
      else this._spriteBtn.txt.setText(`외형  🎲  ${this.rerolls.sprite}`);
    }, [prev, next]);
};

Tab_Recruit.prototype._rerollPassive = function () {
  if (this.rerolls.passive <= 0) { this._toast('재설정 횟수 소진'); return; }
  const prev = this.result.passive;
  const next = _rFrom(RECRUIT_PASSIVE_POOL[this.result.cog]);
  this._showChoicePopup('패시브  재설정', prev, next, (chosen) => {
    this.result.passive = chosen; this.rerolls.passive--;
    this._passiveTxt.setText(chosen);
    if (this.rerolls.passive <= 0) this._disableBtn(this._passiveBtn, '✕');
    else this._passiveBtn.txt.setText(`🎲  ${this.rerolls.passive}`);
  }, [prev, next]);
};

Tab_Recruit.prototype._rerollSkill = function () {
  if (this.rerolls.skill <= 0) { this._toast('재설정 횟수 소진'); return; }
  const prev = this.result.skill;
  const next = _rFrom(RECRUIT_SKILL_POOL[this.result.cog]);
  this._showChoicePopup('스킬  재설정', prev, next, (chosen) => {
    this.result.skill = chosen; this.rerolls.skill--;
    this._skillTxt.setText(chosen);
    if (this.rerolls.skill <= 0) this._disableBtn(this._skillBtn, '✕');
    else this._skillBtn.txt.setText(`🎲  ${this.rerolls.skill}`);
  }, [prev, next]);
};

// ── 영입 확정 ────────────────────────────────────────────────────

Tab_Recruit.prototype._confirmHire = function () {
  const { result } = this;
  const statObj = {};
  RECRUIT_STAT_KEYS.forEach((k, i) => { statObj[k] = result.stats[i]; });

  CharacterManager.addCharacter({
    id:        `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name:      result.name,
    age:       16 + Math.floor(Math.random() * 10),
    job:       result.job,
    jobLabel:  RECRUIT_JOB_LABEL[result.job],
    stats:     statObj,
    statSum:   result.statSum,
    cog:       result.cog,
    passive:   result.passive,
    skill:     result.skill,
    currentHp: statObj.hp * 10,
    maxHp:     statObj.hp * 10,
    spriteKey: result.spriteKey,
  });

  this._toast(`${result.name}  영입 완료!`);
  this._delay(900, () => this._buildReady());
};
