// ================================================================
//  Recruit_Data.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruits/Recruit_Data.js
//
//  역할: 영입 탭 전용 상수 + 가챠 유틸 함수
//  의존: Data_CharacterNames.js (CHARACTER_NAMES)
//        Data_Overclock.js      (OVERCLOCK_CHANCE, OVERCLOCK_POOL)  ← 분리됨
//        PositionData.js        (POSITION_POOL)
//        PassiveData.js         (PASSIVE_POOL)
//        SkillData.js           (SKILL_DATA — 키 참조)
//
//  ── 변경 이력 ───────────────────────────────────────────────
//    v2: 어빌리티 3분리 / 오버클럭 / 스탯 편향 / 직업 다양성 / 가격 연동 가중치
//    v3: OVERCLOCK_CHANCE / OVERCLOCK_POOL → Data_Overclock.js 로 분리
// ================================================================


// ── Cog 10등급 체계 ───────────────────────────────────────────────
//   Cog 1:   7~ 25   Cog 2:  26~ 44   Cog 3:  45~ 63
//   Cog 4:  64~ 82   Cog 5:  83~100   Cog 6: 101~133
//   Cog 7: 134~166   Cog 8: 167~200   Cog 9: 201~250
//   Cog10: 251~300

const RECRUIT_GACHA_BASE = [
  { cog: 1,  baseW: 9490, min:   7, max:  25 },
  { cog: 2,  baseW:  350, min:  26, max:  44 },
  { cog: 3,  baseW:  100, min:  45, max:  63 },
  { cog: 4,  baseW:   30, min:  64, max:  82 },
  { cog: 5,  baseW:   15, min:  83, max: 100 },
  { cog: 6,  baseW:    3, min: 101, max: 133 },
  { cog: 7,  baseW:    2, min: 134, max: 166 },
  { cog: 8,  baseW:    1, min: 167, max: 200 },
  { cog: 9,  baseW:    0, min: 201, max: 250 },
  { cog: 10, baseW:    0, min: 251, max: 300 },
];

const RECRUIT_COG_SCALE = {
  1:  { type: 'down',  rate: 0.05 },
  2:  { type: 'down',  rate: 0.03 },
  3:  { type: 'down',  rate: 0.01 },
  4:  { type: 'up',    rate: 0.20 },
  5:  { type: 'up',    rate: 0.35 },
  6:  { type: 'up',    rate: 0.55 },
  7:  { type: 'up',    rate: 0.75 },
  8:  { type: 'up',    rate: 1.00 },
  9:  { type: 'fixed', val:  0    },
  10: { type: 'fixed', val:  0    },
};

const RECRUIT_STAT_MINS   = [1, 0, 1, 5, 0];
const RECRUIT_STAT_LABELS = ['체력', '건강', '공격', '민첩', '행운'];
const RECRUIT_STAT_KEYS   = ['hp', 'health', 'attack', 'agility', 'luck'];

const RECRUIT_COG_COLORS = {
  1:'#7dff4f', 2:'#aaee22', 3:'#ccdd00', 4:'#ffdd00', 5:'#ffaa00',
  6:'#ff7700', 7:'#ff4400', 8:'#dd0000', 9:'#ff2255', 10:'#cc44ff',
};

const RECRUIT_SKILL_POOL = {
  1:  ['기본 일격', '빠른 찌르기'],
  2:  ['연속 타격', '방어 자세'],
  3:  ['강타', '회피 기동'],
  4:  ['독 도포', '광역 타격'],
  5:  ['강화 독', '순간 가속'],
  6:  ['폭발 타격', '전방 스캔'],
  7:  ['철갑 관통', '심해 압박'],
  8:  ['전기 충격', '철벽 방어'],
  9:  ['코어 오버로드', '심연의 포효'],
  10: ['코어 오버로드', '심연의 포효'],
};

const _RECRUIT_NAME_POOL = (typeof CHARACTER_NAMES !== 'undefined' && CHARACTER_NAMES.length > 0)
  ? CHARACTER_NAMES
  : ['볼트','기어','러스트','뎁스','아크','스팀','드릴','앵커','크롬','스크랩'];

const RECRUIT_NAMES     = { fisher: _RECRUIT_NAME_POOL, diver: _RECRUIT_NAME_POOL };
const RECRUIT_JOB_LABEL = { fisher: '낚시꾼', diver: '잠수부' };
const RECRUIT_JOBS      = ['fisher', 'diver'];

