// ================================================================
//  Tab_Recruit.js
//  경로: Games/Codes/Scenes/Atelier/tabs/Tab_Recruit.js
//
//  영입 탭 — 낚시꾼 / 잠수부 가챠 시스템
//
//  [Phase 흐름]
//    SELECT  → 카드 두 장 (ㅁ ㅁ), 직업별 가격 표시, 고용 버튼
//    SLOT    → 슬롯머신으로 스탯 합계 결정 (중앙 ㅁ 1개)
//    CUSTOM  → 슬롯창 왼쪽으로 밀리고 오른쪽에 커스터마이징 창 등장 (ㅁ ㅁ)
//
//  [외부 의존 — 전역 변수로 이미 로드돼 있음]
//    CharacterManager  — addCharacter(), calcCog()
//    SaveManager       — load(), save()
//    scaledFontSize()  — utils.js
//    FontManager.MONO  — FontManager.js
// ================================================================

// ─── 상수 ────────────────────────────────────────────────────────

const RECRUIT_GACHA_TABLE = [
  { weight: 10, min:   0, max:  14 },
  { weight:  9, min:  15, max:  29 },
  { weight:  8, min:  30, max:  44 },
  { weight:  7, min:  45, max:  59 },
  { weight:  6, min:  60, max:  74 },
  { weight:  5, min:  75, max:  89 },
  { weight:  4, min:  90, max: 109 },
  { weight:  3, min: 110, max: 139 },
  { weight:  2, min: 140, max: 189 },
  { weight:  1, min: 190, max: 250 },
];

const RECRUIT_STAT_MINS   = [1, 0, 1, 5, 0];
const RECRUIT_STAT_LABELS = ['체력', '건강', '공격', '민첩', '행운'];
const RECRUIT_STAT_KEYS   = ['hp', 'health', 'attack', 'agility', 'luck'];

const RECRUIT_COG_THRESHOLDS = [10, 25, 45, 65, 80, 95];

const RECRUIT_PASSIVE_POOL = {
  1: ['윗칸 타격', '앞칸 타격'],
  2: ['앞칸 타격', '현재 칸 타격'],
  3: ['현재 칸 타격', '대각 타격', '윗칸 타격'],
  4: ['전열 전체 타격', '대각 타격', '앞칸 타격'],
  5: ['전열 전체 타격', '현재 칸 타격', '후열 타격'],
  6: ['전/후열 동시 타격', '후열 타격', '전열 전체 타격'],
  7: ['전체 칸 타격', '전/후열 동시 타격'],
};
const RECRUIT_SKILL_POOL = {
  1: ['기본 일격', '빠른 찌르기'],
  2: ['연속 타격', '방어 자세'],
  3: ['강타', '회피 기동', '독 도포'],
  4: ['광역 타격', '강화 독', '순간 가속'],
  5: ['폭발 타격', '전방 스캔', '철갑 관통'],
  6: ['심해 압박', '전기 충격', '철벽 방어'],
  7: ['코어 오버로드', '심연의 포효'],
};

const RECRUIT_NAMES = {
  fisher: ['강철손', '갈고리', '파도잡이', '심해꾼', '녹슨낚시', '소금쟁이', '파랑이', '먹장어', '심연꾼', '날카로운눈'],
  diver:  ['잠수사', '깊은숨', '해류', '침잠자', '해저인', '투명수', '녹색폐', '어둠잠수', '산소통', '어비스'],
};

const RECRUIT_BASE_PRICE = 5;
const RECRUIT_PRICE_STEP = 5;
const RECRUIT_MAX_REROLL = 3;
const RECRUIT_SLOT_TICK  = 60;
const RECRUIT_SLOT_COUNT = 28;
const RECRUIT_SPRITE_COUNT = 72;

// ─── 유틸 ────────────────────────────────────────────────────────

function _rwPick(table) {
  const total = table.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of table) { r -= e.weight; if (r <= 0) return e; }
  return table[table.length - 1];
}

