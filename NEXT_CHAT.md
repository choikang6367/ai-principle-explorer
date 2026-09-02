# 현재까지 완료

- React + TypeScript + Vite 기반의 단계형 AI 원리 탐험 홈페이지를 구현했다.
- 시작 화면에서 글 생성 원리·이미지 인식 원리·이미지 생성 원리 중 하나를 고를 수 있으며, 기존 글 생성 흐름과 150개 질문·Transformer 교육용 계산은 유지한다.
- 이미지 인식 원리 체험을 현재 앱에 다시 연결했다: 공개 라이선스 사진 10장 선택 → 사진 보기 → 픽셀 RGB 숫자 → 특징 찾기 → 가능성 변화 → 사람과 AI의 결과 비교.
- 이미지 생성 원리 탐험을 10단계로 연결했다: 소개 → 프롬프트 → 의미 단서 → 숫자 지도 → 노이즈 → 여러 번 정리 → 잠재 공간 → 비교 → 검사 → 완료.
- 주인공·행동·장소·스타일·분위기 선택, 단서별 그림 영역 설명, 0~100 숫자 지도, 7개 로컬 SVG 노이즈 단계, 버튼·슬라이더 조작을 구현했다.
- 잠재 공간·디코더 비유, 장소·스타일·분위기 전후 비교, 6개 결과 검사 체크리스트, 완료 요약과 글 생성 모드 연결을 구현했다.
- 실제 이미지 생성 API·외부 이미지·난수 없이 결정적인 교육용 구성 그림을 사용한다. 화면의 단서 연결과 숫자·노이즈 그림은 실제 모델 내부 상태나 attention map이 아니다.
- 이미지 인식·생성 진행 상태를 저장 버전 7로 분리해 복원하고, 기존 글 답변 상태와 이전 이미지 인식 단계 ID의 안전한 마이그레이션을 유지한다.
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
- `src/data/imageExperiences.ts`
- `src/data/imageGeneration.ts`
- `src/components/ImageExperienceStages.tsx`
- `src/components/ImageGenerationStages.tsx`
- `scripts/validate-image-experiences.mjs`
- `scripts/validate-scenarios.mjs`
- `scripts/validate-image-generation.mjs`
- `scripts/validate-progress.mjs`
- `scripts/validate-transformer.mjs`
- `README.md`
- `PROJECT_STATE.md`
- `DECISIONS.md`

# 주의할 점

- 질문 데이터는 `src/data/questionBank.ts`에서 관리하고, 화면 컴포넌트에 질문을 직접 추가하지 않는다.
- `src/data/scenarios.ts`의 후보 답변은 사실을 자동으로 보증하는 답이 아니라, 질문 유형에 따른 답변 방향을 보여 주는 교육용 문장이다.
- Transformer 수치와 AI 토큰화 예시는 특정 상용 모델의 실제 내부 계산이나 tokenizer 결과가 아니다.
- 진행 상태 버전은 7이며, 글 답변 상태와 이미지 인식 선택·예상, 이미지 생성 선택·정리·검사 상태를 새로고침 후 복원한다. 기존 버전 5·6 저장 데이터는 안전하게 읽는다.

# 검증 결과

- `npm test`: 통과 — 안전성, Transformer 정규화·Attention 연결·생성 반복, 150개 시나리오, 이미지 인식 10개 사진 자산·좌표, 이미지 생성 데이터, 저장 복원 검증.
- `npm run build`: 통과 — TypeScript 타입 검사 및 Vite 프로덕션 빌드.
- 브라우저: 이미지 인식 5단계와 이미지 생성 흐름 전체 완주, 프롬프트 조합 3종, 장소·스타일·분위기 비교, 체크리스트·완료 저장 복원, 텍스트 모드 연결, Enter 키 이동 확인.
- 브라우저: 320px에서 홈·프롬프트·정리·검사·완료의 `scrollWidth === clientWidth` 확인. 주요 단계 캡처도 확인했다.

# 다음 작업

1. 이미지 생성 단계별 그림을 실제 수업에서 사용할 학생·교사에게 검토받고 문구를 다듬는다.
2. 필요하면 노이즈 단계 SVG를 선택한 주인공·장소·스타일과 더 직접적으로 연결하는 별도 교육 자료를 추가한다.
3. 실제 모델/API 연결은 개인정보, 비용, 근거, 안전 필터를 포함한 별도 범위로 설계한다.
