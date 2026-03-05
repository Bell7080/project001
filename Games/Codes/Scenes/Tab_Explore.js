// ================================================================
//  Tab_Explore.js
//  경로: Games/Codes/Scenes/Tab_Explore.js
//
//  역할: 탐색 탭 — 중앙 패널에 확인 화면 표시
//  의존: FontManager, utils.js
// ================================================================

class Tab_Explore {
  constructor(scene, W, H) {
    this.scene = scene;
    this.W = W;
    this.H = H;
    this._container = scene.add.container(0, 0);
    this._build();
  }

  _build() {
    const { scene, W, H } = this;
    const cx = W / 2;
    const cy = H * 0.50;

    // ── 패널 배경 ────────────────────────────────────────────
    const panelW = W * 0.52;
    const panelH = H * 0.52;
    const panel = scene.add.graphics();
    panel.fillStyle(0x080604, 0.96);
    panel.lineStyle(1, 0x2a1a0a, 0.8);
    panel.strokeRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);
    panel.fillRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);

    // 패널 내부 코너 장식
    const deco = scene.add.graphics();
    deco.lineStyle(1, 0x2a1a0a, 0.5);
    const cs = 10;
    const px = cx - panelW / 2 + 8;
    const py = cy - panelH / 2 + 8;
    const px2 = cx + panelW / 2 - 8;
    const py2 = cy + panelH / 2 - 8;
    deco.lineBetween(px, py, px + cs, py);
    deco.lineBetween(px, py, px, py + cs);
    deco.lineBetween(px2, py, px2 - cs, py);
    deco.lineBetween(px2, py, px2, py + cs);
    deco.lineBetween(px, py2, px + cs, py2);
    deco.lineBetween(px, py2, px, py2 - cs);
    deco.lineBetween(px2, py2, px2 - cs, py2);
    deco.lineBetween(px2, py2, px2, py2 - cs);

    // ── 상단 작은 라벨 ───────────────────────────────────────
    scene.add.text(cx, cy - panelH / 2 + parseInt(scaledFontSize(22, scene.scale)), '[ 탐  색 ]', {
      fontSize:   scaledFontSize(12, scene.scale),
      fill:       '#2a1508',
      fontFamily: FontManager.MONO,
      letterSpacing: 3,
    }).setOrigin(0.5, 0.5);

    // ── 구분선 ───────────────────────────────────────────────
    const lineY = cy - panelH / 2 + parseInt(scaledFontSize(40, scene.scale));
    const lineG = scene.add.graphics();
    lineG.lineStyle(1, 0x1e1008, 1);
    lineG.lineBetween(cx - panelW / 2 + 16, lineY, cx + panelW / 2 - 16, lineY);

    // ── 메인 텍스트 ──────────────────────────────────────────
    scene.add.text(cx, cy - panelH * 0.08, '심해를 직면할', {
      fontSize:   scaledFontSize(28, scene.scale),
      fill:       '#6b4020',
      fontFamily: FontManager.TITLE,
    }).setOrigin(0.5);

    scene.add.text(cx, cy + panelH * 0.10, '준비가 되었습니까?', {
      fontSize:   scaledFontSize(28, scene.scale),
      fill:       '#6b4020',
      fontFamily: FontManager.TITLE,
    }).setOrigin(0.5);

    // ── 확인 버튼 ────────────────────────────────────────────
    const btnW  = parseInt(scaledFontSize(110, scene.scale));
    const btnH  = parseInt(scaledFontSize(42, scene.scale));
    const btnY  = cy + panelH * 0.34;

    const btnBg = scene.add.graphics();

    const drawBtn = (state) => {
      btnBg.clear();
      if (state === 'hover') {
        btnBg.fillStyle(0x3a0a0a, 1);
        btnBg.lineStyle(2, 0xcc3010, 1);
      } else if (state === 'down') {
        btnBg.fillStyle(0x200505, 1);
        btnBg.lineStyle(2, 0x8a2008, 1);
      } else {
        btnBg.fillStyle(0x280808, 1);
        btnBg.lineStyle(2, 0x8a2010, 0.9);
      }
      btnBg.strokeRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH);
      btnBg.fillRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH);
    };
    drawBtn('normal');

    const btnTxt = scene.add.text(cx, btnY, '확  인', {
      fontSize:   scaledFontSize(22, scene.scale),
      fill:       '#cc4418',
      fontFamily: FontManager.TITLE,
    }).setOrigin(0.5);

    const hit = scene.add.rectangle(cx, btnY, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => {
      drawBtn('hover');
      btnTxt.setStyle({ fill: '#ff6633' });
    });
    hit.on('pointerout', () => {
      drawBtn('normal');
      btnTxt.setStyle({ fill: '#cc4418' });
    });
    hit.on('pointerdown', () => {
      drawBtn('down');
      btnTxt.setStyle({ fill: '#ff3300' });
    });
    hit.on('pointerup', () => {
      scene.scene.start('ExploreScene', { from: 'AtelierScene' });
    });

    this._container.add([panel, deco, lineG]);
  }

  show()    { this._container.setVisible(true);  }
  hide()    { this._container.setVisible(false); }
  destroy() { this._container.destroy(); }
}
