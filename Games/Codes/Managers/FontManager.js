// ================================================================
//  FontManager.js
//  경로: src/core/FontManager.js
//
//  역할: 게임에서 사용하는 폰트를 중앙에서 관리
//  사용법:
//    1. assets/fonts/ 에 폰트 파일(.woff2) 업로드
//    2. FONTS 객체에 항목 추가
//    3. FontManager.init() 호출 후 게임 시작
// ================================================================

const FontManager = {

  // ── 폰트 정의 ────────────────────────────────────────────────
  //  key     : 게임 내에서 사용할 이름 (Phaser fontFamily에 그대로 입력)
  //  family  : CSS font-family 이름
  //  src     : 폰트 파일 경로 (assets/fonts/ 기준)
  //  weight  : 폰트 굵기 (normal / bold / 100~900)
  //  style   : 폰트 스타일 (normal / italic)
  // ─────────────────────────────────────────────────────────────
  FONTS: [
    {
      key:    'NeoDunggeunmoPro',
      family: 'NeoDunggeunmoPro',
      src:    'assets/fonts/NeoDunggeunmoPro-Regular.woff2',
      weight: 'normal',
      style:  'normal',
    },
  ],

  FALLBACK: "'NeoDunggeunmoPro', monospace",

  // ── 초기화 ───────────────────────────────────────────────────
  //  게임 시작 전(Phaser 초기화 전)에 호출
  //  Promise 반환 — 모든 폰트 로드 완료 후 resolve
  init() {
    if (this.FONTS.length === 0) {
      console.log('[FontManager] 등록된 폰트 없음, 기본 폰트 사용');
      return Promise.resolve();
    }

    const promises = this.FONTS.map(font => this._loadFont(font));
    return Promise.all(promises).then(() => {
      console.log('[FontManager] 모든 폰트 로드 완료');
    });
  },

  // ── 단일 폰트 로드 ──────────────────────────────────────────
  _loadFont(font) {
    return new Promise((resolve, reject) => {
      const face = new FontFace(font.family, `url(${font.src})`, {
        weight: font.weight || 'normal',
        style:  font.style  || 'normal',
      });

      face.load()
        .then(loaded => {
          document.fonts.add(loaded);
          console.log(`[FontManager] 로드 완료: ${font.key}`);
          resolve();
        })
        .catch(err => {
          console.warn(`[FontManager] 로드 실패: ${font.key}`, err);
          resolve(); // 실패해도 게임은 계속 진행
        });
    });
  },

  // ── 폰트 이름 반환 (Phaser fontFamily에 사용) ───────────────
  //  예: FontManager.get('NanumMyeongjo') → 'NanumMyeongjo, serif'
  get(key) {
    const font = this.FONTS.find(f => f.key === key);
    if (!font) {
      console.warn(`[FontManager] 등록되지 않은 폰트: ${key}`);
      return this.FALLBACK;
    }
    return `${font.family}, ${this.FALLBACK}`;
  },
};
