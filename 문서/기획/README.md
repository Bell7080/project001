# 🔧 PROJECT001 — 공방 (Atelier)

> 스토리 중심 로그라이크 게임 개발 저장소  
> Phaser 3 (웹) → Unity (이식) 확장 구조

---

## 📁 저장소 구조

```
project001/
│
├── 📒 docs/                        # 공방 문서 (기획 · 세계관 · 설계)
│   ├── world/                      # 세계관 설정
│   ├── design/                     # 게임 디자인 문서
│   ├── characters/                 # 캐릭터 설정집
│   ├── story/                      # 스토리/시나리오
│   └── references/                 # 레퍼런스 자료
│
├── 🎮 src/                         # 게임 소스코드 (Phaser 3 + TypeScript)
│   ├── core/                       # 핵심 시스템 (상태관리, 이벤트 등)
│   ├── scenes/                     # Phaser 씬
│   ├── entities/                   # 캐릭터, 적, 오브젝트
│   ├── systems/                    # 전투, 로그라이크, 스토리 시스템
│   └── ui/                         # UI 컴포넌트
│
├── 📦 data/                        # JSON 데이터 (유니티 이식 시 재활용)
│   ├── characters/
│   ├── items/
│   ├── events/
│   └── story/
│
├── 🖼️ assets/                      # 리소스
│   ├── images/
│   ├── audio/
│   └── fonts/
│
├── 🧪 prototype/                   # 빠른 테스트용 프로토타입
│
├── 📝 devlog/                      # 개발 일지
│
├── index.html                      # 게임 진입점 (Codespaces · GitHub Pages)
└── README.md
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
