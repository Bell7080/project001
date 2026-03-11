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

// ─── 메인 클래스 ──────────────────────────────────────────────────
//  상수·유틸 함수는 Recruit_Data.js 참조

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

    // ── [ 영  입 ] 라벨 ────────────────────────────────────────
    const labelY = cy - panelH / 2 + parseInt(this._fs(26));
    scene.add.text(cx, labelY, '[ 영  입 ]', {
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
    hit.on('pointerup',    () => this._onHire());

    this._container.add([panel, deco, lineG, txt, priceLabel, priceTxt, btnGlow, btnBg, btnTxt, hit]);

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

  // ── 탭 버튼 잠금/해제 ─────────────────────────────────────────
  // AtelierScene._sideButtonRefs 의 btn 들을 직접 껐다 켜서 차단하고
  // 검은 반투명 오버레이로 시각적으로도 잠금 표시
  _lockTabs() {
    const refs = this.scene._sideButtonRefs || [];
    refs.forEach(({ btn }) => btn.disableInteractive());

    if (!this._lockOverlay) {
      this._lockOverlay = this.scene.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.55)
        .setOrigin(0).setDepth(10);
      this._container.setDepth(11);
    }
  }

  _unlockTabs() {
    const refs = this.scene._sideButtonRefs || [];
    refs.forEach(({ btn }) => btn.setInteractive({ useHandCursor: true }));

    if (this._lockOverlay) {
      this._lockOverlay.destroy();
      this._lockOverlay = null;
    }
    this._container.setDepth(0);
  }

  _onHire() {
    const save = SaveManager.load() || {};
    if ((save.arc ?? 0) < this.price) { this._toast('Arc 부족!'); return; }
    save.arc -= this.price;
    this.price += RECRUIT_PRICE_STEP;
    save.recruitPrice = this.price;
    SaveManager.save(save);
    this.scene.events.emit('arcUpdated', save.arc);

    this._lockTabs();
    this._buildSlot();
  }

  // ════════════════════════════════════════════════════════════════
  //  Phase 2 : SLOT  (3개 슬롯머신 동시 가동)
  //  → Recruit_Slot.js 에 위임
  // ════════════════════════════════════════════════════════════════

  _buildSlot() {
    // Recruit_Slot.js의 prototype 메서드로 실행됨
  }

  // ════════════════════════════════════════════════════════════════
  //  Phase 3 : PICK  (3개 카드 중 선택)
  //  → Recruit_Pick.js 에 위임
  // ════════════════════════════════════════════════════════════════

  _buildPick() {
    // Recruit_Pick.js의 prototype 메서드로 실행됨
  }

  // ════════════════════════════════════════════════════════════════
  //  영입 확정  ← 수정: position / overclock / mastery / pendingStats 추가
  // ════════════════════════════════════════════════════════════════

  _confirmHire() {
    const { result } = this;
    const statObj = {};
    RECRUIT_STAT_KEYS.forEach((k, i) => { statObj[k] = result.stats[i]; });

    CharacterManager.addCharacter({
      id:           `c_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      name:         result.name,
      age:          16 + Math.floor(Math.random() * 10),
      job:          result.job,
      jobLabel:     RECRUIT_JOB_LABEL[result.job],
      stats:        statObj,
      statSum:      result.statSum,
      cog:          result.cog,
      position:     result.position  ?? null,   // ← 추가
      passive:      result.passive,
      skill:        result.skill,
      overclock:    result.overclock ?? null,   // ← 추가
      mastery:      0,                          // ← 추가
      pendingStats: 0,                          // ← 추가
      currentHp:    statObj.hp * 10,
      maxHp:        statObj.hp * 10,
      spriteKey:    result.spriteKey,
    });

    this._unlockTabs();
    this._clear();

    this._showHireCompletePopup(result.name, () => {
      this._buildReady();
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  토스트
  // ════════════════════════════════════════════════════════════════

  _toast(msg) {
    const { scene, W, H } = this;
    const cx    = W / 2;
    const cy    = H / 2;
    const depth = 300;
    const bW    = parseInt(scaledFontSize(220, scene.scale));
    const bH    = parseInt(scaledFontSize(54,  scene.scale));

    const box = scene.add.graphics().setDepth(depth).setAlpha(0);
    box.fillStyle(0x0d0a06, 0.94);
    box.fillRoundedRect(cx - bW/2, cy - bH/2, bW, bH, 8);
    box.lineStyle(2, 0x8a3010, 0.9);
    box.strokeRoundedRect(cx - bW/2, cy - bH/2, bW, bH, 8);
    box.lineStyle(1, 0x3a1008, 0.5);
    box.strokeRoundedRect(cx - bW/2 + 4, cy - bH/2 + 4, bW - 8, bH - 8, 5);

    const txt = scene.add.text(cx, cy, msg, {
      fontSize: scaledFontSize(15, scene.scale),
      fill: '#e06030', fontFamily: FontManager.MONO,
    }).setOrigin(0.5).setDepth(depth + 1).setAlpha(0);

    scene.tweens.add({
      targets: [box, txt], alpha: 1, duration: 180, ease: 'Sine.easeOut',
      onComplete: () => {
        scene.time.delayedCall(1100, () => {
          scene.tweens.add({
            targets: [box, txt], alpha: 0, duration: 300, ease: 'Sine.easeIn',
            onComplete: () => { box.destroy(); txt.destroy(); },
          });
        });
      },
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  영입 완료 팝업
  // ════════════════════════════════════════════════════════════════

  _showHireCompletePopup(name, onDone) {
    const { scene, W, H } = this;
    const cx    = W / 2;
    const cy    = H / 2;
    const depth = 200;

    const overlay = scene.add.rectangle(0, 0, W, H, 0x000000, 0)
      .setOrigin(0).setDepth(depth);

    const bW    = parseInt(scaledFontSize(280, scene.scale));
    const bH    = parseInt(scaledFontSize(90,  scene.scale));
    const boxCy = cy + parseInt(scaledFontSize(4, scene.scale));

    const msgBox = scene.add.graphics().setDepth(depth + 0.5).setAlpha(0);
    msgBox.fillStyle(0x0d0a06, 0.92);
    msgBox.fillRoundedRect(cx - bW/2, boxCy - bH/2, bW, bH, 10);
    msgBox.lineStyle(2, 0x9a6020, 0.85);
    msgBox.strokeRoundedRect(cx - bW/2, boxCy - bH/2, bW, bH, 10);
    msgBox.lineStyle(1, 0x3a2010, 0.4);
    msgBox.strokeRoundedRect(cx - bW/2 + 4, boxCy - bH/2 + 4, bW - 8, bH - 8, 7);

    const mainTxt = scene.add.text(cx, cy - parseInt(scaledFontSize(10, scene.scale)),
      `${name}  영입 완료`, {
      fontSize: scaledFontSize(28, scene.scale),
      fill: '#e8c070', fontFamily: FontManager.TITLE,
      stroke: '#0a0604', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(depth + 1);

    const subTxt = scene.add.text(cx, cy + parseInt(scaledFontSize(18, scene.scale)),
      '새로운 동료가 합류했습니다', {
      fontSize: scaledFontSize(13, scene.scale),
      fill: '#8a6030', fontFamily: FontManager.MONO,
    }).setOrigin(0.5).setAlpha(0).setDepth(depth + 1);

    scene.tweens.add({ targets: overlay, alpha: 0.55, duration: 200, ease: 'Sine.easeOut' });
    scene.tweens.add({
      targets: [msgBox, mainTxt, subTxt], alpha: 1,
      duration: 220, ease: 'Sine.easeOut',
      onComplete: () => {
        scene.time.delayedCall(1400, () => {
          scene.tweens.add({
            targets: [overlay, msgBox, mainTxt, subTxt],
            alpha: 0, duration: 380, ease: 'Sine.easeIn',
            onComplete: () => {
              overlay.destroy(); msgBox.destroy();
              mainTxt.destroy(); subTxt.destroy();
              if (onDone) onDone();
            },
          });
        });
      },
    });
  }
}
