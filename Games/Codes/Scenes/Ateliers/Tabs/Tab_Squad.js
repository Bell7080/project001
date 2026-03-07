// ================================================================
//  Tab_Squad.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Squad.js
// ================================================================

class Tab_Squad {
  constructor(scene, W, H) {
    this.scene  = scene;
    this.W      = W;
    this.H      = H;
    this._container = scene.add.container(0, 0);

    const raw = CharacterManager.loadSquad();
    this._squad = this._migrateSquad(raw);

    this._filterJob     = 'all';
    this._filterCog     = 'all';
    this._sliderOffset  = 0;
    this._sliderDragged = false;
    this._filterBarObjs = [];

    // 드래그 앤 드롭 상태
    this._dragGhost      = null;
    this._dragCharId     = null;
    this._dragTargetIdx  = null;
    this._glowGraphics   = null;

    // 프로필 팝업 상태
    this._squadPopupGroup   = null;
    this._squadPopupOverlay = null;
    this._squadOpenCharId   = null;

    this._build();
  }

  _migrateSquad(raw) {
    if (!raw || !Array.isArray(raw)) return Array(10).fill(null).map(() => []);
    return Array(10).fill(null).map((_, i) => {
      const v = raw[i];
      if (!v) return [];
      if (Array.isArray(v)) return v.filter(Boolean);
      return [v];
    });
  }

  _build() {
    const { scene, W, H } = this;

    const panelX = W * 0.20;
    const panelY = H * 0.10;   // DAY/Arc 바 아래 바로 시작
    const panelW = W * 0.60;
    const panelH = H * 0.72;   // 더 길게

    const bg = scene.add.graphics();
    bg.fillStyle(0x0d0a06, 0.97);
    bg.lineStyle(1, 0x4a2a10, 0.8);
    bg.strokeRect(panelX, panelY, panelW, panelH);
    bg.fillRect(panelX, panelY, panelW, panelH);
    this._container.add(bg);

    this._container.add(scene.add.text(panelX + 16, panelY + 16, '[ 탐 사 대 ]', {
      fontSize: scaledFontSize(12, scene.scale), fill: '#5a3818', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0));

    // 힌트 텍스트 (우상단)
    this._hintText = scene.add.text(panelX + panelW - 16, panelY + 16,
      '카드를 칸에 드래그하여 배치  ·  배치된 칸 클릭으로 회수', {
      fontSize: scaledFontSize(9, scene.scale), fill: '#8a5020', fontFamily: FontManager.MONO,
    }).setOrigin(1, 0);
    this._container.add(this._hintText);

    // ── 필터 바
    this._filterY = panelY + panelH - parseInt(scaledFontSize(36, scene.scale));
    this._buildFilters(panelX, panelW, this._filterY);

    // ── 격자
    const gridSize = Math.min(panelW * 0.54, panelH * 0.54);
    const cellSize = gridSize / 3;

    const cx    = panelX + panelW / 2;
    const gridX = cx - gridSize / 2;
    const gridY = panelY + parseInt(scaledFontSize(40, scene.scale));

    this._gridX    = gridX;
    this._gridY    = gridY;
    this._cellSize = cellSize;
    this._gridSize = gridSize;
    this._gridCells = [];
    this._buildGrid(gridX, gridY, cellSize);

    // ── 슬라이더
    const sliderTopY  = gridY + gridSize + parseInt(scaledFontSize(3, scene.scale));
    const sliderBotY  = this._filterY - parseInt(scaledFontSize(2, scene.scale));
    this._sliderAreaX = panelX + 10;
    this._sliderAreaY = sliderTopY;
    this._sliderAreaW = panelW - 20;
    this._sliderAreaH = Math.max(parseInt(scaledFontSize(100, scene.scale)), sliderBotY - sliderTopY);
    this._buildSlider();
  }
}
