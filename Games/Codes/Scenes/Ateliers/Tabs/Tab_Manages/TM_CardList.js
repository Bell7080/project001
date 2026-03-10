// ================================================================
//  TM_CardList.js
//  경로: Games/Codes/Scenes/Atelier/tabs/Tab_Manages/TM_CardList.js
//
//  역할: 좌측 패널 — 필터 바 + 캐릭터 카드 목록 + 드래그 스크롤
//        카드 배경은 반투명(뒷배경이 비치도록)
// ================================================================

const TM_CardList = {

  // ── 좌측 패널 컨테이너 + 필터 + 카드 빌드 ──────────────────
  buildListPanel(tab, fs, backBtnH) {
    const { scene, W, H } = tab;
    const { _listW: lw, _bodyY: by } = tab;
    const pm = tab._panelMargin || 0;

    tab._listPanel = scene.add.container(0, 0);
    tab._container.add(tab._listPanel);

    // 좌측 패널 — 불투명 (뒷배경은 패널 바깥 여백으로 보임)
    const panelH  = H - by - backBtnH - pm;
    const panelBg = scene.add.graphics();
    panelBg.fillStyle(0x05080c, 0.96);
    panelBg.lineStyle(1, 0x2a1a08, 0.5);
    panelBg.strokeRect(pm, by, lw - pm * 2, panelH);
    panelBg.fillRect(pm, by, lw - pm * 2, panelH);
    tab._listPanel.add(panelBg);

    tab._filterY       = by + parseInt(fs(8));
    tab._filterBarObjs = [];
    TM_CardList.buildFilterBar(tab, fs);

    const filterRowH = parseInt(fs(26)) + parseInt(fs(8));
    const filterJobH = parseInt(fs(26)) + parseInt(fs(4));
    tab._cardAreaX   = pm + 4;
    tab._cardAreaY   = tab._filterY + filterRowH + filterJobH + parseInt(fs(4));
    tab._cardAreaW   = lw - pm * 2 - 8;
    tab._cardAreaH   = H - tab._cardAreaY - backBtnH - pm - 4;

    TM_CardList.buildCardList(tab, fs);
  },

  // ── 카드 목록만 (새로고침 시 재호출) ────────────────────────
  buildCardList(tab, fs) {
    const { scene } = tab;
    const fsFn     = fs || (n => scaledFontSize(n, scene.scale));
    const allChars = CharacterManager.initIfEmpty();
    const chars    = tab._applyFilter(allChars);
    const cw       = tab._cardAreaW;
    const ch       = parseInt(fsFn(72));
    const gap      = parseInt(fsFn(5));
    tab._cardW = cw; tab._cardH = ch; tab._cardGap = gap;

    const maskGfx = scene.add.graphics();
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(tab._cardAreaX, tab._cardAreaY, tab._cardAreaW, tab._cardAreaH);
    maskGfx.setVisible(false);
    tab._maskGfx = maskGfx;

    tab._cardRow = scene.add.container(tab._cardAreaX, tab._cardAreaY);
    tab._cardRow.setMask(maskGfx.createGeometryMask());
    tab._listPanel.add(maskGfx);
    tab._listPanel.add(tab._cardRow);

    chars.forEach((char, i) => {
      const card = TM_CardList._makeCard(tab, char, 0, i * (ch + gap), cw, ch, fsFn);
      tab._cardRow.add(card);
      tab._cardObjs.push({ container: card, char });
    });
    tab._totalCardH = chars.length > 0 ? chars.length * (ch + gap) - gap : 0;
  },

  // ── 필터 바 ─────────────────────────────────────────────────
  buildFilterBar(tab, fs) {
    const { scene } = tab;
    const fsFn = fs || (n => scaledFontSize(n, scene.scale));
    const fy   = tab._filterY;
    const rowH = parseInt(fsFn(26));

    const JOB_FILTERS = [
      { key:'all',    label:'전체'   }, { key:'fisher', label:'낚시꾼' },
      { key:'diver',  label:'잠수부' }, { key:'ai',     label:'AI'    },
    ];
    const COG_FILTERS = [
      { key:'all', label:'전체' },
      ...[1,2,3,4,5,6,7,8,9,10].map(n => ({ key:`${n}`, label:`${n}` })),
    ];

    const jobLbl = scene.add.text(6, fy + parseInt(fsFn(13)), '직업', {
      fontSize: fsFn(8), fill: '#4a2e10', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);
    tab._listPanel.add(jobLbl);
    tab._filterBarObjs.push(jobLbl);

    let bx = 6 + parseInt(fsFn(22));
    JOB_FILTERS.forEach(f => {
      bx = TM_CardList._makeChip(tab, bx, fy, f.label, rowH, fsFn,
        () => { tab._filterJob = f.key; tab._refreshCards(); TM_CardList._rebuildFilterBar(tab, fsFn); },
        tab._filterJob === f.key);
    });

    const cogFy  = fy + rowH + parseInt(fsFn(4));
    const cogLbl = scene.add.text(6, cogFy + parseInt(fsFn(13)), 'Cog', {
      fontSize: fsFn(8), fill: '#4a2e10', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);
    tab._listPanel.add(cogLbl);
    tab._filterBarObjs.push(cogLbl);

    let cbx = 6 + parseInt(fsFn(22));
    COG_FILTERS.forEach(f => {
      cbx = TM_CardList._makeChip(tab, cbx, cogFy, f.label, rowH, fsFn,
        () => { tab._filterCog = f.key; tab._refreshCards(); TM_CardList._rebuildFilterBar(tab, fsFn); },
        tab._filterCog === f.key);
    });
  },

  _rebuildFilterBar(tab, fs) {
    tab._filterBarObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    tab._filterBarObjs = [];
    TM_CardList.buildFilterBar(tab, fs);
  },

  _makeChip(tab, x, y, label, h, fs, onClick, active) {
    const { scene } = tab;
    const tmp = scene.add.text(-9999, -9999, label, { fontSize: fs(9), fontFamily: FontManager.MONO });
    const bw  = tmp.width + 10; tmp.destroy();

    const bg = scene.add.graphics();
    const draw = (hov) => {
      bg.clear();
      bg.fillStyle(active ? (hov ? 0x2a1e0c : 0x181208) : (hov ? 0x141008 : 0x000000), active ? 0.85 : 0.5);
      bg.lineStyle(1, active ? 0x9a6020 : (hov ? 0x4a2810 : 0x221608), 0.9);
      bg.strokeRect(x, y, bw, h); bg.fillRect(x, y, bw, h);
    };
    draw(false);

    const txt = scene.add.text(x + bw / 2, y + h / 2, label, {
      fontSize: fs(9), fill: active ? '#e8a040' : '#5a3818', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);

    const hit = scene.add.rectangle(x + bw / 2, y + h / 2, bw, h, 0, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => draw(true));
    hit.on('pointerout',  () => draw(false));
    hit.on('pointerup',   onClick);

    tab._listPanel.add([bg, txt, hit]);
    tab._filterBarObjs.push(bg, txt, hit);
    return x + bw + 3;
  },

  // ── 개별 캐릭터 카드 ─────────────────────────────────────────
  _makeCard(tab, char, x, y, cw, ch, fsFn) {
    const { scene } = tab;
    const fs = fsFn || (n => scaledFontSize(n, scene.scale));
    const c  = scene.add.container(x, y);

    const JOB_BG     = { fisher:0x0b1822, diver:0x0b1a10, ai:0x16091e };
    const JOB_BORDER = { fisher:0x3a6888, diver:0x3a7050, ai:0x6a4888 };
    const JOB_ACCENT = { fisher:0x1a3a5a, diver:0x1a3a28, ai:0x2a1240 };
    const JOB_SHORT  = { fisher:'FISH',   diver:'DIVE',   ai:'A·I'   };

    const cbg = scene.add.graphics();
    const drawCbg = (hover, sel) => {
      cbg.clear();
      if (sel) {
        cbg.fillStyle(JOB_ACCENT[char.job] || 0x1a1810, 0.92);
        cbg.lineStyle(2, 0xc8a060, 1);
      } else if (hover) {
        cbg.fillStyle(JOB_BG[char.job] || 0x181410, 0.80);
        cbg.lineStyle(1, 0xc8a060, 0.7);
      } else {
        cbg.fillStyle(JOB_BG[char.job] || 0x181410, 0.55);
        cbg.lineStyle(1, JOB_BORDER[char.job] || 0x3a2010, 0.6);
      }
      cbg.strokeRect(0, 0, cw, ch); cbg.fillRect(0, 0, cw, ch);
    };
    drawCbg(false, tab._selectedChar && tab._selectedChar.id === char.id);

    const portS  = ch - 8;
    const portBg = scene.add.graphics();
    portBg.fillStyle(0x030303, 0.7);
    portBg.fillRect(4, 4, portS, portS);

    const obs = [cbg, portBg];
    if (char.spriteKey && scene.textures.exists(char.spriteKey)) {
      const img = scene.add.image(4 + portS / 2, 4 + portS / 2, char.spriteKey).setOrigin(0.5);
      img.setScale(Math.min(portS / img.width, portS / img.height));
      obs.push(img);
    } else {
      obs.push(scene.add.text(4 + portS / 2, 4 + portS / 2, JOB_SHORT[char.job] || '?', {
        fontSize: fs(18), fill: '#1a2028', fontFamily: FontManager.MONO,
      }).setOrigin(0.5));
    }

    const infoX  = 4 + portS + 8;
    const infoW  = cw - infoX - 4;
    const cogCol = (typeof CharacterManager !== 'undefined' && CharacterManager.getCogColor)
      ? CharacterManager.getCogColor(char.cog).css : '#c8a040';

    obs.push(
      scene.add.text(infoX, 8, char.name, { fontSize:fs(12), fill:'#d8b878', fontFamily:FontManager.TITLE }).setOrigin(0,0),
      scene.add.text(infoX, 8+parseInt(fs(16)), `Cog ${char.cog}`, { fontSize:fs(10), fill:cogCol, fontFamily:FontManager.MONO }).setOrigin(0,0),
      scene.add.text(infoX, 8+parseInt(fs(30)), char.jobLabel||'', { fontSize:fs(9), fill:'#6a4828', fontFamily:FontManager.MONO }).setOrigin(0,0),
    );

    const hpPct = char.maxHp > 0 ? char.currentHp / char.maxHp : 1;
    const hpBarY = ch - 7;
    const hpCol  = hpPct > 0.6 ? 0x2a6030 : hpPct > 0.3 ? 0x706020 : 0x702020;
    const hpBg   = scene.add.graphics(); hpBg.fillStyle(0x050404, 0.8); hpBg.fillRect(infoX, hpBarY, infoW, 3);
    const hpFg   = scene.add.graphics(); hpFg.fillStyle(hpCol, 1); hpFg.fillRect(infoX, hpBarY, Math.max(1, Math.round(infoW * hpPct)), 3);
    obs.push(hpBg, hpFg);

    const hit = scene.add.rectangle(cw / 2, ch / 2, cw, ch, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', (ptr) => { if (!tab._inCardArea(ptr)) return; drawCbg(true,  tab._selectedChar?.id === char.id); });
    hit.on('pointerout',  ()    => { drawCbg(false, tab._selectedChar?.id === char.id); });
    hit.on('pointerup',   (ptr) => { if (!tab._inCardArea(ptr) || tab._dragged) return; tab._selectChar(char); });
    obs.push(hit);

    c.add(obs);
    c._drawCbg = drawCbg;
    c._charId  = char.id;
    return c;
  },

  // ── 드래그 스크롤 ────────────────────────────────────────────
  setupDrag(tab) {
    const { scene } = tab;
    let startY = 0, startScroll = 0;

    tab._dragDown  = (ptr) => { if (!tab._inCardArea(ptr)) return; startY = ptr.y; startScroll = tab._scrollY; tab._dragged = false; };
    tab._dragMove  = (ptr) => { if (!ptr.isDown) return; const dy = ptr.y - startY; if (Math.abs(dy) > 5) tab._dragged = true; if (tab._dragged) _scrollTo(tab, startScroll + dy); };
    tab._dragUp    = () => { scene.time.delayedCall(50, () => { tab._dragged = false; }); };
    tab._dragWheel = (ptr, objs, dx, dy) => { if (tab._inCardArea(ptr)) _scrollTo(tab, tab._scrollY - dy * 0.8); };

    scene.input.on('pointerdown', tab._dragDown);
    scene.input.on('pointermove', tab._dragMove);
    scene.input.on('pointerup',   tab._dragUp);
    scene.input.on('wheel',       tab._dragWheel);
  },
};

function _scrollTo(tab, y) {
  const max = Math.max(0, tab._totalCardH - tab._cardAreaH);
  tab._scrollY = Math.max(-max, Math.min(0, y));
  if (tab._cardRow) tab._cardRow.y = tab._cardAreaY + tab._scrollY;
}
