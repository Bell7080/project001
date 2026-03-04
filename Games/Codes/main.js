// ================================================================
//  main.js
//  경로: Games/Codes/main.js
//
//  ── Electron 이식 시 변경 지점 ──────────────────────────────────
//  [BROWSER-ONLY] 태그가 붙은 블록은 Electron 환경에서 제거하거나
//  Electron 전용 API 로 교체하세요.
//
//  주요 변경 지점:
//    1. fsOverlay 클릭 → app.whenReady() 후 바로 startGame() 호출
//    2. requestFullscreen / exitFullscreen
//       → win.setFullScreen(true/false) (BrowserWindow)
//    3. F11 전체화면 토글 → Electron 에서 직접 처리하거나 globalShortcut 등록
//    4. contextmenu / dragstart preventDefault
//       → Electron webPreferences: { contextIsolation: true } 로 대체 가능
//    5. localStorage (FontManager, SaveManager, InputManager)
//       → electron-store 또는 app.getPath('userData') 기반 fs 로 교체
// ================================================================

// ── [BROWSER-ONLY] 시작 오버레이 ─────────────────────────────────
const fsOverlay = document.getElementById('fs-overlay');

function startGame() {

  // ── [BROWSER-ONLY] 전체화면 요청 ───────────────────────────────
  // Electron: win.setFullScreen(true) 으로 교체
  const el        = document.documentElement;
  const fsRequest = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
  const fsPromise = fsRequest ? fsRequest.call(el).catch(() => {}) : Promise.resolve();

  // ── [BROWSER-ONLY] 오버레이 제거 ───────────────────────────────
  fsOverlay.style.opacity = '0';
  setTimeout(() => fsOverlay.remove(), 400);

  fsPromise.finally(() => {
    FontManager.init().then(() => {

      const game = new Phaser.Game({
        type:            Phaser.AUTO,
        backgroundColor: '#060608',
        parent:          'game-container',
        scene:           [LobbyScene, LoadingScene, SettingsScene, GameScene],
        scale: {
          mode:       Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width:      window.innerWidth,
          height:     window.innerHeight,
        },
      });

      window._phaserGame = game;

      // ── InputManager 초기 씬에서 초기화는 각 씬 create() 에서 진행
      //    여기서는 바인딩 데이터만 미리 로드
      InputManager._loadBinds();

      // ── 리사이즈: 캔버스 크기만 맞춤 (씬 재시작 없음) ──────────
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          game.scale.resize(window.innerWidth, window.innerHeight);
        }, 100);
      });

      // ── [BROWSER-ONLY] fullscreenchange: 비디오 탭 상태 동기화 ──
      // Electron: win.on('enter-full-screen') / win.on('leave-full-screen') 로 교체
      function handleFsChange() {
        setTimeout(() => {
          game.scale.resize(window.innerWidth, window.innerHeight);
          const activeScenes = game.scene.getScenes(true);
          activeScenes.forEach(scene => {
            if (scene.scene.key === 'SettingsScene' && scene._activeTab === 'video') {
              scene.scene.restart({ from: scene.fromScene, tab: 'video' });
            }
          });
        }, 100);
      }
      document.addEventListener('fullscreenchange',       handleFsChange);
      document.addEventListener('webkitfullscreenchange', handleFsChange);

      // ── 키보드 전역 처리 ──────────────────────────────────────
      window.addEventListener('keydown', (e) => {

        // [BROWSER-ONLY] F11 전체화면 토글
        // Electron: globalShortcut.register('F11', ...) 또는 Menu 액션으로 처리
        if (e.key === 'F11') {
          e.preventDefault();
          if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
          else                             document.exitFullscreen?.();
          return;
        }

        // ESC: GameScene 에서는 로비로 복귀
        // 주의: SettingsScene 의 리바인딩 중일 때는 InputManager 가 먼저 처리하므로
        //        여기서의 ESC 는 GameScene 전용으로만 동작함
        if (e.key === 'Escape') {
          const activeScenes = game.scene.getScenes(true);
          const inGame = activeScenes.some(s => s.scene.key === 'GameScene');
          if (inGame) {
            e.preventDefault();
            e.stopImmediatePropagation();
            game.scene.start('LobbyScene');
          }
        }

      }, true); // capture: true

    });
  });
}

// ── [BROWSER-ONLY] 마우스 기본 동작 차단 ─────────────────────────
// Electron: webPreferences contextIsolation / preload 로 대체 가능
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart',   e => e.preventDefault());
document.addEventListener('mousedown',   e => { if (e.button === 1) e.preventDefault(); });

// ── [BROWSER-ONLY] 오버레이 클릭으로 게임 시작 ───────────────────
// Electron: app.whenReady().then(startGame) 으로 교체
fsOverlay.addEventListener('click', startGame, { once: true });
