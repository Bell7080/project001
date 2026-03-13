// ================================================================
//  LoadingScene.js
//  경로: Games/Codes/Scenes/LoadingScene.js
//
//  역할: 씬 전환 시 로딩 화면
//        AtelierScene 진입 전 미완료 스토리 이벤트 자동 체크
//
//  흐름:
//    LobbyScene → LoadingScene
//      └─ nextScene === 'AtelierScene' + 미완료 이벤트 있음
//           → DialogueScene 경유 후 AtelierScene
//      └─ 이미 다 봤거나 해당 없음
//           → 바로 AtelierScene
//
//  의존: FontManager, utils.js, CharacterSpriteManager,
//        StoryManager, SaveManager
//
//  ✏️ PATCH — 텍스트 크기 수정
//    · 'NEURAL RUST' 타이틀: 12→28 (1920기준 12px는 안 보이는 수준)
//    · 진행 도트: 34→48 (화면 중심 인디케이터로 더 뚜렷하게)
//    · 레이아웃: 타이틀(위) + 도트(중앙) 순서로 재배치
// ================================================================

class LoadingScene extends Phaser.Scene {
  constructor() { super({ key: 'LoadingScene' }); }

  init(data) {
    this.nextScene = data.next || 'LobbyScene';
    this.saveData  = data.save || null;
  }

  preload() {
    CharacterSpriteManager.preload(this);

    this.load.on('progress', (value) => {
      if (this._progressDot) {
        const stages = ['·', '· ·', '· · ·'];
        this._progressDot.setText(stages[Math.floor(value * 3) % 3]);
      }
    });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── 배경 ──────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x050407).setOrigin(0);

    const grid = this.add.graphics();
    const step = Math.round(W / 56);
    for (let x = 0; x <= W; x += step) {
      grid.lineStyle(1, 0x0f0a05, 0.5);
      grid.lineBetween(x, 0, x, H);
    }
    for (let y = 0; y <= H; y += step) {
      grid.lineStyle(1, 0x0f0a05, 0.5);
      grid.lineBetween(0, y, W, y);
    }

    // ── 텍스트 ────────────────────────────────────────────
    // ✏️ 타이틀: 12→28 (1920기준 12px는 사실상 안 보이는 크기)
    // ✏️ 도트:   34→48 (화면 중앙 기준점으로 더 뚜렷하게)
    this.add.text(W / 2, H / 2 - parseInt(scaledFontSize(28, this.scale)) * 1.2, 'NEURAL RUST', {
      fontSize:      scaledFontSize(28, this.scale),
      fill:          '#2e1a0a',
      fontFamily:    FontManager.MONO,
      letterSpacing: 6,
    }).setOrigin(0.5);

    const dot = this.add.text(W / 2, H / 2, '·', {
      fontSize:   scaledFontSize(48, this.scale),
      fill:       '#3d2010',
      fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    this._progressDot = dot;

    // ── 애니메이션 ────────────────────────────────────────
    let count = 0;
    const dots = ['·', '· ·', '· · ·'];
    this.time.addEvent({
      delay: 300, repeat: 8,
      callback: () => { dot.setText(dots[count % 3]); count++; },
    });

    // ── 스프라이트 시트 등록 ──────────────────────────────
    CharacterSpriteManager.extractToTextures(this);

    // ── 다음 씬으로 ───────────────────────────────────────
    this.time.delayedCall(1200, () => this._goNext());
  }

  // AtelierScene 진입 시에만 스토리 이벤트 체크
  // 그 외 씬 전환은 그냥 통과
  _goNext() {
    if (this.nextScene !== 'AtelierScene') {
      this.scene.start(this.nextScene, { save: this.saveData });
      return;
    }

    // StoryManager.getScenesForToday('start'):
    //   오늘 day의 start 이벤트 중 once:true + 아직 _seen 플래그 없는 것만 반환
    //   → '초회이고 아직 안 본' 이벤트만 나옴, 두 번째 로딩부터는 빈 배열
    const pending = StoryManager.getScenesForToday('start');

    if (pending.length > 0) {
      // 미완료 이벤트 → DialogueScene 경유
      this.scene.start('DialogueScene', {
        eventId:  pending[0],
        next:     'AtelierScene',
        nextData: { save: this.saveData },
      });
    } else {
      // 이미 다 봤거나 이벤트 없음 → 바로 공방
      this.scene.start('AtelierScene', { save: this.saveData });
    }
  }
}
