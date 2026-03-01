// ================================================================
//  LobbyScene.js
//  경로: Games/Codes/Scenes/LobbyScene.js
//
//  역할: 게임 메인 타이틀 / 로비 화면
//  의존: FontManager, SaveManager, utils.js
// ================================================================

class LobbyScene extends Phaser.Scene {
  constructor() { super({ key: 'LobbyScene' }); }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;

    this._buildBackground(W, H, cx);
    this._buildTitle(W, H, cx);
    this._buildMenu(W, H);
    this._buildFooter(W, H);
  }

  _buildBackground(W, H, cx) {
    this.add.rectangle(0, 0, W, H, 0x060608).setOrigin(0);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x0d0d12, 1);
    const step = Math.round(W / 48);
    for (let x = 0; x <= W; x += step) grid.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += step) grid.lineBetween(0, y, W, y);

    const glow = this.add.graphics();
    for (let i = 5; i > 0; i--) {
      glow.fillStyle(0x7777aa, 0.015 * i);
      glow.fillCircle(cx, H * 0.42, Math.min(W, H) * 0.1 * i);
    }

    const deco = this.add.graphics();
    const ly = H * 0.80;
    deco.lineStyle(1, 0x222230, 1);
    deco.lineBetween(W * 0.04, ly, W * 0.42, ly);
    deco.lineBetween(W * 0.58, ly, W * 0.96, ly);
  }

  _buildTitle(W, H, cx) {
    const sub = this.add.text(cx, H * 0.26, 'P  R  O  J  E  C  T  0  0  1', {
      fontSize: scaledFontSize(12, this.scale),
      fill: '#2a2a3a',
      fontFamily: FontManager.MONO,
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    const title = this.add.text(cx, H * 0.38, '공  방', {
      fontSize: scaledFontSize(76, this.scale),
      fill: '#ddd8cc',
      fontFamily: FontManager.TITLE,
    }).setOrigin(0.5).setAlpha(0);

    const kanji = this.add.text(cx, H * 0.53, '工  房', {
      fontSize: scaledFontSize(13, this.scale),
      fill: '#252530',
      fontFamily: FontManager.MONO,
      letterSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: sub,   alpha: 1, duration: 1000, delay: 300,  ease: 'Sine.easeOut' });
    this.tweens.add({ targets: title, alpha: 1, duration: 1400, delay: 600,  ease: 'Sine.easeOut' });
    this.tweens.add({ targets: kanji, alpha: 1, duration: 1000, delay: 1000, ease: 'Sine.easeOut' });
  }

  _buildMenu(W, H) {
    const hasSave = SaveManager.hasSave();
    const x     = W * 0.07;
    const baseY = H * 0.70;
    const gap   = parseInt(scaledFontSize(42, this.scale));

    const items = hasSave
      ? [
          { label: '새로 시작하기', key: 'new',      delay: 900  },
          { label: '불러오기',      key: 'load',     delay: 1050 },
          { label: '설  정',        key: 'settings', delay: 1200 },
          { label: '나가기',        key: 'quit',     delay: 1350 },
        ]
      : [
          { label: '시  작',        key: 'new',      delay: 900  },
          { label: '설  정',        key: 'settings', delay: 1050 },
          { label: '나가기',        key: 'quit',     delay: 1200 },
        ];

    items.forEach((item, i) => {
      this._makeMenuButton(item.label, x, baseY + gap * i, item.key, item.delay);
    });
  }

  _makeMenuButton(label, x, y, key, delay) {
    const marker = this.add.text(x - parseInt(scaledFontSize(16, this.scale)), y, '│', {
      fontSize: scaledFontSize(14, this.scale),
      fill: '#2a2a3a',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5).setAlpha(0);

    const btn = this.add.text(x, y, label, {
      fontSize: scaledFontSize(19, this.scale),
      fill: '#666677',
      fontFamily: FontManager.TITLE,
    }).setOrigin(0, 0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    const underline = this.add.graphics().setAlpha(0);

    this.tweens.add({ targets: [btn, marker, underline], alpha: 1, duration: 500, delay, ease: 'Sine.easeOut' });

    const origX = x;

    btn.on('pointerover', () => {
      this.tweens.add({ targets: btn, x: origX + parseInt(scaledFontSize(8, this.scale)), duration: 100, ease: 'Sine.easeOut' });
      btn.setStyle({ fill: '#d4cfc6' });
      marker.setStyle({ fill: '#886655' });
      underline.clear();
      underline.lineStyle(1, 0x554433, 0.7);
      underline.lineBetween(
        x, y + parseInt(scaledFontSize(14, this.scale)),
        x + btn.width + parseInt(scaledFontSize(8, this.scale)), y + parseInt(scaledFontSize(14, this.scale))
      );
    });

    btn.on('pointerout', () => {
      this.tweens.add({ targets: btn, x: origX, duration: 100, ease: 'Sine.easeOut' });
      btn.setStyle({ fill: '#666677' });
      marker.setStyle({ fill: '#2a2a3a' });
      underline.clear();
    });

    btn.on('pointerdown', () => this._onMenuClick(key));
  }

  _onMenuClick(key) {
    switch (key) {
      case 'new':
        this._transition(() => this.scene.start('LoadingScene', { next: 'GameScene' }));
        break;
      case 'load':
        if (SaveManager.hasSave())
          this._transition(() => this.scene.start('LoadingScene', { next: 'GameScene', save: SaveManager.load() }));
        break;
      case 'settings':
        this._transition(() => this.scene.start('SettingsScene', { from: 'LobbyScene' }));
        break;
      case 'quit':
        window.close();
        break;
    }
  }

  _transition(callback) {
    const flash = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x060608, 0)
      .setOrigin(0).setDepth(999);
    this.tweens.add({
      targets: flash, alpha: 1, duration: 350, ease: 'Sine.easeIn',
      onComplete: callback,
    });
  }

  _buildFooter(W, H) {
    this.add.text(W - 14, H - 12, 'v0.0.1  prototype', {
      fontSize: scaledFontSize(10, this.scale),
      fill: '#1c1c24',
      fontFamily: FontManager.MONO,
    }).setOrigin(1, 1);
  }
}
