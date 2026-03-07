# 🎮 게임 디자인 문서 (GDD) — NEURAL RUST

> 본 문서는 **현재 코드 구현 상태 + 목표 기획**을 함께 관리합니다.
> 최종 기준: `Games/Codes/*` 실제 동작.

---

## 1) 게임 개요

| 항목 | 내용 |
|---|---|
| 타이틀 | **NEURAL RUST** (뉴럴 러스트) |
| 장르 | 스토리 진행형 관리 시뮬레이션 + 디펜스 |
| 엔진 | Phaser 3 (웹) |
| 이식 계획 | Electron 패키징 → Unity 이식(장기) |
| 개발 형태 | 1인 개발, 문서 주도 개발(기획 ↔ 코드 동기화) |

---

## 2) 코어 루프

```text
[공방(Atelier) 허브] 탭에서 준비/관리
        ↓
[탐색(Explore)] 이벤트 카드 선택
        ↓
[결과 반영] (현재는 공방 복귀)
        ↓
[Day 진행/스토리] StoryManager 기준으로 확장
```

### 현재 구현 상태
- 공방 허브 UI/탭 전환 동작: 구현됨
- 탐색 슬롯 이벤트 연출: 구현됨
- 카드 결과에 따른 실제 전투 씬 분기: 미구현(복귀 처리)

---

## 3) 주요 시스템 현황

## 3-1. 씬 구성

| 씬 | 상태 | 설명 |
|---|---|---|
| LobbyScene | 구현 | 타이틀/메뉴/진입 |
| LoadingScene | 구현 | 전환 로딩 + 캐릭터 시트 로드 |
| SettingsScene | 구현 | 비디오/오디오/키/폰트/저장 탭 |
| AtelierScene | 구현 | 허브 + 좌우 탭 + 하단 탐색 버튼 |
| ExploreScene | 구현 | 슬롯형 이벤트 카드 선택 연출 |
| GameScene | 플레이스홀더 | 인게임 임시 화면 |

## 3-2. 공방 탭

| 탭 키 | 상태 | 파일 |
|---|---|---|
| explore | 구현 | `Tab_Explore.js` |
| manage | 구현 | `Tab_Manage.js` + Popup + Utils |
| squad | 구현 | `Tab_Squad.js` + Grid + Slider |
| welcome | 구현 | `Tab_Welcome.js` (공방 첫 진입 오버레이) |
| charprofile | 구현 | `Tab_CharProfile.js` (관리/탐사대 연동 팝업) |
| recruit/facility/outsource/dredge/shop/storage/codex/memory | 플레이스홀더 | `Tab_Stubs.js` |

## 3-3. 데이터/저장

- 저장 계층: `localStorage`
- 핵심 키: `neural_rust_save`, `neural_rust_story`, `neural_rust_settings`, `nr_characters`, `nr_squad` 등
- StoryManager: `TOTAL_DAYS = 50` 임시값, Day 1~2 시작 씬만 등록

---

## 4) 디자인 원칙

- 심해/증기/고철/녹 미학 유지
- 정적이고 밀도 높은 UI 톤
- 수치/전투보다 **인물·선택·기록**의 감정선을 우선

---

## 5) 미결 과제 (우선순위)

1. Explore 결과를 실제 전투/스토리 분기로 연결
2. 스텁 탭(영입/시설/외주/드레지) 실제 기능화
3. StoryManager Day 데이터 확장 및 조건 분기 정교화
4. Electron 이식 대비 저장/전체화면 처리 분리

---

## 6) 문서 동기화 기준

- 세계관 상세: `세계관.md`
- 스토리 씬/ID 설계: `시나리오.md`
- 캐릭터/직군/능력치 규칙: `캐릭터.md`, `탐사대_시스템.md`
- 구현 구조/스크립트 순서: `Games/Codes/folder_structure.md`
