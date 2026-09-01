# 현재까지 완료

- React + TypeScript + Vite 기반의 단계형 AI 원리 탐험 홈페이지를 구현했다.
- 시작 화면 → AI 사용법 → 주제 → 완성된 질문 → 직접 물어보기 → 미리 배우기 → 토큰화 → Transformer → 참고하기 → 예측 → 생성 → 검사 → 비교 → 완성 흐름으로 확장했다.
- 주제는 동물·사람·일상·과학·학교 5개이며, 각 주제에 30개씩 총 150개 질문을 연결했다.
- 각 주제는 지식형·상상형·선택·의견형 질문을 10개씩 제공하며, 질문 화면의 유형 필터로 한 번에 10개를 탐색한다.
- `src/data/questionBank.ts`의 질문 원문을 `src/data/scenarios.ts`가 공통 토큰·참고 단서·후보·결과 구조로 결정적으로 변환한다.
- 지식형은 원인·과정·결과, 상상형은 장면·가능성·조건, 선택·의견형은 상황·장단점·기준을 후보로 보여 준다.
- 외부 생성형 AI API나 난수는 사용하지 않으며, 실제 AI 내부 생각이 아닌 교육용 시뮬레이션임을 화면에 명시한다.
- 토큰화 단계의 직접 문장 끊기, AI 토큰화 비교, Transformer 계산 walkthrough, 후보 확률 비교, 반복 생성, 안전·근거 검사, 저장 진행 복원을 연결했다.
- 사용자가 만든 토큰 묶음과 Attention 선택이 실제 교육용 Transformer 계산과 후보 확률에 반영되도록 했다.
- 답변은 후보의 교육용 재료를 한 조각씩 다시 계산해 이어 붙이며, 끝 표시·길이 제한으로 멈추는 과정을 보여 준다.
- 입문 화면에서 생성형 AI의 질문 입력 → 답변 출력 채팅 예시를 보여 주고, 선택한 완성 질문을 실제 입력창에서 직접 보내야 원리 탐험이 열린다.
- `npm test`가 안전성·Transformer 수치·150개 시나리오·진행 상태를 검사하고, `npm run build`가 타입 검사와 프로덕션 번들을 검사한다.

# 이번 작업에서 수정한 주요 파일

- `src/data/questionBank.ts`
- `src/data/scenarios.ts`
- `src/data/categories.ts`
- `src/types/experience.ts`
- `src/App.tsx`
- `src/components/AIProcessStages.tsx`
- `src/components/ScenarioStages.tsx`
- `src/components/TransformerDetails.tsx`
- `src/components/StageProgress.tsx`
- `src/components/TokenSplitPractice.tsx`
- `src/transformer/engine.ts`
- `src/transformer/generation.ts`
- `src/components/CategoryGlyph.tsx`
- `src/styles.css`
- `src/data/progress.ts`
- `scripts/validate-scenarios.mjs`
- `scripts/validate-progress.mjs`
- `scripts/validate-transformer.mjs`
- `README.md`
- `PROJECT_STATE.md`
- `DECISIONS.md`

# 다음 작업

1. 150개 질문의 문장별 과학·생활 설명을 교정하고, 필요한 질문에는 더 구체적인 교육용 후보를 보강한다.
2. 실제 수업 맥락에서 유형 필터의 탐색성과 카테고리별 난이도 균형을 점검한다.
3. 실제 모델/API 연결이 필요해질 때 서버·비용·개인정보·안전 필터·근거 검색을 별도 범위로 설계한다.
4. 교사용 콘텐츠 관리와 별도 콘텐츠 배포가 필요해질 때 별도 범위로 설계한다.

# 주의할 점

- 질문 데이터는 `src/data/questionBank.ts`에서 관리하고, 화면 컴포넌트에 질문을 직접 추가하지 않는다.
- `src/data/scenarios.ts`의 후보 답변은 사실을 자동으로 보증하는 답이 아니라, 질문 유형에 따른 답변 방향을 보여 주는 교육용 문장이다.
- Transformer 수치와 AI 토큰화 예시는 특정 상용 모델의 실제 내부 계산이나 tokenizer 결과가 아니다.
- 진행 상태 버전은 5이며, 기존 저장 데이터가 새 입문 흐름을 건너뛰지 않도록 새 버전에서 복원 기준을 갱신했다.

# 검증 결과

- `npm test`: 통과 — 안전성, Transformer 정규화·Attention 연결·생성 반복, 150개 시나리오, 저장 복원 검증.
- `npm run build`: 통과 — TypeScript 타입 검사 및 Vite 프로덕션 빌드.
- 브라우저: 5개 주제 노출, 유형별 10개 질문 표시, 상상형 흐름의 토큰화 단계, 브라우저 콘솔 error/warn 없음 확인.
- 390px 모바일: 질문 유형 필터와 질문 카드 10개 표시, `innerWidth/documentWidth/bodyWidth = 390/390/390` 확인.
