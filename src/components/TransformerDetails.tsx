import { type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import type { Scenario } from '../types/experience'
import type { TransformerCalculation, TransformerVector } from '../transformer/engine'

const STEP_TITLES = [
  '문장을 작은 조각으로',
  '조각마다 숫자 붙이기',
  '중요한 말 찾아보기',
  '뒤의 말은 가려 두기',
  '여러 방법으로 살펴보기',
  '다음 말 고르기',
] as const

const STEP_GUIDES = [
  {
    label: '1. 레고 블록',
    title: '문장을 작은 조각으로 나눠요.',
    description: 'AI는 긴 문장 전체를 한 번에 보지 않고, 가지고 놀기 쉬운 레고 블록처럼 작은 말 조각으로 나눠요.',
    formula: '문장 → 작은 말 조각',
  },
  {
    label: '2. 숫자 이름표',
    title: '각 조각에 숫자 이름표를 붙여요.',
    description: '컴퓨터는 글자를 그대로 계산하기 어려워요. 각 조각의 뜻과 문장 속 자리를 작은 숫자로 바꿔 기억해요.',
    formula: '말 조각 + 자리 → 숫자 이름표',
  },
  {
    label: '3. 손전등',
    title: '지금 필요한 앞부분을 비춰 봐요.',
    description: '마지막 조각이 답을 만들 때 도움이 되는 앞 조각을 손전등처럼 찾아봐요. Q·K·V라는 세 가지 숫자표를 사용해요.',
    formula: '찾기표(Q) + 단서표(K) + 내용표(V)',
  },
  {
    label: '4. 미래 가리개',
    title: '아직 안 나온 말은 미리 못 봐요.',
    description: '다음 말을 고르기 전에 정답을 훔쳐보면 안 되니까, 뒤에 있는 조각에는 가리개를 씌워요.',
    formula: '앞에 나온 말은 볼 수 있음 / 뒤의 말은 미리 가림',
  },
  {
    label: '5. 여러 탐정',
    title: '서로 다른 단서를 보고 결과를 합쳐요.',
    description: '여러 명의 탐정이 각자 다른 단서를 살펴보고, 그 결과를 합친 뒤 원래 정보와 함께 한 번 더 정리해요.',
    formula: '여러 관찰 결과 → 하나의 정리된 결과',
  },
  {
    label: '6. 다음 조각',
    title: '가장 그럴듯한 다음 조각을 골라요.',
    description: '마지막까지 정리한 뒤, 다음에 올 수 있는 말마다 가능성을 붙여요. 이 작은 예제에서는 가장 높은 하나를 골라요.',
    formula: '다음 말 후보 → 가능성 비교 → 하나 고르기',
  },
] as const

function formatNumber(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.00'
}

function formatVector(vector: TransformerVector | undefined) {
  return `[${(vector ?? []).map((value) => formatNumber(value)).join(', ')}]`
}

function formatPercent(value: number) {
  return `${formatNumber(value * 100, 1)}%`
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value * 100))
}

function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Space') {
    event.preventDefault()
    action()
  }
}

function VectorLine({ label, vector }: { label: string; vector: TransformerVector | undefined }) {
  return (
    <div className="transformer-vector-line">
      <span>{label}</span>
      <code>{formatVector(vector)}</code>
    </div>
  )
}

