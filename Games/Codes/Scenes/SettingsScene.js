// ================================================================
//  SettingsScene.js
//  경로: Games/Codes/Scenes/SettingsScene.js
//
//  역할: 설정 화면 — 폰트 전환 테스트 포함
//  의존: FontManager, utils.js
// ================================================================

class SettingsScene extends Phaser.Scene {
  constructor() { super({ key: 'SettingsScene' }); }

  init(data) {
    this.fromScene = data.from || 'LobbyScene';
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;

    this._buildBackground(W, H);
    this._buildTitle(W, H, cx);
    this._buildFontSection(W, H, cx);
    this._buildBackButton(W, H);
  }

  _buildBackground(W, H) {
    this.add.rectangle(0, 0, W, H, 0x060608).setOrigin(0);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x0d0d12, 1);
    const step = Math.round(W / 48);
    for (let x = 0; x <= W; x += step) grid.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += step) grid.lineBetween(0, y, W, y);
  }

  _buildTitle(W, H, cx) {
    this.add.text(cx, H * 0.12, '설  정', {
      fontSize: scaledFontSize(32, this.scale),
      fill: '#9999aa',
      fontFamily: FontManager.TITLE,
    }).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(1, 0x222230, 1);
    line.lineBetween(W * 0.1, H * 0.20, W * 0.9, H * 0.20);
  }

  _buildFontSection(W, H, cx) {
    this.add.text(W * 0.08, H * 0.28, '[ 폰트 ]', {
      fontSize: scaledFontSize(13, this.scale),
      fill: '#444455',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);

    const saved = localStorage.getItem('settings_font') || 'game';
    this._currentFont = saved;

    const options = [
      {
        key:    'game',
        label:  'NeoDunggeunmoPro',
        desc:   '게임 전용 도트 폰트',
        family: "'NeoDunggeunmoPro', monospace",
      },
      {
        key:    'system',
        label:  'System Default',
        desc:   '브라우저 기본 시스템 폰트',
        family: "Arial, sans-serif",
      },
    ];

    const baseY = H * 0.38;
    const gap   = H * 0.16;

    options.forEach((opt, i) => {
      this._makeFontOption(opt, W, baseY + gap * i, cx);
    });

    this._buildPreview(W, H, cx);
  }

  _makeFontOption(opt, W, y, cx) {
    const isSelected = this._currentFont === opt.key;

    const box = this.add.graphics();
    this._drawOptionBox(box, W * 0.08, y - 30, W * 0.84, 60, isSelected);

    const nameText = this.add.text(W * 0.13, y - 8, opt.label, {
      fontSize: scaledFontSize(16, this.scale),
      fill: isSelected ? '#d4cfc6' : '#555566',
      fontFamily: opt.family,
    }).setOrigin(0, 0.5);

    this.add.text(W * 0.13, y + 12, opt.desc, {
      fontSize: scaledFontSize(10, this.scale),
      fill: isSelected ? '#666677' : '#333344',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);

    this.add.text(W * 0.09, y, isSelected ? '▶' : '·', {
      fontSize: scaledFontSize(12, this.scale),
      fill: isSelected ? '#886655' : '#333344',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);

    const hitArea = this.add.rectangle(cx, y, W * 0.84, 60, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      if (this._currentFont !== opt.key) {
        this._drawOptionBox(box, W * 0.08, y - 30, W * 0.84, 60, false, true);
        nameText.setStyle({ fill: '#aaaaaa' });
      }
    });

    hitArea.on('pointerout', () => {
      if (this._currentFont !== opt.key) {
        this._drawOptionBox(box, W * 0.08, y - 30, W * 0.84, 60, false, false);
        nameText.setStyle({ fill: '#555566' });
      }
    });

    hitArea.on('pointerdown', () => {
      this._currentFont = opt.key;
      localStorage.setItem('settings_font', opt.key);
      FontManager.setActive(opt.key);
      this.scene.restart({ from: this.fromScene });
    });
  }

  _drawOptionBox(gfx, x, y, w, h, selected, hover = false) {
    gfx.clear();
    if (selected) {
      gfx.lineStyle(1, 0x554433, 0.8);
      gfx.fillStyle(0x1a1510, 1);
    } else if (hover) {
      gfx.lineStyle(1, 0x333344, 0.6);
      gfx.fillStyle(0x0e0e12, 1);
    } else {
      gfx.lineStyle(1, 0x1a1a22, 0.6);
      gfx.fillStyle(0x000000, 0);
    }
    gfx.strokeRect(x, y, w, h);
    gfx.fillRect(x, y, w, h);
  }

  _buildPreview(W, H, cx) {
    const previewY = H * 0.75;

    const line = this.add.graphics();
    line.lineStyle(1, 0x1a1a22, 1);
    line.lineBetween(W * 0.1, previewY - 20, W * 0.9, previewY - 20);

    this.add.text(W * 0.08, previewY, '미리보기', {
      fontSize: scaledFontSize(11, this.scale),
      fill: '#333344',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);

    this.add.text(cx, previewY + 30, '공방 — PROJECT001 — 가나다 ABC 123', {
      fontSize: scaledFontSize(18, this.scale),
      fill: '#888899',
      fontFamily: FontManager.TITLE,
    }).setOrigin(0.5, 0);

    this.add.text(cx, previewY + 60, '어둠 속에서 빛을 찾아 헤매는 자의 이야기', {
      fontSize: scaledFontSize(13, this.scale),
      fill: '#444455',
      fontFamily: FontManager.BODY,
    }).setOrigin(0.5, 0);
  }

  _buildBackButton(W, H) {
    const btn = this.add.text(W * 0.08, H * 0.92, '← 돌아가기', {
      fontSize: scaledFontSize(14, this.scale),
      fill: '#444455',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ fill: '#aaaaaa' }));
    btn.on('pointerout',  () => btn.setStyle({ fill: '#444455' }));
    btn.on('pointerdown', () => {
      const flash = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x060608, 0)
        .setOrigin(0).setDepth(999);
      this.tweens.add({
        targets: flash, alpha: 1, duration: 300, ease: 'Sine.easeIn',
        onComplete: () => this.scene.start(this.fromScene),
      });
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start(this.fromScene);
    });
  }
}
