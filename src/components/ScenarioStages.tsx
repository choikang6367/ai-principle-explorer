import { useMemo, useState, type CSSProperties, type KeyboardEvent, type MutableRefObject, type ReactNode } from 'react'
import { StageProgress } from './StageProgress'
import { TokenSplitPractice } from './TokenSplitPractice'
import { TransformerWalkthrough } from './TransformerDetails'
import type { AttentionTarget, Category, InputToken, PredictionCandidate, Scenario } from '../types/experience'
import { runTransformer } from '../transformer/engine'

interface ScenarioStageProps {
  category: Category
  scenario: Scenario
  onBack: () => void
}

interface ScenarioActionProps {
  backLabel: string
  nextLabel: string
  nextDisabled?: boolean
  onBack: () => void
  onNext: () => void
}

function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

function ScenarioTopline({ label, current }: { label: string; current: number }) {
  return (
    <div className="stage-topline">
      <p className="eyebrow">
        <span className="eyebrow__marker" aria-hidden="true" />
        AI 원리 탐험 <span className="eyebrow__slash">/</span> {label}
      </p>
      <StageProgress current={current} />
    </div>
  )
}

function ScenarioActions({
  backLabel,
  nextLabel,
  nextDisabled = false,
  onBack,
  onNext,
}: ScenarioActionProps) {
  return (
    <div className="stage-actions scenario-stage-actions">
      <button
        className="back-button"
        type="button"
        onClick={onBack}
        onKeyDown={(event) => handleButtonKeyDown(event, onBack)}
      >
        <span aria-hidden="true">←</span>
        {backLabel}
      </button>
      <p className="keyboard-hint keyboard-hint--wide">
        <kbd>Esc</kbd>
        <span>이전</span>
        <span className="keyboard-hint__divider" aria-hidden="true" />
        <kbd>Enter</kbd>
        <span>다음 단계</span>
      </p>
      <button
        className="primary-button scenario-next-button"
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        onKeyDown={(event) => handleButtonKeyDown(event, onNext)}
      >
        {nextLabel}
        <span className="primary-button__arrow" aria-hidden="true">
          ↗
        </span>
      </button>
      <p className="stage-note">
        <span className="stage-note__mark" aria-hidden="true">i</span>
        실제 AI의 내부 생각이 아닌, 원리를 쉽게 보는 교육용 모형이에요.
      </p>
    </div>
  )
}

function ScenarioHeading({
  category,
  kicker,
  id,
  title,
  accent,
  description,
}: {
  category: Category
  kicker: string
  id: string
  title: ReactNode
  accent: string
  description: ReactNode
}) {
  return (
    <div className="scenario-stage__heading">
      <div>
        <p className="section-kicker">{category.label} / {kicker}</p>
        <h1 id={id}>
          {title}
          <span className="scenario-stage__accent">{accent}</span>
        </h1>
      </div>
      <p className="scenario-stage__description">{description}</p>
    </div>
  )
}

function TokenRow({ tokens, selectedTokenId }: { tokens: readonly InputToken[]; selectedTokenId?: string | null }) {
  return (
    <div className="token-row" aria-label="질문을 나눈 토큰">
      {tokens.map((token, index) => (
        <span
          className={`token-chip token-chip--${token.kind} ${token.id === selectedTokenId ? 'is-selected' : ''}`}
          key={token.id}
        >
          <span className="token-chip__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span>{token.text}</span>
        </span>
      ))}
    </div>
  )
}

