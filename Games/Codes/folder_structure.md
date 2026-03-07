# 📁 프로젝트 폴더 구조 — NEURAL RUST

> 실제 코드 기준 최신 구조/로드 순서 문서.

---

## 1) 디렉토리 구조

```text
neural-rust/
├── index.html
├── README.md
├── 문서/
│   ├── 기획/
│   │   ├── README.md
│   │   ├── GDD.md
│   │   ├── 세계관.md
│   │   ├── 시나리오.md
│   │   ├── 캐릭터.md
│   │   └── 레퍼런스.md
│   └── 개발/
│       ├── 개발 일지.md
│       ├── 시스템 기획.md
│       └── 탐사대_시스템.md
└── Games/
    ├── Assets/
    │   ├── Fonts/
    │   ├── Sprites/
    │   └── Audios/
    └── Codes/
        ├── Managers/
        └── Scenes/
```

---

## 2) Managers

- `FontManager.js`
- `SaveManager.js`
- `StoryManager.js`
- `InputManager.js`
- `AudioManager.js`
- `utils.js`
- `CharacterManager.js`
- `CharacterSpriteManager.js`

---

## 3) Scenes

- 루트 씬
  - `LobbyScene.js`
  - `LoadingScene.js`
  - `SettingsScene.js`
  - `GameScene.js` (플레이스홀더)
  - `AtelierScene.js`
  - `ExploreScene.js`

- 공방 보조 파일
  - `Ateliers/AtelierHUD.js`
  - `Ateliers/AtelierTabs.js`
  - `Ateliers/Tabs/Tab_Welcome.js`
  - `Ateliers/Tabs/Tab_Explore.js`
  - `Ateliers/Tabs/Tab_Manage.js`
  - `Ateliers/Tabs/Tab_Manage_Popup.js`
  - `Ateliers/Tabs/Tab_Manage_Utils.js`
  - `Ateliers/Tabs/Tab_Squad.js`
  - `Ateliers/Tabs/Tab_Squads/*`
  - `Ateliers/Tabs/Tab_CharProfile.js`
  - `Ateliers/Tabs/Tab_Stubs.js`

- 설정 탭
  - `Settings/Settings_Tab_Video.js`
  - `Settings/Settings_Tab_Audio.js`
  - `Settings/Settings_Tab_Keys.js`
  - `Settings/Settings_Tab_Font.js`
  - `Settings/Settings_Tab_Save.js`

---

## 4) index.html 스크립트 로드 원칙

1. Phaser
2. Managers
3. Scenes (의존 파일 먼저)
4. `main.js`

> 특히 `Tab_Manage.js`/`Tab_Squad.js`는 확장 파일보다 먼저 로드되어야 합니다.

---

## 5) 저장 키

| 키 | 관리 |
|---|---|
| `neural_rust_save` | SaveManager |
| `neural_rust_settings` | SaveManager |
| `neural_rust_story` | SaveManager |
| `neural_rust_keybinds` | InputManager |
| `neural_rust_audio` | AudioManager |
| `settings_font` | FontManager |
| `nr_characters` | CharacterManager |
| `nr_squad` | CharacterManager |

---

## 6) Electron 이식 체크

- 저장 계층: `localStorage` → 파일 기반
- 전체화면 API 분리
- 시작 오버레이 처리 전환
