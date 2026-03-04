# 🔧 PROJECT001 — 공방 (Atelier)

> 스토리 중심 로그라이크 게임 개발 저장소  
> Phaser 3 (웹) → Electron (패키징) → Unity (이식) 확장 구조

---

## 📁 저장소 구조

```
project001/
│
├── 📒 문서/
│   ├── 기획/
│   │   ├── README.md
│   │   ├── 게임 디자인 문서.md
│   │   ├── 세계관 설정 메모.md
│   │   ├── 스토리 시나리오.md
│   │   ├── 캐릭터 설정집.md
│   │   └── 레퍼런스 게임 자료.md
│   └── 개발/
│       └── 개발 일지.md
│
├── 🎮 Games/
│   ├── Assets/
│   │   └── Fonts/
│   │       └── NeoDunggeunmoPro-Regular.woff2
│   │
│   └── Codes/
│       ├── Managers/
│       │   ├── FontManager.js      # 폰트 관리 + 전환
│       │   ├── SaveManager.js      # 세이브 / 설정 / 스토리 데이터
│       │   ├── StoryManager.js     # 스토리 흐름 제어 (Day / Flag / Log)
│       │   ├── InputManager.js     # 키 바인딩 중앙 관리
│       │   └── utils.js            # 전역 유틸 함수
│       │
│       ├── Scenes/
│       │   ├── LobbyScene.js       # 메인 타이틀 · 로비
│       │   ├── LoadingScene.js     # 씬 전환 로딩
│       │   ├── SettingsScene.js    # 설정 (폰트 · 비디오 · 키 · 저장)
│       │   └── GameScene.js        # 인게임 (개발 중)
│       │
│       ├── Entities/               # 캐릭터 · 적 · 오브젝트 (추후)
│       ├── Systems/                # 전투 · 로그라이크 시스템 (추후)
│       └── UI/                     # UI 컴포넌트 (추후)
│
└── index.html
```

---

## 🔗 파일 로드 순서

```
Phaser 3 CDN
  └─ FontManager.js
  └─ SaveManager.js
  └─ StoryManager.js      ← SaveManager 의존
  └─ InputManager.js
  └─ utils.js
  └─ LobbyScene.js
  └─ LoadingScene.js
  └─ SettingsScene.js
  └─ GameScene.js
  └─ main.js              ← 마지막
```

---

## 💾 저장 데이터 구조

| 키 | 내용 |
|---|---|
| `project001_save` | 게임 진행 데이터 (런, 인게임 상태) |
| `project001_settings` | 설정 (폰트 등) |
| `project001_story` | 스토리 진행 (Day, 플래그, 이벤트 로그, 로어) |
| `project001_keybinds` | 키 바인딩 |
| `settings_font` | 폰트 프리셋 단축 키 |

---

## 📖 스토리 시스템 사용법

스토리 데이터는 `StoryManager.js` 상단의 `STORY_DATA` 객체에 Day별로 정의합니다.

```javascript
// StoryManager.js — STORY_DATA 작성 예시
5: [
  {
    id:    'day5_angela_warning',   // 고유 ID (플래그 키로도 사용됨)
    phase: 'story',                 // 실행 페이즈
    once:  true,                    // 한 번만 실행
    condition: () =>
      SaveManager.getFlag('npc_angela_met'),
    onComplete: () => {
      SaveManager.unlockLore('lore_001');
    },
  },
],
```

씬에서의 사용:

```javascript
// 오늘 실행할 씬 확인
const scenes = StoryManager.getScenesForToday('start');

// 특정 씬 실행 여부 판단
if (StoryManager.shouldPlay('day5_angela_warning')) { ... }

// 씬 완료 처리
StoryManager.completeScene('day5_angela_warning');

// 다음 Day 진행
StoryManager.advance();

// 디버그
StoryManager.debug();
```

---

## ⌨️ 키 설정 (InputManager)

설정 화면 → 키 설정 탭에서 리바인딩 가능.  
코드에서는 `InputManager.isJustDown('confirm')` 형태로 사용.

기본 액션 목록: `confirm` / `cancel` / `menu` / `tab` / `moveUp` / `moveDown` / `moveLeft` / `moveRight` / `dash` / `map`

---

## 🔌 Electron 이식 체크리스트

| 항목 | 파일 | 처리 |
|---|---|---|
| `[BROWSER-ONLY]` 전체화면 API | `main.js` | `win.setFullScreen()` 교체 |
| `[BROWSER-ONLY]` 오버레이 클릭 | `main.js` | `app.whenReady()` 로 교체 |
| localStorage 저장 | `SaveManager._read/_write` | `fs` / `electron-store` 교체 |
| 키 바인딩 저장 | `InputManager._saveBinds/_loadBinds` | 동상 |
| contextmenu 차단 | `main.js` | Electron `webPreferences` 로 대체 |

---

## 🚀 빠른 시작 (Codespaces)

```bash
npx serve .
```

---

## 🗺️ 개발 로드맵

| 단계 | 내용 | 환경 |
|---|---|---|
| 1단계 | 세계관 · 기획 문서 정리 | 사지방 (웹) |
| 2단계 | Phaser 3 프로토타입 · 매니저 구축 | 사지방 (Codespaces) |
| 3단계 | 핵심 시스템 구현 + 스토리 작업 | 사지방 (Codespaces) |
| 4단계 | Electron 패키징 → exe | 사지방 / 휴가 |
| 5단계 | Unity 이식 | 전역 후 |

---

## 📌 레퍼런스 게임

- **로보토미 코퍼레이션 / 림버스 컴퍼니** — 세계관 깊이, 관리 시스템, 스토리 플래그 구조
- **다키스트 던전** — 로그라이크 구조, 심리 시스템
- **산나비** — 서사 밀도, 액션감
- **아이작** — 랜덤 생성, 아이템 시너지
