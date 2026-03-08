// ================================================================
//  Tab_CharProfile.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_CharProfile.js
//
//  역할: 캐릭터 프로필 팝업 — 공용 모듈
//        관리 탭(Tab_Manage)과 탐사대 탭(Tab_Squad) 모두에서 사용
//
//  ✏️ 수정: 좌우 2단 레이아웃
//    좌측 (40%) — 초상화 크게 + HP바
//    우측 (60%) — 이름 / 나이 / 직업 / Cog / 스탯 / 패시브 / 스킬
//
//  사용법:
//    CharProfile.open(scene, W, H, char, {
//      onClose:   () => {},
//      onHeal:    (char, cost) => {},
//      extraBtns: [{ label: '...', danger: true, onClick: () => {} }],
//    });
//
//  의존: FontManager, scaledFontSize (utils.js)
// ================================================================

const CharProfile = {

  open(scene, W, H, char, opts = {}) {
    const { onClose, onHeal, extraBtns = [] } = opts;

    // ── 팝업 전체 크기 ────────────────────────────────────────
    const pw = W * 0.52;
    const ph = H * 0.80;
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;
    const fs = n => scaledFontSize(n, scene.scale);

    // ── 오버레이 ─────────────────────────────────────────────
    const overlay = scene.add.rectangle(0, 0, W, H, 0x000000, 0.55)
      .setOrigin(0).setDepth(400).setInteractive();
    overlay.on('pointerup', () => _close());

    const g = scene.add.container(0, 0).setDepth(401);

    // ── 팝업 배경 + 코너 장식 ────────────────────────────────
    const popBg = scene.add.graphics();
    popBg.fillStyle(0x0a0806, 0.99);
    popBg.lineStyle(1, 0x6a3a10, 0.9);
    popBg.strokeRect(px, py, pw, ph);
    popBg.fillRect(px, py, pw, ph);
    popBg.lineStyle(1, 0x8a5020, 0.7);
    const cs = 10;
    [[px+4,py+4,1,1],[px+pw-4,py+4,-1,1],[px+4,py+ph-4,1,-1],[px+pw-4,py+ph-4,-1,-1]]
      .forEach(([ox, oy, sx, sy]) => {
        popBg.lineBetween(ox, oy, ox + cs * sx, oy);
        popBg.lineBetween(ox, oy, ox, oy + cs * sy);
      });
    g.add(popBg);

    // ── 2단 레이아웃 분할 ─────────────────────────────────────
    const pad   = pw * 0.04;
    const divX  = px + pw * 0.42;          // 좌/우 경계선 X

    // 좌측 영역
    const leftX = px + pad;
    const leftW = divX - px - pad * 1.5;

    // 우측 영역
    const rightX = divX + pad * 0.5;
    const rightW = px + pw - pad - rightX;

    const topY   = py + pad;
    const btnH2  = parseInt(fs(26));
    const btnY2  = py + ph - btnH2 - parseInt(fs(10));
    const bodyH  = btnY2 - topY - parseInt(fs(6));

    // ── 중앙 구분선 ──────────────────────────────────────────
    const divLine = scene.add.graphics();
    divLine.lineStyle(1, 0x3a2010, 0.5);
    divLine.lineBetween(divX, py + pad * 0.5, divX, btnY2 - pad * 0.5);
    g.add(divLine);

    // ════════════════════════════════════════════════════════
    // 좌측: 초상화 + HP바
    // ════════════════════════════════════════════════════════
    const portH = bodyH * 0.88;
    const portY = topY;

    const portBox = scene.add.graphics();
    portBox.fillStyle(0x080605, 0.9);
    portBox.lineStyle(1, 0x3a2510, 0.6);
    portBox.strokeRect(leftX, portY, leftW, portH);
    portBox.fillRect(leftX, portY, leftW, portH);
    g.add(portBox);

    const JOB_SHORT = { fisher: 'FISH', diver: 'DIVE', ai: 'A·I' };
    let portIcon;
    if (char.spriteKey && scene.textures.exists(char.spriteKey)) {
      const img = scene.add.image(leftX + leftW / 2, portY + portH * 0.46, char.spriteKey)
        .setOrigin(0.5);
      const scale = Math.min(leftW / img.width, portH * 0.88 / img.height);
      img.setScale(scale);
      portIcon = img;
    } else {
      portIcon = scene.add.text(leftX + leftW / 2, portY + portH / 2,
        JOB_SHORT[char.job] || '???', {
        fontSize: fs(16), fill: '#2a3a44', fontFamily: FontManager.MONO,
      }).setOrigin(0.5);
    }
    g.add(portIcon);

    // HP 바 (초상화 하단)
    const hpBarH = 16;
    const hpBarY = portY + portH - hpBarH;
    const hpPct  = char.maxHp > 0 ? char.currentHp / char.maxHp : 1;
    const hpCol  = hpPct > 0.6 ? 0x306030 : hpPct > 0.3 ? 0x806020 : 0x803020;
    const hpBg   = scene.add.graphics();
    hpBg.fillStyle(0x050404, 0.9);
    hpBg.fillRect(leftX, hpBarY, leftW, hpBarH);
    const hpFg   = scene.add.graphics();
    hpFg.fillStyle(hpCol, 1);
    hpFg.fillRect(leftX, hpBarY, Math.round(leftW * hpPct), hpBarH);
    const hpTxt  = scene.add.text(leftX + leftW / 2, hpBarY + hpBarH / 2,
      `HP  ${char.currentHp} / ${char.maxHp}`, {
      fontSize: fs(10), fill: '#d0b060', fontFamily: FontManager.MONO,
    }).setOrigin(0.5);
    g.add([hpBg, hpFg, hpTxt]);

    // ════════════════════════════════════════════════════════
    // 우측: 캐릭터 정보
    // ════════════════════════════════════════════════════════
    let curY = topY;

    // 툴팁 헬퍼
    let _tooltip = null;
    const _showTip = (x, y, text) => {
      _hideTip();
      const tpad = 12, maxW = parseInt(fs(220));
      const txtObj = scene.add.text(0, 0, text, {
        fontSize: fs(13), fill: '#f0e0b0', fontFamily: FontManager.MONO,
        wordWrap: { width: maxW },
      }).setDepth(502);
      const bw = txtObj.width + tpad * 2;
      const bh = txtObj.height + tpad * 2;
      let tx = x + 18, ty = y + 18;
      if (tx + bw > W - 10) tx = x - bw - 10;
      if (ty + bh > H - 10) ty = y - bh - 10;
      const bgObj = scene.add.graphics().setDepth(501);
      bgObj.fillStyle(0x0d0b07, 0.97);
      bgObj.lineStyle(2, 0x9a6020, 1);
      bgObj.strokeRect(tx, ty, bw, bh);
      bgObj.fillRect(tx, ty, bw, bh);
      bgObj.lineStyle(1, 0x3a2010, 0.5);
      bgObj.strokeRect(tx+3, ty+3, bw-6, bh-6);
      txtObj.setPosition(tx + tpad, ty + tpad);
      _tooltip = { bg: bgObj, txt: txtObj };
    };
    const _moveTip = (x, y) => {
      if (!_tooltip) return;
      const { txt, bg } = _tooltip;
      const tpad = 12;
      const bw = txt.width + tpad * 2, bh = txt.height + tpad * 2;
      let tx = x + 18, ty = y + 18;
      if (tx + bw > W - 10) tx = x - bw - 10;
      if (ty + bh > H - 10) ty = y - bh - 10;
      bg.clear();
      bg.fillStyle(0x0d0b07, 0.97);
      bg.lineStyle(2, 0x9a6020, 1);
      bg.strokeRect(tx, ty, bw, bh);
      bg.fillRect(tx, ty, bw, bh);
      bg.lineStyle(1, 0x3a2010, 0.5);
      bg.strokeRect(tx+3, ty+3, bw-6, bh-6);
      txt.setPosition(tx + tpad, ty + tpad);
    };
    const _hideTip = () => {
      if (_tooltip) { _tooltip.bg.destroy(); _tooltip.txt.destroy(); _tooltip = null; }
    };

    // 이름
    g.add(scene.add.text(rightX, curY, char.name, {
      fontSize: fs(16), fill: '#e8c070', fontFamily: FontManager.TITLE,
    }).setOrigin(0, 0));
    curY += parseInt(fs(20));

    // 나이
    g.add(scene.add.text(rightX, curY, `나이  ${char.age}세`, {
      fontSize: fs(9), fill: '#5a4020', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0));
    curY += parseInt(fs(13));

    // 직업 (툴팁)
    const JOB_TIPS = {
      fisher: getJobDescription('fisher'),
      diver:  getJobDescription('diver'),
      ai:     getJobDescription('ai'),
    };
    const jobLbl = scene.add.text(rightX, curY, `직업  :  ${char.jobLabel}`, {
      fontSize: fs(10), fill: '#c8802a', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0);
    const jobHit = scene.add.rectangle(
      rightX, curY + parseInt(fs(7)), jobLbl.width, parseInt(fs(14)), 0, 0
    ).setInteractive({ useHandCursor: false }).setOrigin(0, 0.5).setDepth(402);
    jobHit.on('pointerover', (ptr) => _showTip(ptr.x, ptr.y, JOB_TIPS[char.job] || char.jobLabel));
    jobHit.on('pointermove', (ptr) => _moveTip(ptr.x, ptr.y));
    jobHit.on('pointerout',  ()    => _hideTip());
    g.add([jobLbl, jobHit]);
    curY += parseInt(fs(16));

    // Cog 등급
    const cogBg = scene.add.graphics();
    cogBg.fillStyle(0x0e0b07, 1);
    cogBg.lineStyle(1, 0x4a2a10, 0.8);
    cogBg.strokeRect(rightX, curY, rightW, parseInt(fs(24)));
    cogBg.fillRect(rightX, curY, rightW, parseInt(fs(24)));
    g.add([cogBg, scene.add.text(rightX + rightW / 2, curY + parseInt(fs(12)),
      `◈  Cog  ${char.cog}  ◈`, {
      fontSize: fs(13), fill: '#e8c040', fontFamily: FontManager.MONO,
    }).setOrigin(0.5)]);
    curY += parseInt(fs(30));

    // 구분선
    const makeSep = (yy) => {
      const s = scene.add.graphics();
      s.lineStyle(1, 0x2a1a08, 0.8);
      s.lineBetween(rightX, yy, rightX + rightW, yy);
      g.add(s);
    };
    makeSep(curY);
    curY += parseInt(fs(5));

    // 스탯 블록
    g.add(scene.add.text(rightX, curY, '[ 스  탯 ]', {
      fontSize: fs(9), fill: '#5a3818', fontFamily: FontManager.MONO,
    }).setOrigin(0, 0));
    curY += parseInt(fs(12));

    const STAT_DEFS = [
      { key: '체력', val: char.stats.hp,      tip: '체력 — 최대 HP에 직접 영향. 높을수록 오래 버팁니다.' },
      { key: '건강', val: char.stats.health,  tip: '건강 — 상태이상 저항 및 자연 회복 속도에 영향.' },
      { key: '공격', val: char.stats.attack,  tip: '공격 — 기본 전투 피해량 계수. 무기 보정과 곱연산.' },
      { key: '민첩', val: char.stats.agility, tip: '민첩 — 행동 순서와 회피율에 영향. 높을수록 선공 확률 증가.' },
      { key: '행운', val: char.stats.luck,    tip: '행운 — 아이템 드롭, 크리티컬 확률, 이벤트 결과에 영향.' },
    ];
    const rowH   = parseInt(fs(15));
    const statBH = STAT_DEFS.length * rowH + parseInt(fs(4));
    const statBg = scene.add.graphics();
    statBg.fillStyle(0x0e0b07, 1);
    statBg.lineStyle(1, 0x2a1a08, 0.7);
    statBg.strokeRect(rightX, curY, rightW, statBH);
    statBg.fillRect(rightX, curY, rightW, statBH);
    g.add(statBg);
    curY += parseInt(fs(2));

    STAT_DEFS.forEach(({ key, val, tip }) => {
      const rowY  = curY;
      const statT = scene.add.text(rightX + 6, rowY, `${key.padEnd(2, '　')}   ${val}`, {
        fontSize: fs(11), fill: '#c8a060', fontFamily: FontManager.MONO,
      }).setOrigin(0, 0);
      const statHit = scene.add.rectangle(
        rightX + 4, rowY + rowH / 2, rightW - 8, rowH, 0, 0
      ).setInteractive({ useHandCursor: false }).setOrigin(0, 0.5).setDepth(402);
      statHit.on('pointerover', (ptr) => _showTip(ptr.x, ptr.y, tip));
      statHit.on('pointermove', (ptr) => _moveTip(ptr.x, ptr.y));
      statHit.on('pointerout',  ()    => _hideTip());
      g.add([statT, statHit]);
      curY += rowH;
    });
    curY += parseInt(fs(7));

    makeSep(curY);
    curY += parseInt(fs(5));

    // 패시브 / 스킬 박스
    const makeBox = (titleStr, nameStr, descStr, yy) => {
      const nameH2 = parseInt(fs(16));
      const descH  = parseInt(fs(11));
      const bh     = parseInt(fs(8)) + nameH2 + descH + parseInt(fs(8));
      const boxG   = scene.add.graphics();
      boxG.fillStyle(0x0e0b07, 1);
      boxG.lineStyle(1, 0x3a2010, 0.7);
      boxG.strokeRect(rightX, yy, rightW, bh);
      boxG.fillRect(rightX, yy, rightW, bh);
      g.add(boxG);
      g.add(scene.add.text(rightX + 6, yy + 4, titleStr, {
        fontSize: fs(8), fill: '#5a3818', fontFamily: FontManager.MONO,
      }).setOrigin(0, 0));
      g.add(scene.add.text(rightX + 6, yy + 4 + parseInt(fs(10)), nameStr, {
        fontSize: fs(13), fill: '#e8c060', fontFamily: FontManager.TITLE,
      }).setOrigin(0, 0));
      g.add(scene.add.text(rightX + 6, yy + 4 + parseInt(fs(10)) + nameH2, descStr || '', {
        fontSize: fs(9), fill: '#7a5830', fontFamily: FontManager.MONO,
        wordWrap: { width: rightW - 12 },
      }).setOrigin(0, 0));
      return yy + bh + parseInt(fs(5));
    };

    curY = makeBox('PASSIVE', char.passive, getPassiveDescription(char.passive), curY);
    curY = makeBox('SKILL',   char.skill,   getSkillDescription(char.skill),     curY);

    // ── 하단 버튼 ────────────────────────────────────────────
    const missing = char.maxHp - char.currentHp;
    const _drawBtnGfx = (gfx, x, y, w, h, danger, hover = false) => {
      gfx.clear();
      if (danger) {
        gfx.fillStyle(hover ? 0x241010 : 0x180a08, 1);
        gfx.lineStyle(1, hover ? 0x8a3020 : 0x4a2010, 0.9);
      } else {
        gfx.fillStyle(hover ? 0x102010 : 0x0a1208, 1);
        gfx.lineStyle(1, hover ? 0x4a8030 : 0x2a4018, 0.9);
      }
      gfx.strokeRect(x, y, w, h);
      gfx.fillRect(x, y, w, h);
    };

    const btns = [];
    if (onHeal && missing > 0) {
      const healCost = Math.ceil(missing * 0.5);
      btns.push({
        label:   `회복  (${healCost} Arc)`,
        danger:  false,
        onClick: () => { _close(); onHeal(char, healCost); },
      });
    }
    extraBtns.forEach(b => btns.push(b));
    btns.push({ label: '닫  기', danger: true, onClick: () => _close() });

    const btnCount = btns.length;
    const gap2     = parseInt(fs(8));
    const totalBtnW = pw - pad * 2;
    const eachW    = (totalBtnW - gap2 * (btnCount - 1)) / btnCount;
    const btnStartX = px + pad;

    btns.forEach((b, i) => {
      const bx   = btnStartX + i * (eachW + gap2);
      const bg2  = scene.add.graphics();
      const txt2 = scene.add.text(bx + eachW / 2, btnY2 + btnH2 / 2, b.label, {
        fontSize: fs(9),
        fill: b.danger ? '#8a3820' : '#6a9060',
        fontFamily: FontManager.MONO,
      }).setOrigin(0.5);
      const hit2 = scene.add.rectangle(bx + eachW / 2, btnY2 + btnH2 / 2, eachW, btnH2, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(402);
      _drawBtnGfx(bg2, bx, btnY2, eachW, btnH2, b.danger);
      hit2.on('pointerover', () => _drawBtnGfx(bg2, bx, btnY2, eachW, btnH2, b.danger, true));
      hit2.on('pointerout',  () => _drawBtnGfx(bg2, bx, btnY2, eachW, btnH2, b.danger, false));
      hit2.on('pointerup',   () => b.onClick());
      g.add([bg2, txt2, hit2]);
    });

    // ── 닫기 ─────────────────────────────────────────────────
    function _close() {
      _hideTip();
      overlay.destroy();
      g.destroy();
      if (onClose) onClose();
    }

    // 페이드인
    g.setAlpha(0);
    scene.tweens.add({ targets: g, alpha: 1, duration: 120, ease: 'Sine.easeOut' });
  },
};
