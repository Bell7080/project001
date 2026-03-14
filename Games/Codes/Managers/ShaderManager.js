// ================================================================
//  ShaderManager.js
//  경로: Games/Codes/Managers/ShaderManager.js
//
//  역할: CSS 레이어 기반 전체화면 쉐이더
//        심해 스팀펑크 톤 조성:
//          ① 비네팅    — 가장자리 어둡게
//          ② 스캔라인  — 브라운관 수평선
//          ③ 청록 틴트 — 심해 색조
//          ④ 노이즈 플리커 — 아날로그 노이즈 (강도 높을 때)
//
//  intensity 0.0 ~ 1.0 으로 모든 효과를 일괄 제어
//
//  저장 연동:
//    SaveManager.saveSettings({ shaderIntensity: v })
//    SaveManager.loadSettings().shaderIntensity
//
//  사용법:
//    ShaderManager.init();           ← main.js _initGame() 에서 1회
//    ShaderManager.setIntensity(0.7);
//    ShaderManager.getIntensity();
// ================================================================

const ShaderManager = {

  _intensity: 0.7,
  _overlay:   null,
  _flickerId: null,

  // ── 초기화 ────────────────────────────────────────────────────
  init() {
    const saved = SaveManager.loadSettings();
    this._intensity = (saved.shaderIntensity !== undefined)
      ? Math.max(0, Math.min(1, saved.shaderIntensity))
      : 0.7;

    this._overlay = document.getElementById('shader-overlay');
    if (!this._overlay) {
      console.warn('[ShaderManager] #shader-overlay 엘리먼트를 찾을 수 없습니다.');
      return;
    }

    this._apply();
    this._startFlicker();
  },

  // ── 강도 설정 (0.0 ~ 1.0) ────────────────────────────────────
  setIntensity(v) {
    this._intensity = Math.max(0, Math.min(1, v));
    this._apply();
    SaveManager.saveSettings({ shaderIntensity: this._intensity });
  },

  getIntensity() {
    return this._intensity;
  },

  // ── CSS 변수 적용 ─────────────────────────────────────────────
  _apply() {
    if (!this._overlay) return;
    const t = this._intensity;

    // 강도 0이면 완전히 숨김
    this._overlay.style.display = t === 0 ? 'none' : 'block';
    if (t === 0) return;

    // 비네팅: 반경 & 불투명도
    //   t=0 → radius 75%, alpha 0
    //   t=1 → radius 45%, alpha 0.75
    const vigRadius = Math.round(75 - t * 30);             // 75% ~ 45%
    const vigAlpha  = (t * 0.75).toFixed(3);               // 0 ~ 0.75

    // 스캔라인: 줄 간격(촘촘할수록 강함)은 고정, 불투명도만 제어
    //   t=0.3 이하엔 거의 안 보임
    const scanAlpha = Math.max(0, (t - 0.2) * 0.25).toFixed(3);  // 0 ~ 0.20

    // 청록 틴트
    //   t=0 → 0, t=1 → 0.14
    const tintAlpha = (t * 0.14).toFixed(3);

    // 색수차 (px): 강도에 비례
    //   t=0 → 0px, t=1 → 2.5px
    const aberrX = (t * 2.5).toFixed(2);
    const aberrY = (t * 0.8).toFixed(2);

    this._overlay.style.setProperty('--vig-radius',  vigRadius + '%');
    this._overlay.style.setProperty('--vig-alpha',   vigAlpha);
    this._overlay.style.setProperty('--scan-alpha',  scanAlpha);
    this._overlay.style.setProperty('--tint-alpha',  tintAlpha);
    this._overlay.style.setProperty('--aberr-x',     aberrX + 'px');
    this._overlay.style.setProperty('--aberr-y',     aberrY + 'px');
  },

  // ── 아날로그 노이즈 플리커 (강도 > 0.4 에서만) ───────────────
  //    랜덤 간격으로 overlay opacity 를 아주 살짝 흔들어 생동감 부여
  _startFlicker() {
    const flicker = () => {
      const t = this._intensity;
      if (!this._overlay || t < 0.4) {
        this._flickerId = setTimeout(flicker, 2000);
        return;
      }

      // 0.4 ~ 1.0 사이에서 강도에 비례한 흔들림 폭
      const maxJitter = (t - 0.4) * 0.06;  // 최대 0.036
      const jitter    = (Math.random() * maxJitter).toFixed(4);
      const sign      = Math.random() > 0.5 ? 1 : -1;

      this._overlay.style.opacity = (1 + sign * jitter).toString();

      // 80~200ms 후 원상복귀
      setTimeout(() => {
        if (this._overlay) this._overlay.style.opacity = '1';
      }, 80 + Math.random() * 120);

      // 다음 플리커: 1.5~5초 후
      this._flickerId = setTimeout(flicker, 1500 + Math.random() * 3500);
    };

    // 최초 실행은 3초 후
    this._flickerId = setTimeout(flicker, 3000);
  },

  destroy() {
    if (this._flickerId) clearTimeout(this._flickerId);
    this._flickerId = null;
  },
};
