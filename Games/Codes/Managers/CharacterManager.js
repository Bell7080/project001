// ================================================================
//  CharacterManager.js
//  경로: Games/Codes/Managers/CharacterManager.js
//
//  [로드 순서 — HTML]
//    1. Games/Codes/Data/CharacterNames.js   ← 이름 풀 300개
//    2. Games/Codes/Managers/CharacterManager.js
// ================================================================

const CharacterManager = (() => {

  // ── 이름 풀 ────────────────────────────────────────────────────
  // CharacterNames.js 가 먼저 로드됐으면 그 풀 사용, 아니면 폴백
  function _getNamePool() {
    return (typeof CHARACTER_NAMES !== 'undefined' && CHARACTER_NAMES.length > 0)
      ? CHARACTER_NAMES
      : [
        '볼트','기어','러스트','뎁스','아크','스팀','드릴','앵커',
        '크롬','스크랩','파이퍼','드리프터','글리치','넥서스','타이드',
        '코그','플럭스','스파크','베인','어비스',
      ];
  }

  // ── 직업 ────────────────────────────────────────────────────────
  const JOB_LABEL = { fisher: '낚시꾼', diver: '잠수부', ai: 'AI' };
  const JOBS      = ['fisher', 'diver', 'ai'];

  // ── Cog 등급 계산 ───────────────────────────────────────────────
  function calcCog(s) {
    if (s <= 10) return 1;
    if (s <= 25) return 2;
    if (s <= 45) return 3;
    if (s <= 65) return 4;
    if (s <= 80) return 5;
    if (s <= 95) return 6;
    return 7;
  }

  // ── 패시브 / 스킬 풀 ────────────────────────────────────────────
  const PASSIVE_POOL = {
    1: ['윗칸 타격', '앞칸 타격'],
    2: ['앞칸 타격', '현재 칸 타격'],
    3: ['현재 칸 타격', '대각 타격', '윗칸 타격'],
    4: ['전열 전체 타격', '대각 타격', '앞칸 타격'],
    5: ['전열 전체 타격', '현재 칸 타격', '후열 타격'],
    6: ['전/후열 동시 타격', '후열 타격', '전열 전체 타격'],
    7: ['전체 칸 타격', '전/후열 동시 타격'],
  };
  const SKILL_POOL = {
    1: ['기본 일격', '빠른 찌르기'],
    2: ['연속 타격', '방어 자세'],
    3: ['강타', '회피 기동', '독 도포'],
    4: ['광역 타격', '강화 독', '순간 가속'],
    5: ['폭발 타격', '전방 스캔', '철갑 관통'],
    6: ['심해 압박', '전기 충격', '철벽 방어'],
    7: ['코어 오버로드', '심연의 포효'],
  };

  // ── 유틸 ────────────────────────────────────────────────────────
  function _pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  const SPRITE_COUNT = 72; // char_000 ~ char_071
  function _randSpriteKey() {
    const n = Math.floor(Math.random() * SPRITE_COUNT);
    return `char_${String(n).padStart(3, '0')}`;
  }

  function _randStats() {
    const total  = 10 + Math.floor(Math.random() * 41);
    const mins   = [1, 0, 1, 5, 0];
    const remain = Math.max(0, total - mins.reduce((a, b) => a + b, 0));
    const b      = [0, 0, 0, 0, 0];
    for (let i = 0; i < remain; i++) b[Math.floor(Math.random() * 5)]++;
    return {
      hp:      mins[0] + b[0],
      health:  mins[1] + b[1],
      attack:  mins[2] + b[2],
      agility: mins[3] + b[3],
      luck:    mins[4] + b[4],
    };
  }

  // ── 캐릭터 생성 ─────────────────────────────────────────────────
  function createCharacter(job) {
    const stats   = _randStats();
    const statSum = Object.values(stats).reduce((a, v) => a + v, 0);
    const cog     = calcCog(statSum);
    return {
      id:        `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name:      _pick(_getNamePool()),
      age:       16 + Math.floor(Math.random() * 10),
      job,
      jobLabel:  JOB_LABEL[job],
      stats,
      statSum,
      cog,
      passive:   _pick(PASSIVE_POOL[cog] || PASSIVE_POOL[1]),
      skill:     _pick(SKILL_POOL[cog]   || SKILL_POOL[1]),
      currentHp: stats.hp * 10,
      maxHp:     stats.hp * 10,
      spriteKey: _randSpriteKey(),
    };
  }

  // ── 스토리지 키 ─────────────────────────────────────────────────
  const KEY       = 'nr_characters';
  const SQUAD_KEY = 'nr_squad';

  // ── 캐릭터 CRUD ─────────────────────────────────────────────────
  function saveAll(chars) {
    localStorage.setItem(KEY, JSON.stringify(chars));
  }

  function loadAll() {
    try {
      const r = localStorage.getItem(KEY);
      return r ? JSON.parse(r) : null;
    } catch { return null; }
  }

  // 영입 확정 시 추가
  function addCharacter(char) {
    const chars = loadAll() || [];
    chars.push(char);
    saveAll(chars);
  }

  // 캐릭터 삭제 (id 기준) — 스쿼드에서도 자동 제거
  function removeCharacter(id) {
    const chars = (loadAll() || []).filter(c => c.id !== id);
    saveAll(chars);
    const squad   = loadSquad();
    const cleaned = squad.map(slot => slot.filter(sid => sid !== id));
    saveSquad(cleaned);
  }

  // 캐릭터 단건 업데이트 (stats, name 등 수정 후 저장)
  function updateCharacter(updated) {
    const chars = loadAll() || [];
    const idx   = chars.findIndex(c => c.id === updated.id);
    if (idx !== -1) { chars[idx] = updated; saveAll(chars); }
  }

  // ── 초기화 (게임 시작 시 1회 호출) ─────────────────────────────
  function initIfEmpty() {
    const ex = loadAll();

    if (ex && ex.length > 0) {
      // 구버전 데이터 마이그레이션: spriteKey 누락/범위 초과 재할당
      let dirty = false;
      ex.forEach(c => {
        const idx = parseInt((c.spriteKey || '').replace('char_', ''), 10);
        if (!c.spriteKey || isNaN(idx) || idx >= SPRITE_COUNT) {
          c.spriteKey = _randSpriteKey();
          dirty = true;
        }
      });
      if (dirty) saveAll(ex);
      return ex;
    }

    // 최초 실행 — 직업별 10명씩 30명 생성
    const chars = [];
    for (let i = 0; i < 10; i++) chars.push(createCharacter('fisher'));
    for (let i = 0; i < 10; i++) chars.push(createCharacter('diver'));
    for (let i = 0; i < 10; i++) chars.push(createCharacter('ai'));
    saveAll(chars);
    return chars;
  }

  // ── 스쿼드 (Array<Array<id>>, 슬롯 10개 × 최대 3명) ────────────
  function loadSquad() {
    try {
      const r = localStorage.getItem(SQUAD_KEY);
      if (!r) return Array(10).fill(null).map(() => []);
      const raw = JSON.parse(r);
      return Array(10).fill(null).map((_, i) => {
        const v = raw[i];
        if (!v) return [];
        if (Array.isArray(v)) return v.filter(Boolean);
        return [v]; // 구버전 단일 id → 배열로 마이그레이션
      });
    } catch {
      return Array(10).fill(null).map(() => []);
    }
  }

  function saveSquad(s) {
    const normalized = Array(10).fill(null).map((_, i) => {
      const v = s[i];
      if (!v) return [];
      if (Array.isArray(v)) return v;
      return [v];
    });
    localStorage.setItem(SQUAD_KEY, JSON.stringify(normalized));
  }

  // ── 공개 API ────────────────────────────────────────────────────
  return {
    initIfEmpty,
    loadAll,
    saveAll,
    createCharacter,
    addCharacter,
    removeCharacter,
    updateCharacter,
    loadSquad,
    saveSquad,
    calcCog,
    JOB_LABEL,
  };

})();
