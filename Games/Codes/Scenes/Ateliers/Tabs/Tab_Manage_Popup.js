// ================================================================
//  Tab_Manage_Popup.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Manage_Popup.js
//
//  역할: 관리 탭 — 캐릭터 프로필 팝업
//        공용 모듈 CharProfile(Tab_CharProfile.js)로 위임
//  의존: Tab_Manage.js (prototype 확장), Tab_CharProfile.js
// ================================================================

Object.assign(Tab_Manage.prototype, {

  _openPopup(char) {
    this._closePopup();
    this._openCharId = char.id;

    CharProfile.open(this.scene, this.W, this.H, char, {
      onClose: () => {
        this._openCharId = null;
        this._popupOverlay = null;
        this._popupGroup   = null;
      },
      onHeal: (c, cost) => {
        this._doHeal(c, cost);
      },
    });

    // ── overlay / group 참조는 CharProfile 내부에서 관리되므로
    //    _closePopup() 은 단순 플래그 초기화만 수행한다.
  },

  _closePopup() {
    // CharProfile 팝업은 overlay 클릭 또는 버튼으로 자체 닫힘.
    // 탭 전환 등 외부에서 강제로 닫을 필요가 있을 경우를 위해
    // Phaser 씬의 depth 400~402 오브젝트를 제거하는 방식으로 처리.
    this._forceCloseCharProfile();
    this._openCharId = null;
  },

  // depth 400~402 범위의 CharProfile 오브젝트 강제 제거
  _forceCloseCharProfile() {
    if (!this.scene || !this.scene.children) return;
    const toRemove = this.scene.children.list.filter(
      obj => obj.depth >= 400 && obj.depth <= 402
    );
    toRemove.forEach(obj => { try { obj.destroy(); } catch(e) {} });
  },

});
