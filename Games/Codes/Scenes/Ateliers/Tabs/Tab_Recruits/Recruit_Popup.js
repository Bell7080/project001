// ================================================================
//  Recruit_Popup.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruits/Recruit_Popup.js
//
//  역할: 재설정 팝업 두 종류
//    _showStatPopup   — 스탯 비교 (이전 vs 새로운), 두 박스 클릭 선택
//    _showChoicePopup — 외형/패시브/스킬 유지 vs 새로운 선택
//  의존: Recruit_Data.js, Tab_Recruit.js(this)
//
//  ✏️ 수정:
//    - 외형 팝업 배경색 밝게 (0x0a0806 → 0x221810)
//    - 외형 이미지 크기 20% 축소 (bW*0.80 → bW*0.64)
//    - 패시브/스킬 설명 텍스트 fontSize 9 → 13
// ================================================================

// ── 스탯 재설정 팝업 ─────────────────────────────────────────────
// overclock: this.result.overclock (없으면 null)
// prevBase / nextBase: 오버클럭 적용 전 원본 배열 (없으면 null)
Tab_Recruit.prototype._showStatPopup = function (prevStats, nextStats, onConfirm, overclock, prevBase, nextBase) {
  const { scene, W, H } = this;
  const cx = W / 2;
  const cy = H / 2;

  const overlay = scene.add.rectangle(0, 0, W, H, 0x000000, 0.80)
    .setOrigin(0).setDepth(80).setInteractive();  // 뒷배경 클릭 차단
  const pop = scene.add.container(0, 0).setDepth(81);

  const bW  = W * 0.26;
  const bH  = H * 0.52;   // 오버클럭 행 여유 확보
  const gap = W * 0.04;
  const lx  = cx - bW/2 - gap/2;
  const rx  = cx + bW/2 + gap/2;
  const bY  = cy;
  const rowH = bH / (RECRUIT_STAT_LABELS.length + 1.8);

  // 스탯 색상 맵 (CharacterManager 없을 때 폴백)
  const SC = (typeof CharacterManager !== 'undefined' && CharacterManager.STAT_COLORS)
    ? CharacterManager.STAT_COLORS
    : { hp:'#ff88bb', health:'#ff4466', attack:'#ff3333', agility:'#55ccff', luck:'#88ff88' };
  const SCO = ['hp', 'health', 'attack', 'agility', 'luck'];

  const ocIdx   = overclock ? overclock.statIdx : -1;
  const ocColor = overclock ? overclock.color   : null;
  const ocHex   = ocColor ? parseInt(ocColor.replace('#','0x')) : null;

  let selectedSide = null;

  const makePanel = (panelX, stats, isPrev) => {
    const side   = isPrev ? 'prev' : 'next';
    const panelG = scene.add.graphics();
    const glowG  = scene.add.graphics();

    const draw = (state) => {
      panelG.clear(); glowG.clear();
      if (state === 'selected') {
        panelG.fillStyle(isPrev ? 0x1a1206 : 0x0e1a08, 1);
        panelG.lineStyle(2, isPrev ? 0xc8a030 : 0x40c840, 1);
        [
          { pad: 12, a: 0.07, c: isPrev ? 0xc8a030 : 0x30c830 },
          { pad:  7, a: 0.18, c: isPrev ? 0xc8a030 : 0x30c830 },
          { pad:  3, a: 0.35, c: isPrev ? 0xb08020 : 0x20b820 },
          { pad:  1, a: 0.60, c: isPrev ? 0x906010 : 0x10a010 },
        ].forEach(({ pad, a, c }) => {
          glowG.lineStyle(2, c, a);
          glowG.strokeRect(panelX - bW/2 - pad, bY - bH/2 - pad, bW + pad*2, bH + pad*2);
        });
      } else if (state === 'hover') {
        panelG.fillStyle(0x1a1208, 1); panelG.lineStyle(1, 0x5a3010, 0.9);
      } else {
        panelG.fillStyle(0x120d07, 1); panelG.lineStyle(1, 0x2a1a08, 0.7);
      }
      // ✏️ 오버클럭 패널 테두리 제거 (증감 박스로만 표현)
      panelG.fillRect(panelX - bW/2, bY - bH/2, bW, bH);
      panelG.strokeRect(panelX - bW/2, bY - bH/2, bW, bH);
    };

    draw('normal');
    pop.add(glowG); pop.add(panelG);

    pop.add(scene.add.text(panelX, bY - bH*0.44,
      isPrev ? '◀  현재 스탯' : '새로운 스탯  ▶', {
      fontSize: this._fs(12), fill: isPrev ? '#c8a060' : '#60c860',
      fontFamily: FontManager.MONO,
    }).setOrigin(0.5));

    const hlineG = scene.add.graphics();
    hlineG.lineStyle(1, 0x2a1808, 0.7);
    hlineG.lineBetween(panelX - bW*0.42, bY - bH*0.36, panelX + bW*0.42, bY - bH*0.36);
    pop.add(hlineG);

    // 오버클럭인 패널이라면 해당 행 glow 먼저 그리기
    const baseArr = isPrev ? prevBase : nextBase;

    // ── 스탯 블록 (커스텀 박스 외형과 동일) ─────────────────────
    const sbX  = panelX - bW * 0.42;
    const sbW  = bW * 0.84;
    const sbY0 = bY - bH * 0.28;
    const rH   = rowH * 0.92;
    const sbH  = rH * RECRUIT_STAT_LABELS.length;

    // 블록 외곽 배경
    const sbBg = scene.add.graphics();
    sbBg.fillStyle(0x0e0b07, 1);
    sbBg.lineStyle(1, 0x2a1a08, 0.7);
    sbBg.fillRect(sbX, sbY0, sbW, sbH);
    sbBg.strokeRect(sbX, sbY0, sbW, sbH);
    pop.add(sbBg);

    RECRUIT_STAT_LABELS.forEach((label, i) => {
      const ry   = sbY0 + i * rH;
      const midY = ry + rH * 0.5;
      const isOc    = i === ocIdx;
      const statCol = SC[SCO[i]] || '#c8bfb0';

      // 행 구분선
      if (i > 0) {
        const sg = scene.add.graphics();
        sg.lineStyle(1, 0x1e1206, 0.5);
        sg.lineBetween(sbX + 4, ry, sbX + sbW - 4, ry);
        pop.add(sg);
      }

      // 오버클럭 행 좌측 강조선
      if (isOc) {
        const ocSlice = scene.add.graphics();
        const slices  = 20;
        const sliceW  = sbW / slices;
        for (let s = 0; s < slices; s++) {
          const alpha = 0.22 - (0.20 * s / (slices - 1));
          ocSlice.fillStyle(ocHex, alpha);
          ocSlice.fillRect(sbX + 1 + s * sliceW, ry + 1, Math.ceil(sliceW), rH - 2);
        }
        ocSlice.fillStyle(ocHex, 0.85);
        ocSlice.fillRect(sbX + 1, ry + 1, 2, rH - 2);
        pop.add(ocSlice);
      }

      // 새로운 탭 증감 배경
      if (!isPrev) {
        const prevBaseVal = prevBase ? prevBase[i] : prevStats[i];
        const nextBaseVal = nextBase ? nextBase[i] : stats[i];
        const baseDiff = nextBaseVal - prevBaseVal;
        if (baseDiff !== 0) {
          const boxCol  = baseDiff > 0 ? 0x204820 : 0x481010;
          const lineCol = baseDiff > 0 ? 0x30a030 : 0xa03030;
          const diffBg  = scene.add.graphics();
          diffBg.fillStyle(boxCol, 0.45);
          diffBg.lineStyle(1, lineCol, 0.5);
          diffBg.fillRect(sbX + 2, ry + 1, sbW - 4, rH - 2);
          diffBg.strokeRect(sbX + 2, ry + 1, sbW - 4, rH - 2);
          pop.add(diffBg);
        }
      }

      // 스탯 라벨
      pop.add(scene.add.text(sbX + 8, midY, label, {
        fontSize: this._fs(13),
        fill: isOc ? ocColor : statCol + 'cc',
        fontFamily: FontManager.MONO,
      }).setOrigin(0, 0.5));

      // 수치
      const rawVal = baseArr ? baseArr[i] : stats[i];
      const valStr = isOc ? `${rawVal} → ${stats[i]}` : `${stats[i]}`;
      pop.add(scene.add.text(sbX + sbW * 0.60, midY, valStr, {
        fontSize: this._fs(15),
        fill: isOc ? ocColor : statCol,
        fontFamily: FontManager.MONO, fontStyle: 'bold',
      }).setOrigin(0.5, 0.5));

      // 증감 화살표
      if (!isPrev) {
        const prevBaseVal = prevBase ? prevBase[i] : prevStats[i];
        const nextBaseVal = nextBase ? nextBase[i] : stats[i];
        const baseDiff = nextBaseVal - prevBaseVal;
        if (baseDiff !== 0) {
          pop.add(scene.add.text(sbX + sbW - 4, midY,
            `${baseDiff > 0 ? '▲' : '▼'}${Math.abs(baseDiff)}`, {
            fontSize: this._fs(11),
            fill: baseDiff > 0 ? '#50e050' : '#e05050',
            fontFamily: FontManager.MONO,
          }).setOrigin(1, 0.5));
        }
      }
    });

    const hit = scene.add.rectangle(panelX, bY, bW, bH, 0, 0)
      .setInteractive({ useHandCursor: true });
    pop.add(hit);
    hit.on('pointerover', () => { if (selectedSide !== side) draw('hover'); });
    hit.on('pointerout',  () => { if (selectedSide !== side) draw('normal'); });

    return { draw, hit, side };
  };

  const prevPanel = makePanel(lx, prevStats, true);
  const nextPanel = makePanel(rx, nextStats, false);

  const onPanelClick = (panel, otherPanel, stats) => {
    panel.hit.on('pointerdown', () => {
      if (selectedSide === panel.side) {
        overlay.destroy(); pop.destroy(); onConfirm(stats);
      } else {
        selectedSide = panel.side;
        panel.draw('selected');
        otherPanel.draw('normal');
      }
    });
  };
  onPanelClick(prevPanel, nextPanel, prevStats);
  onPanelClick(nextPanel, prevPanel, nextStats);
};

