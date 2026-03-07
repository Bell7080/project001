// ================================================================
//  Tab_Welcome.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Welcome.js
//
//  역할: 게임 시작 / 복귀 시 공방 진입 환영 화면
//        "환  영  합  니  다" 타이핑 효과 출력
//        클릭 또는 타이핑 완료 후 onDone 콜백 호출
//
//  사용:
//    const welcome = new Tab_Welcome(scene, W, H, () => {
//      // 닫힌 후 처리 (탭 전환 등)
//    });
// ================================================================

class Tab_Welcome {
  constructor(scene, W, H, onDone) {
    this.scene   = scene;
    this.W       = W;
    this.H       = H;
    this._onDone = onDone || (() => {});
    this._timers = [];
    this._tweens = [];
    this._container = scene.add.container(0, 0).setDepth(200);
    this._build();
  }

  _build() {
    const { scene, W, H } = this;
    const fs = n => scaledFontSize(n, scene.scale);

    // ── 배경 오버레이 ─────────────────────────────────────────
    const overlay = scene.add.rectangle(0, 0, W, H, 0x000000, 0.72)
      .setOrigin(0).setInteractive();
    overlay.on('pointerup', () => this._close());
    this._container.add(overlay);

    // ── 패널 ─────────────────────────────────────────────────
    const pw = W * 0.50;
    const ph = H * 0.36;
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;

    const panelBg = scene.add.graphics();
    panelBg.fillStyle(0x080604, 0.99);
    panelBg.lineStyle(1, 0x3a2010, 0.9);
    panelBg.strokeRect(px, py, pw, ph);
    panelBg.fillRect(px, py, pw, ph);

    // 코너 장식
    panelBg.lineStyle(1, 0x6a3a18, 0.6);
    const cs = 12;
    [[px+5, py+5, 1, 1], [px+pw-5, py+5, -1, 1],
     [px+5, py+ph-5, 1, -1], [px+pw-5, py+ph-5, -1, -1]]
      .forEach(([ox, oy, sx, sy]) => {
        panelBg.lineBetween(ox, oy, ox + cs*sx, oy);
        panelBg.lineBetween(ox, oy, ox, oy + cs*sy);
      });
    this._container.add(panelBg);

    // ── 텍스트 ───────────────────────────────────────────────
    const cx = px + pw / 2;

    const txt1 = scene.add.text(cx, py + ph * 0.30, '', {
      fontSize: fs(22), fill: '#d4a060',
      fontFamily: FontManager.TITLE, letterSpacing: 6,
    }).setOrigin(0.5).setAlpha(0);
    this._container.add(txt1);

    const txt2 = scene.add.text(cx, py + ph * 0.52, '', {
      fontSize: fs(13), fill: '#5a3818',
      fontFamily: FontManager.MONO, letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);
    this._container.add(txt2);

    // 하단 힌트
    const hint = scene.add.text(cx, py + ph * 0.82, '─  클릭하여 계속  ─', {
      fontSize: fs(9), fill: '#2a1808', fontFamily: FontManager.MONO,
    }).setOrigin(0.5).setAlpha(0);
    this._container.add(hint);

    // ── 타이핑 시퀀스 ─────────────────────────────────────────
    this._delay(100, () => {
      this._typeText(txt1, '환  영  합  니  다', 60, () => {
        this._delay(280, () => {
          this._typeText(txt2, ': )', 90, () => {
            this._delay(200, () => {
              this._tween({ targets: hint, alpha: 0.5, duration: 700 });
              this._delay(900, () => {
                this._tween({
                  targets: hint,
                  alpha: { from: 0.5, to: 0.15 },
                  duration: 1100, yoyo: true, repeat: -1,
                  ease: 'Sine.easeInOut',
                });
              });
            });
          });
        });
      });
    });
  }

  // ── 타이핑 효과 ─────────────────────────────────────────────
  _typeText(textObj, fullText, charDelay, onDone) {
    textObj.setAlpha(1).setText('');
    const chars = [...fullText];
    let i = 0;
    const tick = () => {
      if (!textObj || !textObj.scene) return;
      if (i < chars.length) {
        textObj.setText(chars.slice(0, ++i).join(''));
        this._timers.push(this.scene.time.delayedCall(charDelay, tick));
      } else {
        if (onDone) onDone();
      }
    };
    this._timers.push(this.scene.time.delayedCall(charDelay, tick));
  }

  _delay(ms, fn) {
    this._timers.push(this.scene.time.delayedCall(ms, fn));
  }

  _tween(cfg) {
    const t = this.scene.tweens.add(cfg);
    this._tweens.push(t);
    return t;
  }

  _close() {
    this._tween({
      targets: this._container, alpha: 0, duration: 300,
      onComplete: () => {
        this.destroy();
        this._onDone();
      },
    });
  }

  show()    { this._container.setVisible(true); }
  hide()    { this._container.setVisible(false); }

  destroy() {
    this._timers.forEach(t => { if (t && t.remove) t.remove(); });
    this._tweens.forEach(t => { if (t && t.stop) t.stop(); });
    if (this._container) { this._container.destroy(); this._container = null; }
  }
}
