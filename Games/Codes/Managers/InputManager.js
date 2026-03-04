// ================================================================
//  InputManager.js
//  경로: Games/Codes/Managers/InputManager.js
//
//  역할: 키 바인딩 중앙 관리
//    - 액션(action) → 키(key) 매핑 테이블 보유
//    - localStorage 에 저장 / 불러오기
//    - 리바인딩(rebind) 지원
//    - isDown(action) / isJustDown(action) 로 씬에서 조회
//
//  사용법:
//    InputManager.init(scene)          — 씬 create() 에서 호출
//    InputManager.isDown('confirm')    — 매 프레임 체크
//    InputManager.isJustDown('menu')   — 단발 입력 체크
//    InputManager.startRebind('confirm', callback) — 리바인딩 시작
//
//  Electron 이식 시:
//    localStorage → electron-store 또는 fs.writeFileSync 로 교체만 하면 됨.
//    Phaser 키 캡처 로직은 그대로 유지.
// ================================================================

const InputManager = {

  // ── 액션 정의 ────────────────────────────────────────────────
  // key: 액션 ID (코드 내부에서 사용)
  // label: 설정 화면에 표시할 이름
  // default: 기본 키 (Phaser KeyCodes 문자열)
  ACTIONS: [
    { key: 'confirm',   label: '확인 / 상호작용',  default: 'Z'      },
    { key: 'cancel',    label: '취소 / 뒤로가기',  default: 'X'      },
    { key: 'menu',      label: '메뉴 열기',         default: 'ESC'    },
    { key: 'tab',       label: '탭 / 다음',         default: 'TAB'    },
    { key: 'moveUp',    label: '위',                default: 'UP'     },
    { key: 'moveDown',  label: '아래',              default: 'DOWN'   },
    { key: 'moveLeft',  label: '왼쪽',              default: 'LEFT'   },
    { key: 'moveRight', label: '오른쪽',            default: 'RIGHT'  },
    { key: 'dash',      label: '대시',              default: 'SHIFT'  },
    { key: 'map',       label: '지도',              default: 'M'      },
  ],

  STORAGE_KEY: 'project001_keybinds',

  // 현재 바인딩 { actionKey: 'KEY_STRING' }
  _binds: {},

  // Phaser 키 오브젝트 { actionKey: Phaser.Input.Keyboard.Key }
  _keys: {},

  // 리바인딩 대기 중인 액션
  _rebindTarget: null,
  _rebindCallback: null,
  _rebindListener: null,

  // ── 초기화 ────────────────────────────────────────────────────
  init(scene) {
    this._scene = scene;
    this._loadBinds();
    this._registerKeys(scene);
  },

  // ── 씬 전환 시 재등록 ─────────────────────────────────────────
  reinit(scene) {
    this._scene = scene;
    this._keys  = {};
    this._registerKeys(scene);
  },

  // ── 키 등록 ───────────────────────────────────────────────────
  _registerKeys(scene) {
    if (!scene || !scene.input || !scene.input.keyboard) return;
    this.ACTIONS.forEach(action => {
      const keyStr = this._binds[action.key] || action.default;
      try {
        this._keys[action.key] = scene.input.keyboard.addKey(
          Phaser.Input.Keyboard.KeyCodes[keyStr] ?? keyStr
        );
      } catch (e) {
        console.warn(`[InputManager] 키 등록 실패: ${action.key} → ${keyStr}`);
      }
    });
  },

  // ── 입력 조회 ─────────────────────────────────────────────────
  isDown(actionKey) {
    return this._keys[actionKey]?.isDown ?? false;
  },

  isJustDown(actionKey) {
    const k = this._keys[actionKey];
    return k ? Phaser.Input.Keyboard.JustDown(k) : false;
  },

  isJustUp(actionKey) {
    const k = this._keys[actionKey];
    return k ? Phaser.Input.Keyboard.JustUp(k) : false;
  },

  // ── 현재 바인딩 키 문자열 반환 ────────────────────────────────
  getKey(actionKey) {
    return this._binds[actionKey] ||
      this.ACTIONS.find(a => a.key === actionKey)?.default || '?';
  },

  // ── 리바인딩 ──────────────────────────────────────────────────
  /**
   * 다음 키 입력을 actionKey 에 바인딩
   * @param {string}   actionKey  - 변경할 액션
   * @param {Function} callback   - (newKeyStr) => void  성공/취소 모두 호출
   */
  startRebind(actionKey, callback) {
    if (this._rebindListener) this._cancelRebind();

    this._rebindTarget   = actionKey;
    this._rebindCallback = callback;

    this._rebindListener = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      // ESC → 취소
      if (e.code === 'Escape') {
        this._cancelRebind();
        callback(null);
        return;
      }

      const keyStr = this._codeToPhaser(e.code, e.key);
      if (!keyStr) { callback(null); return; }

      // 중복 바인딩 확인 — 기존 액션에서 제거 후 재할당
      Object.keys(this._binds).forEach(k => {
        if (this._binds[k] === keyStr && k !== actionKey) {
          this._binds[k] = this.ACTIONS.find(a => a.key === k)?.default || '';
        }
      });

      this._binds[actionKey] = keyStr;
      this._saveBinds();
      if (this._scene) this._registerKeys(this._scene);
      this._cleanupRebind();
      callback(keyStr);
    };

    window.addEventListener('keydown', this._rebindListener, { capture: true, once: true });
  },

  _cancelRebind() {
    if (this._rebindListener) {
      window.removeEventListener('keydown', this._rebindListener, true);
    }
    this._cleanupRebind();
  },

  _cleanupRebind() {
    this._rebindTarget   = null;
    this._rebindCallback = null;
    this._rebindListener = null;
  },

  // ── 기본값으로 초기화 ─────────────────────────────────────────
  resetToDefaults() {
    this._binds = {};
    this._saveBinds();
    if (this._scene) this._registerKeys(this._scene);
  },

  // ── 저장 / 불러오기 ───────────────────────────────────────────
  // TODO(Electron): localStorage → electron-store / fs 로 교체
  _saveBinds() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._binds));
    } catch (e) {
      console.warn('[InputManager] 저장 실패', e);
    }
  },

  _loadBinds() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this._binds = raw ? JSON.parse(raw) : {};
    } catch (e) {
      this._binds = {};
    }
  },

  // ── KeyboardEvent.code → Phaser KeyCodes 문자열 변환 ─────────
  _codeToPhaser(code, key) {
    // 문자 키 (KeyA, KeyB …)
    if (/^Key[A-Z]$/.test(code)) return code.replace('Key', '');

    // 숫자 키 (Digit0 … Digit9)
    if (/^Digit\d$/.test(code)) return code.replace('Digit', '');

    // 특수 매핑 테이블
    const MAP = {
      ArrowUp:      'UP',
      ArrowDown:    'DOWN',
      ArrowLeft:    'LEFT',
      ArrowRight:   'RIGHT',
      Space:        'SPACE',
      Enter:        'ENTER',
      ShiftLeft:    'SHIFT',
      ShiftRight:   'SHIFT',
      ControlLeft:  'CTRL',
      ControlRight: 'CTRL',
      AltLeft:      'ALT',
      AltRight:     'ALT',
      Tab:          'TAB',
      Backspace:    'BACKSPACE',
      Delete:       'DELETE',
      Home:         'HOME',
      End:          'END',
      PageUp:       'PAGE_UP',
      PageDown:     'PAGE_DOWN',
      Insert:       'INSERT',
      F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4',
      F5: 'F5', F6: 'F6', F7: 'F7', F8: 'F8',
      F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',
      Numpad0: 'NUMPAD_ZERO',  Numpad1: 'NUMPAD_ONE',
      Numpad2: 'NUMPAD_TWO',   Numpad3: 'NUMPAD_THREE',
      Numpad4: 'NUMPAD_FOUR',  Numpad5: 'NUMPAD_FIVE',
      Numpad6: 'NUMPAD_SIX',   Numpad7: 'NUMPAD_SEVEN',
      Numpad8: 'NUMPAD_EIGHT', Numpad9: 'NUMPAD_NINE',
      BracketLeft:  'OPEN_BRACKET',
      BracketRight: 'CLOSED_BRACKET',
      Semicolon:    'SEMICOLON',
      Quote:        'QUOTES',
      Comma:        'COMMA',
      Period:       'PERIOD',
      Slash:        'FORWARD_SLASH',
      Backslash:    'BACK_SLASH',
      Minus:        'MINUS',
      Equal:        'PLUS',
      Backquote:    'BACKTICK',
    };

    return MAP[code] || null;
  },

  // ── 표시용 키 이름 ────────────────────────────────────────────
  displayName(actionKey) {
    const k = this.getKey(actionKey);
    const DISPLAY = {
      UP: '↑', DOWN: '↓', LEFT: '←', RIGHT: '→',
      SPACE: 'Space', ENTER: 'Enter', SHIFT: 'Shift',
      CTRL: 'Ctrl', ALT: 'Alt', TAB: 'Tab',
      ESC: 'Esc', BACKSPACE: 'BS', DELETE: 'Del',
      PAGE_UP: 'PgUp', PAGE_DOWN: 'PgDn',
    };
    return DISPLAY[k] || k;
  },
};
