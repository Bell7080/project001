// ================================================================
//  Tab_Recruit.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruit.js
//
//  [Phase 흐름]
//    READY  → [ 영 입 ] 패널 + 가격 + 확인 스타일 버튼
//    SLOT   → 3개 슬롯머신 동시 가동 (직업 / 스탯합계 표시)
//    PICK   → 3개 결과 카드 중 하나 선택
//    CUSTOM → 커스터마이징 (스탯·외형·패시브·스킬 재설정)
//
//  ✏️ v2 수정:
//    - _lockOverlay를 _container 안으로 이동
//    - _unlockTabs에서 _container.setDepth(0) 조작 제거
//    - destroy()에 잠금 상태 복구 + _lockOverlay 정리 추가
//  ✏️ v3 수정:
//    - _clear()에 _ocGlowTween 중단 추가
//      → Recruit_Custom.js 오버클럭 glow tween이 destroy 후에도
//         onUpdate를 호출해 발생하던 "Cannot read properties of null (reading 'cut')" 수정
// ================================================================

class Tab_Recruit {
  constructor(scene, W, H) {
    this.scene = scene;
    this.W = W;
    this.H = H;

    const save = SaveManager.load() || {};
    this.price = save.recruitPrice ?? RECRUIT_BASE_PRICE;

    this.result        = null;
    this.rerolls       = {};
    this._lockOverlay  = null;
    this._ocGlowTween  = null;   // ✏️ 오버클럭 glow tween 참조

    this._container  = scene.add.container(0, 0);
    this._timers     = [];
    this._tweens     = [];
    this._sceneHits  = [];

    this._buildReady();
  }

  show()    { this._container.setVisible(true);  }
  hide()    { this._container.setVisible(false); }

  destroy() {
    if (this._lockOverlay) {
      try { this._lockOverlay.destroy(); } catch(e) {}
      this._lockOverlay = null;
    }
    const refs = this.scene._sideButtonRefs || [];
    refs.forEach(({ btn }) => {
      try { btn.setInteractive({ useHandCursor: true }); } catch(e) {}
    });

    this._timers.forEach(t => { if (t && t.remove) t.remove(); });
    this._tweens.forEach(t => { if (t && t.stop)   t.stop();   });
    this._sceneHits.forEach(h => { try { h.destroy(); } catch(e){} });
    this._timers    = [];
    this._tweens    = [];
    this._sceneHits = [];
    this._container.destroy();
  }

  // ── 내부 유틸 ─────────────────────────────────────────────────

  _fs(n) { return scaledFontSize(n, this.scene.scale); }

  _clear() {
    // ✏️ 오버클럭 glow tween 먼저 중단 — 컨테이너 정리 전에 반드시 실행
    //    tween이 살아있는 상태에서 ocTxt가 destroy되면 onUpdate에서
    //    "Cannot read properties of null (reading 'cut')" 오류 발생
    if (this._ocGlowTween) {
      try { this._ocGlowTween.stop(); this._ocGlowTween.remove(); } catch(e) {}
      this._ocGlowTween = null;
    }
    this._container.removeAll(true);
  }

  _delay(ms, fn) {
    const t = this.scene.time.delayedCall(ms, fn);
    this._timers.push(t);
    return t;
  }

  _tween(cfg) {
    const t = this.scene.tweens.add(cfg);
    this._tweens.push(t);
    return t;
  }

  // ── 탭 버튼 잠금/해제 ─────────────────────────────────────────
  _lockTabs() {
    const refs = this.scene._sideButtonRefs || [];
    refs.forEach(({ btn }) => btn.disableInteractive());

    if (!this._lockOverlay) {
      this._lockOverlay = this.scene.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.55)
        .setOrigin(0).setDepth(50);
      this._container.add(this._lockOverlay);
    }
  }

  _unlockTabs() {
    const refs = this.scene._sideButtonRefs || [];
    refs.forEach(({ btn }) => btn.setInteractive({ useHandCursor: true }));

    if (this._lockOverlay) {
      this._lockOverlay.destroy();
      this._lockOverlay = null;
    }
  }

  // ── 나머지 메서드는 Recruit_*.js 파일에서 prototype으로 주입됨 ──
}
