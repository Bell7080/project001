// ================================================================
//  SaveManager.js
//  경로: Games/Codes/Managers/SaveManager.js
//
//  역할: 게임 세이브 데이터 관리 (localStorage 기반)
//
//  저장 키 구조:
//    project001_save     — 게임 진행 데이터 (런, 인게임 상태)
//    project001_settings — 설정 데이터 (폰트 등)
//    project001_story    — 스토리 진행 데이터 (플래그, 로그, 로어)
//
//  TODO(Electron):
//    localStorage → fs.readFileSync / fs.writeFileSync 교체
//    _read() / _write() 두 함수만 수정하면 전체 반영됨
// ================================================================

// ── 스토리 세이브 기본값 ──────────────────────────────────────────
// 스토리 설계 후 flags 항목을 채워넣으세요.
// 이 구조 자체는 건드리지 않아도 됩니다.
const STORY_SAVE_DEFAULT = {

  // 현재 진행 위치
  progress: {
    day:   1,
    phase: 'start',   // 'start' | 'operations' | 'story' | 'result'
  },

  // 플래그 테이블
  // 형식: { "flag_id": true/false } 또는 { "choice_id": "A" }
  // 씬 실행 조건, 선택지 결과, NPC 상태 등 모든 상태값을 여기에 기록
  flags: {},

  // 이벤트 발생 로그 (순서 보존)
  // 한 번 발생한 이벤트 ID를 순서대로 누적
  // 용도: 회상 씬, 아카이브, "이 이벤트보다 먼저 발생했는지" 판단
  log: [],

  // 해금된 로어 / 기록물 ID 목록
  // 세계관 아카이브, 도감, 메모리 등에 활용
  unlockedLore: [],

  // 열람 완료한 로어 ID (해금 ≠ 읽음)
  readLore: [],
};

const SaveManager = {

  SAVE_KEY:     'project001_save',
  SETTINGS_KEY: 'project001_settings',
  STORY_KEY:    'project001_story',

  // ================================================================
  //  내부 읽기 / 쓰기
  //  TODO(Electron): 이 두 함수만 fs 기반으로 교체
  // ================================================================
  _read(key, fallback) {
    try {
      const r = localStorage.getItem(key);
      return r ? JSON.parse(r) : fallback;
    } catch (e) {
      console.warn(`[SaveManager] 읽기 실패: ${key}`, e);
      return fallback;
    }
  },

  _write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`[SaveManager] 쓰기 실패: ${key}`, e);
    }
  },

  // ================================================================
  //  게임 데이터 (런 / 인게임 상태)
  // ================================================================
  hasSave()    { return localStorage.getItem(this.SAVE_KEY) !== null; },
  save(data)   { this._write(this.SAVE_KEY, data); },
  load()       { return this._read(this.SAVE_KEY, null); },
  deleteSave() { localStorage.removeItem(this.SAVE_KEY); },

  // ================================================================
  //  설정 데이터
  // ================================================================
  saveSettings(patch) {
    const next = Object.assign({}, this.loadSettings(), patch);
    this._write(this.SETTINGS_KEY, next);
  },
  loadSettings() { return this._read(this.SETTINGS_KEY, {}); },
  deleteSettings() { localStorage.removeItem(this.SETTINGS_KEY); },

  // ================================================================
  //  스토리 데이터
  // ================================================================

  // ── 전체 불러오기 / 저장 ─────────────────────────────────────
  loadStory() {
    const saved = this._read(this.STORY_KEY, null);
    if (!saved) return JSON.parse(JSON.stringify(STORY_SAVE_DEFAULT));
    // 새 필드가 추가된 경우 기본값으로 병합
    return Object.assign({}, JSON.parse(JSON.stringify(STORY_SAVE_DEFAULT)), saved);
  },

  _saveStory(data) {
    this._write(this.STORY_KEY, data);
  },

  // ── 진행 위치 ────────────────────────────────────────────────
  setProgress(day, phase) {
    const s = this.loadStory();
    s.progress = { day, phase };
    this._saveStory(s);
  },

  getProgress() {
    return this.loadStory().progress;
  },

  // ── 플래그 ───────────────────────────────────────────────────
  // 단일 플래그 설정
  setFlag(key, value) {
    const s = this.loadStory();
    s.flags[key] = value;
    this._saveStory(s);
  },

  // 플래그 읽기 (없으면 false)
  getFlag(key) {
    return this.loadStory().flags[key] ?? false;
  },

  // 여러 플래그 한 번에 설정
  setFlags(patch) {
    const s = this.loadStory();
    Object.assign(s.flags, patch);
    this._saveStory(s);
  },

  // 여러 플래그가 모두 true인지 확인
  checkFlags(keys) {
    const flags = this.loadStory().flags;
    return keys.every(k => !!flags[k]);
  },

  // 하나라도 true인지 확인
  checkAnyFlag(keys) {
    const flags = this.loadStory().flags;
    return keys.some(k => !!flags[k]);
  },

  // ── 이벤트 로그 ──────────────────────────────────────────────
  // 이벤트 추가 (중복 방지)
  addLog(eventId) {
    const s = this.loadStory();
    if (!s.log.includes(eventId)) s.log.push(eventId);
    this._saveStory(s);
  },

  // 이벤트 발생 여부
  hasEvent(eventId) {
    return this.loadStory().log.includes(eventId);
  },

  // eventId가 otherEventId보다 먼저 발생했는지
  happenedBefore(eventId, otherEventId) {
    const log = this.loadStory().log;
    return log.indexOf(eventId) < log.indexOf(otherEventId);
  },

  // ── 로어 / 기록물 ────────────────────────────────────────────
  // 로어 해금
  unlockLore(loreId) {
    const s = this.loadStory();
    if (!s.unlockedLore.includes(loreId)) s.unlockedLore.push(loreId);
    this._saveStory(s);
  },

  // 해금 여부 확인
  isLoreUnlocked(loreId) {
    return this.loadStory().unlockedLore.includes(loreId);
  },

  // 읽음 처리
  markLoreRead(loreId) {
    const s = this.loadStory();
    if (!s.readLore.includes(loreId)) s.readLore.push(loreId);
    this._saveStory(s);
  },

  // 읽지 않은 해금 로어 목록 (알림 뱃지 등에 활용)
  getUnreadLore() {
    const s = this.loadStory();
    return s.unlockedLore.filter(id => !s.readLore.includes(id));
  },

  // ── 스토리 초기화 ─────────────────────────────────────────────
  deleteStory() {
    localStorage.removeItem(this.STORY_KEY);
  },

  // ================================================================
  //  전체 초기화
  // ================================================================
  deleteAll() {
    this.deleteSave();
    this.deleteSettings();
    this.deleteStory();
    localStorage.removeItem('settings_font');
    localStorage.removeItem('project001_keybinds');
  },
};
