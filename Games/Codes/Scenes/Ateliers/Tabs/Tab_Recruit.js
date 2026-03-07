// ================================================================
//  Tab_Recruit.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruit.js
//
//  [Phase 흐름]
//    READY  → [ 영 입 ] 패널 + 가격 + 확인 스타일 버튼
//    SLOT   → 3개 슬롯머신 동시 가동 (직업 / 스탯합계 표시)
//    PICK   → 3개 결과 카드 중 하나 선택
//    CUSTOM → 커스터마이징 (스탯·외형·패시브·스킬 재설정)
//
//  [외부 의존 — 전역]
//    CharacterManager, SaveManager, scaledFontSize, FontManager
// ================================================================

// ─── 상수 ─────────────────────────────────────────────────────────

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
const RECRUIT_COG_TH      = [10, 25, 45, 65, 80, 95];

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
  fisher: ['강철손','갈고리','파도잡이','심해꾼','녹슨낚시','소금쟁이','파랑이','먹장어','심연꾼','날카로운눈'],
  diver:  ['잠수사','깊은숨','해류','침잠자','해저인','투명수','녹색폐','어둠잠수','산소통','어비스'],
};
const RECRUIT_JOB_LABEL = { fisher: '낚시꾼', diver: '잠수부' };
const RECRUIT_JOBS      = ['fisher', 'diver'];

const RECRUIT_BASE_PRICE   = 5;
const RECRUIT_PRICE_STEP   = 5;
const RECRUIT_MAX_REROLL   = 3;
const RECRUIT_SLOT_TICK    = 55;
const RECRUIT_SLOT_COUNT   = 30;
const RECRUIT_SPRITE_COUNT = 72;

// ─── 유틸 ─────────────────────────────────────────────────────────

function _rWPick(table) {
  const total = table.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of table) { r -= e.weight; if (r <= 0) return e; }
  return table[table.length - 1];
}

function _rCog(sum) {
  for (let i = 0; i < RECRUIT_COG_TH.length; i++) if (sum <= RECRUIT_COG_TH[i]) return i + 1;
  return 7;
}

function _rDist(total) {
  const s = [...RECRUIT_STAT_MINS];
  let rem = total - s.reduce((a, b) => a + b, 0);
  if (rem < 0) rem = 0;
  for (let i = 0; i < rem; i++) s[Math.floor(Math.random() * 5)]++;
  return s;
}

function _rFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function _rSpriteKey() {
  return `char_${String(Math.floor(Math.random() * RECRUIT_SPRITE_COUNT)).padStart(3, '0')}`;
}

// 가챠 1회 결과 생성
function _rRoll() {
  const entry  = _rWPick(RECRUIT_GACHA_TABLE);
  const statSum = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
  const job    = _rFrom(RECRUIT_JOBS);
  const cog    = _rCog(statSum);
  return {
    job, statSum, cog,
    stats:     _rDist(statSum),
    name:      _rFrom(RECRUIT_NAMES[job]),
    spriteKey: _rSpriteKey(),
    passive:   _rFrom(RECRUIT_PASSIVE_POOL[cog]),
    skill:     _rFrom(RECRUIT_SKILL_POOL[cog]),
  };
}

// ─── 메인 클래스 ──────────────────────────────────────────────────

class Tab_Recruit {
  constructor(scene, W, H) {
    this.scene = scene;
    this.W = W;
    this.H = H;

    const save = SaveManager.load() || {};
    this.price = save.recruitPrice ?? RECRUIT_BASE_PRICE;

    this.result  = null;
    this.rerolls = {};

    this._container = scene.add.container(0, 0);
    this._timers = [];
    this._tweens = [];

    this._buildReady();
  }

  show()    { this._container.setVisible(true);  }
  hide()    { this._container.setVisible(false); }

  destroy() {
    this._timers.forEach(t => { if (t && t.remove) t.remove(); });
    this._tweens.forEach(t => { if (t && t.stop)   t.stop();   });
    this._timers = [];
    this._tweens = [];
    this._container.destroy();
  }

  // ── 내부 유틸 ─────────────────────────────────────────────────

  _fs(n)   { return scaledFontSize(n, this.scene.scale); }
  _clear() { this._container.removeAll(true); }

  _delay(ms, fn) {
    const t = this.scene.time.delayedCall(ms, fn);
    this._timers.push(t);
    return t;
  }

  _tween(cfg) {
    const t = this.scene.tweens.add(cfg);
    this._tweens.push(t);
    return t;
  }

  // ════════════════════════════════════════════════════════════════
  //  Phase 1 : READY
  // ════════════════════════════════════════════════════════════════

