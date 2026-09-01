# 프로젝트 상태

## 프로젝트 목적

초등학교 6학년 학생이 직접 질문을 고르고 선택하면서 생성형 AI가 입력을 나누고, 앞의 내용을 참고하고, 다음 말을 확률적으로 고르는 원리를 이해하도록 돕는 인터랙티브 웹사이트다. 화면은 긴 스크롤 학습지보다 게임처럼 한 장면씩 진행한다.

## 현재 기술 스택

- React
- TypeScript
- Vite
- 별도 UI/애니메이션 라이브러리 없이 CSS 중심 구현
- 외부 생성형 AI API 미사용. 교육용 시뮬레이션 데이터를 로컬 구조로 관리

## 주요 폴더 구조

```text
.
├── src/
│   ├── components/
│   │   ├── CategoryGlyph.tsx
│   │   ├── ExplorerOrb.tsx
│   │   ├── ScenarioStages.tsx
│   │   ├── TokenSplitPractice.tsx
│   │   ├── TransformerDetails.tsx
│   │   └── StageProgress.tsx
│   ├── data/
│   │   ├── categories.ts
│   │   ├── questionBank.ts
│   │   ├── progress.ts
│   │   └── scenarios.ts
│   ├── types/
│   │   └── experience.ts
│   ├── transformer/
│   │   └── engine.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── scripts/
│   ├── validate-safety.mjs
│   ├── validate-transformer.mjs
│   ├── validate-progress.mjs
│   └── validate-scenarios.mjs
├── DECISIONS.md
├── NEXT_CHAT.md
├── PROJECT_STATE.md
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

## 현재 구현된 기능

- React + TypeScript + Vite 초기 실행 구조
- 시작 화면: AI가 다음 말을 고르는 과정을 소개하는 히어로 화면
- 단계형 화면 전환: 시작 화면 → 주제 → 질문 → 토큰화 → Transformer → 참고하기 → 예측 → 비교 → 완성
- 5개 주제(동물·사람·일상·과학·학교)를 고르는 선택 UI
- 선택한 카테고리의 즉시 피드백 패널
- 카테고리별 30개, 총 150개 질문 선택 화면
- 지식형·상상형·선택·의견형을 각각 10개씩 보여 주는 질문 유형 필터
- 질문 유형에 따라 원인 설명·상상 확장·관점 비교 후보를 만드는 교육용 AI 응답 흐름
- 토큰화 → 참고할 단서 선택 → 다음 말 후보·확률 → 학생/AI 선택 비교 → 답변 완성
- 학생이 고른 후보에 따라 달라지는 교육용 답변 경로와 완료 후 재시작/다른 질문 이동
- 마우스/터치 버튼, Enter/Space 진행·선택, 방향키 목록 이동, Escape/이전 버튼 단계 이동
- 포커스 스타일, `aria-pressed`, `aria-live`, 모바일 레이아웃, `prefers-reduced-motion`
- 실제 AI 내부 계산이 아닌 교육용 모형임을 화면에 명시
- 고정된 작은 행렬로 임베딩·위치 정보·Q/K/V·두 개 Head·Causal Mask·Residual·Feed Forward·Logit·Softmax를 계산하는 결정적 교육용 Transformer 예제
- 토큰화 다음 단계에서 바로 이어지는 6단계 Transformer walkthrough와 Attention 표·막대, 다음 토큰 확률·선택 결과
- Transformer의 각 단계를 레고 블록·숫자 이름표·손전등·미래 가리개·탐정 같은 아주 쉬운 비유와 한 줄 공식으로 설명
- 토큰화 단계에서 아이가 글자 사이 경계를 눌러 직접 문장을 나누고, 자신이 만든 결과·아이 눈높이 낱말 단위·일반적인 AI subword 예시를 비교하는 체험
- Transformer 계산 예제의 확률을 기존 시나리오 후보 확률과 별도 레이어로 표시하고 실제 GPT 내부 생각이나 Chain of Thought가 아님을 명시
- Transformer 단계의 계산 결과 메모이제이션, 로컬 저장 데이터 4,096자 상한, 저장소 예외 시 체험을 계속하는 안전한 복원 처리
- `index.html`의 same-origin 중심 CSP·Referrer Policy와 unsafe DOM/code-execution sink 회귀 검사
- 질문·토큰·참고 대상·후보 확률·분기 결과를 화면과 분리한 타입 안전 데이터 구조
- 단계별 이전/다음 이동과 현재 선택 상태 유지
- 새로고침 뒤 현재 단계와 유효한 선택 상태를 로컬 저장소에서 복원
- `npm test`로 150개 시나리오의 데이터 구조·참조·확률과 저장 복원 회귀를 자동 검사
- `npm test`로 unsafe DOM/code-execution 패턴, CSP·저장 한도, Transformer 수치, 시나리오 데이터, 진행 상태를 자동 검사
- 모든 시나리오의 AI 토큰 비교 조각이 원문을 보존하는지도 자동 검사

## 아직 구현되지 않은 기능

- 교사용 콘텐츠 관리와 별도 콘텐츠 배포 방식

## 중요한 설계 결정

- 상세 결정은 `DECISIONS.md`에 기록한다.
- 화면 진행은 스크롤보다 단계 전환을 우선한다.
- 첫 버전은 외부 AI API 없이 교육용 모형 데이터로 원리를 설명한다.
- 질문 콘텐츠는 `src/data/questionBank.ts`에서 관리하고, `src/data/scenarios.ts`의 결정적 factory가 공통 체험 구조로 변환한다.

## 알려진 문제

- 질문 목록은 5개 카테고리와 유형별 10개 묶음으로 나뉘며, 한 화면에 유형별 10개만 보여 주어 150개 콘텐츠의 탐색성을 유지한다.
- 작은 화면의 결과 화면은 한 장면 안에서 정보가 세로로 배치되므로 필요할 때 자연스러운 세로 스크롤이 생긴다. 가로 넘침은 없다.
- Transformer 계산 예제는 현재 활성 질문에 맞춘 고정 수치·작은 어휘의 한 블록 모형이다. 실제 GPT의 가중치·출력·내부 생각을 재현하지 않으며, 후보의 첫 토큰 연결도 학습 흐름을 설명하기 위한 시각적 연결이다.
- 문장 끊기 비교의 `일반적인 AI 토큰화 예시`도 특정 모델의 실제 tokenizer를 의미하지 않는다. 모델·언어·어휘에 따라 결과가 달라질 수 있는 subword 예시다.
- 150개 질문의 후보 답변은 외부 AI가 생성한 사실 답변이 아니라, 질문 유형별로 AI가 답변 방향을 고르는 과정을 보여 주는 교육용 문장이다. 사실형 질문은 최종 답변 전에 근거를 다시 확인하도록 안내한다.
- `index.html`의 CSP는 정적 HTML에서 적용되는 기본 방어선이다. 실제 배포 시에는 호스팅 환경에서도 CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors` 같은 HTTP 응답 헤더를 함께 설정해야 한다.

## 다음 개발 단계

1. 150개 질문의 문장별 과학·생활 설명을 교정하고, 필요한 질문에는 더 구체적인 교육용 후보를 보강한다.
2. 카테고리별 질문 탐색성과 난이도 균형을 실제 수업 맥락에서 점검한다.
3. 필요할 때 교사용 콘텐츠 관리와 배포 방식을 별도 범위로 설계한다.
