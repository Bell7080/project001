// ================================================================
//  Tab_Squad_Drag.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Squads/Tab_Squad_Drag.js
//
//  역할: 탐사대 탭 — 드래그 앤 드롭 전역 처리
//
//  ── 전역 포인터 위임 방식 ────────────────────────────────────
//  카드(hit)는 pointerdown 시 드래그 대상을 씬에 등록하는
//  신호만 발신한다. 이후 고스트 이동·드롭 판정·셀 발광은
//  씬 전역 리스너(_setupDragListeners)가 단독으로 처리한다.
//
//  카드별 pointermove 핸들러가 없으므로, 드래그 중 다른 카드
//  위를 지나가도 이벤트 간섭이 발생하지 않는다.
//
//  의존: Tab_Squad.js (prototype 확장)
// ================================================================

Object.assign(Tab_Squad.prototype, {

  // ── 드래그 시작 ──────────────────────────────────────────────
  // 카드의 pointerdown → pointermove 임계치 초과 시 호출
  // 이미 드래그 중이면 진입 차단
  _startDrag(char, ptr) {
    if (this._dragGhost) return;

    const { scene } = this;
    const cw = parseInt(scaledFontSize(64, scene.scale));
    const ch = parseInt(scaledFontSize(68, scene.scale));

    const JOB_COLOR  = { fisher: 0x1a3050, diver: 0x1a3020, ai: 0x2a1a3a };
    const JOB_BORDER = { fisher: 0x3a6888, diver: 0x3a7050, ai: 0x6a4888 };
    const JOB_SHORT  = { fisher: 'FISH',   diver: 'DIVE',   ai: 'A·I'   };

    const g = scene.add.container(ptr.x - cw / 2, ptr.y - ch * 0.3).setDepth(600);

    const bg = scene.add.graphics();
    bg.fillStyle(JOB_COLOR[char.job] || 0x1a1810, 0.92);
    bg.lineStyle(2, 0xffd060, 1);
    bg.strokeRect(0, 0, cw, ch);
    bg.fillRect(0, 0, cw, ch);

    const icon = scene.add.text(cw / 2, ch * 0.30, JOB_SHORT[char.job] || '???', {
      fontSize: scaledFontSize(8, scene.scale), fill: '#5a7888', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);

    const nm = scene.add.text(cw / 2, ch * 0.52, char.name, {
      fontSize: scaledFontSize(7, scene.scale), fill: '#e8c060', fontFamily: FontManager.TITLE,
    }).setOrigin(0.5, 0);

    const cog = scene.add.text(cw / 2, ch * 0.72, `Cog${char.cog}`, {
      fontSize: scaledFontSize(6, scene.scale), fill: '#7a5030', fontFamily: FontManager.MONO,
    }).setOrigin(0.5, 0);

    g.add([bg, icon, nm, cog]);
    scene.tweens.add({ targets: g, alpha: 0.88, duration: 80 });

    // 상태 등록 — 이 시점부터 전역 리스너가 제어권을 가짐
    this._dragGhost     = g;
    this._dragChar      = char;
    this._dragCharId    = char.id;
    this._dragTargetIdx = null;
    this._isDraggingAny = true;

    this._clearCellGlow();
  },

  // ── 드래그 이동 (전역 pointermove에서 호출) ──────────────────
  _moveDrag(ptr) {
    if (!this._dragGhost) return;
    const cw = this._dragGhost.list[0]?.width  || 64;
    const ch = this._dragGhost.list[0]?.height || 68;
    this._dragGhost.setPosition(ptr.x - cw / 2, ptr.y - ch * 0.3);

    const hitIdx = this._hitTestGrid(ptr.x, ptr.y);
    if (hitIdx !== this._dragTargetIdx) {
      this._dragTargetIdx = hitIdx;
      this._updateCellGlow(hitIdx);
    }
  },

  // ── 드래그 고스트 제거 ───────────────────────────────────────
  _destroyDragGhost() {
    if (this._dragGhost) {
      this._dragGhost.destroy();
      this._dragGhost = null;
    }
    this._isDraggingAny = false;
    this._dragChar      = null;
    this._dragCharId    = null;
    this._dragTargetIdx = null;
  },

  // ── 격자 히트 테스트 ─────────────────────────────────────────
  _hitTestGrid(px, py) {
    if (!this._gridCells) return null;
    const cs      = this._cellSize;
    const subHalf = this._subSize / 2;

    // 잠수정 칸
    if (Math.abs(px - this._subCx) < subHalf && Math.abs(py - this._subCy) < subHalf) {
      return 9;
    }
    // 3×3 격자
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellCx = this._gridX + col * cs + cs / 2;
        const cellCy = this._gridY + row * cs + cs / 2;
        if (Math.abs(px - cellCx) < cs * 0.50 && Math.abs(py - cellCy) < cs * 0.50) {
          return row * 3 + col;
        }
      }
    }
    return null;
  },

  // ── 셀 발광 효과 ─────────────────────────────────────────────
  _updateCellGlow(idx) {
    this._clearCellGlow();
    if (idx === null) return;

    const { scene } = this;
    const glowG = scene.add.graphics().setDepth(500);
    this._glowGraphics = glowG;

    let cx, cy, sz;
    if (idx === 9) {
      cx = this._subCx; cy = this._subCy; sz = this._subSize;
    } else {
      const cs  = this._cellSize;
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      cx = this._gridX + col * cs + cs / 2;
      cy = this._gridY + row * cs + cs / 2;
      sz = cs * 0.90;
    }

    const layers = [
      { pad: 6, alpha: 0.10, col: 0xffd060 },
      { pad: 3, alpha: 0.22, col: 0xffd060 },
      { pad: 1, alpha: 0.45, col: 0xffe080 },
    ];
    layers.forEach(({ pad, alpha, col }) => {
      glowG.lineStyle(2 + pad, col, alpha);
      glowG.strokeRect(cx - sz / 2 - pad, cy - sz / 2 - pad, sz + pad * 2, sz + pad * 2);
    });
    glowG.lineStyle(2, 0xffd060, 1);
    glowG.strokeRect(cx - sz / 2, cy - sz / 2, sz, sz);
    glowG.fillStyle(0xffd060, 0.08);
    glowG.fillRect(cx - sz / 2, cy - sz / 2, sz, sz);

    scene.tweens.add({
      targets: glowG, alpha: { from: 1, to: 0.55 },
      duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  },

  _clearCellGlow() {
    if (this._glowGraphics) {
      this._glowGraphics.destroy();
      this._glowGraphics = null;
    }
  },

  // ── 드롭 처리 (전역 pointerup에서 호출) ─────────────────────
  _dropDrag(ptr) {
    this._clearCellGlow();
    const char = this._dragChar;
    this._destroyDragGhost();
    if (!char) return;

    const hitIdx = this._hitTestGrid(ptr.x, ptr.y);
    if (hitIdx === null) return;

    const slot = this._squad[hitIdx] || [];
    if (slot.length >= 3) {
      this._showToast('해당 칸은 이미 가득 찼습니다 (최대 3명)');
      return;
    }
    if (slot.includes(char.id)) {
      this._showToast('이미 같은 칸에 배치된 캐릭터입니다');
      return;
    }

    slot.push(char.id);
    this._squad[hitIdx] = slot;
    CharacterManager.saveSquad(this._squad);
    this._rebuildGridFull();
    this._populateSlider();
  },

  // ── 전역 드래그 리스너 설정 ──────────────────────────────────
  // 슬라이더 가로 스크롤 + 드래그 앤 드롭을 단일 리스너 세트로 처리
  _setupDragListeners() {
    const { scene } = this;
    const { _sliderAreaX: aX, _sliderAreaY: aY, _sliderAreaW: aW, _sliderAreaH: aH } = this;
    let startX = 0, startOff = 0;

    const inArea = (ptr) =>
      ptr.x >= aX && ptr.x <= aX + aW && ptr.y >= aY && ptr.y <= aY + aH;

    // ── pointerdown ─────────────────────────────────────────────
    this._sliderOnDown = (ptr) => {
      // 드래그 중이면 슬라이더 스크롤 시작 차단
      if (this._dragGhost) return;
      if (!inArea(ptr)) return;
      startX = ptr.x;
      startOff = this._sliderOffset;
      this._sliderDragged = false;
    };

    // ── pointermove ─────────────────────────────────────────────
    // 드래그 고스트가 있으면 고스트 이동만 처리
    // 없으면 슬라이더 가로 스크롤 처리
    this._sliderOnMove = (ptr) => {
      if (this._dragGhost) {
        this._moveDrag(ptr);
        return;
      }
      if (!ptr.isDown) return;
      if (!inArea({ x: ptr.x, y: ptr.y })) return;
      const dx = ptr.x - startX;
      if (Math.abs(dx) > 5) this._sliderDragged = true;
      if (!this._sliderDragged) return;
      const maxOff = -(Math.max(0, this._sliderTotalW - aW));
      this._sliderOffset = Math.max(maxOff, Math.min(0, startOff + dx));
      this._sliderRow.x  = aX + this._sliderOffset;
    };

    // ── pointerup ───────────────────────────────────────────────
    // 드래그 고스트가 있으면 드롭 판정 처리
    this._sliderOnUp = (ptr) => {
      if (this._dragGhost) {
        this._dropDrag(ptr);
        return;
      }
      scene.time.delayedCall(50, () => { this._sliderDragged = false; });
    };

    // ── wheel ────────────────────────────────────────────────────
    this._sliderOnWheel = (ptr, objs, dx, dy) => {
      if (!inArea(ptr)) return;
      const maxOff = -(Math.max(0, this._sliderTotalW - aW));
      this._sliderOffset = Math.max(maxOff, Math.min(0, this._sliderOffset - dy * 0.6));
      this._sliderRow.x  = aX + this._sliderOffset;
    };

    scene.input.on('pointerdown', this._sliderOnDown);
    scene.input.on('pointermove', this._sliderOnMove);
    scene.input.on('pointerup',   this._sliderOnUp);
    scene.input.on('wheel',       this._sliderOnWheel);
  },

});
