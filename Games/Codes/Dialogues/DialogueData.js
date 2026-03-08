// ================================================================
//  DialogueData.js
//  경로: Games/Codes/Dialogues/DialogueData.js
//
//  ※ 이 파일은 convert_dialogue.js 실행 시 자동 생성됩니다.
//    직접 수정하지 마세요.
//
//  갱신 방법:
//    1. NeuralRust_Dialogue.xlsx 편집 (한셀)
//    2. cd Games/Codes/Dialogues/Tools
//    3. node convert_dialogue.js
// ================================================================

// ── 캐릭터 단축어 → 표시명 ──────────────────────────────────────
const CAST_DATA = {
  "P": "Player"
};

// ── 이벤트 ID → BGM 파일명 ──────────────────────────────────────
const BGM_DATA = {};

// ── SFX 별칭 → 파일명 ───────────────────────────────────────────
const SFX_DATA = {};

// ── 텍스트 강조 키워드 ───────────────────────────────────────────
const KEYWORD_DATA = [];

// ── 대화 이벤트 데이터 ───────────────────────────────────────────
//  구조: { [eventId]: { lines: DialogueLine[], lineMap: { [id]: index } } }
const DIALOGUE_DATA = {};
