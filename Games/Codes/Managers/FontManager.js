// ================================================================
//  FontManager.js
//  경로: Games/Codes/Managers/FontManager.js
//
//  역할: 폰트 중앙 관리 + 설정에서 폰트 전환 지원
//
//  ✏️ 추가 — adjustedSize(basePx, sceneScale)
//    Phaser 캔버스는 CSS @font-face size-adjust를 무시하므로
//    폰트별 배율을 여기서 직접 보정한다.
//
//    SCALE 테이블에서 프리셋별 배율을 관리.
//    scaledFontSize() 를 대체해 전체에서 이 메서드만 사용한다.
//
//    일괄 치환:
//      찾기:   scaledFontSize(
//      바꾸기: FontManager.adjustedSize(
// ================================================================

const FontManager = {

  FONTS: [
    {
      key:    'NeoDunggeunmoPro',
      family: 'NeoDunggeunmoPro',
      src:    'Games/Assets/Fonts/NeoDunggeunmoPro-Regular.woff2',
      weight: 'normal',
      style:  'normal',
    },
    {
      key:    'BMKiranghaerang',
      family: 'BMKiranghaerang',
      src:    'Games/Assets/Fonts/BMKIRANGHAERANG.woff2',
      weight: 'normal',
      style:  'normal',
    },
  ],

  PRESETS: {
    kirang: {
      TITLE: "'BMKiranghaerang', monospace",
      BODY:  "'BMKiranghaerang', monospace",
      MONO:  "'BMKiranghaerang', monospace",
    },
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

  // ── 폰트별 Phaser 렌더 보정 배율 ──────────────────────────────
  //  Phaser 캔버스는 CSS size-adjust를 무시하기 때문에
  //  index.html @font-face 와 별도로 여기서 직접 보정한다.
  //
  //  index.html 기준:
  //    BMKiranghaerang  → size-adjust: 160%  (원본이 매우 작음)
  //    NeoDunggeunmoPro → size-adjust: 110%  (원본이 약간 작음)
  //    system           → size-adjust 없음   (기준값)
  //
  //  배율 조정 방법:
  //    · 숫자를 올리면 해당 폰트 전체가 커짐
  //    · 1.00 = 보정 없음 (scaledFontSize 와 동일)
  //    · 깨지는 텍스트가 생기면 해당 basePx 를 낮춰서 맞출 것
  //      (이 배율을 건드리지 말고 호출부 basePx 를 조정)
  // ──────────────────────────────────────────────────────────────
  SCALE: {
    kirang: 1.25,   // BMKiranghaerang — Phaser에서 작게 보여 25% 보정
    game:   1.10,   // NeoDunggeunmoPro — 10% 보정
    system: 1.00,   // Arial / Courier — 보정 없음
  },

  FALLBACK: "'NeoDunggeunmoPro', monospace",

  init() {
    const saved = localStorage.getItem('settings_font') || 'kirang';
    this._activePreset = saved;
    if (this.FONTS.length === 0) return Promise.resolve();
    return Promise.all(this.FONTS.map(f => this._loadFont(f)))
      .then(() => console.log('[FontManager] 폰트 로드 완료'))
      .catch(e => console.warn('[FontManager] 폰트 로드 중 오류 (무시됨)', e));
  },

  setActive(presetKey) {
    if (!this.PRESETS[presetKey]) {
      console.warn(`[FontManager] 없는 프리셋: ${presetKey}`);
      return;
    }
    this._activePreset = presetKey;
    console.log(`[FontManager] 폰트 전환 → ${presetKey}`);
  },

  get TITLE() { return (this.PRESETS[this._activePreset] || this.PRESETS.kirang).TITLE; },
  get BODY()  { return (this.PRESETS[this._activePreset] || this.PRESETS.kirang).BODY;  },
  get MONO()  { return (this.PRESETS[this._activePreset] || this.PRESETS.kirang).MONO;  },

  // ── 핵심 메서드 ───────────────────────────────────────────────
  //  scaledFontSize() 를 대체한다.
  //  시그니처가 동일하므로 일괄 치환만 하면 된다.
  //
  //  @param {number} basePx     - 1920×1080 / system 폰트 기준 크기
  //  @param {object} sceneScale - Phaser scene.scale 객체
  //  @returns {string}          - '24px' 형태 문자열
  // ──────────────────────────────────────────────────────────────
  adjustedSize(basePx, sceneScale) {
    const raw   = parseInt(scaledFontSize(basePx, sceneScale), 10);
    const scale = this.SCALE[this._activePreset] ?? 1.00;
    return `${Math.round(raw * scale)}px`;
  },

  // _loadFont: FontFace 생성·load 모두 try-catch로 보호해
  // 어떤 상황에서도 반드시 resolve()가 호출되도록 보장한다.
  _loadFont(font) {
    return new Promise(resolve => {
      try {
        const face = new FontFace(font.family, `url(${font.src})`, {
          weight: font.weight || 'normal',
          style:  font.style  || 'normal',
        });
        face.load()
          .then(loaded => { document.fonts.add(loaded); resolve(); })
          .catch(err   => { console.warn(`[FontManager] 실패: ${font.key}`, err); resolve(); });
      } catch (err) {
        console.warn(`[FontManager] FontFace 생성 실패: ${font.key}`, err);
        resolve();
      }
    });
  },

  get(key) {
    const f = this.FONTS.find(f => f.key === key);
    return f ? `'${f.family}', monospace` : this.FALLBACK;
  },
};
