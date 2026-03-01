# 🔧 PROJECT001 — 공방 (Atelier)

> 스토리 중심 로그라이크 게임 개발 저장소  
> Phaser 3 (웹) → Unity (이식) 확장 구조

---

## 📁 저장소 구조

```
project001/
│
├── 📒 문서/                        # 공방 문서 (기획 · 개발)
│   ├── 기획/                       # 세계관 · 게임 설계 · 캐릭터 · 스토리
│   │   ├── README.md               # 저장소 소개 (이 파일)
│   │   ├── 게임 디자인 문서.md      # GDD — 게임 설계도
│   │   ├── 세계관 설정 메모.md      # 세계관 자유 메모
│   │   ├── 스토리 시나리오.md       # 시나리오 · 씬 · 엔딩
│   │   ├── 캐릭터 설정집.md         # 캐릭터 설정 템플릿 · 목록
│   │   └── 레퍼런스 게임 자료.md    # 레퍼런스 분석 · 자료 정리
│   │
│   └── 개발/                       # 개발 기록
│       └── 개발 일지.md             # 날짜별 작업 기록
│
├── 🎮 Games/                       # 게임 소스코드 + 리소스
│   │
│   ├── Assets/                     # 리소스
│   │   └── Fonts/                  # 폰트 파일
│   │       └── NeoDunggeunmoPro-Regular.woff2
│   │
│   └── Codes/                      # 소스코드 (Phaser 3)
│       ├── Managers/               # 핵심 매니저 클래스
│       │   ├── FontManager.js      # 폰트 관리 + 전환
│       │   ├── SaveManager.js      # 세이브 데이터 관리
│       │   └── utils.js            # 전역 유틸 함수
│       │
│       ├── Scenes/                 # Phaser 씬 파일
│       │   ├── LobbyScene.js       # 메인 타이틀 · 로비
│       │   ├── LoadingScene.js     # 씬 전환 로딩
│       │   ├── SettingsScene.js    # 설정 화면 (폰트 전환 등)
│       │   └── GameScene.js        # 인게임 (개발 중)
│       │
│       ├── Entities/               # 캐릭터 · 적 · 오브젝트 (추후)
│       ├── Systems/                # 전투 · 로그라이크 · 스토리 시스템 (추후)
│       └── UI/                     # UI 컴포넌트 (추후)
│
└── index.html                      # 게임 진입점 (Codespaces · GitHub Pages)
```

---

## 🔗 index.html 파일 로드 순서

```
Phaser 3 CDN
  └─ Games/Codes/Managers/FontManager.js
  └─ Games/Codes/Managers/SaveManager.js
  └─ Games/Codes/Managers/utils.js
  └─ Games/Codes/Scenes/LobbyScene.js
  └─ Games/Codes/Scenes/LoadingScene.js
  └─ Games/Codes/Scenes/SettingsScene.js
  └─ Games/Codes/Scenes/GameScene.js
  └─ Games/Codes/main.js            ← 마지막에 Phaser.Game() 실행
```

---

## 🚀 빠른 시작 (Codespaces)

1. 저장소에서 `Code → Codespaces → Create` 클릭
2. 터미널에서 로컬 서버 실행:
```bash
npx serve .
```
3. 포트 포워딩된 주소로 브라우저에서 게임 확인

---

## 🗺️ 개발 로드맵

| 단계 | 내용 | 환경 |
|------|------|------|
| 1단계 | 세계관 · 기획 문서 정리 | 사지방 (웹) |
| 2단계 | Phaser 3 기반 프로토타입 | 사지방 (Codespaces) |
| 3단계 | 핵심 시스템 구현 | 사지방 (Codespaces) |
| 4단계 | Unity 이식 | 전역 후 |

---

## 📌 참고 레퍼런스 게임

- **로보토미 코퍼레이션 / 림버스 컴퍼니** — 세계관 깊이, 관리 시스템
- **다키스트 던전** — 로그라이크 구조, 심리 시스템
- **산나비** — 서사 밀도, 액션감
- **아이작** — 랜덤 생성, 아이템 시너지
