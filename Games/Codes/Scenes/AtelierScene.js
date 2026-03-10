// ================================================================
//  AtelierScene.js
//  경로: Games/Codes/Scenes/AtelierScene.js
// ================================================================

class AtelierScene extends Phaser.Scene {
  constructor() { super({ key: 'AtelierScene' }); }

  init(data) {
    // 웰컴 화면 중에는 activeTab을 null로 유지 → 어떤 버튼도 활성 표시 안 됨
    // 실제 탭 전환은 _switchTab에서 _activeTab을 설정하므로 문제 없음
    this._pendingTab  = data.tab  || 'explore';
    this._activeTab   = null;
    this._fromScene   = data.from || 'LobbyScene';
    this._skipWelcome = data.skipWelcome || false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W;
    this.H = H;

    InputManager.reinit(this);
    CharacterManager.initIfEmpty();

    this._buildBackground(W, H);
    this._buildHUD(W, H);
    this._sideButtonRefs = [];
    this._uiAnimTargets  = [];
    this._buildSideButtons(W, H);
    this._buildTopButtons(W, H);

    this._currentTabObj = null;
    this._switchTab(this._pendingTab, true);

    if (!this._skipWelcome && this._fromScene === 'LobbyScene') {
      this._showWelcome();
    } else {
      this._animateUIIn(true);
    }
  }

  // ── 웰컴 팝업 ────────────────────────────────────────────────
  // onClose = 타이핑 완료 콜백 → UI 슬라이드인
  // _welcomeObj는 탭 클릭 시 _switchTab → build()에서 destroy
  _showWelcome() {
    // 웰컴 화면 중에는 언더라인 숨기기
    if (this._sideButtonRefs) {
      this._sideButtonRefs.forEach(({ underline }) => {
        if (underline) underline.setAlpha(0);
      });
    }
    this._welcomeObj = new Tab_Welcome(this, this.W, this.H, () => {
      this._animateUIIn(false);
      // 슬라이드인 후 활성 탭 언더라인 복원
      this.time.delayedCall(400, () => this._rebuildSideButtonColors());
    });
  }

  // ── UI 등장 애니메이션 ────────────────────────────────────────
  _animateUIIn(instant) {
    if (!this._uiAnimTargets) return;

    this._uiAnimTargets.forEach(({ obj, originX, originY, dir, delay, onShow }) => {
      if (!obj || !obj.scene) return;

      if (instant) {
        obj.setAlpha(1).setPosition(originX, originY);
        if (onShow) onShow();
        return;
      }

      const offX = dir === 'left' ? -80 : dir === 'right' ? 80 : 0;
      const offY = dir === 'up'   ? -50 : dir === 'down'  ? 50 : 0;

      obj.setAlpha(0).setPosition(originX + offX, originY + offY);
      this.tweens.add({
        targets: obj,
        x: originX, y: originY, alpha: 1,
        duration: 320, delay: delay || 0,
        ease: 'Back.easeOut',
        onComplete: () => { if (onShow) onShow(); },
      });
    });
  }

