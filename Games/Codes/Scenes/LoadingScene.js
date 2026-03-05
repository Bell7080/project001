// ================================================================
//  LoadingScene.js
//  경로: Games/Codes/Scenes/LoadingScene.js
//
//  역할: 씬 전환 시 로딩 화면
//  의존: FontManager, utils.js
// ================================================================

class LoadingScene extends Phaser.Scene {
  constructor() { super({ key: 'LoadingScene' }); }

  init(data) {
    this.nextScene = data.next || 'LobbyScene';
    this.saveData  = data.save || null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(0, 0, W, H, 0x050407).setOrigin(0);

    const grid = this.add.graphics();
    const step = Math.round(W / 56);
    for (let x = 0; x <= W; x += step) { grid.lineStyle(1, 0x0f0a05, 0.5); grid.lineBetween(x, 0, x, H); }
    for (let y = 0; y <= H; y += step) { grid.lineStyle(1, 0x0f0a05, 0.5); grid.lineBetween(0, y, W, y); }

    const dot = this.add.text(W / 2, H / 2, '·', {
      fontSize: scaledFontSize(34, this.scale),   // 28 → 34
      fill: '#3d2010',
      fontFamily: FontManager.MONO,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + parseInt(scaledFontSize(34, this.scale)), 'NEURAL RUST', {
      fontSize: scaledFontSize(12, this.scale),   // 10 → 12
      fill: '#1e1008',
      fontFamily: FontManager.MONO,
      letterSpacing: 4,
    }).setOrigin(0.5);

    let count = 0;
    const dots = ['·', '· ·', '· · ·'];
    this.time.addEvent({
      delay: 300, repeat: 8,
      callback: () => { dot.setText(dots[count % 3]); count++; },
    });

    this.time.delayedCall(1200, () => {
      this.scene.start(this.nextScene, { save: this.saveData });
    });
  }
}