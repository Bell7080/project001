// ================================================================
//  LobbyScene.js
//  경로: Games/Codes/Scenes/LobbyScene.js
//
//  역할: NEURAL RUST 메인 타이틀 / 로비 화면
//  의존: FontManager, SaveManager, AudioManager, utils.js
//
//  폰트 수치 기준: 1280×720 basePx × 1.5 (가시성 개선)
//  배경 전략: Background_006.png ENVELOP(cover) — 방식 2
// ================================================================

class LobbyScene extends Phaser.Scene {
  constructor() { super({ key: 'LobbyScene' }); }

  preload() {
    if (!this.textures.exists('bg_lobby')) {
      this.load.image('bg_lobby', 'Games/Assets/Sprites/Background_006.png');
    }
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;

    AudioManager.reinit(this);

    this._buildBackground(W, H, cx);
    this._buildTitle(W, H, cx);
    this._buildMenu(W, H);
    this._buildFooter(W, H);
  }

  // ── 배경 ──────────────────────────────────────────────────────
  _buildBackground(W, H, cx) {
    // ① 검은 베이스 (이미지 로드 실패 시 fallback)
    this.add.rectangle(0, 0, W, H, 0x050407).setOrigin(0);

    // ② 배경 이미지 — ENVELOP(cover): 비율 유지하며 화면 꽉 채움
    if (this.textures.exists('bg_lobby')) {
      const bg     = this.add.image(cx, H / 2, 'bg_lobby');
      const scaleX = W / bg.width;
      const scaleY = H / bg.height;
      bg.setScale(Math.max(scaleX, scaleY)).setDepth(0);
    }

    // ③ 어두운 반투명 오버레이
    this.add.rectangle(0, 0, W, H, 0x050407, 0.52).setOrigin(0).setDepth(1);

    // ④ 스캔라인
    const scan = this.add.graphics().setDepth(2);
    for (let y = 0; y < H; y += 4) {
      scan.lineStyle(1, 0x1a0e06, 0.18);
      scan.lineBetween(0, y, W, y);
    }
  }
