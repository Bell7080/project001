// ================================================================
//  Recruit_Popup.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruits/Recruit_Popup.js
//
//  역할: 재설정 팝업 두 종류
//    _showStatPopup   — 스탯 비교 (이전 vs 새로운), 두 박스 클릭 선택
//    _showChoicePopup — 외형/패시브/스킬 유지 vs 새로운 선택
//  의존: Recruit_Data.js, Tab_Recruit.js(this)
// ================================================================

// ── 스탯 재설정 팝업 ─────────────────────────────────────────────
// 검은 오버레이 위에 두 패널만 표시
// 1클릭 → 발광 선택, 2클릭 → 확정

Tab_Recruit.prototype._showStatPopup = function (prevStats, nextStats, onConfirm) {
  const { scene, W, H } = this;
  const cx = W / 2;
  const cy = H / 2;

  // 씬 레벨에 직접 생성 — _container(depth 51)보다 위인 60/61에 배치
  // 이렇게 해야 커스텀 화면을 덮는 진짜 오버레이가 된다
  const overlay = scene.add.rectangle(0, 0, W, H, 0x000000, 0.80)
    .setOrigin(0).setDepth(60).setInteractive(); // 커스텀 UI 클릭 차단
  const pop = scene.add.container(0, 0).setDepth(61);

  const bW  = W * 0.26;
  const bH  = H * 0.48;
  const gap = W * 0.04;
  const lx  = cx - bW/2 - gap/2;
  const rx  = cx + bW/2 + gap/2;
  const bY  = cy;
  const rowH = bH / (RECRUIT_STAT_LABELS.length + 1.5);

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
      panelG.fillRect(panelX - bW/2, bY - bH/2, bW, bH);
      panelG.strokeRect(panelX - bW/2, bY - bH/2, bW, bH);
    };

    draw('normal');
    pop.add(glowG); pop.add(panelG);

    // 헤더
    pop.add(scene.add.text(panelX, bY - bH*0.44,
      isPrev ? '◀  현재 스탯' : '새로운 스탯  ▶', {
      fontSize: this._fs(12), fill: isPrev ? '#c8a060' : '#60c860',
      fontFamily: FontManager.MONO, letterSpacing: 2,
    }).setOrigin(0.5));

    // 헤더 구분선
    const hlineG = scene.add.graphics();
    hlineG.lineStyle(1, 0x2a1808, 0.7);
    hlineG.lineBetween(panelX - bW*0.42, bY - bH*0.36, panelX + bW*0.42, bY - bH*0.36);
    pop.add(hlineG);

    // 스탯 행
    RECRUIT_STAT_LABELS.forEach((label, i) => {
      const ry   = bY - bH*0.28 + i * rowH;
      const val  = stats[i];
      const diff = val - prevStats[i];

      pop.add(scene.add.text(panelX - bW*0.38, ry, label, {
        fontSize: this._fs(13), fill: '#a08060', fontFamily: FontManager.MONO,
      }).setOrigin(0, 0.5));

      pop.add(scene.add.text(panelX + bW*0.10, ry, String(val), {
        fontSize: this._fs(15), fill: '#e8d4a0',
        fontFamily: FontManager.MONO, fontStyle: 'bold',
      }).setOrigin(0.5, 0.5));

      if (!isPrev && diff !== 0) {
        pop.add(scene.add.text(panelX + bW*0.38, ry,
          `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)}`, {
          fontSize: this._fs(13), fill: diff > 0 ? '#50e050' : '#e05050',
          fontFamily: FontManager.MONO,
        }).setOrigin(1, 0.5));
      }
    });

    // 히트 영역
    const hit = scene.add.rectangle(panelX, bY, bW, bH, 0, 0)
      .setInteractive({ useHandCursor: true });
    pop.add(hit);
    hit.on('pointerover', () => { if (selectedSide !== side) draw('hover'); });
    hit.on('pointerout',  () => { if (selectedSide !== side) draw('normal'); });

    return { draw, hit, side };
  };

  const prevPanel = makePanel(lx, prevStats, true);
  const nextPanel = makePanel(rx, nextStats, false);

  // 클릭 핸들러 (양쪽 패널 생성 후 등록)
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
  const cx = W/2; const cy = H/2;
  const pw = W*0.42; const ph = H*0.26;

  const pop = scene.add.container(0, 0).setDepth(50);
  this._container.add(pop);

  pop.add(scene.add.rectangle(cx, cy, W, H, 0x000000, 0.55));

  const pb = scene.add.graphics();
  pb.fillStyle(0x120d07, 0.98); pb.lineStyle(1, 0x3a2210, 0.9);
  pb.fillRect(cx-pw/2, cy-ph/2, pw, ph); pb.strokeRect(cx-pw/2, cy-ph/2, pw, ph);
  pop.add(pb);

  pop.add(scene.add.text(cx, cy - ph*0.38, title, {
    fontSize: this._fs(13), fill: '#c8bfb0', fontFamily: FontManager.MONO,
  }).setOrigin(0.5));

  const bW = pw*0.38; const bH = ph*0.30;
  const lx = cx - pw*0.23; const rx = cx + pw*0.23; const bY = cy + ph*0.06;

  const makeBtn = (x, topLabel, bodyLabel, isNew, value) => {
    const cbg = scene.add.graphics();
    const draw = (h) => {
      cbg.clear();
      cbg.fillStyle(h ? (isNew ? 0x3d2010 : 0x1a1008) : (isNew ? 0x2a1a0a : 0x120d07), 1);
      cbg.lineStyle(1, h ? 0xa05018 : (isNew ? 0x3d2010 : 0x2a1a0a), 1);
      cbg.fillRect(x-bW/2, bY-bH/2, bW, bH); cbg.strokeRect(x-bW/2, bY-bH/2, bW, bH);
    };
    draw(false); pop.add(cbg);
    pop.add(scene.add.text(x, bY - bH*0.30, topLabel, {
      fontSize: this._fs(9), fill: isNew ? '#a05018' : '#3d2010', fontFamily: FontManager.MONO,
    }).setOrigin(0.5));
    bodyLabel.split('   ').forEach((line, li) => {
      pop.add(scene.add.text(x, bY - 4 + li * parseInt(this._fs(12)), line, {
        fontSize: this._fs(10), fill: '#c8bfb0', fontFamily: FontManager.MONO,
      }).setOrigin(0.5));
    });
    const chit = scene.add.rectangle(x, bY, bW, bH, 0, 0).setInteractive({ useHandCursor: true });
    pop.add(chit);
    chit.on('pointerover', () => draw(true));
    chit.on('pointerout',  () => draw(false));
    chit.on('pointerdown', () => { pop.destroy(); onConfirm(value); });
  };

  makeBtn(lx, '유  지', prevLabel, false, rawValues ? rawValues[0] : prevLabel);
  makeBtn(rx, '새로운', nextLabel, true,  rawValues ? rawValues[1] : nextLabel);

  // ✕ 닫기 (유지로 처리)
  const xt = scene.add.text(cx + pw*0.44, cy - ph*0.42, '✕', {
    fontSize: this._fs(11), fill: '#4a2a10', fontFamily: FontManager.MONO,
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });
  pop.add(xt);
  xt.on('pointerover', () => xt.setStyle({ fill: '#c8bfb0' }));
  xt.on('pointerout',  () => xt.setStyle({ fill: '#4a2a10' }));
  xt.on('pointerdown', () => { pop.destroy(); onConfirm(rawValues ? rawValues[0] : prevLabel); });
};