// ── 외형/패시브/스킬 선택 팝업 ───────────────────────────────────
Tab_Recruit.prototype._showChoicePopup = function (title, prevLabel, nextLabel, onConfirm, rawValues) {
  const { scene, W, H } = this;
  const cx = W / 2;
  const cy = H / 2;

  const overlay = scene.add.rectangle(0, 0, W, H, 0x000000, 0.80)
    .setOrigin(0).setDepth(80).setInteractive();  // 뒷배경 클릭 차단
  const pop = scene.add.container(0, 0).setDepth(81);

  const isSprite = rawValues &&
    typeof rawValues[0] === 'string' && rawValues[0].startsWith('char_');
  const bW  = isSprite ? W * 0.20 : W * 0.26;
  const bH  = isSprite ? H * 0.52 : H * 0.24;
  const gap = W * 0.04;
  const lx  = cx - bW/2 - gap/2;
  const rx  = cx + bW/2 + gap/2;
  const bY  = cy;

  pop.add(scene.add.text(cx, cy - bH/2 - parseInt(this._fs(16)), title, {
    fontSize: this._fs(13), fill: '#c8bfb0', fontFamily: FontManager.MONO,
  }).setOrigin(0.5));

  let selectedSide = null;

  const makePanel = (panelX, label, isPrev, rawVal) => {
    const side   = isPrev ? 'prev' : 'next';
    const panelG = scene.add.graphics();
    const glowG  = scene.add.graphics();

    const draw = (state) => {
      panelG.clear(); glowG.clear();
      if (state === 'selected') {
        panelG.fillStyle(isPrev ? 0x1a1206 : 0x0e1a08, 1);
        panelG.lineStyle(2, isPrev ? 0xc8a030 : 0x40c840, 1);
        [
          { pad: 12, a: 0.07, c: isPrev ? 0xc8a030 : 0x30c830 },
          { pad:  7, a: 0.18, c: isPrev ? 0xc8a030 : 0x30c830 },
          { pad:  3, a: 0.35, c: isPrev ? 0xb08020 : 0x20b820 },
          { pad:  1, a: 0.60, c: isPrev ? 0x906010 : 0x10a010 },
        ].forEach(({ pad, a, c }) => {
          glowG.lineStyle(2, c, a);
          glowG.strokeRect(panelX - bW/2 - pad, bY - bH/2 - pad, bW + pad*2, bH + pad*2);
        });
      } else if (state === 'hover') {
        panelG.fillStyle(0x1a1208, 1); panelG.lineStyle(1, 0x5a3010, 0.9);
      } else {
        panelG.fillStyle(0x120d07, 1); panelG.lineStyle(1, 0x2a1a08, 0.7);
      }
      panelG.fillRect(panelX - bW/2, bY - bH/2, bW, bH);
      panelG.strokeRect(panelX - bW/2, bY - bH/2, bW, bH);
    };

    draw('normal');
    pop.add(glowG); pop.add(panelG);

    pop.add(scene.add.text(panelX, bY - bH*0.44,
      isPrev ? '◀  현재' : '새로운  ▶', {
      fontSize: this._fs(12),
      fill: isPrev ? '#c8a060' : '#60c860',
      fontFamily: FontManager.MONO, letterSpacing: 2,
    }).setOrigin(0.5));

    const hlineG = scene.add.graphics();
    hlineG.lineStyle(1, 0x2a1808, 0.7);
    hlineG.lineBetween(panelX - bW*0.42, bY - bH*0.34, panelX + bW*0.42, bY - bH*0.34);
    pop.add(hlineG);

    if (isSprite) {
      // ✏️ 이미지 크기 20% 축소 (0.80 → 0.64), 배경 밝게 (0x0a0806 → 0x221810)
      const iSz = bW * 0.64;
      const iY  = bY + bH * 0.02;
      const iBg = scene.add.graphics();
      iBg.fillStyle(0x221810, 1);
      iBg.lineStyle(1, 0x4a3020, 0.9);
      iBg.fillRect(panelX - iSz/2, iY - iSz/2, iSz, iSz);
      iBg.strokeRect(panelX - iSz/2, iY - iSz/2, iSz, iSz);
      pop.add(iBg);

      if (rawVal && scene.textures.exists(rawVal)) {
        const img = scene.add.image(panelX, iY, rawVal).setOrigin(0.5);
        const sc  = Math.min(iSz / img.width, iSz / img.height) * 0.90;
        img.setScale(sc);
        pop.add(img);
      } else {
        const num = parseInt((rawVal || '').replace('char_', '')) + 1;
        pop.add(scene.add.text(panelX, iY, `#${num}`, {
          fontSize: this._fs(18), fill: '#3d2010', fontFamily: FontManager.MONO,
        }).setOrigin(0.5));
      }
    } else {
      // 패시브 / 스킬 / 포지션 팝업
      const nameY = bY - bH * 0.08;
      pop.add(scene.add.text(panelX, nameY, label, {
        fontSize: this._fs(14), fill: '#e8c060',
        fontFamily: FontManager.TITLE,
      }).setOrigin(0.5));

      // ✏️ 포지션 설명도 포함
      const desc = (typeof getPositionDescription === 'function' ? getPositionDescription(label) : '') ||
                   (typeof getPassiveDescription  === 'function' ? getPassiveDescription(label)  : '') ||
                   (typeof getSkillDescription    === 'function' ? getSkillDescription(label)    : '') || '';
      if (desc) {
        pop.add(scene.add.text(panelX, nameY + parseInt(this._fs(22)), desc, {
          fontSize: this._fs(13), fill: '#a07840',
          fontFamily: FontManager.MONO,
          wordWrap: { width: bW * 0.84 }, align: 'center',
        }).setOrigin(0.5, 0));
      }
    }

    const hit = scene.add.rectangle(panelX, bY, bW, bH, 0, 0)
      .setInteractive({ useHandCursor: true });
    pop.add(hit);
    hit.on('pointerover', () => { if (selectedSide !== side) draw('hover'); });
    hit.on('pointerout',  () => { if (selectedSide !== side) draw('normal'); });

    return { draw, hit, side };
  };

  const prevPanel = makePanel(lx, prevLabel, true,  rawValues?.[0]);
  const nextPanel = makePanel(rx, nextLabel, false, rawValues?.[1]);

  const onPanelClick = (panel, otherPanel, val) => {
    panel.hit.on('pointerdown', () => {
      if (selectedSide === panel.side) {
        overlay.destroy(); pop.destroy(); onConfirm(val);
      } else {
        selectedSide = panel.side;
        panel.draw('selected');
        otherPanel.draw('normal');
      }
    });
  };
  onPanelClick(prevPanel, nextPanel, rawValues?.[0] ?? prevLabel);
  onPanelClick(nextPanel, prevPanel, rawValues?.[1] ?? nextLabel);

  // X버튼 없음 — 반드시 선택해야 닫힘
};
