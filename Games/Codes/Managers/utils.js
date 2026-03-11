// ================================================================
//  utils.js
//  경로: Games/Codes/Managers/utils.js
//
//  역할: 어느 씬에서도 사용하는 전역 유틸 함수
//
//  기준 해상도: 1920 × 1080
//  하한선 0.50 — 작은 화면에서도 최소 절반 크기 보장
//  상한 없음   — 4K 등 큰 화면에서는 자동으로 커짐
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
  return `${Math.round(basePx * Math.max(ratio, 0.50))}px`;
}

/**
 * 해상도 비율 반환 (레이아웃 계산용)
 * @param {object} sceneScale - Phaser scene.scale 객체
 * @returns {number}
 */
function scaleRatio(sceneScale) {
  const s = sceneScale || { width: window.innerWidth, height: window.innerHeight };
  return Math.min(s.width / 1920, s.height / 1080);
}
