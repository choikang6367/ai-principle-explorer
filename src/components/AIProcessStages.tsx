import type { Category, AnswerCheck, GeneratedAnswer, PredictionCandidate, Scenario } from '../types/experience'
import { ScenarioActions, ScenarioHeading, ScenarioTopline } from './ScenarioStages'

interface ProcessStageProps {
  category: Category
  scenario: Scenario
  onBack: () => void
}

export function LearningStage({ category, scenario, onBack, onNext }: ProcessStageProps & { onNext: () => void }) {
  return (
    <section className="scenario-stage ai-learning-stage stage-enter" aria-labelledby="learning-title">
      <ScenarioTopline label="다섯 번째 장면 / AI가 미리 배우기" current={4} />
      <ScenarioHeading
        category={category}
        kicker="MODEL TRAINING"
        id="learning-title"
        title={<>AI는 먼저<br /></>}
        accent="예시를 보며 배워요."
        description={<>AI가 질문을 받기 전에는 많은 문장을 보며 연습해요.<br />사람의 도움을 받아 더 유용하고 안전한 답을 고르는 법도 배워요.</>}
      />
      <div className="simulation-layout">
        <article className="learning-card model-learning-board">
          <div className="learning-card__topline">
            <span>LEARN → CHECK → ADJUST</span>
            <span>BEFORE YOUR QUESTION</span>
          </div>
          <div className="model-learning-sequence" aria-label="AI가 미리 배우는 순서">
            <article className="model-learning-step">
              <span>01</span>
              <strong>많이 읽어요</strong>
              <p>여러 분야의 문장을 보며 말들이 어떻게 이어지는지 살펴봐요.</p>
            </article>
            <article className="model-learning-step">
              <span>02</span>
              <strong>다음 말을 맞혀 봐요</strong>
              <p>문장을 잠깐 멈추고, 다음에 올 말을 예상해 봐요.</p>
            </article>
            <article className="model-learning-step">
              <span>03</span>
              <strong>숫자를 조금 바꿔요</strong>
              <p>예상과 실제 답이 다르면 안쪽 숫자를 조절하며 다시 연습해요.</p>
            </article>
          </div>
          <div className="model-learning-loop" role="img" aria-label="예시 문장을 보고 다음 말을 예상한 뒤 숫자를 조절하는 순환">
            <span>예시 문장</span>
            <b aria-hidden="true">→</b>
            <span>다음 말 예상</span>
            <b aria-hidden="true">→</b>
            <span>답과 비교</span>
            <b aria-hidden="true">→</b>
            <span>숫자 조절</span>
          </div>
          <div className="model-learning-example">
            <span className="learning-card__explanation-label">이번 질문에 쓰일 준비</span>
            <strong>{scenario.question}</strong>
            <p>이 질문 하나로 AI가 새로 공부하는 것이 아니라, 이미 배운 숫자를 사용해 답을 만들어 보기로 해요.</p>
          </div>
          <div className="model-learning-footnote">
            <span>사람의 도움</span>
            <p>사람이 “도움이 되고 안전한 답”의 예시를 알려 주면 AI가 답변 태도도 한 번 더 다듬을 수 있어요. 이 화면은 그 학습 아이디어를 쉽게 그려 본 거예요.</p>
          </div>
        </article>
        <aside className="info-card model-learning-info">
          <span className="info-card__number">01</span>
          <p className="info-card__label">미리 배우기</p>
          <h2>AI도 먼저<br /><span>연습이 필요해요.</span></h2>
          <p className="info-card__description">
            지금부터 보는 과정은 ‘시험을 보는 시간’이에요. AI는 이때 배운 숫자를 이용해 질문을 읽고 답을 만들어요.
          </p>
          <div className="info-card__badge">학습이 끝나면, 다음 장면에서 질문을 작은 조각으로 나눠요.</div>
        </aside>
      </div>
      <ScenarioActions
        backLabel="직접 물어보기로 돌아가기"
        nextLabel="질문을 작은 조각으로"
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

export function GenerationStage({
  category,
  scenario,
  candidate,
  answer,
  onBack,
  onNext,
}: ProcessStageProps & {
  candidate: PredictionCandidate
  answer: GeneratedAnswer
  onNext: () => void
}) {
  const visibleSteps = answer.steps.slice(0, 8)
  const hiddenStepCount = Math.max(0, answer.steps.length - visibleSteps.length)
  const previewTokenCount = Math.min(visibleSteps.length, answer.tokens.length)
  const previewText = answer.tokens.slice(0, previewTokenCount).join(' ')
  const previewSuffix = previewTokenCount < answer.tokens.length ? ' …' : ''

  return (
    <section className="scenario-stage answer-generation-stage stage-enter" aria-labelledby="generation-title">
      <ScenarioTopline label="열 번째 장면 / 한 조각씩 생성하기" current={9} />
      <ScenarioHeading
        category={category}
        kicker="AUTOREGRESSIVE GENERATION"
        id="generation-title"
        title={<>답변을<br /></>}
        accent="한 조각씩 만들어요."
        description={<>AI는 문장 전체를 한 번에 꺼내지 않아요.<br />다음 조각을 고르고, 그 조각을 뒤에 붙인 뒤 다시 계산해요.</>}
      />
      <div className="simulation-layout">
        <article className="learning-card generation-board">
          <div className="learning-card__topline">
            <span>ONE TOKEN AT A TIME</span>
            <span>{answer.tokens.length}번 계산 · {answer.stopReason === 'answer-complete' ? '끝까지 도착' : '길이 제한'}</span>
          </div>
          <div className="generation-answer-preview" aria-live="polite">
            <span className="learning-card__explanation-label">지금까지 이어진 답변</span>
            <small className="generation-question">질문: {scenario.question}</small>
            <p>{previewText}{previewSuffix}</p>
            <small className="generation-preview-note">{previewTokenCount}개 조각까지 화면에 펼쳐 보였어요.</small>
          </div>
          <div className="generation-loop-explanation">
            <strong>고르기 → 뒤에 붙이기 → 다시 보기</strong>
            <span>이 작은 반복을 답변이 끝날 때까지 이어 가요.</span>
          </div>
          <div className="generation-step-list" aria-label="답변 조각을 생성하는 반복 과정">
            {visibleSteps.map((step) => (
              <article className="generation-step" key={`${candidate.id}-${step.index}`}>
                <span className="generation-step__number">{String(step.index + 1).padStart(2, '0')}</span>
                <div className="generation-step__main">
                  <div className="generation-step__topline">
                    <span>앞에서 본 조각 {step.contextLength}개</span>
                    <strong>+ {step.selectedToken}</strong>
                  </div>
                  <div className="generation-step__options">
                    {step.options.map((option) => (
                      <span className={option.text === step.selectedToken ? 'is-selected' : ''} key={option.id}>
                        {option.text} <small>{option.probability}%</small>
                      </span>
                    ))}
                  </div>
                  <p>{step.selectionLabel}</p>
                </div>
              </article>
            ))}
          </div>
          {hiddenStepCount > 0 ? (
            <p className="generation-more-note">같은 방식으로 {hiddenStepCount}개 조각을 더 이어서 답변을 완성했어요.</p>
          ) : null}
          <div className="generation-policy">
            <div>
              <span className="learning-card__explanation-label">이번 모형의 선택 방법</span>
              <strong>가장 높은 후보 고르기</strong>
            </div>
            <p>{answer.stopReason === 'answer-complete'
              ? '이번 답변은 준비한 문장 끝에 도착해서 멈췄어요. 실제 AI도 끝 표시를 만나거나 정한 길이에 도달하면 생성을 멈춰요.'
              : '정한 길이에 도달해 생성을 멈췄어요. 실제 AI도 끝 표시를 만나거나 정한 길이에 도달하면 멈춰요.'} 고른 답변 경로의 재료를 한 조각씩 보여 주는 교육용 모형이에요. 실제 AI는 매번 전체 말 목록을 다시 계산하고, 상위 몇 개나 온도를 조절해 다른 선택을 할 수도 있어요.</p>
          </div>
        </article>
        <aside className="info-card generation-info">
          <span className="info-card__number">03</span>
          <p className="info-card__label">반복 생성</p>
          <h2>한 단어가<br /><span>다음 단어를 불러요.</span></h2>
          <p className="info-card__description">
            고른 조각이 새로운 앞부분이 되기 때문에, 다음 조각을 고를 때마다 지금까지의 답변도 함께 참고해요.
          </p>
          <div className="info-card__badge">끝났다는 표시를 만나거나 정한 길이에 도달하면 생성을 멈춰요.</div>
        </aside>
      </div>
      <ScenarioActions
        backLabel="다음 말 다시 고르기"
        nextLabel="답변 안전성·근거 검사"
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

export function ReviewStage({
  category,
  scenario,
  candidate,
  answer,
  checks,
  onBack,
  onNext,
}: ProcessStageProps & {
  candidate: PredictionCandidate
  answer: GeneratedAnswer
  checks: readonly AnswerCheck[]
  onNext: () => void
}) {
  const hasReviewItem = checks.some((check) => check.status === 'needs-review')

  return (
    <section className="scenario-stage answer-review-stage stage-enter" aria-labelledby="review-title">
      <ScenarioTopline label="열한 번째 장면 / 답변 검사" current={10} />
      <ScenarioHeading
        category={category}
        kicker="CHECK BEFORE SHARING"
        id="review-title"
        title={<>답변을<br /></>}
        accent="그대로 믿어도 될까?"
        description={<>AI가 만든 답변은 완성 직전에 한 번 더 살펴봐야 해요.<br />안전한지, 질문에 맞는지, 근거가 필요한지 확인해 볼게요.</>}
      />
      <div className="review-layout">
        <article className="learning-card review-board">
          <div className="learning-card__topline">
            <span>OUTPUT REVIEW</span>
            <span>{hasReviewItem ? 'CHECK NEEDED' : 'READY'}</span>
          </div>
          <div className="review-answer-box">
            <span className="learning-card__explanation-label">검사할 답변</span>
            <small className="review-question">질문: {scenario.question}</small>
            <strong>{candidate.text}</strong>
            <p>{answer.text}</p>
          </div>
          <div className="review-check-list" aria-label="답변 검사 결과">
            {checks.map((check) => (
              <article className={`review-check review-check--${check.status}`} key={check.id}>
                <span className="review-check__mark" aria-hidden="true">{check.status === 'pass' ? '✓' : '?'}</span>
                <div>
                  <div className="review-check__topline">
                    <strong>{check.label}</strong>
                    <span>{check.status === 'pass' ? '확인됨' : '한 번 더 확인'}</span>
                  </div>
                  <p>{check.explanation}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="review-aftercare">
            <span className="learning-card__explanation-label">출력 후 정리</span>
            <p>앞뒤 빈칸과 겹치는 빈칸을 정리하고, 답변이 끝났는지 확인한 뒤 사람에게 보여 줘요.</p>
          </div>
        </article>
        <aside className="info-card review-info">
          <span className="info-card__number">04</span>
          <p className="info-card__label">검사와 근거 확인</p>
          <h2>AI의 답도<br /><span>확인하고 써요.</span></h2>
          <p className="info-card__description">
            AI는 그럴듯한 문장을 만들 수 있지만, 언제나 맞는 것은 아니에요. 특히 사실을 묻는 질문은 믿을 만한 자료와 비교해야 해요.
          </p>
          <div className="info-card__badge">검사를 통과했다는 말은 ‘사용할 준비’라는 뜻이지, 사실 정답 보증이 아니에요.</div>
        </aside>
      </div>
      <ScenarioActions
        backLabel="생성 과정 다시 보기"
        nextLabel="나의 선택과 비교하기"
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}
