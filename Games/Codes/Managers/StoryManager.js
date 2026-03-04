// ================================================================
//  StoryManager.js
//  경로: Games/Codes/Managers/StoryManager.js
//
//  역할: 스토리 흐름 제어
//    - 씬 실행 조건 판단 (플래그 기반)
//    - 현재 Day에 실행할 씬 목록 반환
//    - 씬 완료 처리 (플래그 세우기 + 로그 추가)
//    - 다음 Day / Phase 진행
//
//  사용법:
//    StoryManager.getScenesForToday()   → 오늘 실행할 씬 ID 배열
//    StoryManager.completeScene(id)     → 씬 완료 처리
//    StoryManager.canAdvance()          → 다음 Day로 넘어갈 수 있는지
//    StoryManager.advance()             → Day 진행
//
//  스토리 데이터 추가 방법:
//    아래 STORY_DATA 객체에 Day별로 씬을 정의하세요.
//    각 씬은 condition() 함수로 실행 조건을 설정할 수 있습니다.
//    condition 없으면 항상 실행.
//
//  의존: SaveManager
// ================================================================

// ================================================================
//  스토리 데이터 정의
//  ※ 이 블록이 앞으로 스토리 작업의 주 공간입니다.
//
//  씬 구조:
//  {
//    id:        고유 ID (플래그 키로도 사용됨)
//    phase:     실행될 페이즈 ('start' | 'story' | 'result')
//    once:      true면 한 번만 실행 (기본 true)
//    condition: () => boolean  실행 조건 함수 (생략 시 항상 실행)
//    onComplete: () => void    완료 시 추가 처리 (생략 가능)
//  }
// ================================================================
const STORY_DATA = {

  // ── Day 1 ────────────────────────────────────────────────────
  1: [
    {
      id:        'day1_intro',
      phase:     'start',
      once:      true,
      // condition 없음 → 항상 실행
    },
  ],

  // ── Day 2 ────────────────────────────────────────────────────
  2: [
    {
      id:        'day2_start',
      phase:     'start',
      once:      true,
    },
  ],

  // 이후 Day는 스토리 작업 시 여기에 추가하세요.
  // 예시:
  //
  // 5: [
  //   {
  //     id:    'day5_angela_warning',
  //     phase: 'story',
  //     once:  true,
  //     condition: () =>
  //       SaveManager.getFlag('npc_angela_met') &&
  //       !SaveManager.getFlag('day5_angela_warning_seen'),
  //   },
  //   {
  //     id:    'day5_first_ordeal',
  //     phase: 'result',
  //     once:  true,
  //     condition: () => SaveManager.getFlag('ordeal_unlocked'),
  //     onComplete: () => {
  //       SaveManager.unlockLore('lore_ordeal_001');
  //     },
  //   },
  // ],
};

// ── 각 Day 클리어 조건 ────────────────────────────────────────────
// 이 조건이 true여야 StoryManager.canAdvance() 가 true를 반환합니다.
// 조건 없으면 항상 진행 가능.
const DAY_CLEAR_CONDITIONS = {
  // 예시:
  // 1: () => SaveManager.getFlag('day1_intro_seen'),
  // 5: () => SaveManager.checkFlags(['day5_quota_met', 'day5_story_seen']),
};

// 총 Day 수 (스토리 설계 후 변경)
const TOTAL_DAYS = 50;


const StoryManager = {

  // ── 오늘 실행할 씬 목록 ──────────────────────────────────────
  // phase 필터 가능: 'start' | 'story' | 'result' | null(전체)
  getScenesForToday(phaseFilter) {
    const { day, phase } = SaveManager.getProgress();
    const dayScenes = STORY_DATA[day] || [];

    return dayScenes.filter(scene => {
      // 페이즈 필터
      if (phaseFilter && scene.phase !== phaseFilter) return false;
      // 이미 실행된 씬 제외 (once: true)
      if (scene.once !== false && SaveManager.getFlag(scene.id + '_seen')) return false;
      // 조건 체크
      if (scene.condition && !scene.condition()) return false;
      return true;
    }).map(s => s.id);
  },

  // ── 특정 씬을 지금 실행해야 하는지 ──────────────────────────
  shouldPlay(sceneId) {
    const { day } = SaveManager.getProgress();
    const dayScenes = STORY_DATA[day] || [];
    const scene = dayScenes.find(s => s.id === sceneId);
    if (!scene) return false;
    if (scene.once !== false && SaveManager.getFlag(sceneId + '_seen')) return false;
    if (scene.condition && !scene.condition()) return false;
    return true;
  },

  // ── 씬 완료 처리 ─────────────────────────────────────────────
  completeScene(sceneId) {
    SaveManager.setFlag(sceneId + '_seen', true);
    SaveManager.addLog(sceneId);

    // onComplete 콜백 실행
    const { day } = SaveManager.getProgress();
    const dayScenes = STORY_DATA[day] || [];
    const scene = dayScenes.find(s => s.id === sceneId);
    if (scene?.onComplete) scene.onComplete();
  },

  // ── 다음 Day로 진행 가능 여부 ────────────────────────────────
  canAdvance() {
    const { day } = SaveManager.getProgress();
    if (day >= TOTAL_DAYS) return false;
    const condition = DAY_CLEAR_CONDITIONS[day];
    return condition ? condition() : true;
  },

  // ── 다음 Day로 진행 ──────────────────────────────────────────
  advance() {
    if (!this.canAdvance()) return false;
    const { day } = SaveManager.getProgress();
    SaveManager.setFlag(`day${day}_cleared`, true);
    SaveManager.addLog(`day${day}_clear`);
    SaveManager.setProgress(day + 1, 'start');
    return true;
  },

  // ── 현재 Day / Phase 편의 조회 ───────────────────────────────
  getDay()   { return SaveManager.getProgress().day;   },
  getPhase() { return SaveManager.getProgress().phase; },

  // ── Phase 전환 ───────────────────────────────────────────────
  setPhase(phase) {
    const { day } = SaveManager.getProgress();
    SaveManager.setProgress(day, phase);
  },

  // ── 엔딩 도달 여부 ───────────────────────────────────────────
  isEnding() {
    return SaveManager.getProgress().day > TOTAL_DAYS;
  },

  // ── 디버그용: 현재 스토리 상태 출력 ─────────────────────────
  debug() {
    const story = SaveManager.loadStory();
    console.group('[StoryManager] 현재 상태');
    console.log('Day:', story.progress.day, '/ Phase:', story.progress.phase);
    console.log('Flags:', story.flags);
    console.log('Log:', story.log);
    console.log('Lore(unlocked):', story.unlockedLore);
    console.groupEnd();
  },
};