function _rCalcCog(sum) {
  for (let i = 0; i < RECRUIT_COG_THRESHOLDS.length; i++) {
    if (sum <= RECRUIT_COG_THRESHOLDS[i]) return i + 1;
  }
  return 7;
}

function _rDistribute(total) {
  const s = [...RECRUIT_STAT_MINS];
  let rem = total - s.reduce((a, b) => a + b, 0);
  if (rem < 0) rem = 0;
  for (let i = 0; i < rem; i++) s[Math.floor(Math.random() * 5)]++;
  return s;
}

function _rRandFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function _rRandSpriteKey() {
  const n = Math.floor(Math.random() * RECRUIT_SPRITE_COUNT);
  return `char_${String(n).padStart(3, '0')}`;
}

// ─── 메인 클래스 ─────────────────────────────────────────────────

class Tab_Recruit {
  constructor(scene, W, H) {
    this.scene = scene;
    this.W     = W;
    this.H     = H;

    // 가격 — 세이브에서 복원
    const save = SaveManager.load() || {};
    this.prices = {
      fisher: save.recruitPrice_fisher ?? RECRUIT_BASE_PRICE,
      diver:  save.recruitPrice_diver  ?? RECRUIT_BASE_PRICE,
    };

    this.activeJob = null;
    this.result    = {};
    this.rerolls   = {};

    this._container = scene.add.container(0, 0);
    this._buildSelect();
  }

  show()    { this._container.setVisible(true);  }
  hide()    { this._container.setVisible(false); }
  destroy() { this._container.destroy(); }

  _fs(n)  { return scaledFontSize(n, this.scene.scale); }
  _clear(){ this._container.removeAll(true); }

  // ════════════════════════════════════════════
  //  Phase 1 : SELECT
  // ════════════════════════════════════════════

  _buildSelect() {
    this._clear();

    const { W, H } = this;
    const cx = W / 2;
    const cy = H * 0.50;
    const cardW = W * 0.20;
    const cardH = cardW * 1.55;
    const gap   = W * 0.06;

    [
      { job: 'fisher', label: '낚시꾼', abbr: 'FISH', x: cx - gap / 2 - cardW / 2 },
      { job: 'diver',  label: '잠수부', abbr: 'DIVE', x: cx + gap / 2 + cardW / 2 },
    ].forEach(info => this._makeCard(info, cardW, cardH, cy));
  }

