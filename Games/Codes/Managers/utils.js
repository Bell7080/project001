// ================================================================
//  utils.js
//  경로: Games/Codes/Managers/utils.js
//
//  역할: 어느 씬에서도 사용하는 전역 유틸 함수
// ================================================================

/**
 * 해상도에 비례하는 폰트 크기 반환
 * @param {number} basePx     - 1280x720 기준 폰트 크기(px)
 * @param {object} sceneScale - Phaser scene.scale 객체 (선택)
 * @returns {string}          - '24px' 형태 문자열
 */
function scaledFontSize(basePx, sceneScale) {
  const s = sceneScale || { width: window.innerWidth, height: window.innerHeight };
  const ratio = Math.min(s.width / 1280, s.height / 720);
  return `${Math.round(basePx * Math.max(ratio, 0.55))}px`;
}
