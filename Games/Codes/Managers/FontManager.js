// ================================================================
//  FontManager.js
//  경로: Games/Codes/Managers/FontManager.js
//
//  역할: 폰트 중앙 관리 + 설정에서 폰트 전환 지원
//  사용법:
//    1. assets/fonts/ 에 폰트 파일(.woff2) 업로드
//    2. FONTS 배열에 항목 추가
//    3. FontManager.init() 호출 후 게임 시작
//    4. FontManager.TITLE / .BODY / .MONO → 현재 활성 폰트 반환
//    5. FontManager.setActive('system')  → 폰트 전환
// ================================================================

const FontManager = {

  // ── 등록된 폰트 목록 ─────────────────────────────────────────
  FONTS: [
    {
      key:    'NeoDunggeunmoPro',
      family: 'NeoDunggeunmoPro',
      src:    'assets/fonts/NeoDunggeunmoPro-Regular.woff2',
      weight: 'normal',
      style:  'normal',
    },
  ],

  // ── 폰트 프리셋 ──────────────────────────────────────────────
  //  'game'   : NeoDunggeunmoPro (게임 전용 도트 폰트)
  //  'system' : 브라우저 기본 시스템 폰트
  PRESETS: {
    game: {
      TITLE: "'NeoDunggeunmoPro', monospace",
      BODY:  "'NeoDunggeunmoPro', monospace",
      MONO:  "'NeoDunggeunmoPro', monospace",
    },
    system: {
      TITLE: "Arial, sans-serif",
      BODY:  "Arial, sans-serif",
      MONO:  "'Courier New', monospace",
    },
  },

  FALLBACK: "'NeoDunggeunmoPro', monospace",

  // ── 초기화 ───────────────────────────────────────────────────
  //  게임 시작 전(Phaser 초기화 전)에 호출
  //  저장된 폰트 설정 자동 복원
  init() {
    const saved = localStorage.getItem('settings_font') || 'game';
    this._activePreset = saved;

    if (this.FONTS.length === 0) return Promise.resolve();

    return Promise.all(this.FONTS.map(f => this._loadFont(f)))
      .then(() => console.log('[FontManager] 폰트 로드 완료'));
  },

  // ── 활성 폰트 전환 ───────────────────────────────────────────
  setActive(presetKey) {
    if (!this.PRESETS[presetKey]) {
      console.warn(`[FontManager] 없는 프리셋: ${presetKey}`);
      return;
    }
    this._activePreset = presetKey;
    console.log(`[FontManager] 폰트 전환 → ${presetKey}`);
  },

  // ── 현재 활성 폰트 반환 ──────────────────────────────────────
  get TITLE() { return (this.PRESETS[this._activePreset] || this.PRESETS.game).TITLE; },
  get BODY()  { return (this.PRESETS[this._activePreset] || this.PRESETS.game).BODY;  },
  get MONO()  { return (this.PRESETS[this._activePreset] || this.PRESETS.game).MONO;  },

  // ── 단일 폰트 로드 ───────────────────────────────────────────
  _loadFont(font) {
    return new Promise(resolve => {
      new FontFace(font.family, `url(${font.src})`, {
        weight: font.weight || 'normal',
        style:  font.style  || 'normal',
      }).load()
        .then(loaded => { document.fonts.add(loaded); resolve(); })
        .catch(err   => { console.warn(`[FontManager] 실패: ${font.key}`, err); resolve(); });
    });
  },

  // ── 특정 폰트 이름 직접 반환 ─────────────────────────────────
  get(key) {
    const f = this.FONTS.find(f => f.key === key);
    return f ? `'${f.family}', monospace` : this.FALLBACK;
  },
};