  _makeCard({ job, label, abbr, x }, cw, ch, cy) {
    const { scene } = this;

    // 배경
    const bg = scene.add.graphics();
    bg.fillStyle(0x120d07, 0.95);
    bg.lineStyle(1, 0x3a2210, 0.8);
    bg.fillRect(x - cw/2, cy - ch/2, cw, ch);
    bg.strokeRect(x - cw/2, cy - ch/2, cw, ch);
    this._container.add(bg);

    // 직업명
    this._container.add(scene.add.text(x, cy - ch * 0.40, label, {
      fontSize: this._fs(14), fill: '#c8bfb0', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    // 아이콘 ㅁ
    const iSz = cw * 0.52;
    const iY  = cy - ch * 0.12;
    const iBg = scene.add.graphics();
    iBg.fillStyle(0x1e1008, 1);
    iBg.lineStyle(1, 0x3d2010, 1);
    iBg.fillRect(x - iSz/2, iY - iSz/2, iSz, iSz);
    iBg.strokeRect(x - iSz/2, iY - iSz/2, iSz, iSz);
    this._container.add(iBg);
    this._container.add(scene.add.text(x, iY, abbr, {
      fontSize: this._fs(13), fill: '#2a1a0a', fontStyle: 'bold', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    // 가격
    const priceTxt = scene.add.text(x, cy + ch * 0.33, `${this.prices[job]} Arc`, {
      fontSize: this._fs(13), fill: '#a05018', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(priceTxt);
    this[`_priceTxt_${job}`] = priceTxt;

    // 고용 버튼
    const bW = cw * 0.72; const bH = ch * 0.115; const bY = cy + ch * 0.45;
    const btnBg = scene.add.graphics();
    const drawBtn = (hover) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0xa05018 : 0x3d2010, 1);
      btnBg.lineStyle(1, 0xa05018, 1);
      btnBg.fillRect(x - bW/2, bY - bH/2, bW, bH);
      btnBg.strokeRect(x - bW/2, bY - bH/2, bW, bH);
    };
    drawBtn(false);
    this._container.add(btnBg);
    this._container.add(scene.add.text(x, bY, '고  용', {
      fontSize: this._fs(12), fill: '#c8a070', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));
    const hit = scene.add.rectangle(x, bY, bW, bH, 0, 0).setInteractive({ useHandCursor: true });
    this._container.add(hit);
    hit.on('pointerover',  () => drawBtn(true));
    hit.on('pointerout',   () => drawBtn(false));
    hit.on('pointerdown',  () => this._onHire(job));
  }

  // ════════════════════════════════════════════
  //  결제
  // ════════════════════════════════════════════

  _onHire(job) {
    const cost = this.prices[job];
    const save = SaveManager.load() || {};
    if ((save.arc ?? 0) < cost) { this._toast('Arc 부족!'); return; }

    save.arc -= cost;
    this.prices[job] += RECRUIT_PRICE_STEP;
    save.recruitPrice_fisher = this.prices.fisher;
    save.recruitPrice_diver  = this.prices.diver;
    SaveManager.save(save);

    // AtelierHUD Arc 갱신
    this.scene.events.emit('arcUpdated', save.arc);

    this.activeJob = job;
    this._buildSlot();
  }

  // ════════════════════════════════════════════
  //  Phase 2 : SLOT
  // ════════════════════════════════════════════

  _buildSlot() {
    this._clear();

    const { scene, W, H } = this;
    const cx = W / 2;
    const cy = H * 0.50;
    const bW = W * 0.26;
    const bH = bW * 1.35;

    const bg = scene.add.graphics();
    bg.fillStyle(0x120d07, 0.95);
    bg.lineStyle(1, 0x3a2210, 0.8);
    bg.fillRect(cx - bW/2, cy - bH/2, bW, bH);
    bg.strokeRect(cx - bW/2, cy - bH/2, bW, bH);
    this._container.add(bg);

    this._container.add(scene.add.text(cx, cy - bH * 0.38, this.activeJob === 'fisher' ? '낚시꾼' : '잠수부', {
      fontSize: this._fs(13), fill: '#7a5028', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    const numTxt = scene.add.text(cx, cy - bH * 0.04, '---', {
      fontSize: this._fs(38), fill: '#c8a070', fontStyle: 'bold', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(numTxt);

    this._container.add(scene.add.text(cx, cy + bH * 0.28, '스 탯  합 계', {
      fontSize: this._fs(11), fill: '#3d2010', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    this._runSlot(numTxt);
  }

  _runSlot(display) {
    const entry    = _rwPick(RECRUIT_GACHA_TABLE);
    const finalSum = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
    const cog      = _rCalcCog(finalSum);

    this.result = {
      statSum:   finalSum,
      cog,
      stats:     _rDistribute(finalSum),
      name:      _rRandFrom(RECRUIT_NAMES[this.activeJob]),
      spriteKey: _rRandSpriteKey(),
      passive:   _rRandFrom(RECRUIT_PASSIVE_POOL[cog]),
      skill:     _rRandFrom(RECRUIT_SKILL_POOL[cog]),
    };
    this.rerolls = { stat: RECRUIT_MAX_REROLL, sprite: RECRUIT_MAX_REROLL, passive: RECRUIT_MAX_REROLL, skill: RECRUIT_MAX_REROLL };

    let tick = 0;
    this.scene.time.addEvent({
      delay: RECRUIT_SLOT_TICK,
      repeat: RECRUIT_SLOT_COUNT - 1,
      callback: () => {
        tick++;
        if (tick < RECRUIT_SLOT_COUNT) {
          const fake = tick > RECRUIT_SLOT_COUNT * 0.65
            ? finalSum + Math.round((Math.random() - 0.5) * (RECRUIT_SLOT_COUNT - tick) * 2)
            : Math.floor(Math.random() * 250);
          display.setText(String(Math.max(0, Math.min(250, fake))));
        } else {
          display.setText(String(finalSum));
          this.scene.time.delayedCall(380, () => this._buildCustom());
        }
      },
    });
  }

  // ════════════════════════════════════════════
  //  Phase 3 : CUSTOM
  // ════════════════════════════════════════════

  _buildCustom() {
    this._clear();

    const { W, H } = this;
    const bW     = W * 0.22;
    const bH     = bW * 1.55;
    const gapX   = W * 0.04;
    const leftX  = W / 2 - (bW * 2 + gapX) / 2 + bW / 2;
    const rightX = leftX + bW + gapX;
    const cy     = H * 0.50;

    this._buildResultBox(leftX, cy, bW, bH);
    this._buildCustomBox(rightX, cy, bW, bH);
  }

  // ── 왼쪽: 결과 요약 ──

  _buildResultBox(cx, cy, bw, bh) {
    const { scene, result } = this;

    const bg = scene.add.graphics();
    bg.fillStyle(0x120d07, 0.95); bg.lineStyle(1, 0x3a2210, 0.8);
    bg.fillRect(cx-bw/2, cy-bh/2, bw, bh); bg.strokeRect(cx-bw/2, cy-bh/2, bw, bh);
    this._container.add(bg);

    this._container.add(scene.add.text(cx, cy - bh*0.43, this.activeJob === 'fisher' ? '낚시꾼' : '잠수부', {
      fontSize: this._fs(12), fill: '#7a5028', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    this._container.add(scene.add.text(cx, cy - bh*0.33, `Cog  ${result.cog}`, {
      fontSize: this._fs(16), fill: '#a05018', fontStyle: 'bold', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    this._container.add(scene.add.text(cx, cy - bh*0.23, `합계  ${result.statSum}`, {
      fontSize: this._fs(11), fill: '#4a2a10', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    const sep = scene.add.graphics();
    sep.lineStyle(1, 0x2a1a0a, 0.8);
    sep.lineBetween(cx - bw*0.38, cy - bh*0.16, cx + bw*0.38, cy - bh*0.16);
    this._container.add(sep);

    this._statTexts = [];
    RECRUIT_STAT_LABELS.forEach((label, i) => {
      const y = cy - bh*0.10 + i * (bh * 0.093);
      const t = scene.add.text(cx, y, `${label}  ${result.stats[i]}`, {
        fontSize: this._fs(11), fill: '#c8bfb0', fontFamily: FontManager.MONO,
      }).setOrigin(0.5);
      this._container.add(t);
      this._statTexts.push(t);
    });

    this._buildNameField(cx, cy + bh*0.37, bw);
  }

  _buildNameField(cx, y, bw) {
    const { scene, result } = this;
    const fW = bw * 0.80; const fH = 24;
    const fbg = scene.add.graphics();
    const drawF = (hover) => {
      fbg.clear();
      fbg.fillStyle(0x1e1008, 1);
      fbg.lineStyle(1, hover ? 0xa05018 : 0x3d2010, 1);
      fbg.fillRect(cx-fW/2, y-fH/2, fW, fH);
      fbg.strokeRect(cx-fW/2, y-fH/2, fW, fH);
    };
    drawF(false);
    this._container.add(fbg);

    this._nameTxt = scene.add.text(cx, y, result.name, {
      fontSize: this._fs(12), fill: '#c8a070', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(this._nameTxt);

    const hit = scene.add.rectangle(cx, y, fW, fH, 0, 0).setInteractive({ useHandCursor: true });
    this._container.add(hit);
    hit.on('pointerover',  () => drawF(true));
    hit.on('pointerout',   () => drawF(false));
    hit.on('pointerdown',  () => this._editName());
  }

  _editName() {
    const { result } = this;
    const el = document.createElement('input');
    el.type = 'text'; el.value = result.name; el.maxLength = 10;
    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'background:#0f0a05;color:#c8a070;border:1px solid #a05018;padding:4px 10px;' +
      'font-size:16px;outline:none;z-index:9999;text-align:center;letter-spacing:2px;';
    document.body.appendChild(el);
    el.focus(); el.select();
    const done = () => {
      const v = el.value.trim();
      if (v) { result.name = v; this._nameTxt.setText(v); }
      document.body.removeChild(el);
    };
    el.addEventListener('blur', done);
    el.addEventListener('keydown', e => { if (e.key === 'Enter') done(); });
  }

  // ── 오른쪽: 커스터마이징 ──

  _buildCustomBox(cx, cy, bw, bh) {
    const { scene, result } = this;

    const bg = scene.add.graphics();
    bg.fillStyle(0x120d07, 0.95); bg.lineStyle(1, 0x3a2210, 0.8);
    bg.fillRect(cx-bw/2, cy-bh/2, bw, bh); bg.strokeRect(cx-bw/2, cy-bh/2, bw, bh);
    this._container.add(bg);

    // 외형 아이콘 ㅁ
    const iSz = bw * 0.40; const iY = cy - bh * 0.29;
    const iBg = scene.add.graphics();
    iBg.fillStyle(0x1e1008, 1); iBg.lineStyle(1, 0x3d2010, 1);
    iBg.fillRect(cx-iSz/2, iY-iSz/2, iSz, iSz); iBg.strokeRect(cx-iSz/2, iY-iSz/2, iSz, iSz);
    this._container.add(iBg);
    this._spriteKeyTxt = scene.add.text(cx, iY, `#${parseInt(result.spriteKey.replace('char_',''))+1}`, {
      fontSize: this._fs(11), fill: '#3d2010', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(this._spriteKeyTxt);

    // 외형 주사위
    this._spriteBtn = this._makeRerollBtn(cx, iY + iSz*0.58, bw*0.70,
      `외형  🎲  ${this.rerolls.sprite}`, () => this._rerollSprite());

    // 스탯 재설정
    this._statBtn = this._makeRerollBtn(cx, cy - bh*0.03, bw*0.82,
      `스탯 재설정  🎲  ${this.rerolls.stat}`, () => this._rerollStats());

    // 패시브
    const pvY = cy + bh * 0.13;
    this._container.add(scene.add.text(cx, pvY-13, '패 시 브', {
      fontSize: this._fs(10), fill: '#4a2a10', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));
    this._passiveTxt = scene.add.text(cx, pvY+4, result.passive, {
      fontSize: this._fs(11), fill: '#c8bfb0', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(this._passiveTxt);
    this._passiveBtn = this._makeRerollBtn(cx, pvY+22, bw*0.55,
      `🎲  ${this.rerolls.passive}`, () => this._rerollPassive());

    // 스킬
    const skY = cy + bh * 0.30;
    this._container.add(scene.add.text(cx, skY-13, '스  킬', {
      fontSize: this._fs(10), fill: '#4a2a10', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));
    this._skillTxt = scene.add.text(cx, skY+4, result.skill, {
      fontSize: this._fs(11), fill: '#c8bfb0', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(this._skillTxt);
    this._skillBtn = this._makeRerollBtn(cx, skY+22, bw*0.55,
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
    cfHit.on('pointerover',  () => drawCf(true));
    cfHit.on('pointerout',   () => drawCf(false));
    cfHit.on('pointerdown',  () => this._confirmHire());
  }

  _makeRerollBtn(cx, y, w, label, cb) {
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
    hit.on('pointerover',  () => draw(true,  false));
    hit.on('pointerout',   () => draw(false, false));
    hit.on('pointerdown',  () => cb());
    return { bg, txt, hit, draw };
  }

  _disableBtn(btn, newLabel) {
    btn.hit.disableInteractive();
    btn.draw(false, true);
    btn.txt.setStyle({ fill: '#2a1a0a' });
    btn.txt.setText(newLabel);
  }

  // ════════════════════════════════════════════
  //  재설정 로직
  // ════════════════════════════════════════════

  _rerollStats() {
    if (this.rerolls.stat <= 0) { this._toast('재설정 횟수 소진'); return; }
    const prev = [...this.result.stats];
    const next = _rDistribute(this.result.statSum);
    this._showChoicePopup('스탯  재설정',
      prev.map((v,i) => `${RECRUIT_STAT_LABELS[i]} ${v}`).join('   '),
      next.map((v,i) => `${RECRUIT_STAT_LABELS[i]} ${v}`).join('   '),
      (chosen) => {
        this.result.stats = chosen; this.rerolls.stat--;
        chosen.forEach((v,i) => this._statTexts[i].setText(`${RECRUIT_STAT_LABELS[i]}  ${v}`));
        if (this.rerolls.stat <= 0) this._disableBtn(this._statBtn, '스탯 재설정  ✕');
        else this._statBtn.txt.setText(`스탯 재설정  🎲  ${this.rerolls.stat}`);
      }, [prev, next]);
  }

  _rerollSprite() {
    if (this.rerolls.sprite <= 0) { this._toast('재설정 횟수 소진'); return; }
    const prev = this.result.spriteKey;
    const next = _rRandSpriteKey();
    this._showChoicePopup('외형  재설정',
      `외형  #${parseInt(prev.replace('char_',''))+1}`,
      `외형  #${parseInt(next.replace('char_',''))+1}`,
      (chosen) => {
        this.result.spriteKey = chosen; this.rerolls.sprite--;
        this._spriteKeyTxt.setText(`#${parseInt(chosen.replace('char_',''))+1}`);
        if (this.rerolls.sprite <= 0) this._disableBtn(this._spriteBtn, '외형  ✕');
        else this._spriteBtn.txt.setText(`외형  🎲  ${this.rerolls.sprite}`);
      }, [prev, next]);
  }

  _rerollPassive() {
    if (this.rerolls.passive <= 0) { this._toast('재설정 횟수 소진'); return; }
    const prev = this.result.passive;
    const next = _rRandFrom(RECRUIT_PASSIVE_POOL[this.result.cog]);
    this._showChoicePopup('패시브  재설정', prev, next,
      (chosen) => {
        this.result.passive = chosen; this.rerolls.passive--;
        this._passiveTxt.setText(chosen);
        if (this.rerolls.passive <= 0) this._disableBtn(this._passiveBtn, '✕');
        else this._passiveBtn.txt.setText(`🎲  ${this.rerolls.passive}`);
      }, [prev, next]);
  }

  _rerollSkill() {
    if (this.rerolls.skill <= 0) { this._toast('재설정 횟수 소진'); return; }
    const prev = this.result.skill;
    const next = _rRandFrom(RECRUIT_SKILL_POOL[this.result.cog]);
    this._showChoicePopup('스킬  재설정', prev, next,
      (chosen) => {
        this.result.skill = chosen; this.rerolls.skill--;
        this._skillTxt.setText(chosen);
        if (this.rerolls.skill <= 0) this._disableBtn(this._skillBtn, '✕');
        else this._skillBtn.txt.setText(`🎲  ${this.rerolls.skill}`);
      }, [prev, next]);
  }

  // ════════════════════════════════════════════
  //  선택 팝업 (유지 vs 새로운)
  // ════════════════════════════════════════════

  _showChoicePopup(title, prevLabel, nextLabel, onConfirm, rawValues) {
    const { scene, W, H } = this;
    const cx = W/2; const cy = H/2;
    const pw = W*0.42; const ph = H*0.26;

    const pop = scene.add.container(0, 0).setDepth(50);
    this._container.add(pop);

    pop.add(scene.add.rectangle(cx, cy, W, H, 0x000000, 0.55));

    const pb = scene.add.graphics();
    pb.fillStyle(0x120d07, 0.98); pb.lineStyle(1, 0x3a2210, 0.9);
    pb.fillRect(cx-pw/2, cy-ph/2, pw, ph); pb.strokeRect(cx-pw/2, cy-ph/2, pw, ph);
    pop.add(pb);

    pop.add(scene.add.text(cx, cy - ph*0.38, title, {
      fontSize: this._fs(13), fill: '#c8bfb0', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    const bW = pw*0.38; const bH = ph*0.30;
    const lx = cx - pw*0.23; const rx = cx + pw*0.23; const bY = cy + ph*0.06;

    const makeBtn = (x, topLabel, bodyLabel, isNew, value) => {
      const cbg = scene.add.graphics();
      const drawC = (h) => {
        cbg.clear();
        cbg.fillStyle(h ? (isNew ? 0x3d2010 : 0x1a1008) : (isNew ? 0x2a1a0a : 0x120d07), 1);
        cbg.lineStyle(1, h ? 0xa05018 : (isNew ? 0x3d2010 : 0x2a1a0a), 1);
        cbg.fillRect(x-bW/2, bY-bH/2, bW, bH); cbg.strokeRect(x-bW/2, bY-bH/2, bW, bH);
      };
      drawC(false);
      pop.add(cbg);
      pop.add(scene.add.text(x, bY - bH*0.30, topLabel, {
        fontSize: this._fs(9), fill: isNew ? '#a05018' : '#3d2010', fontFamily: FontManager.MONO,
      }).setOrigin(0.5));
      bodyLabel.split('   ').forEach((line, li) => {
        pop.add(scene.add.text(x, bY - 4 + li * parseInt(this._fs(12)), line, {
          fontSize: this._fs(10), fill: '#c8bfb0', fontFamily: FontManager.MONO,
        }).setOrigin(0.5));
      });
      const chit = scene.add.rectangle(x, bY, bW, bH, 0, 0).setInteractive({ useHandCursor: true });
      pop.add(chit);
      chit.on('pointerover',  () => drawC(true));
      chit.on('pointerout',   () => drawC(false));
      chit.on('pointerdown',  () => { pop.destroy(); onConfirm(value); });
    };

    makeBtn(lx, '유  지', prevLabel, false, rawValues ? rawValues[0] : prevLabel);
    makeBtn(rx, '새로운', nextLabel, true,  rawValues ? rawValues[1] : nextLabel);

    // ✕ = 유지
    const xt = scene.add.text(cx + pw*0.44, cy - ph*0.42, '✕', {
      fontSize: this._fs(11), fill: '#4a2a10', fontFamily: FontManager.MONO,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    pop.add(xt);
    xt.on('pointerover',  () => xt.setStyle({ fill: '#c8bfb0' }));
    xt.on('pointerout',   () => xt.setStyle({ fill: '#4a2a10' }));
    xt.on('pointerdown',  () => { pop.destroy(); onConfirm(rawValues ? rawValues[0] : prevLabel); });
  }

  // ════════════════════════════════════════════
  //  영입 확정
  // ════════════════════════════════════════════

  _confirmHire() {
    const { result } = this;
    const statObj = {};
    RECRUIT_STAT_KEYS.forEach((k, i) => { statObj[k] = result.stats[i]; });

    CharacterManager.addCharacter({
      id:        `c_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      name:      result.name,
      age:       16 + Math.floor(Math.random() * 10),
      job:       this.activeJob,
      jobLabel:  this.activeJob === 'fisher' ? '낚시꾼' : '잠수부',
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
    this.scene.time.delayedCall(900, () => this._buildSelect());
  }

  // ════════════════════════════════════════════
  //  토스트
  // ════════════════════════════════════════════

  _toast(msg) {
    const { scene, W, H } = this;
    const tx = scene.add.text(W/2, H*0.88, msg, {
      fontSize: this._fs(12), fill: '#c8a070',
      fontFamily: FontManager.MONO,
      backgroundColor: '#1e1008',
      padding: { x: 12, y: 5 },
    }).setOrigin(0.5).setDepth(60);
    scene.tweens.add({
      targets: tx, alpha: 0, y: tx.y - 20,
      duration: 700, delay: 800,
      onComplete: () => tx.destroy(),
    });
  }
}