export function TokenizeStage({ category, scenario, onBack, onNext }: ScenarioStageProps & { onNext: () => void }) {
  return (
    <section className="scenario-stage stage-enter" aria-labelledby="tokenize-title">
      <ScenarioTopline label="세 번째 장면 / 입력 나누기" current={1} />
      <ScenarioHeading
        category={category}
        kicker="TOKENIZATION"
        id="tokenize-title"
        title={<>질문을<br /></>}
        accent="작은 말로 나눠 봐요."
        description={<>먼저 AI가 질문을 읽기 쉬운 작은 단위로 나눠요.<br />이 체험에서는 낱말과 물음표를 하나씩 살펴볼게요.</>}
      />
      <div className="simulation-layout">
        <article className="learning-card tokenization-board">
          <div className="learning-card__topline">
            <span>INPUT → TOKENS</span>
            <span>01 / 03</span>
          </div>
          <div className="question-strip">
            <span className="question-strip__label">MY QUESTION</span>
            <p>{scenario.question}</p>
          </div>
          <TokenSplitPractice scenario={scenario} />
          <div className="learning-card__connector" aria-hidden="true">↓</div>
          <TokenRow tokens={scenario.tokens} />
          <div className="learning-card__divider" />
          <div className="learning-card__explanation">
            <span className="learning-card__explanation-label">WHAT HAPPENED?</span>
            <p>{scenario.tokenizationHint}</p>
          </div>
        </article>
        <aside className="info-card">
          <span className="info-card__number">01</span>
          <p className="info-card__label">입력 나누기</p>
          <h2>토큰은<br /><span>작은 단위</span>예요.</h2>
          <p className="info-card__description">
            AI는 질문 전체를 한 번에 삼키지 않고, 작은 조각으로 나누어 차례로 살펴봐요.
          </p>
          <div className="info-card__badge">다음 장면에서 AI가 다음 말을 고르는 과정을 살펴봐요.</div>
        </aside>
      </div>
      <ScenarioActions
        backLabel="질문 다시 고르기"
        nextLabel="다음 말 고르는 과정 보기"
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

export function TransformerStage({ category, scenario, onBack, onNext }: ScenarioStageProps & { onNext: () => void }) {
  const [step, setStep] = useState(0)
  const transformerResult = useMemo(
    () => runTransformer(scenario.tokens, scenario.candidates),
    [scenario.tokens, scenario.candidates],
  )

  return (
    <section className="scenario-stage stage-enter" aria-labelledby="transformer-title">
      <ScenarioTopline label="네 번째 장면 / 다음 말 고르기" current={2} />
      <ScenarioHeading
        category={category}
        kicker="다음 말 고르기"
        id="transformer-title"
        title={<>AI가 다음 말을<br /></>}
        accent="고르는 과정을 봐요."
        description={<>어려운 계산 이름 대신 레고 블록과 손전등 같은 비유로 살펴봐요.<br />AI가 앞의 말을 참고해 다음 말을 고르는 순서를 따라가 볼게요.</>}
      />
      <TransformerWalkthrough
        result={transformerResult}
        scenario={scenario}
        step={step}
        onStepChange={setStep}
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

function getAttentionChoices(scenario: Scenario) {
  return scenario.attentionTargets
    .map((target) => ({
      target,
      token: scenario.tokens.find((token) => token.id === target.tokenId),
    }))
    .filter((choice): choice is { target: AttentionTarget; token: InputToken } => Boolean(choice.token))
}

export function AttentionStage({
  category,
  scenario,
  selectedTokenId,
  attentionRefs,
  onSelectToken,
  onBack,
  onNext,
}: ScenarioStageProps & {
  selectedTokenId: string | null
  attentionRefs: MutableRefObject<Array<HTMLButtonElement | null>>
  onSelectToken: (tokenId: string) => void
  onNext: () => void
}) {
  const attentionChoices = getAttentionChoices(scenario)
  const selected = attentionChoices.find((choice) => choice.token.id === selectedTokenId)

  const moveFocus = (index: number, direction: 1 | -1) => {
    const nextIndex = (index + direction + attentionChoices.length) % attentionChoices.length
    attentionRefs.current[nextIndex]?.focus()
  }

  const handleChoiceKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number, tokenId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelectToken(tokenId)
      return
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocus(index, 1)
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(index, -1)
    }
  }

  return (
    <section className="scenario-stage stage-enter" aria-labelledby="attention-title">
      <ScenarioTopline label="다섯 번째 장면 / 참고하기" current={3} />
      <ScenarioHeading
        category={category}
        kicker="ATTENTION"
        id="attention-title"
        title={<>앞의 말을<br /></>}
        accent="골라서 참고해요."
        description={<>질문의 모든 말이 똑같이 중요한 것은 아니에요.<br />답을 만들 때 참고할 단서를 하나 골라 보세요.</>}
      />
      <div className="simulation-layout">
        <article className="learning-card attention-board">
          <div className="learning-card__topline">
            <span>FOCUS THE CONTEXT</span>
            <span>02 / 03</span>
          </div>
          <p className="board-prompt">{scenario.attentionHint}</p>
          <TokenRow tokens={scenario.tokens} selectedTokenId={selectedTokenId} />
          <div className="attention-choice-list" aria-label="참고할 단서 선택">
            {attentionChoices.map(({ token, target }, index) => (
              <button
                key={target.tokenId}
                ref={(element) => {
                  attentionRefs.current[index] = element
                }}
                className={`attention-choice ${token.id === selectedTokenId ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={token.id === selectedTokenId}
                aria-label={`${token.text}, ${target.label}, 참고 세기 ${Math.round(target.weight * 100)}%`}
                onClick={() => onSelectToken(token.id)}
                onKeyDown={(event) => handleChoiceKeyDown(event, index, token.id)}
              >
                <span className="attention-choice__token">{token.text}</span>
                <span className="attention-choice__body">
                  <span className="attention-choice__label">{target.label}</span>
                  <span>{target.explanation}</span>
                </span>
                <span className="attention-choice__weight" aria-hidden="true">
                  <span style={{ '--attention-width': `${Math.round(target.weight * 100)}%` } as CSSProperties} />
                </span>
                <span className="attention-choice__status" aria-hidden="true">
                  {token.id === selectedTokenId ? 'SELECTED' : 'CHOOSE'}
                </span>
              </button>
            ))}
          </div>
          <div className="attention-board__feedback" aria-live="polite">
            {selected ? (
              <>
                <span className="learning-card__explanation-label">지금 참고하는 단서</span>
                <strong>{selected.token.text} · {selected.target.label}</strong>
                <span>{selected.target.explanation}</span>
              </>
            ) : (
              <>
                <span className="learning-card__explanation-label">YOUR TURN</span>
                <span>아래 단서 중 하나를 골라 보세요.</span>
              </>
            )}
          </div>
        </article>
        <aside className={`selection-panel attention-preview-panel ${selected ? 'has-selection' : ''}`} aria-live="polite">
          <span className="info-card__number">02</span>
          <p className="selection-panel__label">교육용 참고 세기</p>
          {selected ? (
            <>
              <h2>{selected.token.text}</h2>
              <p className="selection-panel__description">{selected.target.explanation}</p>
              <div className="attention-meter">
                <div className="attention-meter__topline">
                  <span>{selected.target.label}</span>
                  <strong>{Math.round(selected.target.weight * 100)}%</strong>
                </div>
                <span className="attention-meter__track"><span style={{ width: `${Math.round(selected.target.weight * 100)}%` }} /></span>
              </div>
            </>
          ) : (
            <>
              <h2>어떤 말이<br /><span>도움이 될까요?</span></h2>
              <p className="selection-panel__empty-description">선택한 단서는 다음 말 후보를 살펴볼 때 참고해요.</p>
            </>
          )}
        </aside>
      </div>
      <ScenarioActions
        backLabel="앞의 순서로 돌아가기"
        nextLabel="다음 말 후보 보기"
        nextDisabled={!selected}
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

export function PredictionStage({
  category,
  scenario,
  selectedTokenId,
  selectedCandidateId,
  candidateRefs,
  onSelectCandidate,
  onBack,
  onNext,
}: ScenarioStageProps & {
  selectedTokenId: string | null
  selectedCandidateId: string | null
  candidateRefs: MutableRefObject<Array<HTMLButtonElement | null>>
  onSelectCandidate: (candidateId: string) => void
  onNext: () => void
}) {
  const selectedAttention = scenario.attentionTargets.find((target) => target.tokenId === selectedTokenId)
  const selectedToken = scenario.tokens.find((token) => token.id === selectedTokenId)
  const selectedCandidate = scenario.candidates.find((candidate) => candidate.id === selectedCandidateId)

  const moveFocus = (index: number, direction: 1 | -1) => {
    const nextIndex = (index + direction + scenario.candidates.length) % scenario.candidates.length
    candidateRefs.current[nextIndex]?.focus()
  }

  const handleCandidateKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number, candidateId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelectCandidate(candidateId)
      return
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocus(index, 1)
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(index, -1)
    }
  }

  return (
    <section className="scenario-stage stage-enter" aria-labelledby="prediction-title">
      <ScenarioTopline label="여섯 번째 장면 / 다음 말 예측" current={4} />
      <ScenarioHeading
        category={category}
        kicker="NEXT WORD"
        id="prediction-title"
        title={<>다음에 올 말을<br /></>}
        accent="골라 봐요."
        description={<>AI는 앞의 단서를 참고해 여러 후보를 만들어요.<br />이번에는 내가 먼저 후보 하나를 골라 볼게요.</>}
      />
      <div className="simulation-layout">
        <article className="learning-card prediction-board">
          <div className="learning-card__topline">
            <span>PREDICTION CANDIDATES</span>
            <span>03 / 03</span>
          </div>
          <div className="prediction-context">
            <span className="prediction-context__label">참고한 앞부분</span>
            <strong>{selectedToken?.text ?? '단서'} <span>·</span> {selectedAttention?.label ?? '선택한 단서'}</strong>
          </div>
          <p className="board-prompt">{scenario.predictionHint}</p>
          <div className="candidate-list" aria-label="다음 말 후보 선택">
            {scenario.candidates.map((candidate, index) => (
              <button
                key={candidate.id}
                ref={(element) => {
                  candidateRefs.current[index] = element
                }}
                className={`candidate-card ${candidate.id === selectedCandidateId ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={candidate.id === selectedCandidateId}
                aria-label={`${candidate.text}, 교육용 확률 ${candidate.probability}%`}
                onClick={() => onSelectCandidate(candidate.id)}
                onKeyDown={(event) => handleCandidateKeyDown(event, index, candidate.id)}
              >
                <span className="candidate-card__topline">
                  <span>후보 {String(index + 1).padStart(2, '0')}</span>
                  <span className="candidate-card__status" aria-hidden="true">
                    {candidate.id === selectedCandidateId ? 'MY PICK' : 'CHOOSE'}
                  </span>
                </span>
                <span className="candidate-card__text">{candidate.text}</span>
                <span className="candidate-card__probability">
                  <span className="candidate-card__probability-label">교육용 확률</span>
                  <strong>{candidate.probability}%</strong>
                  <span className="candidate-card__bar" aria-hidden="true">
                    <span style={{ '--candidate-width': `${candidate.probability}%` } as CSSProperties} />
                  </span>
                </span>
                <span className="candidate-card__explanation">{candidate.explanation}</span>
              </button>
            ))}
          </div>
        </article>
        <aside className={`selection-panel prediction-preview-panel ${selectedCandidate ? 'has-selection' : ''}`} aria-live="polite">
          <p className="selection-panel__label">나의 다음 말</p>
          {selectedCandidate ? (
            <>
              <h2>{selectedCandidate.text}</h2>
              <div className="prediction-preview-panel__probability">교육용 확률 <strong>{selectedCandidate.probability}%</strong></div>
              <p className="selection-panel__description">{selectedCandidate.explanation}</p>
            </>
          ) : (
            <>
              <span className="selection-panel__pulse" aria-hidden="true" />
              <h2>후보를 하나<br /><span>골라 보세요.</span></h2>
              <p className="selection-panel__empty-description">방향키로 이동하고 Enter로 선택할 수도 있어요.</p>
            </>
          )}
        </aside>
      </div>
      <ScenarioActions
        backLabel="참고할 부분 다시 고르기"
        nextLabel="AI의 선택과 비교하기"
        nextDisabled={!selectedCandidate}
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

export function CompareStage({
  category,
  studentCandidate,
  aiCandidate,
  onBack,
  onNext,
}: Pick<ScenarioStageProps, 'category' | 'onBack'> & {
  studentCandidate: PredictionCandidate
  aiCandidate: PredictionCandidate
  onNext: () => void
}) {
  const isMatch = studentCandidate.id === aiCandidate.id

  return (
    <section className="scenario-stage stage-enter" aria-labelledby="compare-title">
      <ScenarioTopline label="일곱 번째 장면 / 선택 비교" current={5} />
      <ScenarioHeading
        category={category}
        kicker="COMPARE"
        id="compare-title"
        title={<>나의 선택과<br /></>}
        accent="AI의 선택을 비교해요."
        description={<>AI가 가장 높은 확률의 후보를 골랐어요.<br />나의 선택과 답변 방향이 어떻게 다른지 살펴봐요.</>}
      />
      <div className={`comparison-banner ${isMatch ? 'is-match' : ''}`} role="status">
        <span className="comparison-banner__mark" aria-hidden="true">{isMatch ? '✓' : '↗'}</span>
        <strong>{isMatch ? 'AI와 같은 후보를 골랐어요.' : '선택에 따라 답변의 방향이 달라졌어요.'}</strong>
        <span>{isMatch ? '확률이 높은 후보와 내 생각이 만났어요.' : '둘 다 문맥에 맞는지 직접 확인해 볼 수 있어요.'}</span>
      </div>
      <div className="comparison-layout">
        <article className="compare-card compare-card--student">
          <div className="compare-card__topline">
            <span>YOUR PICK / 학생 선택</span>
            <span>{studentCandidate.probability}%</span>
          </div>
          <h2>{studentCandidate.text}</h2>
          <div className="compare-card__divider" />
          <p className="compare-card__label">이 후보로 이어진 결과</p>
          <h3>{studentCandidate.outcome.title}</h3>
          <p className="compare-card__explanation">{studentCandidate.outcome.explanation}</p>
          <div className="answer-preview">
            <span>답변 미리보기</span>
            <p>{studentCandidate.outcome.answer}</p>
          </div>
        </article>
        <div className="comparison-bridge" aria-hidden="true">
          <span>VS</span>
          <div />
        </div>
        <article className="compare-card compare-card--ai">
          <div className="compare-card__topline">
            <span>AI PICK / 교육용 모형</span>
            <span>{aiCandidate.probability}%</span>
          </div>
          <h2>{aiCandidate.text}</h2>
          <div className="compare-card__divider" />
          <p className="compare-card__label">AI 후보로 이어진 결과</p>
          <h3>{aiCandidate.outcome.title}</h3>
          <p className="compare-card__explanation">{aiCandidate.outcome.explanation}</p>
          <div className="answer-preview">
            <span>답변 미리보기</span>
            <p>{aiCandidate.outcome.answer}</p>
          </div>
        </article>
      </div>
      <ScenarioActions
        backLabel="다음 말 다시 고르기"
        nextLabel="답변 완성 보기"
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

export function CompleteStage({
  category,
  scenario,
  studentCandidate,
  aiCandidate,
  onBack,
  onOtherQuestion,
  onRestart,
}: ScenarioStageProps & {
  studentCandidate: PredictionCandidate
  aiCandidate: PredictionCandidate
  onOtherQuestion: () => void
  onRestart: () => void
}) {
  return (
    <section className="scenario-stage stage-enter" aria-labelledby="complete-title">
      <ScenarioTopline label="마지막 장면 / 답변 완성" current={6} />
      <ScenarioHeading
        category={category}
        kicker="COMPLETE"
        id="complete-title"
        title={<>이제 답변을<br /></>}
        accent="완성해 봐요."
        description={<>한 단어를 고르는 작은 선택이 답변의 방향을 만들었어요.<br />마지막으로 내가 고른 경로의 답을 읽어 볼게요.</>}
      />
      <div className="completion-layout">
        <article className="final-answer-card">
          <div className="final-answer-card__topline">
            <span>MY ANSWER PATH</span>
            <span>COMPLETE</span>
          </div>
          <p className="final-answer-card__question">{scenario.question}</p>
          <div className="final-answer-card__choice">
            <span>내가 고른 다음 말</span>
            <strong>{studentCandidate.text}</strong>
          </div>
          <div className="final-answer-card__divider" />
          <p className="final-answer-card__label">완성된 답변</p>
          <h2>{studentCandidate.outcome.title}</h2>
          <p className="final-answer-card__answer">{studentCandidate.outcome.answer}</p>
        </article>
        <aside className="completion-reflection">
          <span className="info-card__number">03</span>
          <p className="info-card__label">탐험 완료</p>
          <h2>AI는 답을<br /><span>한 번에 알지 않아요.</span></h2>
          <p className="info-card__description">
            입력을 나누고, 앞의 단서를 참고하고, 여러 후보 중 하나를 고르는 과정을 거쳐요.
          </p>
          <div className="completion-reflection__ai-choice">
            <span>AI가 고른 후보</span>
            <strong>{aiCandidate.text}</strong>
          </div>
          <p className="completion-reflection__hint">{scenario.completionHint}</p>
        </aside>
      </div>
      <div className="stage-actions completion-actions">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
          onKeyDown={(event) => handleButtonKeyDown(event, onBack)}
        >
          <span aria-hidden="true">←</span>
          비교 화면으로
        </button>
        <p className="stage-note">
          <span className="stage-note__mark" aria-hidden="true">i</span>
          이 결과는 실제 모델 답변이 아닌 교육용 시뮬레이션이에요.
        </p>
        <div className="completion-actions__buttons">
          <button
            className="secondary-button"
            type="button"
            onClick={onOtherQuestion}
            onKeyDown={(event) => handleButtonKeyDown(event, onOtherQuestion)}
          >
            다른 질문 고르기
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={onRestart}
            onKeyDown={(event) => handleButtonKeyDown(event, onRestart)}
          >
            처음부터 다시
            <span className="primary-button__arrow" aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </section>
  )
}
