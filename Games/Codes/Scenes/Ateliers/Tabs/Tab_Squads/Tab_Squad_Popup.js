// ================================================================
//  Tab_Squad_Popup.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Squads/Tab_Squad_Popup.js
//
//  역할: 탐사대 탭 — 캐릭터 프로필 팝업
//        (_openSquadPopup, _closeSquadPopup, _drawPopupBtn)
//
//  의존: Tab_Squad.js (prototype 확장)
// ================================================================

Object.assign(Tab_Squad.prototype, {

  // ── 팝업 열기 ────────────────────────────────────────────────
  _openSquadPopup(char) {
    if (this._squadPopupGroup) this._closeSquadPopup();
    this._squadOpenCharId = char.id;

    const { scene, W, H } = this;

    const pw = Math.min(W * 0.58, parseInt(scaledFontSize(420, scene.scale)));
    const ph = Math.min(H * 0.70, parseInt(scaledFontSize(430, scene.scale)));
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;

    // 오버레이
    const overlay = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.62)
      .setInteractive().setDepth(700);
    overlay.on('pointerup', () => this._closeSquadPopup());
    this._squadPopupOverlay = overlay;

    // 팝업 그룹
    const grp = scene.add.container(0, 0).setDepth(701);
    this._squadPopupGroup = grp;

    // ── 배경 ────────────────────────────────────────────────────
    const bgG = scene.add.graphics();
    bgG.fillStyle(0x0d0a06, 0.98);
    bgG.lineStyle(2, 0x6a3a18, 0.9);
    bgG.strokeRect(px, py, pw, ph);
    bgG.fillRect(px, py, pw, ph);
    grp.add(bgG);

    // ── 헤더 ────────────────────────────────────────────────────
    const headerH = parseInt(scaledFontSize(34, scene.scale));

    grp.add(scene.add.text(px + 16, py + 10, '[ 캐 릭 터 프 로 필 ]', {
      fontSize: scaledFontSize(10, scene.scale), fill: '#5a3818', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0));

    // 헤더 하단 구분선
    const decoLine = scene.add.graphics();
    decoLine.lineStyle(1, 0x3a2010, 0.5);
    decoLine.lineBetween(px + 16, py + headerH, px + pw - 16, py + headerH);
    grp.add(decoLine);

    // 닫기 버튼
    this._drawPopupBtn(grp, px + pw - 28, py + 8, '✕', '#8a4030', '#cc5533',
      () => this._closeSquadPopup());

    // ── 레이아웃 기준점 ─────────────────────────────────────────
    const JOB_COLOR  = { fisher: 0x0e1f38, diver: 0x0e1f18, ai: 0x180e28 };
    const JOB_BORDER = { fisher: 0x3a6888, diver: 0x3a7050, ai: 0x6a4888 };
    const JOB_LABEL  = { fisher: '낚 시 꾼', diver: '잠 수 부', ai: 'A · I' };

    const bodyY    = py + headerH + 8;
    const pad      = 16;

    // ── 좌측: 초상화 ────────────────────────────────────────────
    const portSize = Math.floor(pw * 0.30);
    const portX    = px + pad;
    const portY    = bodyY;

    const portBg = scene.add.graphics();
    portBg.fillStyle(JOB_COLOR[char.job] || 0x0e0c08, 1);
    portBg.lineStyle(2, JOB_BORDER[char.job] || 0x4a3018, 0.9);
    portBg.strokeRect(portX, portY, portSize, portSize);
    portBg.fillRect(portX, portY, portSize, portSize);
    grp.add(portBg);

    // 이니셜 (초상화 중앙 상단)
    const initial = (char.name || '?').charAt(0);
    grp.add(scene.add.text(portX + portSize / 2, portY + portSize * 0.40, initial, {
      fontSize: scaledFontSize(34, scene.scale),
      fill: `#${(JOB_BORDER[char.job] || 0x4a3018).toString(16).padStart(6,'0')}`,
      fontFamily: FontManager.TITLE,
    }).setOrigin(0.5, 0.5));

    // 직종 라벨 (초상화 하단)
    grp.add(scene.add.text(portX + portSize / 2, portY + portSize * 0.76,
      JOB_LABEL[char.job] || char.job, {
      fontSize: scaledFontSize(8, scene.scale),
      fill: `#${(JOB_BORDER[char.job] || 0x4a3018).toString(16).padStart(6,'0')}`,
      fontFamily: FontManager.MONO,
    }).setOrigin(0.5, 0.5));

    // ── 우측: 이름 · Cog · HP · 스탯 ──────────────────────────
    const infoX  = portX + portSize + 16;
    const infoW  = px + pw - pad - infoX;
    let   curY   = portY;

    // 이름
    grp.add(scene.add.text(infoX, curY, char.name, {
      fontSize: scaledFontSize(17, scene.scale), fill: '#e8c060', fontFamily: FontManager.TITLE,
    }).setOrigin(0, 0));
    curY += parseInt(scaledFontSize(22, scene.scale));

    // Cog + 직종
    grp.add(scene.add.text(infoX, curY,
      `Cog ${char.cog}  ·  ${JOB_LABEL[char.job] || char.job}`, {
      fontSize: scaledFontSize(9, scene.scale), fill: '#7a5030', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0));
    curY += parseInt(scaledFontSize(20, scene.scale));

    // HP 레이블
    grp.add(scene.add.text(infoX, curY, 'HP', {
      fontSize: scaledFontSize(8, scene.scale), fill: '#5a4028', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0));

    // HP 수치 (우측 정렬)
    const hpPct = char.maxHp > 0 ? char.currentHp / char.maxHp : 1;
    const hpCol = hpPct > 0.6 ? 0x306030 : hpPct > 0.3 ? 0x806020 : 0x803020;
    grp.add(scene.add.text(infoX + infoW, curY,
      `${char.currentHp} / ${char.maxHp}`, {
      fontSize: scaledFontSize(7, scene.scale), fill: '#4a3020', fontFamily: FontManager.MONO,
    }).setOrigin(1, 0));
    curY += parseInt(scaledFontSize(12, scene.scale));

    // HP 바
    const hpBarH2 = 7;
    const hpBg2 = scene.add.graphics();
    hpBg2.fillStyle(0x050404, 1);
    hpBg2.lineStyle(1, 0x2a1808, 0.8);
    hpBg2.strokeRect(infoX, curY, infoW, hpBarH2);
    hpBg2.fillRect(infoX, curY, infoW, hpBarH2);
    grp.add(hpBg2);
    const hpFg2 = scene.add.graphics();
    hpFg2.fillStyle(hpCol, 1);
    hpFg2.fillRect(infoX, curY, Math.max(2, Math.round(infoW * hpPct)), hpBarH2);
    grp.add(hpFg2);
    curY += hpBarH2 + parseInt(scaledFontSize(10, scene.scale));

    // 스탯 목록
    const STATS = [
      { key: 'str',     label: 'STR' },
      { key: 'dex',     label: 'DEX' },
      { key: 'int',     label: 'INT' },
      { key: 'luck',    label: 'LCK' },
      { key: 'sanity',  label: 'SAN' },
      { key: 'stamina', label: 'STA' },
    ];
    const statBarH   = 4;
    const statRowH   = parseInt(scaledFontSize(13, scene.scale));
    const labelW     = parseInt(scaledFontSize(22, scene.scale));
    const valW       = parseInt(scaledFontSize(20, scene.scale));
    const barW       = infoW - labelW - valW - 6;

    STATS.forEach(({ key, label }) => {
      if (char[key] === undefined) return;
      const val = char[key];
      const pct = Math.min(1, val / 100);
      const bx  = infoX + labelW + 4;
      const mid = curY + statRowH / 2;

      // 라벨
      grp.add(scene.add.text(infoX, mid, label, {
        fontSize: scaledFontSize(7, scene.scale), fill: '#4a5a38', fontFamily: FontManager.MONO,
      }).setOrigin(0, 0.5));

      // 바 배경 + 채움
      const rowG = scene.add.graphics();
      rowG.fillStyle(0x050404, 1);
      rowG.fillRect(bx, mid - statBarH / 2, barW, statBarH);
      rowG.fillStyle(0x4a7050, 1);
      rowG.fillRect(bx, mid - statBarH / 2, Math.max(1, Math.round(barW * pct)), statBarH);
      grp.add(rowG);

      // 수치
      grp.add(scene.add.text(infoX + infoW, mid, `${val}`, {
        fontSize: scaledFontSize(7, scene.scale), fill: '#6a8050', fontFamily: FontManager.MONO,
      }).setOrigin(1, 0.5));

      curY += statRowH;
    });

    // ── 구분선 ──────────────────────────────────────────────────
    const divY = Math.max(portY + portSize, curY) + parseInt(scaledFontSize(10, scene.scale));
    const divG = scene.add.graphics();
    divG.lineStyle(1, 0x3a2010, 0.5);
    divG.lineBetween(px + pad, divY, px + pw - pad, divY);
    grp.add(divG);

    // ── 배치 현황 ───────────────────────────────────────────────
    const secY = divY + 8;
    grp.add(scene.add.text(px + pad, secY, '[ 배 치 현 황 ]', {
      fontSize: scaledFontSize(9, scene.scale), fill: '#5a3818', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0));

    const deploySlots = this._getDeploySlots(char.id);
    const SLOT_NAMES  = ['1번 칸','2번 칸','3번 칸','4번 칸','5번 칸',
                         '6번 칸','7번 칸','8번 칸','9번 칸','잠수정'];
    const deployY     = secY + parseInt(scaledFontSize(18, scene.scale));

    if (deploySlots.length === 0) {
      grp.add(scene.add.text(px + pad, deployY, '현재 배치된 칸 없음', {
        fontSize: scaledFontSize(8, scene.scale), fill: '#3a2510', fontFamily: FontManager.MONO,
      }).setOrigin(0, 0));
    } else {
      deploySlots.forEach((slotIdx, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const tx  = px + pad + col * parseInt(scaledFontSize(88, scene.scale));
        const ty  = deployY + row * parseInt(scaledFontSize(16, scene.scale));
        grp.add(scene.add.text(tx, ty,
          `▸ ${SLOT_NAMES[slotIdx] || `칸 ${slotIdx}`}`, {
          fontSize: scaledFontSize(8, scene.scale), fill: '#c89030', fontFamily: FontManager.MONO,
        }).setOrigin(0, 0));
      });
    }

    // ── 설명 텍스트 ─────────────────────────────────────────────
    if (char.desc) {
      const descBaseY = deployY + parseInt(scaledFontSize(deploySlots.length > 0 ? 22 : 16, scene.scale));
      const descDivG  = scene.add.graphics();
      descDivG.lineStyle(1, 0x3a2010, 0.4);
      descDivG.lineBetween(px + pad, descBaseY - 4, px + pw - pad, descBaseY - 4);
      grp.add(descDivG);
      grp.add(scene.add.text(px + pad, descBaseY, char.desc, {
        fontSize: scaledFontSize(8, scene.scale),
        fill: '#6a4828', fontFamily: FontManager.MONO,
        wordWrap: { width: pw - pad * 2 },
      }).setOrigin(0, 0));
    }

    // ── 하단 버튼 ────────────────────────────────────────────────
    const btnH   = parseInt(scaledFontSize(26, scene.scale));
    const btnY   = py + ph - btnH - 10;
    const btnGap = 8;

    if (deploySlots.length > 0) {
      const lastSlot = deploySlots[deploySlots.length - 1];
      const recallW  = pw * 0.44;
      const closeW   = pw * 0.28;
      const totalW   = recallW + btnGap + closeW;
      const startBX  = px + (pw - totalW) / 2;

      this._drawPopupBtn(grp, startBX, btnY,
        '마지막 배치 회수', '#803020', '#cc4428', () => {
          this._removeLastFromSlot(lastSlot);
          this._closeSquadPopup();
        }, recallW);

      this._drawPopupBtn(grp, startBX + recallW + btnGap, btnY,
        '닫  기', '#3a2810', '#7a5030',
        () => this._closeSquadPopup(), closeW);
    } else {
      const closeW  = pw * 0.30;
      this._drawPopupBtn(grp, px + (pw - closeW) / 2, btnY,
        '닫  기', '#3a2810', '#7a5030',
        () => this._closeSquadPopup(), closeW);
    }

    // ── 입장 애니 ────────────────────────────────────────────────
    grp.setAlpha(0);
    grp.y = parseInt(scaledFontSize(10, scene.scale));
    scene.tweens.add({
      targets: grp, alpha: 1, y: 0, duration: 150, ease: 'Cubic.easeOut',
    });
  },

  // ── 팝업 닫기 ────────────────────────────────────────────────
  _closeSquadPopup() {
    if (this._squadPopupOverlay) {
      this._squadPopupOverlay.destroy();
      this._squadPopupOverlay = null;
    }
    if (this._squadPopupGroup) {
      this._squadPopupGroup.destroy();
      this._squadPopupGroup = null;
    }
    this._squadOpenCharId = null;
  },

  // ── 팝업 내부 버튼 생성 헬퍼 ────────────────────────────────
  _drawPopupBtn(grp, bx, by, label, fillHex, hoverHex, onClick, minW = 0) {
    const { scene } = this;
    const fs2 = scaledFontSize(9, scene.scale);
    const tmp  = scene.add.text(-9999, -9999, label, { fontSize: fs2, fontFamily: FontManager.MONO });
    const bw   = Math.max(minW, tmp.width + 20); tmp.destroy();
    const bh   = parseInt(scaledFontSize(22, scene.scale));
    const cx   = bx + bw / 2;
    const cy   = by + bh / 2;

    const fillC  = parseInt(fillHex.replace('#',''), 16);
    const hoverC = parseInt(hoverHex.replace('#',''), 16);

    const btnBg = scene.add.graphics();
    const drawBtn = (hover) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? hoverC : fillC, 1);
      btnBg.lineStyle(1, hover ? hoverC : fillC, 1);
      btnBg.strokeRect(bx, by, bw, bh);
      btnBg.fillRect(bx, by, bw, bh);
    };
    drawBtn(false);
    grp.add(btnBg);

    const btnTxt = scene.add.text(cx, cy, label, {
      fontSize: fs2, fill: '#d0b070', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    grp.add(btnTxt);

    const btnHit = scene.add.rectangle(cx, cy, bw, bh, 0, 0)
      .setInteractive({ useHandCursor: true });
    btnHit.on('pointerover', () => drawBtn(true));
    btnHit.on('pointerout',  () => drawBtn(false));
    btnHit.on('pointerup',   onClick);
    grp.add(btnHit);
  },

});
