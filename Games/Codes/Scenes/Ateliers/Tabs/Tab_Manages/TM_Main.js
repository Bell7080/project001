// ================================================================
//  TM_Main.js
//  경로: Games/Codes/Scenes/Atelier/tabs/Tab_Manages/TM_Main.js
//
//  역할: Tab_Manage_Full 진입점 — 상태 관리, 생명주기, 패널 조립
//
//  로드 순서 (index.html):
//    TM_Layout.js → TM_CardList.js → TM_Center.js → TM_RightPanel.js → TM_Main.js
// ================================================================

class Tab_Manage_Full {

  constructor(scene, W, H, onBack) {
    this.scene  = scene;
    this.W      = W;
    this.H      = H;
    this.onBack = onBack || null;

    this._selectedChar  = null;
    this._cardObjs      = [];
    this._cardRow       = null;
    this._maskGfx       = null;
    this._scrollY       = 0;
    this._totalCardH    = 0;
    this._dragged       = false;

    this._filterJob     = 'all';
    this._filterCog     = 'all';
    this._filterBarObjs = [];

    this._detailObjs   = [];
    this._detailTweens = [];

    // AtelierScene 애니메이션용 패널 참조
    this._headerPanel = null;
    this._listPanel   = null;
    this._centerPanel = null;
    this._rightPanel  = null;
    this._backBtn     = null;

    this._container = scene.add.container(0, 0);
    this._build();
  }

  _build() {
    const { scene, W, H } = this;
    const fs = n => scaledFontSize(n, scene.scale);

    const hdrH     = parseInt(fs(44));
    const backBtnH = parseInt(fs(60));
    this._hdrH     = hdrH;

    // 패널 여백 (뒷배경이 테두리 주변에 보이도록)
    const pm = Math.round(W * 0.012);
    this._panelMargin = pm;

    this._listW    = Math.round(W * 0.21);
    this._centerW  = Math.round(W * 0.44);   // 중앙 더 넓게, 우측 줄임
    this._rightW   = W - this._listW - this._centerW;
    this._bodyY    = hdrH + 1 + pm;
    this._bodyH    = H - hdrH - 1 - pm * 2 - backBtnH;

    TM_Layout.buildBackground(this, fs);
    TM_Layout.buildHeader(this, fs, hdrH);
    TM_Layout.buildDividers(this, backBtnH);
    TM_Layout.buildBackBtn(this, fs, backBtnH);
    TM_CardList.buildListPanel(this, fs, backBtnH);
    TM_Center.buildCenterPanel(this, fs);
    TM_RightPanel.buildRightPanel(this, fs);
    TM_CardList.setupDrag(this);
  }

  _selectChar(char) {
    this._selectedChar = char;
    this._cardObjs.forEach(({ container: c, char: ch }) => {
      if (c._drawCbg) c._drawCbg(false, ch.id === char.id);
    });
    TM_Center.buildDetail(this, char);
    TM_RightPanel.buildDetail(this, char);
  }

  _refreshCards() {
    this._cardObjs = [];
    this._scrollY  = 0;
    if (this._cardRow)  { this._cardRow.destroy();  this._cardRow  = null; }
    if (this._maskGfx) { this._maskGfx.destroy();   this._maskGfx  = null; }
    TM_CardList.buildCardList(this);
  }

  _applyFilter(chars) {
    return chars.filter(c =>
      (this._filterJob === 'all' || c.job === this._filterJob) &&
      (this._filterCog === 'all' || c.cog === parseInt(this._filterCog))
    );
  }

  _inCardArea(ptr) {
    return ptr.x >= this._cardAreaX && ptr.x <= this._cardAreaX + this._cardAreaW
        && ptr.y >= this._cardAreaY && ptr.y <= this._cardAreaY + this._cardAreaH;
  }

  _showToast(msg) {
    const { scene, W, H } = this;
    const t = scene.add.text(W / 2, H * 0.5, msg, {
      fontSize: scaledFontSize(15, scene.scale), fill: '#cc5533', fontFamily: FontManager.MONO,
    }).setOrigin(0.5).setDepth(700).setAlpha(0);
    scene.tweens.add({ targets: t, alpha: 1, duration: 200, onComplete: () => {
      scene.time.delayedCall(1200, () => {
        scene.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
      });
    }});
  }

  _doHeal(char, cost) {
    const save = SaveManager.load(), arc = save?.arc ?? 0;
    if (arc < cost) { this._showToast('Arc가 부족합니다'); return; }
    if (save) { save.arc = arc - cost; SaveManager.save(save); this.scene.events.emit('arcUpdated', save.arc); }
    const chars = CharacterManager.loadAll(), target = chars.find(c => c.id === char.id);
    if (target) { target.currentHp = target.maxHp; CharacterManager.saveAll(chars); }
    const updated = CharacterManager.loadAll().find(c => c.id === char.id) || char;
    this._refreshCards();
    this._selectChar(updated);
  }

  show()  { this._container.setVisible(true);  }
  hide()  { this._container.setVisible(false); }

  destroy() {
    if (this._detailTweens) this._detailTweens.forEach(tw => { try { tw.stop(); tw.remove(); } catch(e){} });
    this._detailObjs.forEach(o     => { try { o.destroy(); } catch(e){} });
    this._filterBarObjs.forEach(o  => { try { o.destroy(); } catch(e){} });
    if (this._maskGfx) { this._maskGfx.destroy(); this._maskGfx = null; }
    const si = this.scene.input;
    if (this._dragDown)  si.off('pointerdown', this._dragDown);
    if (this._dragMove)  si.off('pointermove', this._dragMove);
    if (this._dragUp)    si.off('pointerup',   this._dragUp);
    if (this._dragWheel) si.off('wheel',       this._dragWheel);
    this._container.destroy();
  }
}
