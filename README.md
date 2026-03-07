# NEURAL RUST

> 심해·증기·고철 세계관 기반의 **스토리 중심 관리 시뮬레이션 + 디펜스** 프로토타입.
> 현재는 **Phaser 3 웹 빌드**를 중심으로 개발 중이며, 추후 Electron 패키징을 고려한 구조로 작성되어 있습니다.

## 프로젝트 개요

- 타이틀: **NEURAL RUST** (뉴럴 러스트)
- 장르: 스토리 진행형 관리 시뮬레이션 + 디펜스
- 코어 루프: 공방(Atelier) 경영 → 운영 이벤트 → 결산/스토리 → 다음 Day
- 목표 플랫폼: Web(Phaser3) → Electron → Unity 이식(장기)

## 현재 개발 상태 (코드 기준)

### 씬(Scene)
- ✅ `LobbyScene`: 타이틀/메뉴/연출
- ✅ `LoadingScene`: 씬 전환용 로딩
- ✅ `SettingsScene`: 비디오·오디오·키·폰트·저장 탭
- ✅ `AtelierScene`: 메인 허브 UI + 탭 전환 구조
- ✅ `ExploreScene`: 슬롯형 이벤트 선택 연출(전투/스토리 카드)
- ⚠️ `GameScene`: 플레이스홀더

### 공방 탭(Atelier Tabs)
- ✅ 구현: `Welcome`, `Explore`, `Manage`, `Squad`, `CharProfile`
- ⚠️ 플레이스홀더: `Recruit`, `Facility`, `Outsource`, `Dredge`, `Shop`, `Storage`, `Codex`, `Memory`

### 매니저(Managers)
- ✅ `SaveManager`: 진행/설정/스토리 저장
- ✅ `StoryManager`: Day/Phase 및 씬 호출 관리
- ✅ `InputManager`: 키 바인딩
- ✅ `AudioManager`: 마스터/BGM/SFX 볼륨
- ✅ `FontManager`: 폰트 적용
- ✅ `CharacterManager`: 캐릭터 생성·저장·탐사대 편성
- ✅ `CharacterSpriteManager`: 스프라이트 매핑

> 현재 저장 계층은 `localStorage` 기반이며, Electron 이식 시 파일 기반 저장소로 교체 예정입니다.

## 실행 방법

별도 빌드 과정 없이 정적 파일로 실행됩니다.

1. 저장소 루트에서 `index.html`을 브라우저로 열기
2. 시작 오버레이 클릭 후 게임 진입

권장: VSCode Live Server 등 로컬 정적 서버로 실행.

## 문서 맵

- 기획 개요: `문서/기획/README.md`
- GDD: `문서/기획/GDD.md`
- 세계관: `문서/기획/세계관.md`
- 시나리오: `문서/기획/시나리오.md`
- 캐릭터: `문서/기획/캐릭터.md`
- 시스템 상세: `문서/개발/시스템 기획.md`
- 개발 일지: `문서/개발/개발 일지.md`
- 코드 구조/로드 순서: `Games/Codes/folder_structure.md`

## 현재 우선 과제

1. `Tab_Stubs.js` 구간의 핵심 탭 순차 구현 (`Recruit`, `Facility`, `Outsource`, `Dredge` 우선)
2. `StoryManager`의 Day별 `STORY_DATA` 확장 및 분기 조건 정리
3. `ExploreScene` 카드 선택 결과를 실제 전투/스토리 씬 분기로 연결
4. Electron 이식 대비 저장/전체화면/입력 처리 분리

---

프로젝트는 문서 주도(기획 → 구현) 방식으로 관리되며, 문서와 실제 코드 상태를 지속 동기화하는 것을 원칙으로 합니다.
