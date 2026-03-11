// ================================================================
//  utils.js
//  경로: Games/Codes/Managers/utils.js
//
//  역할: 어느 씬에서도 사용하는 전역 유틸 함수
//
//  기준 해상도: 1920 × 1080
//  최소 배율 1.0 — 1080p 미만 환경에서도 폰트 크기 유지
//  최대 비례  — 4K 등 큰 화면에서는 자동으로 커짐
// ================================================================

/**
 * 해상도에 비례하는 폰트 크기 반환
 * @param {number} basePx     - 1920×1080 기준 폰트 크기(px)
 * @param {object} sceneScale - Phaser scene.scale 객체 (선택)
 * @returns {string}          - '24px' 형태 문자열
 */
function scaledFontSize(basePx, sceneScale) {
  const s = sceneScale || { width: window.innerWidth, height: window.innerHeight };
  const ratio = Math.min(s.width / 1920, s.height / 1080);
  return `${Math.round(basePx * Math.max(ratio, 1.0))}px`;
}