  _buildReady() {
    this._clear();

    const { scene, W, H } = this;
    const cx = W / 2;
    const cy = H * 0.52;

    const panelW = W * 0.54;
    const panelH = H * 0.55;

    // ── 패널 배경 ─────────────────────────────────────────────
    const panel = scene.add.graphics();
    panel.fillStyle(0x120d07, 1);
    panel.lineStyle(2, 0x7a4018, 0.85);
    panel.strokeRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);
    panel.fillRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);

    // ── 코너 장식 (Tab_Explore 동일) ──────────────────────────
    const deco = scene.add.graphics();
    deco.lineStyle(1, 0x7a4018, 0.7);
    const cs = 14;
    const px  = cx - panelW / 2 + 8;  const py  = cy - panelH / 2 + 8;
    const px2 = cx + panelW / 2 - 8;  const py2 = cy + panelH / 2 - 8;
    deco.lineBetween(px,  py,  px + cs, py);   deco.lineBetween(px,  py,  px,  py + cs);
    deco.lineBetween(px2, py,  px2 - cs, py);  deco.lineBetween(px2, py,  px2, py + cs);
    deco.lineBetween(px,  py2, px + cs, py2);  deco.lineBetween(px,  py2, px,  py2 - cs);
    deco.lineBetween(px2, py2, px2 - cs, py2); deco.lineBetween(px2, py2, px2, py2 - cs);

    // ── [ 영  입 ] 라벨 ─────────────────────────────────────
    const labelY = cy - panelH / 2 + parseInt(this._fs(26));
    const recruitLabel = scene.add.text(cx, labelY, '[ 영  입 ]', {
      fontSize: this._fs(13), fill: '#7a5028',
      fontFamily: FontManager.MONO, letterSpacing: 3,
    }).setOrigin(0.5);

    // ── 구분선 ────────────────────────────────────────────────
    const lineY = cy - panelH / 2 + parseInt(this._fs(44));
    const lineG = scene.add.graphics();
    lineG.lineStyle(1, 0x4a2a10, 0.9);
    lineG.lineBetween(cx - panelW / 2 + 20, lineY, cx + panelW / 2 - 20, lineY);

    // ── 메인 텍스트 (타이핑) ──────────────────────────────────
    const txt = scene.add.text(cx, cy - panelH * 0.10, '', {
      fontSize: this._fs(22), fill: '#e8c080', fontFamily: FontManager.TITLE,
    }).setOrigin(0.5).setAlpha(0);

    // ── 가격 표시 ─────────────────────────────────────────────
    const priceY = cy + panelH * 0.09;
    const priceTxt = scene.add.text(cx, priceY, `${this.price}  Arc`, {
      fontSize: this._fs(28), fill: '#c8a070',
      fontFamily: FontManager.MONO,
      stroke: '#0a0604', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    this._priceTxt = priceTxt;

    const priceLabel = scene.add.text(cx, priceY - parseInt(this._fs(22)), '영입 비용', {
      fontSize: this._fs(10), fill: '#4a2a10', fontFamily: FontManager.MONO,
    }).setOrigin(0.5).setAlpha(0);

    // ── 확인 버튼 (Tab_Explore 스타일 — 주황 글로우) ──────────
    const btnW = parseInt(this._fs(130));
    const btnH = parseInt(this._fs(50));
    const btnY = cy + panelH * 0.33;

    const btnBg   = scene.add.graphics().setAlpha(0);
    const btnGlow = scene.add.graphics().setAlpha(0);

    const drawBtn = (state) => {
      btnBg.clear();
      if (state === 'hover') {
        btnBg.fillStyle(0x5a2808, 1);
        btnBg.lineStyle(2, 0xc87030, 1);
      } else if (state === 'down') {
        btnBg.fillStyle(0x2a1004, 1);
        btnBg.lineStyle(2, 0x9a5018, 1);
      } else {
        btnBg.fillStyle(0x3a1a08, 1);
        btnBg.lineStyle(2, 0xa05018, 0.95);
      }
      btnBg.strokeRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH);
      btnBg.fillRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH);
    };
    drawBtn('normal');

    const drawGlow = (intensity) => {
      btnGlow.clear();
      [
        { pad: 14, alpha: 0.04 * intensity, col: 0xc86020 },
        { pad:  8, alpha: 0.12 * intensity, col: 0xc87030 },
        { pad:  4, alpha: 0.25 * intensity, col: 0xa05018 },
        { pad:  1, alpha: 0.48 * intensity, col: 0x8a3a10 },
      ].forEach(({ pad, alpha, col }) => {
        btnGlow.lineStyle(2, col, alpha);
        btnGlow.strokeRect(
          cx - btnW / 2 - pad, btnY - btnH / 2 - pad,
          btnW + pad * 2, btnH + pad * 2
        );
      });
    };

    const btnTxt = scene.add.text(cx, btnY, '영  입', {
      fontSize: this._fs(24), fill: '#c8a070', fontFamily: FontManager.TITLE,
    }).setOrigin(0.5).setAlpha(0);

    const hit = scene.add.rectangle(cx, btnY, btnW, btnH, 0, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover',  () => { drawBtn('hover'); btnTxt.setStyle({ fill: '#e8c080' }); });
    hit.on('pointerout',   () => { drawBtn('normal'); btnTxt.setStyle({ fill: '#c8a070' }); });
    hit.on('pointerdown',  () => { drawBtn('down');  btnTxt.setStyle({ fill: '#a07040' }); });
    hit.on('pointerup',    () => this._onHire(cx, cy, panelW, panelH));

    this._container.add([panel, deco, recruitLabel, lineG, txt, priceLabel, priceTxt, btnGlow, btnBg, btnTxt, hit]);

    // ── 타이핑 → 버튼 등장 ────────────────────────────────────
    this._delay(80, () => {
      this._typeText(txt, '새로운 동료를 영입하시겠습니까?', 48, () => {
        this._delay(160, () => {
          this._tween({ targets: [priceTxt, priceLabel], alpha: 1, duration: 300, ease: 'Sine.easeOut' });
          this._delay(200, () => this._revealBtn(btnBg, btnGlow, btnTxt, drawBtn, drawGlow));
        });
      });
    });
  }

  _revealBtn(btnBg, btnGlow, btnTxt, drawBtn, drawGlow) {
    this._tween({ targets: btnBg, alpha: { from: 0, to: 1 }, duration: 220 });
    this._delay(80, () => {
      btnGlow.setAlpha(1);
      const go = { v: 0 };
      this._tween({
        targets: go, v: 1, duration: 550, ease: 'Sine.easeOut',
        onUpdate: () => drawGlow(go.v),
        onComplete: () => {
          this._tween({
            targets: go, v: { from: 1, to: 0.35 },
            duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            onUpdate: () => drawGlow(go.v),
          });
        },
      });
    });
    this._delay(100, () => {
      this._tween({ targets: btnTxt, alpha: { from: 0, to: 1 }, duration: 280 });
      this._delay(300, () => {
        this._tween({
          targets: btnTxt, alpha: { from: 1, to: 0.65 },
          duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      });
    });
  }

  _typeText(textObj, fullText, charDelay, onDone) {
    textObj.setAlpha(1).setText('');
    const chars = [...fullText];
    let i = 0;
    const tick = () => {
      if (!textObj || !textObj.scene) return;
      if (i < chars.length) {
        textObj.setText(chars.slice(0, ++i).join(''));
        this._delay(charDelay, tick);
      } else {
        if (onDone) onDone();
      }
    };
    this._delay(charDelay, tick);
  }

  // ════════════════════════════════════════════════════════════════
  //  결제
  // ════════════════════════════════════════════════════════════════

  _onHire(cx, cy, panelW, panelH) {
    const save = SaveManager.load() || {};
    if ((save.arc ?? 0) < this.price) { this._toast('Arc 부족!'); return; }

    save.arc -= this.price;
    this.price += RECRUIT_PRICE_STEP;
    save.recruitPrice = this.price;
    SaveManager.save(save);
    this.scene.events.emit('arcUpdated', save.arc);

    this._buildSlot();
  }

  // ════════════════════════════════════════════════════════════════
  //  Phase 2 : SLOT  (3개 슬롯머신 동시 가동)
  // ════════════════════════════════════════════════════════════════

  _buildSlot() {
    this._clear();

    const { scene, W, H } = this;
    const cx     = W / 2;
    const cy     = H * 0.50;
    const cardW  = W * 0.155;
    const cardH  = cardW * 1.80;
    const gap    = W * 0.032;

    // 3개 최종 결과 미리 확정
    this._rolls = [_rRoll(), _rRoll(), _rRoll()];

    // 카드 3개 배치
    const positions = [
      cx - cardW - gap,
      cx,
      cx + cardW + gap,
    ];

    this._slotDisplays = [];  // { jobTxt, numTxt }

    positions.forEach((x, i) => {
      // 카드 배경
      const bg = scene.add.graphics();
      bg.fillStyle(0x120d07, 0.95);
      bg.lineStyle(1, 0x3a2210, 0.8);
      bg.fillRect(x - cardW/2, cy - cardH/2, cardW, cardH);
      bg.strokeRect(x - cardW/2, cy - cardH/2, cardW, cardH);
      this._container.add(bg);

      // 코너 장식 (작게)
      const dc = scene.add.graphics();
      dc.lineStyle(1, 0x5a3018, 0.6);
      const cs = 8;
      const lx = x - cardW/2 + 6; const rx = x + cardW/2 - 6;
      const ty = cy - cardH/2 + 6; const by2 = cy + cardH/2 - 6;
      dc.lineBetween(lx, ty, lx+cs, ty); dc.lineBetween(lx, ty, lx, ty+cs);
      dc.lineBetween(rx, ty, rx-cs, ty); dc.lineBetween(rx, ty, rx, ty+cs);
      dc.lineBetween(lx, by2, lx+cs, by2); dc.lineBetween(lx, by2, lx, by2-cs);
      dc.lineBetween(rx, by2, rx-cs, by2); dc.lineBetween(rx, by2, rx, by2-cs);
      this._container.add(dc);

      // 카드 번호
      this._container.add(scene.add.text(x, cy - cardH * 0.44, `${i + 1}`, {
        fontSize: this._fs(10), fill: '#3a2010', fontFamily: FontManager.MONO,
      }).setOrigin(0.5));

      // 직업 슬롯
      const jobTxt = scene.add.text(x, cy - cardH * 0.28, '???', {
        fontSize: this._fs(16), fill: '#7a5028',
        fontFamily: FontManager.TITLE,
      }).setOrigin(0.5);
      this._container.add(jobTxt);

      // 구분선
      const sep = scene.add.graphics();
      sep.lineStyle(1, 0x2a1a0a, 0.8);
      sep.lineBetween(x - cardW * 0.38, cy - cardH * 0.14, x + cardW * 0.38, cy - cardH * 0.14);
      this._container.add(sep);

      // 스탯합계 슬롯
      const numTxt = scene.add.text(x, cy + cardH * 0.02, '---', {
        fontSize: this._fs(34), fill: '#c8a070',
        fontStyle: 'bold', fontFamily: FontManager.MONO,
      }).setOrigin(0.5);
      this._container.add(numTxt);

      // 라벨
      this._container.add(scene.add.text(x, cy + cardH * 0.22, '스 탯  합 계', {
        fontSize: this._fs(9), fill: '#3d2010', fontFamily: FontManager.MONO,
      }).setOrigin(0.5));

      this._slotDisplays.push({ jobTxt, numTxt, x });
    });

    // 슬롯 가동
    this._runSlots();
  }

  _runSlots() {
    const JOBS_DISPLAY = ['낚시꾼', '잠수부'];
    let done = 0;

    this._rolls.forEach((roll, i) => {
      let tick = 0;
      // 카드마다 약간씩 시차
      this._delay(i * 80, () => {
        const ev = this.scene.time.addEvent({
          delay: RECRUIT_SLOT_TICK,
          repeat: RECRUIT_SLOT_COUNT + i * 4 - 1,  // 오른쪽 카드일수록 조금 더 돌아감
          callback: () => {
            tick++;
            const total = RECRUIT_SLOT_COUNT + i * 4;
            const { jobTxt, numTxt } = this._slotDisplays[i];

            if (tick < total) {
              // 직업 랜덤 깜빡
              jobTxt.setText(_rFrom(JOBS_DISPLAY));
              // 숫자 랜덤 (후반부에 실제값에 수렴)
              const fake = tick > total * 0.65
                ? roll.statSum + Math.round((Math.random() - 0.5) * (total - tick) * 2.5)
                : Math.floor(Math.random() * 250);
              numTxt.setText(String(Math.max(0, Math.min(250, fake))));
            } else {
              // 최종값 확정
              jobTxt.setText(RECRUIT_JOB_LABEL[roll.job]);
              jobTxt.setStyle({ fill: roll.job === 'fisher' ? '#c8a070' : '#7ab0c8' });
              numTxt.setText(String(roll.statSum));
              done++;
              if (done === 3) {
                // 모든 슬롯 완료 → PICK 페이즈
                this._delay(420, () => this._buildPick());
              }
            }
          },
        });
        this._timers.push(ev);
      });
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  Phase 3 : PICK  (3개 카드 중 선택)
  // ════════════════════════════════════════════════════════════════

  _buildPick() {
    this._clear();

    const { scene, W, H } = this;
    const cx    = W / 2;
    const cy    = H * 0.50;
    const cardW = W * 0.155;
    const cardH = cardW * 1.80;
    const gap   = W * 0.032;

    const positions = [cx - cardW - gap, cx, cx + cardW + gap];

    // 안내 텍스트
    this._container.add(scene.add.text(cx, cy - cardH * 0.56, '영입할 동료를 선택하십시오', {
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

      // 직업
      this._container.add(scene.add.text(x, cy - cardH * 0.40, RECRUIT_JOB_LABEL[roll.job], {
        fontSize: this._fs(16), fontFamily: FontManager.TITLE,
        fill: isF ? '#c8a070' : '#7ab0c8',
      }).setOrigin(0.5));

      // 일러스트 ㅁ (플레이스홀더)
      const iSz = cardW * 0.72;
      const iY  = cy - cardH * 0.12;
      const iBg = scene.add.graphics();
      iBg.fillStyle(0x1a1008, 1);
      iBg.lineStyle(1, 0x2a1a0a, 1);
      iBg.fillRect(x - iSz/2, iY - iSz/2, iSz, iSz);
      iBg.strokeRect(x - iSz/2, iY - iSz/2, iSz, iSz);
      this._container.add(iBg);

      // Cog 등급
      const cogColors = ['','#9ab890','#90a8c8','#c8c070','#c89050','#c85050','#b030b0','#ff2020'];
      this._container.add(scene.add.text(x, iY, `Cog  ${roll.cog}`, {
        fontSize: this._fs(12), fill: cogColors[roll.cog] || '#c8bfb0',
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
      hit.on('pointerover',  () => drawCard(true));
      hit.on('pointerout',   () => drawCard(false));
      hit.on('pointerdown',  () => {
        this.result  = roll;
        this.rerolls = {
          stat: RECRUIT_MAX_REROLL, sprite: RECRUIT_MAX_REROLL,
          passive: RECRUIT_MAX_REROLL, skill: RECRUIT_MAX_REROLL,
        };
        this._buildCustom();
      });
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  Phase 4 : CUSTOM
  // ════════════════════════════════════════════════════════════════

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

  // ── 왼쪽: 결과 요약 ───────────────────────────────────────────

  _buildResultBox(cx, cy, bw, bh) {
    const { scene, result } = this;
    const isF = result.job === 'fisher';

    const bg = scene.add.graphics();
    bg.fillStyle(0x120d07, 0.95); bg.lineStyle(1, 0x3a2210, 0.8);
    bg.fillRect(cx-bw/2, cy-bh/2, bw, bh); bg.strokeRect(cx-bw/2, cy-bh/2, bw, bh);
    this._container.add(bg);

    this._container.add(scene.add.text(cx, cy - bh*0.43, RECRUIT_JOB_LABEL[result.job], {
      fontSize: this._fs(16), fill: isF ? '#c8a070' : '#7ab0c8',
      fontFamily: FontManager.TITLE,
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

    // ── 이름 필드 (스탯 위, 구분선 바로 아래) ───────────────
    this._buildNameField(cx, cy - bh*0.10, bw);

    this._statTexts = [];
    RECRUIT_STAT_LABELS.forEach((label, i) => {
      const y = cy - bh*0.01 + i * (bh * 0.088);
      const t = scene.add.text(cx, y, `${label}  ${result.stats[i]}`, {
        fontSize: this._fs(11), fill: '#c8bfb0', fontFamily: FontManager.MONO,
      }).setOrigin(0.5);
      this._container.add(t);
      this._statTexts.push(t);
    });
  }

  _buildNameField(cx, y, bw) {
    const { scene, result } = this;
    const fW = bw * 0.80; const fH = parseInt(this._fs(22));

    // 배경
    const fbg = scene.add.graphics();
    this._nameFieldBg  = fbg;
    this._nameFieldCx  = cx;
    this._nameFieldY   = y;
    this._nameFieldW   = fW;
    this._nameFieldH   = fH;
    this._nameEditing  = false;
    this._nameBuffer   = result.name;
    this._nameCursorOn = false;

    const drawF = (state) => {
      fbg.clear();
      fbg.fillStyle(state === 'edit' ? 0x2a1408 : 0x1e1008, 1);
      fbg.lineStyle(1,
        state === 'edit'  ? 0xc87030 :
        state === 'hover' ? 0xa05018 : 0x3d2010, 1);
      fbg.fillRect(cx - fW/2, y - fH/2, fW, fH);
      fbg.strokeRect(cx - fW/2, y - fH/2, fW, fH);
    };
    this._drawNameField = drawF;
    drawF('normal');
    this._container.add(fbg);

    // 이름 텍스트 (커서 포함해서 표시)
    this._nameTxt = scene.add.text(cx, y, result.name, {
      fontSize: this._fs(12), fill: '#c8a070', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._container.add(this._nameTxt);

    // 히트 영역
    const hit = scene.add.rectangle(cx, y, fW, fH, 0, 0)
      .setInteractive({ useHandCursor: true });
    this._container.add(hit);
    hit.on('pointerover',  () => { if (!this._nameEditing) drawF('hover'); });
    hit.on('pointerout',   () => { if (!this._nameEditing) drawF('normal'); });
    hit.on('pointerdown',  () => this._startNameEdit());

    // 바깥 클릭으로 종료
    scene.input.on('pointerdown', (ptr) => {
      if (!this._nameEditing) return;
      const dx = Math.abs(ptr.x - cx);
      const dy = Math.abs(ptr.y - y);
      if (dx > fW/2 || dy > fH/2) this._commitNameEdit();
    });
  }

  _startNameEdit() {
    if (this._nameEditing) return;
    this._nameEditing  = true;
    this._nameBuffer   = this.result.name;
    this._drawNameField('edit');

    // 커서 점멸 타이머
    this._nameCursorTimer = this.scene.time.addEvent({
      delay: 500, loop: true,
      callback: () => {
        if (!this._nameEditing) return;
        this._nameCursorOn = !this._nameCursorOn;
        this._refreshNameTxt();
      },
    });

    // 키보드 입력 수신
    this._nameKeyHandler = (evt) => {
      if (!this._nameEditing) return;
      const key = evt.key;
      if (key === 'Enter' || key === 'Escape') {
        this._commitNameEdit();
      } else if (key === 'Backspace') {
        if (this._nameBuffer.length > 0)
          this._nameBuffer = [...this._nameBuffer].slice(0, -1).join('');
        this._refreshNameTxt();
      } else if (key.length === 1 && this._nameBuffer.length < 10) {
        this._nameBuffer += key;
        this._refreshNameTxt();
      }
    };
    window.addEventListener('keydown', this._nameKeyHandler);
    this._refreshNameTxt();
  }

  _refreshNameTxt() {
    const cursor = this._nameEditing && this._nameCursorOn ? '|' : '';
    this._nameTxt.setText(this._nameBuffer + cursor);
  }

  _commitNameEdit() {
    if (!this._nameEditing) return;
    this._nameEditing = false;
    if (this._nameCursorTimer) { this._nameCursorTimer.remove(); this._nameCursorTimer = null; }
    if (this._nameKeyHandler)  { window.removeEventListener('keydown', this._nameKeyHandler); this._nameKeyHandler = null; }
    const v = this._nameBuffer.trim();
    if (v) { this.result.name = v; } else { this._nameBuffer = this.result.name; }
    this._nameTxt.setText(this.result.name);
    this._drawNameField('normal');
  }

  // ── 오른쪽: 커스터마이징 ──────────────────────────────────────

  _buildCustomBox(cx, cy, bw, bh) {
    const { scene, result } = this;

    const bg = scene.add.graphics();
    bg.fillStyle(0x120d07, 0.95); bg.lineStyle(1, 0x3a2210, 0.8);
    bg.fillRect(cx-bw/2, cy-bh/2, bw, bh); bg.strokeRect(cx-bw/2, cy-bh/2, bw, bh);
    this._container.add(bg);

    // 외형 ㅁ
    const iSz = bw * 0.40; const iY = cy - bh * 0.29;
    const iBg = scene.add.graphics();
    iBg.fillStyle(0x1e1008, 1); iBg.lineStyle(1, 0x3d2010, 1);
    iBg.fillRect(cx-iSz/2, iY-iSz/2, iSz, iSz); iBg.strokeRect(cx-iSz/2, iY-iSz/2, iSz, iSz);
    this._container.add(iBg);
    this._spriteBoxX  = cx;
    this._spriteBoxY  = iY;
    this._spriteBoxSz = iSz;
    // 스프라이트 이미지 or 번호 텍스트
    this._spriteImg = null;
    this._spriteKeyTxt = null;
    this._renderSpriteBox(result.spriteKey);

    this._spriteBtn = this._makeRerollBtn(cx, iY + iSz*0.58, bw*0.70,
      `외형  🎲  ${this.rerolls.sprite}`, () => this._rerollSprite());

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

  // 외형 박스 내용 렌더링 (이미지 or 번호 텍스트)
  _renderSpriteBox(spriteKey) {
    const { scene } = this;
    const cx  = this._spriteBoxX;
    const iY  = this._spriteBoxY;
    const iSz = this._spriteBoxSz;

    // 기존 이미지/텍스트 제거
    if (this._spriteImg)    { this._spriteImg.destroy();    this._spriteImg    = null; }
    if (this._spriteKeyTxt) { this._spriteKeyTxt.destroy(); this._spriteKeyTxt = null; }

    if (spriteKey && scene.textures.exists(spriteKey)) {
      const img = scene.add.image(cx, iY, spriteKey).setOrigin(0.5);
      const sc  = Math.min(iSz / img.width, iSz / img.height) * 0.92;
      img.setScale(sc);
      this._spriteImg = img;
      this._container.add(img);
    } else {
      const num = parseInt(spriteKey.replace('char_','')) + 1;
      this._spriteKeyTxt = scene.add.text(cx, iY, `#${num}`, {
        fontSize: this._fs(11), fill: '#3d2010', fontFamily: FontManager.MONO,
      }).setOrigin(0.5);
      this._container.add(this._spriteKeyTxt);
    }
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

  // ── 재설정 ────────────────────────────────────────────────────

  _rerollStats() {
    if (this.rerolls.stat <= 0) { this._toast('재설정 횟수 소진'); return; }
    const prev = [...this.result.stats];
    const next = _rDist(this.result.statSum);
    this._showStatPopup(prev, next, (chosen) => {
      this.result.stats = chosen; this.rerolls.stat--;
      chosen.forEach((v,i) => this._statTexts[i].setText(`${RECRUIT_STAT_LABELS[i]}  ${v}`));
      if (this.rerolls.stat <= 0) this._disableBtn(this._statBtn, '스탯 재설정  ✕');
      else this._statBtn.txt.setText(`스탯 재설정  🎲  ${this.rerolls.stat}`);
    });
  }

  _rerollSprite() {
    if (this.rerolls.sprite <= 0) { this._toast('재설정 횟수 소진'); return; }
    const prev = this.result.spriteKey;
    const next = _rSpriteKey();
    this._showChoicePopup('외형  재설정',
      `외형  #${parseInt(prev.replace('char_',''))+1}`,
      `외형  #${parseInt(next.replace('char_',''))+1}`,
      (chosen) => {
        this.result.spriteKey = chosen; this.rerolls.sprite--;
        this._renderSpriteBox(chosen);
        if (this.rerolls.sprite <= 0) this._disableBtn(this._spriteBtn, '외형  ✕');
        else this._spriteBtn.txt.setText(`외형  🎲  ${this.rerolls.sprite}`);
      }, [prev, next]);
  }

  _rerollPassive() {
    if (this.rerolls.passive <= 0) { this._toast('재설정 횟수 소진'); return; }
    const prev = this.result.passive;
    const next = _rFrom(RECRUIT_PASSIVE_POOL[this.result.cog]);
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
    const next = _rFrom(RECRUIT_SKILL_POOL[this.result.cog]);
    this._showChoicePopup('스킬  재설정', prev, next,
      (chosen) => {
        this.result.skill = chosen; this.rerolls.skill--;
        this._skillTxt.setText(chosen);
        if (this.rerolls.skill <= 0) this._disableBtn(this._skillBtn, '✕');
        else this._skillBtn.txt.setText(`🎲  ${this.rerolls.skill}`);
      }, [prev, next]);
  }

  // ── 선택 팝업 ─────────────────────────────────────────────────

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

  }

  // ════════════════════════════════════════════════════════════════
  //  스탯 재설정 팝업 (전용)
  //  - 오버레이 + 두 패널 (이전 / 변경)
  //  - 패널 클릭 → 발광 → 한 번 더 클릭 → 확정
  //  - x 버튼 없음 (반드시 하나를 선택해야 닫힘)
  // ════════════════════════════════════════════════════════════════

  _showStatPopup(prevStats, nextStats, onConfirm) {
    const { scene, W, H } = this;
    const cx = W / 2;
    const cy = H / 2;

    // ── 씬 직접 오버레이 ─────────────────────────────────────
    const overlay = scene.add.rectangle(0, 0, W, H, 0x000000, 0.80)
      .setOrigin(0).setDepth(80);

    // ── 팝업 컨테이너 (박스 두 개만) ─────────────────────────
    const pop = scene.add.container(0, 0).setDepth(81);

    // ── 두 패널 크기/위치 (화면 중앙 정렬) ───────────────────
    const bW  = W * 0.26;
    const bH  = H * 0.48;
    const gap = W * 0.04;
    const lx  = cx - bW/2 - gap/2;
    const rx  = cx + bW/2 + gap/2;
    const bY  = cy;
    const rowH = bH / (RECRUIT_STAT_LABELS.length + 1.5);

    let selectedSide = null;  // 'prev' | 'next'

    const makeStatPanel = (panelX, stats, isPrev) => {
      const side   = isPrev ? 'prev' : 'next';
      const panelG = scene.add.graphics();
      const glowG  = scene.add.graphics();

      const drawPanel = (state) => {
        panelG.clear();
        glowG.clear();

        // state: 'normal' | 'hover' | 'selected'
        if (state === 'selected') {
          panelG.fillStyle(isPrev ? 0x1a1206 : 0x0e1a08, 1);
          panelG.lineStyle(2, isPrev ? 0xc8a030 : 0x40c840, 1);
          // 발광 레이어
          [
            { pad: 12, a: 0.07, c: isPrev ? 0xc8a030 : 0x30c830 },
            { pad:  7, a: 0.18, c: isPrev ? 0xc8a030 : 0x30c830 },
            { pad:  3, a: 0.35, c: isPrev ? 0xb08020 : 0x20b820 },
            { pad:  1, a: 0.60, c: isPrev ? 0x906010 : 0x10a010 },
          ].forEach(({ pad, a, c }) => {
            glowG.lineStyle(2, c, a);
            glowG.strokeRect(panelX - bW/2 - pad, bY - bH/2 - pad, bW + pad*2, bH + pad*2);
          });
        } else if (state === 'hover') {
          panelG.fillStyle(0x1a1208, 1);
          panelG.lineStyle(1, 0x5a3010, 0.9);
        } else {
          panelG.fillStyle(0x120d07, 1);
          panelG.lineStyle(1, 0x2a1a08, 0.7);
        }
        panelG.fillRect(panelX - bW/2, bY - bH/2, bW, bH);
        panelG.strokeRect(panelX - bW/2, bY - bH/2, bW, bH);
      };

      drawPanel('normal');
      pop.add(glowG);
      pop.add(panelG);

      // 헤더 라벨
      pop.add(scene.add.text(panelX, bY - bH*0.44,
        isPrev ? '◀  현재 스탯' : '새로운 스탯  ▶', {
        fontSize: this._fs(12), fill: isPrev ? '#c8a060' : '#60c860',
        fontFamily: FontManager.MONO, letterSpacing: 2,
      }).setOrigin(0.5));

      // 구분선
      const hlineG = scene.add.graphics();
      hlineG.lineStyle(1, 0x2a1808, 0.7);
      hlineG.lineBetween(panelX - bW*0.42, bY - bH*0.36, panelX + bW*0.42, bY - bH*0.36);
      pop.add(hlineG);

      // 스탯 행들
      RECRUIT_STAT_LABELS.forEach((label, i) => {
        const ry  = bY - bH*0.28 + i * rowH;
        const val = stats[i];
        const diff = val - prevStats[i];   // 현재 패널(prev)이면 0, next면 차이값

        // 스탯 이름
        pop.add(scene.add.text(panelX - bW*0.38, ry, label, {
          fontSize: this._fs(13), fill: '#a08060',
          fontFamily: FontManager.MONO,
        }).setOrigin(0, 0.5));

        // 스탯 수치
        pop.add(scene.add.text(panelX + bW*0.10, ry, String(val), {
          fontSize: this._fs(15), fill: '#e8d4a0',
          fontFamily: FontManager.MONO, fontStyle: 'bold',
        }).setOrigin(0.5, 0.5));

        // 차이 표시 (next 패널만)
        if (!isPrev && diff !== 0) {
          const arrow = diff > 0 ? '▲' : '▼';
          const col   = diff > 0 ? '#50e050' : '#e05050';
          pop.add(scene.add.text(panelX + bW*0.38, ry,
            `${arrow} ${Math.abs(diff)}`, {
            fontSize: this._fs(13), fill: col,
            fontFamily: FontManager.MONO,
          }).setOrigin(1, 0.5));
        }
      });

      // 히트 영역
      const hit = scene.add.rectangle(panelX, bY, bW, bH, 0, 0)
        .setInteractive({ useHandCursor: true });
      pop.add(hit);

      hit.on('pointerover', () => {
        if (selectedSide !== side) drawPanel('hover');
      });
      hit.on('pointerout', () => {
        if (selectedSide !== side) drawPanel('normal');
      });
      // pointerdown은 prevPanel/nextPanel 생성 후 아래에서 등록

      return { drawPanel, hit };
    };

    const prevPanel = makeStatPanel(lx, prevStats, true);
    const nextPanel = makeStatPanel(rx, nextStats, false);

    // otherDraw 패치 — 히트박스 pointerdown 재등록
    prevPanel.hit.removeAllListeners();
    prevPanel.hit.on('pointerover', () => {
      if (selectedSide !== 'prev') prevPanel.drawPanel('hover');
    });
    prevPanel.hit.on('pointerout', () => {
      if (selectedSide !== 'prev') prevPanel.drawPanel('normal');
    });
    prevPanel.hit.on('pointerdown', () => {
      if (selectedSide === 'prev') {
        overlay.destroy(); pop.destroy(); onConfirm(prevStats);
      } else {
        selectedSide = 'prev';
        prevPanel.drawPanel('selected');
        nextPanel.drawPanel('normal');
      }
    });

    nextPanel.hit.removeAllListeners();
    nextPanel.hit.on('pointerover', () => {
      if (selectedSide !== 'next') nextPanel.drawPanel('hover');
    });
    nextPanel.hit.on('pointerout', () => {
      if (selectedSide !== 'next') nextPanel.drawPanel('normal');
    });
    nextPanel.hit.on('pointerdown', () => {
      if (selectedSide === 'next') {
        overlay.destroy(); pop.destroy(); onConfirm(nextStats);
      } else {
        selectedSide = 'next';
        nextPanel.drawPanel('selected');
        prevPanel.drawPanel('normal');
      }
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  영입 확정
  // ════════════════════════════════════════════════════════════════

  _confirmHire() {
    const { result } = this;
    const statObj = {};
    RECRUIT_STAT_KEYS.forEach((k, i) => { statObj[k] = result.stats[i]; });

    CharacterManager.addCharacter({
      id:        `c_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
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
  }

  // ════════════════════════════════════════════════════════════════
  //  토스트
  // ════════════════════════════════════════════════════════════════

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
