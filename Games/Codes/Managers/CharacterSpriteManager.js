// ================================================================
//  CharacterSpriteManager.js
//  경로: Games/Codes/Managers/CharacterSpriteManager.js
//
//  역할: 캐릭터 스프라이트 시트 로드 및 키 관리
//
//  스프라이트 시트 구조:
//    Sd_Character_Sheet_001.png → char_000 ~ char_035 (6x6 = 36개)
//    Sd_Character_Sheet_002.png → char_036 ~ char_071 (6x6 = 36개)
//    총 72개
//
//  사용법:
//    [LoadingScene.preload]  CharacterSpriteManager.preload(this);
//    [LoadingScene.create]   CharacterSpriteManager.extractToTextures(this);
//    [다른 씬]               this.add.image(x, y, CharacterSpriteManager.getKey(id))
// ================================================================

const CharacterSpriteManager = (() => {

  // ── 경로 ──────────────────────────────────────────────────
  const SHEET_1_KEY  = 'char_sheet_001';
  const SHEET_2_KEY  = 'char_sheet_002';
  const SHEET_1_PATH = 'Games/Assets/Sprites/Sd_Character_Sheet_001.png';
  const SHEET_2_PATH = 'Games/Assets/Sprites/Sd_Character_Sheet_002.png';

  // ── 실제 픽셀 경계 (brightness 분석으로 확정된 값) ────────
  const ROWS_1 = [[6,133],[129,259],[260,378],[384,500],[503,622],[626,744]];
  const COLS_1 = [[11,75],[92,155],[173,236],[257,316],[338,396],[415,481]];

  const ROWS_2 = [[13,140],[154,288],[296,429],[438,563],[582,707],[720,845]];
  const COLS_2 = [[19,85],[113,176],[205,265],[296,358],[387,451],[478,543]];

  // 출력 셀 크기 (패딩 포함 통일 캔버스)
  const CELL_W = 76;
  const CELL_H = 140;

  // ── preload ───────────────────────────────────────────────
  // spritesheet 아닌 일반 image로 로드 → getSourceImage() 안정성 확보
  function preload(scene) {
    if (!scene.textures.exists(SHEET_1_KEY)) {
      scene.load.image(SHEET_1_KEY, SHEET_1_PATH);
    }
    if (!scene.textures.exists(SHEET_2_KEY)) {
      scene.load.image(SHEET_2_KEY, SHEET_2_PATH);
    }
  }

  // ── extractToTextures ─────────────────────────────────────
  // LoadingScene.create() 안에서 한 번 호출
  function extractToTextures(scene) {
    _extractSheet(scene, SHEET_1_KEY, ROWS_1, COLS_1, 0);
    _extractSheet(scene, SHEET_2_KEY, ROWS_2, COLS_2, 36);
  }

  function _extractSheet(scene, sheetKey, rowBounds, colBounds, startIdx) {
    if (!scene.textures.exists(sheetKey)) {
      console.warn('[CharacterSpriteManager] 시트 미로드:', sheetKey);
      return;
    }

    const src = scene.textures.get(sheetKey).getSourceImage();

    let idx = startIdx;
    for (const [y0, y1] of rowBounds) {
      for (const [x0, x1] of colBounds) {
        const key = getKey(idx);
        idx++;

        if (scene.textures.exists(key)) continue;

        const cropW = x1 - x0;
        const cropH = y1 - y0;

        // 매 셀마다 독립 canvas 생성 — 참조 공유 문제 원천 차단
        const canvas  = document.createElement('canvas');
        canvas.width  = CELL_W;
        canvas.height = CELL_H;
        const ctx     = canvas.getContext('2d');

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CELL_W, CELL_H);

        const px = Math.floor((CELL_W - cropW) / 2);
        const py = Math.floor((CELL_H - cropH) / 2);
        ctx.drawImage(src, x0, y0, cropW, cropH, px, py, cropW, cropH);

        scene.textures.addCanvas(key, canvas);
      }
    }
  }

  // ── getKey ────────────────────────────────────────────────
  function getKey(id) {
    return `char_${String(id).padStart(3, '0')}`;
  }

  function getTotal() { return 72; }

  return { preload, extractToTextures, getKey, getTotal, CELL_W, CELL_H };

})();
