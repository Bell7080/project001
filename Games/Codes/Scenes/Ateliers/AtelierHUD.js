// ================================================================
//  AtelierHUD.js
//  경로: Games/Codes/Scenes/Atelier/AtelierHUD.js
//
//  역할: 공방 화면 상단 중앙 — Day / Arc 표시
//  의존: FontManager, SaveManager, utils.js
// ================================================================

class AtelierHUD {

  constructor(scene, W, H) {
    this.scene = scene;
    this.W = W;
    this.H = H;
    this._build();
  }

  _build() {
    const { scene, W, H } = this;
    const cx   = W / 2;
    const topY = H * 0.045;
    const barH = parseInt(scaledFontSize(32, scene.scale));
    const gap  = parseInt(scaledFontSize(6, scene.scale));

    const { day } = SaveManager.getProgress();
    const arc     = this._getArc();

    // ── DAY 패널 (좌) ────────────────────────────────────────
    const dayW = W * 0.18;
    const dayX = cx - gap / 2 - dayW;

    const dayBg = scene.add.graphics();
    dayBg.fillStyle(0x0e0905, 0.96);
    dayBg.lineStyle(1, 0x3a2010, 0.9);
    dayBg.strokeRect(dayX, topY - barH / 2, dayW, barH);
    dayBg.fillRect(dayX, topY - barH / 2, dayW, barH);

    scene.add.text(dayX + dayW / 2, topY, `DAY  ${day}`, {
      fontSize:      scaledFontSize(14, scene.scale),
      fill:          '#a07040',
      fontFamily:    FontManager.MONO,
      letterSpacing: 2,
    }).setOrigin(0.5);

    // ── ARC 패널 (우) — 화폐 스타일 ─────────────────────────
    const arcW = W * 0.18;
    const arcX = cx + gap / 2;

    const arcBg = scene.add.graphics();
    arcBg.fillStyle(0x0c0a04, 0.98);
    arcBg.lineStyle(2, 0x7a5010, 0.95);
    arcBg.strokeRect(arcX, topY - barH / 2, arcW, barH);
    arcBg.fillRect(arcX, topY - barH / 2, arcW, barH);
    // 내부 얇은 테두리
    arcBg.lineStyle(1, 0x3a2008, 0.6);
    arcBg.strokeRect(arcX + 2, topY - barH / 2 + 2, arcW - 4, barH - 4);

    // Arc 라벨 (앞, 크고 진하게) + 숫자 (뒤)
    const arcCx = arcX + arcW / 2;

    scene.add.text(arcX + parseInt(scaledFontSize(10, scene.scale)), topY,
      'ARC', {
      fontSize:      scaledFontSize(15, scene.scale),
      fill:          '#c8881a',
      fontFamily:    FontManager.MONO,
      fontStyle:     'bold',
      letterSpacing: 3,
    }).setOrigin(0, 0.5);

    this._arcNumTxt = scene.add.text(arcX + arcW - parseInt(scaledFontSize(10, scene.scale)), topY,
      `${arc}`, {
      fontSize:      scaledFontSize(14, scene.scale),
      fill:          '#f0c050',
      fontFamily:    FontManager.MONO,
      letterSpacing: 1,
    }).setOrigin(1, 0.5);

    // arcUpdated 이벤트 수신 → HUD 숫자 즉시 갱신
    scene.events.on('arcUpdated', (newArc) => {
      if (this._arcNumTxt && this._arcNumTxt.scene) {
        this._arcNumTxt.setText(`${newArc}`);
      }
    }, this);
  }

  _getArc() {
    const save = SaveManager.load();
    return save?.arc ?? 0;
  }
}
