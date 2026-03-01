// ================================================================
//  main.js
//  경로: Games/Codes/main.js
//
//  역할: Phaser.Game() 초기화 + 전체화면 처리
//  주의: 반드시 모든 씬 파일 로드 후 마지막에 실행
//
//  새 씬 추가 시:
//    1. Games/Codes/Scenes/ 에 씬 파일 생성
//    2. index.html 에 <script src="Games/Codes/Scenes/새씬.js"> 추가
//    3. 아래 scene 배열에 클래스명 추가
// ================================================================

const fsOverlay = document.getElementById('fs-overlay');

function startGame() {
  const el = document.documentElement;
  const fsRequest = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
  const fsPromise = fsRequest ? fsRequest.call(el).catch(() => {}) : Promise.resolve();

  fsOverlay.style.opacity = '0';
  setTimeout(() => fsOverlay.remove(), 400);

  fsPromise.finally(() => {
    FontManager.init().then(() => {
      const game = new Phaser.Game({
        type: Phaser.AUTO,
        backgroundColor: '#060608',
        parent: 'game-container',
        scene: [
          LobbyScene,
          LoadingScene,
          SettingsScene,
          GameScene,
          // ↑ 새 씬 클래스 여기에 추가
        ],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width:  window.innerWidth,
          height: window.innerHeight,
        },
      });

      window._phaserGame = game;

      window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'F11') {
          e.preventDefault();
          if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
          else                             document.exitFullscreen?.();
        }
      });
    });
  });
}

// ── 브라우저 기본 동작 차단 ───────────────────────────────────
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart',   e => e.preventDefault());
document.addEventListener('mousedown',   e => { if (e.button === 1) e.preventDefault(); });

document.addEventListener('fullscreenchange', () => {
  setTimeout(() => {
    if (window._phaserGame)
      window._phaserGame.scale.resize(window.innerWidth, window.innerHeight);
  }, 100);
});

fsOverlay.addEventListener('click', startGame, { once: true });