  _buildBackground(W, H) {
    this.add.rectangle(0, 0, W, H, 0x060408).setOrigin(0);
    const scan = this.add.graphics();
    for (let y = 0; y < H; y += 4) {
      scan.lineStyle(1, 0x1a0e06, 0.18);
      scan.lineBetween(0, y, W, y);
    }
    const grid = this.add.graphics();
    const step = Math.round(W / 56);
    grid.lineStyle(1, 0x120d06, 0.7);
    for (let x = 0; x <= W; x += step) grid.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += step) grid.lineBetween(0, y, W, y);
    this.add.text(W / 2, H * 0.50, 'ATELIER', {
      fontSize: scaledFontSize(80, this.scale),
      fill: '#0e0a06',
      fontFamily: FontManager.TITLE,
    }).setOrigin(0.5).setAlpha(0.18);
  }

  _buildHUD(W, H) {
    this._hud = new AtelierHUD(this, W, H);
  }

  _switchTab(key, instant = false) {
    if (!instant && key === this._activeTab && !this._welcomeObj) return;
    // 전환 중 중복 클릭 방지
    if (this._tabSwitching) return;

    const W = this.W, H = this.H;
    const TabMap = {
      explore: Tab_Explore, recruit: Tab_Recruit, manage: Tab_Manage_Full, squad: Tab_Squad,
      facility: Tab_Facility, outsource: Tab_Outsource, dredge: Tab_Dredge,
      shop: Tab_Shop, storage: Tab_Storage, codex: Tab_Codex, memory: Tab_Memory,
    };

    // ── 언더라인 즉시 전부 숨김 (잔상 방지) ──────────────────
    if (this._sideButtonRefs) {
      this._sideButtonRefs.forEach(({ underline, drawUnderline }) => {
        if (underline)     underline.setAlpha(0);
        if (drawUnderline) drawUnderline(false);
      });
    }

    const build = () => {
      this._tabSwitching = false;

      if (this._welcomeObj) {
        const wo = this._welcomeObj; this._welcomeObj = null;
        this.tweens.add({ targets: wo._container, alpha: 0, duration: 200, ease: 'Sine.easeIn', onComplete: () => wo.destroy() });
      }
      if (this._currentTabObj) { this._currentTabObj.destroy(); this._currentTabObj = null; }

      this._activeTab = key;
      this._rebuildSideButtonColors();

      const Cls = TabMap[key];
      if (!Cls) return;
      if (key === 'manage') {
        this._enterManageFull();
      } else {
        this._currentTabObj = new Cls(this, W, H);
        this._currentTabObj.show();
      }
    };

    if (instant) { build(); return; }

    this._tabSwitching = true;
    const prev = this._currentTabObj;
    if (prev && prev._container) {
      this.tweens.add({
        targets: prev._container, alpha: 0, duration: 100, ease: 'Sine.easeIn',
        onComplete: () => {
          build();
          if (key !== 'manage' && this._currentTabObj?._container) {
            this._currentTabObj._container.setAlpha(0);
            this.tweens.add({ targets: this._currentTabObj._container, alpha: 1, duration: 160, ease: 'Sine.easeOut' });
          }
        },
      });
    } else {
      build();
    }
  }

  _rebuildSideButtonColors() {
    if (!this._sideButtonRefs) return;
    this._sideButtonRefs.forEach(({ key, btn, marker, underline, drawUnderline }) => {
      const active = key === this._activeTab;
      btn.setStyle({ fill: active ? '#e8c080' : '#7a5030' });
      marker.setStyle({ fill: active ? '#c06820' : '#4a2a10' });
      if (underline) underline.setAlpha(active ? 1 : 0);
      if (drawUnderline) drawUnderline(active);
    });
  }

  _buildSideButtons(W, H) {
    const leftItems = [
      { key: 'shop',    label: '상  점' },
      { key: 'storage', label: '창  고' },
      { key: 'codex',   label: '도  감' },
      { key: 'memory',  label: '회  상' },
    ];
    leftItems.forEach((item, i) => {
      const refs = this._makeSideButton(
        item.label, W * 0.07,
        H * 0.25 + i * parseInt(scaledFontSize(52, this.scale)),
        item.key, false, i
      );
      this._sideButtonRefs.push({ key: item.key, ...refs });
    });

    const rightItems = [
      { key: 'recruit',   label: '영  입'   },
      { key: 'manage',    label: '관  리'   },
      { key: 'squad',     label: '탐 사 대' },
      { key: 'facility',  label: '시  설'   },
      { key: 'outsource', label: '외  주'   },
      { key: 'dredge',    label: '드 레 지' },
    ];
    rightItems.forEach((item, i) => {
      const refs = this._makeSideButton(
        item.label, W * 0.93,
        H * 0.22 + i * parseInt(scaledFontSize(52, this.scale)),
        item.key, true, i
      );
      this._sideButtonRefs.push({ key: item.key, ...refs });
    });

    this._makeExploreButton(W / 2, H * 0.86);
  }

  _makeSideButton(label, x, y, key, alignRight, idx) {
    const isActive = this._activeTab === key;
    const indent   = parseInt(scaledFontSize(18, this.scale));
    const shift    = parseInt(scaledFontSize(8, this.scale));

    const marker = this.add.text(
      alignRight ? x + indent : x - indent, y, '│', {
        fontSize: scaledFontSize(18, this.scale),
        fill: isActive ? '#c06820' : '#4a2a10',
        fontFamily: FontManager.MONO,
      }
    ).setOrigin(alignRight ? 0 : 1, 0.5).setAlpha(0);

    const btn = this.add.text(x, y, label, {
      fontSize: scaledFontSize(26, this.scale),
      fill: isActive ? '#e8c080' : '#7a5030',
      fontFamily: FontManager.TITLE,
    }).setOrigin(alignRight ? 1 : 0, 0.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const underline = this.add.graphics().setAlpha(0);
    const origX = x;
    // uw를 btn.width 대신 폰트 기반 고정값 사용 (setAlpha(0) 시 width=0 방지)
    const sideUW = parseInt(scaledFontSize(26, this.scale)) * 2.8 + shift + 4;

    const drawUnderline = (on) => {
      underline.clear();
      if (!on) return;
      underline.lineStyle(1, 0x8b4010, 0.9);
      const ly = y + parseInt(scaledFontSize(17, this.scale));
      if (alignRight) underline.lineBetween(x - sideUW, ly, x, ly);
      else            underline.lineBetween(x, ly, x + sideUW, ly);
    };
    if (isActive) drawUnderline(true);

    btn.on('pointerover', () => {
      if (key === this._activeTab) return;
      this.tweens.add({ targets: btn, x: alignRight ? origX - shift : origX + shift, duration: 100, ease: 'Sine.easeOut' });
      btn.setStyle({ fill: '#e8c080' });
      marker.setStyle({ fill: '#c06820' });
      underline.setAlpha(1);
      drawUnderline(true);
    });
    btn.on('pointerout', () => {
      if (key === this._activeTab) return;
      this.tweens.add({ targets: btn, x: origX, duration: 100, ease: 'Sine.easeOut' });
      btn.setStyle({ fill: '#7a5030' });
      marker.setStyle({ fill: '#4a2a10' });
      drawUnderline(false);
    });
    btn.on('pointerdown', () => this._switchTab(key));

    const dir = alignRight ? 'right' : 'left';
    const delay = 80 + idx * 40;
    this._uiAnimTargets.push({ obj: btn,    originX: x, originY: y, dir, delay });
    this._uiAnimTargets.push({ obj: marker, originX: alignRight ? x + indent : x - indent, originY: y, dir, delay: delay + 20 });
    // underline은 Graphics라 tween position 불가 — _rebuildSideButtonColors에서만 제어

    return { btn, marker, underline, drawUnderline };
  }

  _makeExploreButton(x, y) {
    const shift = parseInt(scaledFontSize(8, this.scale));

    const sepLine = this.add.graphics();
    sepLine.lineStyle(1, 0x3a2a10, 0.7);
    sepLine.lineBetween(
      x - this.W * 0.18, y - parseInt(scaledFontSize(28, this.scale)),
      x + this.W * 0.18, y - parseInt(scaledFontSize(28, this.scale))
    );

    const marker = this.add.text(x - parseInt(scaledFontSize(36, this.scale)), y, '│', {
      fontSize: scaledFontSize(18, this.scale),
      fill: this._activeTab === 'explore' ? '#c06820' : '#4a2a10',
      fontFamily: FontManager.MONO,
    }).setOrigin(1, 0.5).setAlpha(0);

    const btn = this.add.text(x, y, '탐    색', {
      fontSize: scaledFontSize(28, this.scale),
      fill: this._activeTab === 'explore' ? '#e8c080' : '#7a5030',
      fontFamily: FontManager.TITLE,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

    // explore 언더라인 — uw는 btn.width 대신 폰트 기반 고정값 사용
    const exploreUnderline = this.add.graphics().setAlpha(0);
    const exploreUW = parseInt(scaledFontSize(28, this.scale)) * 3.2 + parseInt(scaledFontSize(8, this.scale)) + 4;
    const drawExploreUnderline = (on) => {
      exploreUnderline.clear();
      if (!on) return;
      const ly = y + parseInt(scaledFontSize(19, this.scale));
      exploreUnderline.lineStyle(1, 0x8b4010, 0.9);
      exploreUnderline.lineBetween(x - exploreUW / 2, ly, x + exploreUW / 2, ly);
    };
    if (this._activeTab === 'explore') drawExploreUnderline(true);

    this._sideButtonRefs.push({ key: 'explore', btn, marker, underline: exploreUnderline, drawUnderline: drawExploreUnderline });

    const origX = x;
    btn.on('pointerover', () => {
      if (this._activeTab === 'explore') return;
      this.tweens.add({ targets: btn, x: origX + shift, duration: 100, ease: 'Sine.easeOut' });
      btn.setStyle({ fill: '#e8c080' });
      marker.setStyle({ fill: '#c06820' });
      exploreUnderline.setAlpha(1);
      drawExploreUnderline(true);
    });
    btn.on('pointerout', () => {
      if (this._activeTab === 'explore') return;
      this.tweens.add({ targets: btn, x: origX, duration: 100, ease: 'Sine.easeOut' });
      btn.setStyle({ fill: '#7a5030' });
      marker.setStyle({ fill: '#4a2a10' });
      drawExploreUnderline(false);
    });
    btn.on('pointerdown', () => this._switchTab('explore'));

    const isExploreActive = this._activeTab === 'explore';
    this._uiAnimTargets.push({ obj: btn,    originX: x, originY: y, dir: 'down', delay: 200 });
    this._uiAnimTargets.push({ obj: marker, originX: x - parseInt(scaledFontSize(36, this.scale)), originY: y, dir: 'down', delay: 220 });
    // exploreUnderline은 Graphics라 tween position 불가 — _rebuildSideButtonColors에서만 제어
  }

  _buildTopButtons(W, H) {
    const bh  = parseInt(scaledFontSize(30, this.scale));
    const by  = H * 0.045;
    const gap = W * 0.008;

    const settingW = parseInt(scaledFontSize(60, this.scale));
    const settingX = W - W * 0.022 - settingW / 2;
    const settingObjs = this._makeTopBtn(settingX, by, settingW, bh, '설  정', () => {
      this.scene.start('SettingsScene', { from: 'AtelierScene' });
    });

    const lobbyW = parseInt(scaledFontSize(60, this.scale));
    const lobbyX = settingX - settingW / 2 - gap - lobbyW / 2;
    const lobbyObjs = this._makeTopBtn(lobbyX, by, lobbyW, bh, '← 로비', () => {
      this._goLobby();
    });

    [settingObjs, lobbyObjs].forEach(({ hit }, i) => {
      if (hit) this._uiAnimTargets.push({ obj: hit, originX: hit.x, originY: by, dir: 'up', delay: i * 40 });
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('SettingsScene', { from: 'AtelierScene' });
    });
  }

  _makeTopBtn(bx, by, bw, bh, label, onClick) {
    const bg = this.add.graphics();
    const draw = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? 0x1e1208 : 0x100a04, 1);
      bg.lineStyle(1, hover ? 0x6a3810 : 0x3a2210, 0.9);
      bg.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
      bg.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
    };
    draw(false);

    this.add.text(bx, by, label, {
      fontSize: scaledFontSize(13, this.scale),
      fill: '#8a6030',
      fontFamily: FontManager.MONO,
    }).setOrigin(0.5);

    const hit = this.add.rectangle(bx, by, bw, bh, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => draw(true));
    hit.on('pointerout',  () => draw(false));
    hit.on('pointerdown', onClick);

    return { bg, hit };
  }

  _goLobby() {
    const flash = this.add.rectangle(0, 0, this.W, this.H, 0x060408, 0)
      .setOrigin(0).setDepth(999);
    this.tweens.add({
      targets: flash, alpha: 1, duration: 300, ease: 'Sine.easeIn',
      onComplete: () => this.scene.start('LobbyScene'),
    });
  }

  // ════════════════════════════════════════════════════════════
  //  Tab_Manage_Full 진입 연출
  //  ① 현재 탭 + 사이드버튼 슬라이드아웃
  //  ② Background_002 페이드인
  //  ③ 헤더↓, 좌측←, 우측→ 슬라이드인
  //  ④ 중앙 일러스트 페이드인 (가장 늦게)
  //  ⑤ 첫 번째 캐릭터 자동 선택
  // ════════════════════════════════════════════════════════════
  _enterManageFull() {
    const W = this.W, H = this.H;
    const dur     = 200;
    const stagger = 30;

    // ① 현재 탭 페이드아웃
    if (this._currentTabObj && this._currentTabObj._container) {
      this.tweens.add({
        targets: this._currentTabObj._container,
        alpha: 0, duration: 150, ease: 'Sine.easeIn',
        onComplete: () => { if (this._currentTabObj) { this._currentTabObj.destroy(); this._currentTabObj = null; } },
      });
    }

    // ① 사이드 버튼 슬라이드아웃
    const leftBtns  = this._uiAnimTargets.filter(t => t.dir === 'left');
    const rightBtns = this._uiAnimTargets.filter(t => t.dir === 'right');
    const downBtns  = this._uiAnimTargets.filter(t => t.dir === 'down' || t.dir === 'up');

    leftBtns.forEach((t, i) => {
      if (!t.obj?.scene) return;
      this.tweens.add({ targets:t.obj, x:t.originX - W*0.18, alpha:0, duration:dur, delay:i*stagger, ease:'Sine.easeIn' });
    });
    rightBtns.forEach((t, i) => {
      if (!t.obj?.scene) return;
      this.tweens.add({ targets:t.obj, x:t.originX + W*0.18, alpha:0, duration:dur, delay:i*stagger, ease:'Sine.easeIn' });
    });
    downBtns.forEach((t, i) => {
      if (!t.obj?.scene) return;
      this.tweens.add({ targets:t.obj, y:t.originY + H*0.12, alpha:0, duration:dur, delay:i*stagger, ease:'Sine.easeIn' });
    });

    const allBtns  = [...leftBtns, ...rightBtns, ...downBtns];
    const slideEnd = dur + allBtns.length * stagger + 30;

    // ② 버튼 사라진 직후 — Tab 생성 + 패널 슬라이드인
    this.time.delayedCall(slideEnd, () => {
      const tab = new Tab_Manage_Full(this, W, H, () => this._exitManageFull());
      this._currentTabObj = tab;

      // 전체 컨테이너는 보이되, 각 패널을 개별 애니메이션
      tab._container.setAlpha(1).setVisible(true);

      // 헤더: 위에서 아래로
      if (tab._headerPanel) {
        const oy = tab._headerPanel.y;
        tab._headerPanel.setAlpha(0).setY(oy - 28);
        this.tweens.add({ targets:tab._headerPanel, y:oy, alpha:1, duration:280, delay:0, ease:'Sine.easeOut' });
      }
      // 좌측: 왼쪽에서 슬라이드인
      if (tab._listPanel) {
        const ox = tab._listPanel.x;
        tab._listPanel.setAlpha(0).setX(ox - W*0.16);
        this.tweens.add({ targets:tab._listPanel, x:ox, alpha:1, duration:320, delay:30, ease:'Back.easeOut' });
      }
      // 우측: 오른쪽에서 슬라이드인
      if (tab._rightPanel) {
        const ox = tab._rightPanel.x;
        tab._rightPanel.setAlpha(0).setX(ox + W*0.16);
        this.tweens.add({ targets:tab._rightPanel, x:ox, alpha:1, duration:320, delay:60, ease:'Back.easeOut' });
      }
      // 돌아가기 버튼: 아래에서 올라오기
      if (tab._backBtn) {
        const oy = tab._backBtn.y;
        tab._backBtn.setAlpha(0).setY(oy + 32);
        this.tweens.add({ targets:tab._backBtn, y:oy, alpha:1, duration:300, delay:80, ease:'Back.easeOut' });
      }
      // 중앙: 배경 이미지 포함 페이드인 (가장 늦게 — 사라락 느낌)
      if (tab._centerPanel) {
        tab._centerPanel.setAlpha(0);
        this.tweens.add({ targets:tab._centerPanel, alpha:1, duration:450, delay:140, ease:'Sine.easeOut' });
      }

      // ⑤ 첫 번째 캐릭터 자동 선택 (패널 슬라이드인 완료 타이밍)
      this.time.delayedCall(220, () => {
        if (tab._cardObjs && tab._cardObjs.length > 0) {
          tab._selectChar(tab._cardObjs[0].char);
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  //  Tab_Manage_Full 퇴장 연출 (돌아가기)
  //  ① 돌아가기 버튼 왼쪽 슬라이드아웃
  //  ② 중앙 일러스트(배경 포함) 페이드아웃
  //  ③ 헤더↑, 좌측←, 우측→ 슬라이드아웃
  //  ④ 탭 destroy + 사이드버튼 슬라이드인 (역방향)
  // ════════════════════════════════════════════════════════════
  _exitManageFull() {
    const W = this.W, H = this.H;
    const tab = this._currentTabObj;
    if (!tab) return;

    // 중복 호출 방지
    this._currentTabObj = null;

    // ① 돌아가기 버튼 왼쪽으로
    if (tab._backBtn) {
      this.tweens.add({ targets:tab._backBtn, x:tab._backBtn.x - W*0.15, alpha:0, duration:200, ease:'Sine.easeIn' });
    }
    // ② 중앙 페이드아웃
    if (tab._centerPanel) {
      this.tweens.add({ targets:tab._centerPanel, alpha:0, duration:220, ease:'Sine.easeIn' });
    }
    // ③ 헤더 위로
    if (tab._headerPanel) {
      this.tweens.add({ targets:tab._headerPanel, y:tab._headerPanel.y - 28, alpha:0, duration:200, delay:0, ease:'Sine.easeIn' });
    }
    // ③ 좌측 왼쪽으로
    if (tab._listPanel) {
      this.tweens.add({ targets:tab._listPanel, x:tab._listPanel.x - W*0.16, alpha:0, duration:220, delay:20, ease:'Sine.easeIn' });
    }
    // ③ 우측 오른쪽으로
    if (tab._rightPanel) {
      this.tweens.add({ targets:tab._rightPanel, x:tab._rightPanel.x + W*0.16, alpha:0, duration:220, delay:40, ease:'Sine.easeIn' });
    }

    // ④ 모든 아웃 완료 후 destroy + 사이드버튼 슬라이드인
    this.time.delayedCall(320, () => {
      try { tab.destroy(); } catch(e){}
      // 언더라인 전부 초기화 후 explore 활성화 (잔상 방지)
      if (this._sideButtonRefs) {
        this._sideButtonRefs.forEach(({ underline, drawUnderline }) => {
          if (underline) underline.setAlpha(0);
          if (drawUnderline) drawUnderline(false);
        });
      }
      this._activeTab = 'explore';
      this._rebuildSideButtonColors();
      this._animateUIIn(false);
    });
  }

  // ── UI 슬라이드아웃 연출 → 콜백 ─────────────────────────────
  // 탐색 확인 버튼 클릭 시 호출 — 좌/우 사이드 버튼 + 탐색 버튼 슬라이드아웃
  _slideOutUIThen(onComplete) {
    const W = this.W;
    const H = this.H;
    const duration = 220;
    const stagger  = 35;

    // 슬라이드아웃 대상 수집
    const leftBtns  = this._uiAnimTargets.filter(t => t.dir === 'left');
    const rightBtns = this._uiAnimTargets.filter(t => t.dir === 'right');
    const downBtns  = this._uiAnimTargets.filter(t => t.dir === 'down' || t.dir === 'up');
    const allBtns   = [...leftBtns, ...rightBtns, ...downBtns];

    // 현재 탭 컨테이너도 페이드아웃
    if (this._currentTabObj && this._currentTabObj._container) {
      this.tweens.add({
        targets: this._currentTabObj._container,
        alpha: 0, duration: duration, ease: 'Sine.easeIn',
      });
    }

    // 좌측 버튼: 왼쪽으로 슬라이드아웃
    leftBtns.forEach((t, i) => {
      if (!t.obj || !t.obj.scene) return;
      this.tweens.add({
        targets: t.obj,
        x: t.originX - W * 0.18,
        alpha: 0,
        duration, delay: i * stagger, ease: 'Sine.easeIn',
      });
    });

    // 우측 버튼: 오른쪽으로 슬라이드아웃
    rightBtns.forEach((t, i) => {
      if (!t.obj || !t.obj.scene) return;
      this.tweens.add({
        targets: t.obj,
        x: t.originX + W * 0.18,
        alpha: 0,
        duration, delay: i * stagger, ease: 'Sine.easeIn',
      });
    });

    // 하단/상단 버튼: 아래로 슬라이드아웃
    downBtns.forEach((t, i) => {
      if (!t.obj || !t.obj.scene) return;
      this.tweens.add({
        targets: t.obj,
        y: t.originY + H * 0.12,
        alpha: 0,
        duration, delay: i * stagger, ease: 'Sine.easeIn',
      });
    });

    // 모든 트윈 완료 후 페이드 전환
    const totalDelay = duration + allBtns.length * stagger + 60;
    this.time.delayedCall(totalDelay, () => {
      const flash = this.add.rectangle(0, 0, W, H, 0x060408, 0)
        .setOrigin(0).setDepth(999);
      this.tweens.add({
        targets: flash, alpha: 1, duration: 280, ease: 'Sine.easeIn',
        onComplete: () => { if (onComplete) onComplete(); },
      });
    });
  }
}
