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
    // ── 기본 내장 폰트 (CDN, 오프라인 불가) ──────────────────
    // 사지방 인터넷 된다면 CDN 폰트도 사용 가능
    // 아래는 로컬 파일 폰트 예시 — assets/fonts/ 에 파일 넣으면 활성화됨

    // {
    //   key:    'MainFont',
    //   family: 'MainFont',
    //   src:    'assets/fonts/your-font.woff2',
    //   weight: 'normal',
    //   style:  'normal',
    // },
    // {
    //   key:    'MainFont-Bold',
    //   family: 'MainFont',
    //   src:    'assets/fonts/your-font-bold.woff2',
    //   weight: 'bold',
    //   style:  'normal',
    // },

    // ── 실제 폰트 추가 예시 ──────────────────────────────────
    // 나눔명조 (한글 명조체)
    // {
    //   key:    'NanumMyeongjo',
    //   family: 'NanumMyeongjo',
    //   src:    'assets/fonts/NanumMyeongjo.woff2',
    //   weight: 'normal',
    //   style:  'normal',
    // },
  ],

  // ── 폴백 폰트 (로컬 폰트 로드 실패 시 사용) ──────────────
  FALLBACK: 'serif',

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
