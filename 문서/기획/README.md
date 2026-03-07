# ⚙️ NEURAL RUST — 문서 허브

> 기획 문서의 진입점입니다.
> 이 문서는 **현재 구현 기준으로 어떤 문서를 어떻게 동기화할지**를 안내합니다.

---

## 1) 문서 구성

| 문서 | 목적 | 동기화 대상 |
|---|---|---|
| `GDD.md` | 게임 전체 설계 요약 | 씬/탭/루프 전반 |
| `세계관.md` | 세계 구조/용어/세력 | 시나리오, 캐릭터 설정 |
| `시나리오.md` | Day/씬 ID/분기 설계 | `StoryManager.STORY_DATA` |
| `캐릭터.md` | 캐릭터 데이터/역할 설계 | `CharacterManager` |
| `문서/개발/시스템 기획.md` | UI/시스템 상세 | `Atelier/Explore/Settings` 코드 |
| `문서/개발/탐사대_시스템.md` | 탐사대 편성/코그 규칙 | `Tab_Squad`, `CharacterManager` |

---

## 2) 현재 구현 상태 요약

### 씬
- 구현: Lobby / Loading / Settings / Atelier / Explore
- 플레이스홀더: GameScene

### 공방 탭
- 구현: Explore / Manage / Squad / Welcome / CharProfile
- 스텁: Recruit / Facility / Outsource / Dredge / Shop / Storage / Codex / Memory

### 데이터
- 저장: `localStorage` 기반
- StoryManager: Day 1~2 start 씬만 등록, `TOTAL_DAYS=50` 임시

---

## 3) 문서 업데이트 원칙

1. 문서 먼저 수정하고 코드 반영하지 말고, **코드 현황 확인 후 문서를 맞춘다**.
2. 씬 ID, 탭 키, 저장 키는 코드 문자열과 동일하게 쓴다.
3. 미구현 항목은 "목표"로 분리 표기한다.

---

## 4) 빠른 참조

- 코드 구조: `Games/Codes/folder_structure.md`
- 루트 안내: `README.md`
- 최신 작업 기록: `문서/개발/개발 일지.md`
