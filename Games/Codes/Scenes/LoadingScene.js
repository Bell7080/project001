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

    this.add.rectangle(0, 0, W, H, 0x060608).setOrigin(0);

    const dot = this.add.text(W / 2, H / 2, '·', {
      fontSize: scaledFontSize(32, this.scale),
      fill: '#333344',
      fontFamily: FontManager.MONO,
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
