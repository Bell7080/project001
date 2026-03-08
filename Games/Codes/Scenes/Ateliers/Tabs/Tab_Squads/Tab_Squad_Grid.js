// ================================================================
//  Tab_Squad_Grid.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Squads/Tab_Squad_Grid.js
//
//  역할: 탐사대 탭 — 3×3 배치 격자 + 잠수정 칸
//        셀 클릭 시 마지막 캐릭터 회수
//
//  ✏️ 수정:
//    - 슬롯 캐릭터 행에 spriteKey 일러스트 표시 (좌측)
//    - 중복 배치 방지: _isCharDeployed() 헬퍼 추가
//
//  의존: Tab_Squad.js (prototype 확장)
// ================================================================

Object.assign(Tab_Squad.prototype, {

  _buildGrid(gx, gy, cs) {
    const { scene } = this;
    const chars = CharacterManager.loadAll() || [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        this._gridCells.push(
          this._makeGridCell(idx, gx + col * cs + cs / 2, gy + row * cs + cs / 2, cs * 0.90, chars)
        );
      }
    }

    // 격자 외곽선
    const outline = scene.add.graphics();
    outline.lineStyle(1, 0x6a3a18, 0.8);
    outline.strokeRect(gx, gy, cs * 3, cs * 3);
    this._container.add(outline);

    // 잠수정 칸 (인덱스 9)
    const subSize = cs * 0.90;
    const subCx   = gx - cs * 0.60;
    const subCy   = gy + cs * 1.5;
    this._subCx   = subCx;
    this._subCy   = subCy;
    this._subSize = subSize;
    this._gridCells.push(this._makeGridCell(9, subCx, subCy, subSize, chars, true));

    // 잠수정 연결선
    const subLine = scene.add.graphics();
    subLine.lineStyle(1, 0x5a9aaa, 0.7);
    subLine.lineBetween(subCx + subSize / 2, subCy, gx, subCy);
    this._container.add(subLine);

    // 입구 화살표
    const entCx  = gx + cs * 3 + cs * 0.50;
    const entCy  = gy + cs * 1.5;
    const arrW   = cs * 0.52;
    const arrH   = cs * 0.44;
    const shaftH = cs * 0.20;
    const ax     = entCx + arrW / 2;
    const tip    = entCx - arrW / 2;
    const pts    = [
      { x: ax,    y: entCy - shaftH / 2 },
      { x: ax,    y: entCy + shaftH / 2 },
      { x: entCx, y: entCy + shaftH / 2 },
      { x: entCx, y: entCy + arrH  / 2  },
      { x: tip,   y: entCy              },
      { x: entCx, y: entCy - arrH  / 2  },
      { x: entCx, y: entCy - shaftH / 2 },
    ];
    const entGfx = scene.add.graphics();
    entGfx.fillStyle(0x4a1010, 0.85);
    entGfx.lineStyle(2, 0xaa3020, 0.9);
    entGfx.fillPoints(pts, true);
    entGfx.strokePoints(pts, true);

    const entLbl = scene.add.text(
      entCx + arrW * 0.05,
      entCy + arrH / 2 + parseInt(scaledFontSize(5, scene.scale)),
      '입  구', {
        fontSize: scaledFontSize(7, scene.scale),
        fill: '#8a4030', fontFamily: FontManager.MONO,
      }).setOrigin(0.5, 0);

    const entLine = scene.add.graphics();
    entLine.lineStyle(1, 0x6a2010, 0.5);
    entLine.lineBetween(gx + cs * 3, entCy, tip, entCy);
    this._container.add([entGfx, entLbl, entLine]);
  },

  _makeGridCell(idx, cx, cy, size, chars, isSub = false) {
    const { scene } = this;

    const slotChars = (this._squad[idx] || [])
      .map(id => chars.find(c => c.id === id))
      .filter(Boolean);
    const count = slotChars.length;
    const MAX   = 3;

    const JOB_COLOR  = { fisher: 0x1e3a5c, diver: 0x1e3d28, ai: 0x2e2248 };

    const HEADER_R = isSub ? 0.28 : 0.0;
    const headerH  = size * HEADER_R;
    const bodyH    = size - headerH;
    const rowH     = bodyH / MAX;

    const L = cx - size / 2;
    const T = cy - size / 2;

    // ── 셀 배경 ─────────────────────────────────────────────────
    const cellBg   = scene.add.graphics();
    const drawCell = (hover = false, glowing = false) => {
      cellBg.clear();
      const fillC = isSub ? 0x0e1f38 : 0x1a1410;
      const lineC = glowing ? 0xffd060
                  : hover   ? 0xc8a050
                  : isSub   ? 0x5a9aaa
                  :            0x4a3018;
      const lineW = glowing ? 2 : 1;
      cellBg.fillStyle(fillC, 1);
      cellBg.lineStyle(lineW, lineC, glowing ? 1 : 0.9);
      cellBg.strokeRect(L, T, size, size);
      cellBg.fillRect(L, T, size, size);
    };
    drawCell();
    this._container.add(cellBg);

    // ── 잠수정 헤더 ─────────────────────────────────────────────
    if (isSub) {
      const hdrBg = scene.add.graphics();
      hdrBg.fillStyle(0x152d4a, 1);
      hdrBg.fillRect(L + 1, T + 1, size - 2, headerH - 1);
      hdrBg.lineStyle(1, 0x3a6888, 0.9);
      hdrBg.lineBetween(L, T + headerH, L + size, T + headerH);
      this._container.add(hdrBg);

      const fs7 = scaledFontSize(7, scene.scale);
      this._container.add(
        scene.add.text(cx, T + headerH * 0.32, '잠  수  정', {
          fontSize: fs7, fill: '#7abccc', fontFamily: FontManager.MONO,
        }).setOrigin(0.5, 0.5)
      );
      this._container.add(
        scene.add.text(cx, T + headerH * 0.72, 'SUB', {
          fontSize: fs7, fill: '#4a7a8a', fontFamily: FontManager.MONO,
        }).setOrigin(0.5, 0.5)
      );
    }

    // ── 캐릭터 행 (일러스트 + 이름) ─────────────────────────────
    for (let i = 0; i < MAX; i++) {
      const rowTop = T + headerH + rowH * i;
      const rowMid = rowTop + rowH / 2;

      if (i < count) {
        const char = slotChars[i];
        const rowBg = scene.add.graphics();
        rowBg.fillStyle(JOB_COLOR[char.job] || 0x181410, 0.9);
        rowBg.fillRect(L + 1, rowTop + 1, size - 2, rowH - 2);
        this._container.add(rowBg);

        if (i > 0) {
          const sep = scene.add.graphics();
          sep.lineStyle(1, 0x050403, 0.9);
          sep.lineBetween(L + 2, rowTop, L + size - 2, rowTop);
          this._container.add(sep);
        }

        // HP 미니바
        const hpPct = char.maxHp > 0 ? char.currentHp / char.maxHp : 1;
        const hpCol = hpPct > 0.6 ? 0x306030 : hpPct > 0.3 ? 0x806020 : 0x803020;
        const hpBH  = 2;
        const hpBW  = size - 6;
        const hpBX  = L + 3;
        const hpBY  = rowTop + rowH - hpBH - 1;
        const hpBg2 = scene.add.graphics();
        hpBg2.fillStyle(0x050404, 1);
        hpBg2.fillRect(hpBX, hpBY, hpBW, hpBH);
        const hpFg2 = scene.add.graphics();
        hpFg2.fillStyle(hpCol, 1);
        hpFg2.fillRect(hpBX, hpBY, Math.max(1, Math.round(hpBW * hpPct)), hpBH);
        this._container.add([hpBg2, hpFg2]);

        // ── 일러스트 (좌측) ──────────────────────────────────────
        const iconSize = rowH * 0.82;
        const iconX    = L + iconSize * 0.55;
        const iconY    = rowMid - 1;

        if (char.spriteKey && scene.textures.exists(char.spriteKey)) {
          const img = scene.add.image(iconX, iconY, char.spriteKey).setOrigin(0.5);
          const sc  = Math.min(iconSize / img.width, iconSize / img.height) * 0.92;
          img.setScale(sc);
          this._container.add(img);
        }

        // ── 이름 텍스트 (일러스트 우측) ─────────────────────────
        const nameX = L + iconSize * 1.15;
        this._container.add(
          scene.add.text(nameX, rowMid - 1, char.name, {
            fontSize: scaledFontSize(6.5, scene.scale),
            fill: '#c8a060', fontFamily: FontManager.MONO,
          }).setOrigin(0, 0.5)
        );

      } else {
        if (i > 0 || isSub) {
          const sep = scene.add.graphics();
          sep.lineStyle(1, 0x160e06, 0.5);
          sep.lineBetween(L + 4, rowTop, L + size - 4, rowTop);
          this._container.add(sep);
        }
      }
    }

    // 빈 일반 셀: 슬롯 번호 + 안내
    if (!isSub && count === 0) {
      this._container.add(
        scene.add.text(cx, cy - parseInt(scaledFontSize(4, scene.scale)), `${idx + 1}`, {
          fontSize: scaledFontSize(12, scene.scale),
          fill: '#3a2a14', fontFamily: FontManager.MONO,
        }).setOrigin(0.5, 0.5)
      );
      this._container.add(
        scene.add.text(cx, cy + parseInt(scaledFontSize(8, scene.scale)), '드롭', {
          fontSize: scaledFontSize(6, scene.scale),
          fill: '#2e2010', fontFamily: FontManager.MONO,
        }).setOrigin(0.5, 0.5)
      );
    }

    // 인원 배지
    this._container.add(
      scene.add.text(L + size - 3, T + 3, `${count}/${MAX}`, {
        fontSize: scaledFontSize(6, scene.scale),
        fill: count >= MAX ? '#e8c040' : '#4a6878',
        fontFamily: FontManager.MONO,
      }).setOrigin(1, 0)
    );

    // ── 히트 영역 ───────────────────────────────────────────────
    const hit = scene.add.rectangle(cx, cy, size, size, 0, 0)
      .setInteractive({ useHandCursor: count > 0 });
    hit.on('pointerover', () => {
      if (!this._dragGhost) drawCell(true, false);
    });
    hit.on('pointerout',  () => drawCell(false, false));
    hit.on('pointerup',   () => {
      if (this._dragGhost) return;
      if (count > 0) this._removeLastFromSlot(idx);
    });
    this._container.add(hit);

    return { idx, drawCell, cellBg, hit };
  },

  // ── 캐릭터가 이미 어딘가에 배치되어 있는지 확인 ──────────────
  _isCharDeployed(charId) {
    return this._squad.some(slot => Array.isArray(slot) && slot.includes(charId));
  },

  // ── 마지막 캐릭터 회수 ──────────────────────────────────────
  _removeLastFromSlot(idx) {
    const slot = this._squad[idx] || [];
    if (!slot.length) return;
    slot.pop();
    this._squad[idx] = slot;
    CharacterManager.saveSquad(this._squad);
    this._updateHint();
    this._rebuildGridFull();
    this._populateSlider();
  },

  _updateHint() {
    if (!this._hintText) return;
    this._hintText.setText('카드를 칸에 드래그하여 배치  ·  배치된 칸 클릭으로 회수');
  },

  // ── 격자 전체 재빌드 ─────────────────────────────────────────
  _rebuildGridFull() {
    this._gridCells.forEach(cell => { cell.cellBg.destroy(); cell.hit.destroy(); });
    this._gridCells = [];
    const chars = CharacterManager.loadAll() || [];
    const { _gridX: gx, _gridY: gy, _cellSize: cs } = this;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        this._gridCells.push(this._makeGridCell(
          idx, gx + col * cs + cs / 2, gy + row * cs + cs / 2, cs * 0.90, chars
        ));
      }
    }
    this._gridCells.push(this._makeGridCell(
      9, this._subCx, this._subCy, this._subSize, chars, true
    ));
  },

});
