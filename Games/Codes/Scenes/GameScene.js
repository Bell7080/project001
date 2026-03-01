// ================================================================
//  GameScene.js
//  경로: Games/Codes/Scenes/GameScene.js
//
//  역할: 인게임 씬 — 장르 확정 후 구현 예정
//  의존: FontManager, utils.js
// ================================================================

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.saveData = data.save || null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(0, 0, W, H, 0x060608).setOrigin(0);

    this.add.text(W / 2, H / 2 - 20, '[ INGAME ]', {
      fontSize: scaledFontSize(20, this.scale),
      fill: '#222233',
      fontFamily: FontManager.MONO,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 20, '개발 중 —', {
      fontSize: scaledFontSize(13, this.scale),
      fill: '#1a1a28',
      fontFamily: FontManager.MONO,
    }).setOrigin(0.5);

    this.add.text(W / 2, H - 28, 'ESC  →  로비로', {
      fontSize: scaledFontSize(11, this.scale),
      fill: '#1c1c24',
      fontFamily: FontManager.MONO,
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('LobbyScene');
    });
  }
}