function AttentionBars({ result, headIndex }: { result: TransformerCalculation; headIndex: number }) {
  const head = result.heads[headIndex]
  const lastIndex = result.tokens.length - 1
  const probabilities = head?.attentionProbabilities[lastIndex] ?? []

  return (
    <div className="transformer-attention-bars" aria-label={`살펴보기 방법 ${headIndex + 1}에서 마지막 조각이 참고한 결과`}>
      {result.tokens.map((token, index) => {
        const probability = probabilities[index] ?? 0
        return (
          <div className="transformer-attention-bar" key={`${headIndex}-${token}-${index}`}>
            <div className="transformer-attention-bar__topline">
              <span>{token}</span>
              <strong>{formatPercent(probability)}</strong>
            </div>
            <span className="transformer-attention-bar__track" aria-hidden="true">
              <span style={{ '--transformer-width': `${clampPercent(probability)}%` } as CSSProperties} />
            </span>
            <span className="transformer-attention-bar__score">
              참고한 정도 {formatPercent(probability)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function CausalMaskTable({ result }: { result: TransformerCalculation }) {
  const head = result.heads[0]
  const mask = head?.causalMask ?? []
  const probabilities = head?.attentionProbabilities ?? []

  return (
    <div className="transformer-table-wrap">
      <table className="transformer-mask-table">
        <caption>첫 번째 살펴보기 방법에서 볼 수 있는 자리</caption>
        <thead>
          <tr>
            <th scope="col">지금 보는 말 ↓ / 살펴볼 말 →</th>
            {result.tokens.map((token, index) => (
              <th scope="col" key={`mask-heading-${index}`}>{token}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.tokens.map((token, rowIndex) => (
            <tr key={`mask-row-${rowIndex}`}>
              <th scope="row">{token}</th>
              {result.tokens.map((_, columnIndex) => {
                const allowed = mask[rowIndex]?.[columnIndex] ?? false
                const probability = probabilities[rowIndex]?.[columnIndex] ?? 0
                return (
                  <td className={allowed ? 'is-allowed' : 'is-masked'} key={`mask-cell-${rowIndex}-${columnIndex}`}>
                    <span>{allowed ? '볼 수 있음' : '미리 가림'}</span>
                    <small>{formatPercent(probability)}</small>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StepOne({ result }: { result: TransformerCalculation }) {
  return (
    <>
      <p className="transformer-step__intro">
        AI가 글을 계산할 수 있도록 각 말 조각을 숫자표로 바꿔요. 조각의 뜻을 나타내는 숫자와 문장 속 자리를 나타내는 숫자를 더해요.
      </p>
      <div className="transformer-embedding-list">
        {result.tokens.map((token, index) => (
          <article className="transformer-embedding-card" key={`${token}-${index}`}>
            <div className="transformer-embedding-card__heading">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{token}</strong>
            </div>
            <VectorLine label="뜻 숫자표" vector={result.tokenEmbeddings[index]} />
            <VectorLine label="자리 숫자표" vector={result.positionEmbeddings[index]} />
            <VectorLine label="두 표를 더한 결과" vector={result.positionAddedEmbeddings[index]} />
          </article>
        ))}
      </div>
    </>
  )
}

function StepTwo({ result }: { result: TransformerCalculation }) {
  const lastIndex = result.tokens.length - 1
  const roles = [
    { label: 'Q · 찾기표', title: '무엇을 찾을까?', description: '지금 보고 있는 조각이 앞에서 찾고 싶은 단서를 적어 둔 표예요.' },
    { label: 'K · 단서표', title: '어디에 단서가 있을까?', description: '각 조각이 어떤 정보와 이어지는지 알려 주는 표예요.' },
    { label: 'V · 내용표', title: '무슨 내용을 가져올까?', description: '고른 조각에서 실제로 가져와 섞을 내용을 담은 표예요.' },
  ]

  return (
    <>
      <p className="transformer-step__intro">
        마지막 조각이 앞의 조각을 살펴볼 때 세 가지 메모를 만들어요. 무엇을 찾을지(Q), 어디에 단서가 있는지(K), 어떤 내용을 가져올지(V)를 적는 거예요. 아래 숫자는 이 메모를 작게 만든 예시예요.
      </p>
      <div className="transformer-role-grid">
        {roles.map((role) => (
          <article className="transformer-role-card" key={role.label}>
            <span>{role.label}</span>
            <strong>{role.title}</strong>
            <p>{role.description}</p>
          </article>
        ))}
      </div>
      <div className="transformer-head-grid transformer-head-grid--vectors">
        {result.heads.map((head) => (
          <article className="transformer-head-card" key={head.index}>
            <h3>살펴보기 방법 {head.index + 1}</h3>
            <VectorLine label="찾기표 Q" vector={head.queries[lastIndex]} />
            <VectorLine label="단서표 K" vector={head.keys[lastIndex]} />
            <VectorLine label="내용표 V" vector={head.values[lastIndex]} />
          </article>
        ))}
      </div>
    </>
  )
}

function StepThree({ result }: { result: TransformerCalculation }) {
  return (
    <>
      <p className="transformer-step__intro">
        이제 마지막 조각이 앞의 조각을 얼마나 참고할지 정해요. 막대가 길수록 그 조각의 도움을 더 많이 받는다는 뜻이에요.
      </p>
      <div className="transformer-head-grid">
        {result.heads.map((head) => (
          <article className="transformer-head-card" key={head.index}>
            <h3>살펴보기 방법 {head.index + 1}</h3>
            <AttentionBars result={result} headIndex={head.index} />
          </article>
        ))}
      </div>
      <p className="transformer-caution">
        막대는 실제 AI가 무엇을 중요하게 생각했는지를 보여 주는 것이 아니에요. 원리를 연습하려고 만든 작은 숫자 예시예요.
      </p>
    </>
  )
}

function StepFour({ result }: { result: TransformerCalculation }) {
  const lastIndex = result.tokens.length - 1
  const lastRow = result.heads[0]?.attentionProbabilities[lastIndex] ?? []

  return (
    <>
      <p className="transformer-step__intro">
        뒤에 있는 말을 미리 보면 공평하지 않겠죠? 그래서 AI는 아직 나오지 않은 말 자리를 가려요. ‘볼 수 있음’은 참고할 수 있는 자리, ‘미리 가림’은 지금 보지 않는 자리예요.
      </p>
      <CausalMaskTable result={result} />
      <div className="transformer-callout">
        <strong>마지막 조각이 참고한 정도</strong>
        <span>{lastRow.map((probability, index) => `${result.tokens[index]} ${formatPercent(probability)}`).join(' · ')}</span>
      </div>
      <p className="transformer-caution">
        마지막 조각보다 뒤의 말은 아직 나오지 않았으니 참고한 정도가 0이에요. 이렇게 해야 다음 말을 고를 때 정답을 미리 보지 않아요.
      </p>
    </>
  )
}

function StepFive({ result }: { result: TransformerCalculation }) {
  const lastIndex = result.tokens.length - 1

  return (
    <>
      <p className="transformer-step__intro">
        여러 방법으로 살펴본 결과를 한데 모아요. 원래 정보도 잃지 않도록 함께 남기고, 마지막으로 한 번 더 정리해요. 아래 숫자는 정보를 정리하는 모습을 아주 작게 보여 줘요.
      </p>
      <div className="transformer-head-grid">
        {result.heads.map((head) => (
          <article className="transformer-head-card" key={head.index}>
            <h3>살펴보기 방법 {head.index + 1} 결과</h3>
            <VectorLine label="모아 본 정보" vector={head.context[lastIndex]} />
          </article>
        ))}
      </div>
      <div className="transformer-calculation-stack">
        <VectorLine label="두 결과를 한데 모으기" vector={result.concatenatedHeadResults[lastIndex]} />
        <VectorLine label="참고한 결과" vector={result.attentionOutput[lastIndex]} />
        <VectorLine label="원래 정보와 합치기" vector={result.residualAfterAttention[lastIndex]} />
        <VectorLine label="한 번 더 정리하기" vector={result.feedForwardOutput[lastIndex]} />
        <VectorLine label="다음 말을 고르기 전 모습" vector={result.residualOutput[lastIndex]} />
      </div>
    </>
  )
}

function StepSix({ result, scenario }: { result: TransformerCalculation; scenario: Scenario }) {
  const selectedCandidate = scenario.candidates.find((candidate) => candidate.id === result.selectedCandidateId)

  return (
    <>
      <p className="transformer-step__intro">
        마지막으로 정리한 숫자를 다음 말 후보들과 비교해요. 후보마다 ‘다음에 올 가능성’을 붙이고, 가장 높은 후보를 골라요.
      </p>
      <div className="transformer-probability-title">
        <span>다음 말이 될 가능성</span>
        <small>후보: {result.vocabulary.join(' · ')}</small>
      </div>
      <div className="transformer-probability-list" aria-label="다음 말 후보와 가능성">
        {result.nextTokenProbabilities.map((item) => (
          <div className={`transformer-probability-row ${item.token === result.selectedNextToken ? 'is-selected' : ''}`} key={item.token}>
            <div className="transformer-probability-row__topline">
              <strong>{item.token}</strong>
              <span>가능성 {formatPercent(item.probability)}</span>
            </div>
            <span className="transformer-probability-row__track" aria-hidden="true">
              <span style={{ '--transformer-width': `${clampPercent(item.probability)}%` } as CSSProperties} />
            </span>
            <span className="transformer-probability-row__meaning">
              {item.token === result.selectedNextToken ? '고른 다음 말' : '다음 말 후보'}
            </span>
          </div>
        ))}
      </div>
      <div className="transformer-selected-token" role="status" aria-live="polite">
        <span>고른 다음 말</span>
        <strong>{result.selectedNextToken}</strong>
        {selectedCandidate ? <small>이어지는 답변: {selectedCandidate.text}</small> : null}
      </div>
      <p className="transformer-caution">
        위 숫자는 원리를 보여 주려고 만든 교육용 예시예요. 실제 AI의 생각이나 정답 확률이 아니며, 다음 단계에서 비교할 후보 확률과도 달라요.
      </p>
    </>
  )
}

function getStepContent(step: number, result: TransformerCalculation, scenario: Scenario): ReactNode {
  switch (step) {
    case 0:
      return <StepOne result={result} />
    case 1:
      return <StepTwo result={result} />
    case 2:
      return <StepThree result={result} />
    case 3:
      return <StepFour result={result} />
    case 4:
      return <StepFive result={result} />
    default:
      return <StepSix result={result} scenario={scenario} />
  }
}

export function TransformerWalkthrough({
  result,
  scenario,
  step,
  onStepChange,
  onBack,
  onNext,
}: {
  result: TransformerCalculation
  scenario: Scenario
  step: number
  onStepChange: (step: number) => void
  onBack: () => void
  onNext: () => void
}) {
  const currentStep = Math.max(0, Math.min(STEP_TITLES.length - 1, step))
  const guide = STEP_GUIDES[currentStep]

  const handleStepKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Space') {
      event.preventDefault()
      onStepChange(index)
      return
    }

    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : 0

    if (direction !== 0) {
      event.preventDefault()
      onStepChange((index + direction + STEP_TITLES.length) % STEP_TITLES.length)
    }
  }

  return (
    <section className="transformer-walkthrough" aria-labelledby="transformer-walkthrough-title">
      <div className="transformer-walkthrough__topline">
        <div>
          <p className="transformer-walkthrough__eyebrow">TRANSFORMER / 어려운 말 없이 보기</p>
          <h2 id="transformer-walkthrough-title">문장을 읽고 다음 말을 고르는 방법</h2>
          <p className="transformer-walkthrough__description">
            Transformer는 영어 이름이 붙은 AI의 한 방법이에요. 여기서는 AI가 문장을 조각으로 나누고, 앞의 말을 살펴보고, 다음 말을 고르는 순서를 쉬운 비유로 따라가요.
          </p>
        </div>
        <span className="transformer-walkthrough__marker">{String(currentStep + 1).padStart(2, '0')} / {STEP_TITLES.length}</span>
      </div>
      <div className="transformer-walkthrough__summary">
        <span>한 줄로 이해하기</span>
        <strong>나누기 → 앞의 말 살펴보기 → 다음 말 고르기</strong>
      </div>
      <div className="transformer-step-tabs" role="tablist" aria-label="AI가 다음 말을 고르는 순서">
        {STEP_TITLES.map((title, index) => (
          <button
            className={`transformer-step-tab ${index === currentStep ? 'is-selected' : ''}`}
            type="button"
            role="tab"
            aria-selected={index === currentStep}
            aria-controls="transformer-step-panel"
            aria-label={`${index + 1}단계 ${title}`}
            id={`transformer-step-tab-${index}`}
            tabIndex={index === currentStep ? 0 : -1}
            key={title}
            onClick={() => onStepChange(index)}
            onKeyDown={(event) => handleStepKeyDown(event, index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{title}</strong>
          </button>
        ))}
      </div>
      <div
        id="transformer-step-panel"
        className="transformer-step"
        role="tabpanel"
        aria-labelledby={`transformer-step-tab-${currentStep}`}
        aria-live="polite"
      >
        <div className="transformer-step__heading">
          <span>순서 {String(currentStep + 1).padStart(2, '0')} / {STEP_TITLES.length}</span>
          <h3>{STEP_TITLES[currentStep]}</h3>
        </div>
        <div className="transformer-easy-guide">
          <span>{guide.label}</span>
          <strong>{guide.title}</strong>
          <p>{guide.description}</p>
          <div className="transformer-easy-guide__formula">
            <span>한 줄 공식</span>
            <strong>{guide.formula}</strong>
          </div>
        </div>
        {getStepContent(currentStep, result, scenario)}
      </div>
      <div className="transformer-walkthrough__actions">
        <button
          className="secondary-button"
          type="button"
          onKeyDown={(event) => handleButtonKeyDown(event, () => {
            if (currentStep === 0) {
              onBack()
            } else {
              onStepChange(currentStep - 1)
            }
          })}
          onClick={() => {
            if (currentStep === 0) {
              onBack()
            } else {
              onStepChange(currentStep - 1)
            }
          }}
        >
          <span aria-hidden="true">←</span>
          {currentStep === 0 ? '문장 나누기로' : '앞 단계'}
        </button>
        <span className="transformer-walkthrough__progress" aria-live="polite">{currentStep + 1} / {STEP_TITLES.length}</span>
        <button
          className="primary-button"
          type="button"
          onKeyDown={(event) => handleButtonKeyDown(event, () => {
            if (currentStep === STEP_TITLES.length - 1) {
              onNext()
            } else {
              onStepChange(currentStep + 1)
            }
          })}
          onClick={() => {
            if (currentStep === STEP_TITLES.length - 1) {
              onNext()
            } else {
              onStepChange(currentStep + 1)
            }
          }}
        >
          {currentStep === STEP_TITLES.length - 1 ? '앞의 말 살펴보기' : '다음 설명'}
          <span className="primary-button__arrow" aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  )
}
