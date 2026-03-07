// ================================================================
//  Recruit_Data.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruits/Recruit_Data.js
//
//  역할: 영입 탭 전용 상수 + 가챠 유틸 함수
//  의존: CharacterNames.js (CHARACTER_NAMES)
// ================================================================

// ── 상수 ──────────────────────────────────────────────────────────

const RECRUIT_GACHA_TABLE = [
  { weight: 10, min:   0, max:  14 },
  { weight:  9, min:  15, max:  29 },
  { weight:  8, min:  30, max:  44 },
  { weight:  7, min:  45, max:  59 },
  { weight:  6, min:  60, max:  74 },
  { weight:  5, min:  75, max:  89 },
  { weight:  4, min:  90, max: 109 },
  { weight:  3, min: 110, max: 139 },
  { weight:  2, min: 140, max: 189 },
  { weight:  1, min: 190, max: 250 },
];

const RECRUIT_STAT_MINS   = [1, 0, 1, 5, 0];
const RECRUIT_STAT_LABELS = ['체력', '건강', '공격', '민첩', '행운'];
const RECRUIT_STAT_KEYS   = ['hp', 'health', 'attack', 'agility', 'luck'];
const RECRUIT_COG_TH      = [10, 25, 45, 65, 80, 95];
const RECRUIT_COG_COLORS  = ['', '#9ab890', '#90a8c8', '#c8c070', '#c89050', '#c85050', '#b030b0', '#ff2020'];

const RECRUIT_PASSIVE_POOL = {
  1: ['윗칸 타격', '앞칸 타격'],
  2: ['앞칸 타격', '현재 칸 타격'],
  3: ['현재 칸 타격', '대각 타격', '윗칸 타격'],
  4: ['전열 전체 타격', '대각 타격', '앞칸 타격'],
  5: ['전열 전체 타격', '현재 칸 타격', '후열 타격'],
  6: ['전/후열 동시 타격', '후열 타격', '전열 전체 타격'],
  7: ['전체 칸 타격', '전/후열 동시 타격'],
};
const RECRUIT_SKILL_POOL = {
  1: ['기본 일격', '빠른 찌르기'],
  2: ['연속 타격', '방어 자세'],
  3: ['강타', '회피 기동', '독 도포'],
  4: ['광역 타격', '강화 독', '순간 가속'],
  5: ['폭발 타격', '전방 스캔', '철갑 관통'],
  6: ['심해 압박', '전기 충격', '철벽 방어'],
  7: ['코어 오버로드', '심연의 포효'],
};

// 이름 풀 — CharacterNames.js 우선, 없으면 폴백
const _RECRUIT_NAME_POOL = (typeof CHARACTER_NAMES !== 'undefined' && CHARACTER_NAMES.length > 0)
  ? CHARACTER_NAMES
  : ['볼트','기어','러스트','뎁스','아크','스팀','드릴','앵커','크롬','스크랩'];

const RECRUIT_NAMES = { fisher: _RECRUIT_NAME_POOL, diver: _RECRUIT_NAME_POOL };

const RECRUIT_JOB_LABEL = { fisher: '낚시꾼', diver: '잠수부' };
const RECRUIT_JOBS      = ['fisher', 'diver'];

const RECRUIT_BASE_PRICE   = 5;
const RECRUIT_PRICE_STEP   = 5;
const RECRUIT_MAX_REROLL   = 3;
const RECRUIT_SLOT_TICK    = 55;
const RECRUIT_SLOT_COUNT   = 30;
const RECRUIT_SPRITE_COUNT = 72;

// ── 가챠 유틸 ─────────────────────────────────────────────────────

function _rWPick(table) {
  const total = table.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of table) { r -= e.weight; if (r <= 0) return e; }
  return table[table.length - 1];
}

function _rCog(sum) {
  for (let i = 0; i < RECRUIT_COG_TH.length; i++) if (sum <= RECRUIT_COG_TH[i]) return i + 1;
  return 7;
}

function _rDist(total) {
  const s = [...RECRUIT_STAT_MINS];
  let rem = total - s.reduce((a, b) => a + b, 0);
  if (rem < 0) rem = 0;
  for (let i = 0; i < rem; i++) s[Math.floor(Math.random() * 5)]++;
  return s;
}

function _rFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function _rSpriteKey() {
  return `char_${String(Math.floor(Math.random() * RECRUIT_SPRITE_COUNT)).padStart(3, '0')}`;
}

// 가챠 1회 결과 생성
function _rRoll() {
  const entry   = _rWPick(RECRUIT_GACHA_TABLE);
  const statSum = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
  const job     = _rFrom(RECRUIT_JOBS);
  const cog     = _rCog(statSum);
  return {
    job, statSum, cog,
    stats:     _rDist(statSum),
    name:      _rFrom(RECRUIT_NAMES[job]),
    spriteKey: _rSpriteKey(),
    passive:   _rFrom(RECRUIT_PASSIVE_POOL[cog]),
    skill:     _rFrom(RECRUIT_SKILL_POOL[cog]),
  };
}