const RECRUIT_BASE_PRICE   = 5;
const RECRUIT_PRICE_STEP   = 5;
const RECRUIT_MAX_REROLL   = 3;
const RECRUIT_SLOT_TICK    = 55;
const RECRUIT_SLOT_COUNT   = 30;
const RECRUIT_SPRITE_COUNT = 72;


// ════════════════════════════════════════════════════════════════
//  가챠 유틸 함수
// ════════════════════════════════════════════════════════════════

function _buildGachaTable(currentPrice) {
  const lv = Math.max(0, Math.floor(
    (currentPrice - RECRUIT_BASE_PRICE) / RECRUIT_PRICE_STEP
  ));
  return RECRUIT_GACHA_BASE.map(entry => {
    const sc = RECRUIT_COG_SCALE[entry.cog];
    let w = entry.baseW;
    if      (sc.type === 'fixed') { w = sc.val; }
    else if (sc.type === 'down')  { w = Math.round(w * Math.max(0.10, 1 - sc.rate * lv)); }
    else                          { w = Math.round(w * (1 + sc.rate * lv)); }
    return { cog: entry.cog, weight: w, min: entry.min, max: entry.max };
  });
}

function _rWPick(table) {
  const active = table.filter(e => e.weight > 0);
  const total  = active.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of active) { r -= e.weight; if (r <= 0) return e; }
  return active[active.length - 1];
}

function _rBiasedInRange(min, max) {
  return min + Math.floor(Math.pow(Math.random(), 1.8) * (max - min + 1));
}

function _rDist(total) {
  const s   = [...RECRUIT_STAT_MINS];
  let   rem = Math.max(0, total - s.reduce((a, b) => a + b, 0));
  for (let i = 0; i < rem; i++) s[Math.floor(Math.random() * 5)]++;
  return s;
}

function _rFrom(arr)     { return arr[Math.floor(Math.random() * arr.length)]; }
function _rSpriteKey()   { return `char_${String(Math.floor(Math.random() * RECRUIT_SPRITE_COUNT)).padStart(3, '0')}`; }

// ── 오버클럭 롤 — Data_Overclock.js 의 OVERCLOCK_CHANCE / OVERCLOCK_POOL 참조 ──
function _rOverclock() {
  if (Math.random() >= OVERCLOCK_CHANCE) return null;
  return OVERCLOCK_POOL[Math.floor(Math.random() * OVERCLOCK_POOL.length)];
}

function _applyOverclock(stats, overclock) {
  if (!overclock) return stats;
  const result = [...stats];
  result[overclock.statIdx] = Math.floor(result[overclock.statIdx] * (1 + overclock.bonus));
  return result;
}

function _ensureJobDiversity(rolls) {
  const jobs = rolls.map(r => r.job);
  if (jobs.every(j => j === jobs[0])) {
    const altJobs = RECRUIT_JOBS.filter(j => j !== jobs[0]);
    rolls[2].job  = _rFrom(altJobs);
    rolls[2].name = _rFrom(RECRUIT_NAMES[rolls[2].job]);
  }
  return rolls;
}

function _rRoll(currentPrice) {
  const price      = currentPrice ?? RECRUIT_BASE_PRICE;
  const entry      = _rWPick(_buildGachaTable(price));
  const statSum    = _rBiasedInRange(entry.min, entry.max);
  const cog        = entry.cog;
  const job        = _rFrom(RECRUIT_JOBS);
  const baseStats  = _rDist(statSum);
  const overclock  = _rOverclock();
  const finalStats = _applyOverclock(baseStats, overclock);
  const finalSum   = finalStats.reduce((a, b) => a + b, 0);

  const posPool = (typeof POSITION_POOL !== 'undefined') ? (POSITION_POOL[cog] || POSITION_POOL[1]) : ['앞칸 타격'];
  const pasPool = (typeof PASSIVE_POOL  !== 'undefined') ? (PASSIVE_POOL[cog]  || PASSIVE_POOL[1])  : ['강인한 체질'];
  const sklPool = RECRUIT_SKILL_POOL[cog] || RECRUIT_SKILL_POOL[1];

  return {
    name:      _rFrom(_RECRUIT_NAME_POOL),
    job,
    stats:     finalStats,
    statSum:   finalSum,
    cog,
    position:  _rFrom(posPool),
    passive:   _rFrom(pasPool),
    skill:     _rFrom(sklPool),
    overclock,
    spriteKey: _rSpriteKey(),
  };
}
