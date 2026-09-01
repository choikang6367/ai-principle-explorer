import { useMemo, useState, type KeyboardEvent } from 'react'
import type { InputToken, Scenario, TokenizationComparison } from '../types/experience'

function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Space') {
    event.preventDefault()
    action()
  }
}

function groupUnits(units: readonly string[], breakPoints: ReadonlySet<number>) {
  const groups: string[] = []
  let currentGroup = ''

  units.forEach((unit, index) => {
    currentGroup += unit
    if (breakPoints.has(index + 1)) {
      groups.push(currentGroup)
      currentGroup = ''
    }
  })

  if (currentGroup) {
    groups.push(currentGroup)
  }

  return groups
}

function getBreakPoints(tokens: readonly InputToken[]) {
  let offset = 0
  return tokens.slice(0, -1).map((token) => {
    offset += Array.from(token.text).length
    return offset
  })
}

function createPracticeTokens(scenario: Scenario, groups: readonly string[]) {
  return groups.map((text, index) => ({
    id: `${scenario.id}-practice-token-${String(index + 1).padStart(2, '0')}`,
    text,
    kind: /^[?？.!！。]+$/u.test(text) ? 'punctuation' as const : 'word' as const,
  }))
}

function getComparison(scenario: Scenario): TokenizationComparison {
  return scenario.tokenizationComparison ?? {
    aiTokens: scenario.tokens.map((token) => token.text),
  }
}

export function TokenSplitPractice({
  scenario,
  initialTokens,
  onTokenizationChange,
}: {
  scenario: Scenario
  initialTokens?: readonly InputToken[]
  onTokenizationChange?: (tokens: readonly InputToken[]) => void
}) {
  const comparison = useMemo(() => getComparison(scenario), [scenario])
  const practiceUnits = useMemo(
    () => Array.from(scenario.tokens.map((token) => token.text).join('')),
    [scenario.tokens],
  )
  const friendlyTokens = useMemo(
    () => scenario.tokens.map((token) => token.text),
    [scenario.tokens],
  )
  const friendlyBreaks = useMemo(() => {
    let offset = 0
    return friendlyTokens.slice(0, -1).map((token) => {
      offset += Array.from(token).length
      return offset
    })
  }, [friendlyTokens])
  const [selectedBreaks, setSelectedBreaks] = useState<ReadonlySet<number>>(
    () => new Set(initialTokens ? getBreakPoints(initialTokens) : []),
  )
  const [showComparison, setShowComparison] = useState(false)
  const selectedGroups = groupUnits(practiceUnits, selectedBreaks)
  const matchesFriendlyShape = friendlyBreaks.length === selectedBreaks.size &&
    friendlyBreaks.every((breakPoint) => selectedBreaks.has(breakPoint))

  const toggleBreak = (breakPoint: number) => {
    const nextBreaks = new Set(selectedBreaks)
    if (nextBreaks.has(breakPoint)) {
      nextBreaks.delete(breakPoint)
    } else {
      nextBreaks.add(breakPoint)
    }
    setSelectedBreaks(nextBreaks)
    onTokenizationChange?.(createPracticeTokens(scenario, groupUnits(practiceUnits, nextBreaks)))
  }

  const resetPractice = () => {
    setSelectedBreaks(new Set())
    setShowComparison(false)
    onTokenizationChange?.(scenario.tokens)
  }

  return (
    <section className="token-practice" aria-labelledby="token-practice-title">
      <div className="token-practice__topline">
        <div>
          <span className="token-practice__eyebrow">YOUR TURN / 문장 끊기</span>
          <h3 id="token-practice-title">내가 먼저 끊어 볼까요?</h3>
        </div>
        <span className="token-practice__count" aria-live="polite">{selectedBreaks.size}곳</span>
      </div>
      <p className="token-practice__intro">
        글자 조각 사이의 점을 눌러, 읽기 좋은 작은 덩어리를 직접 만들어 보세요.
      </p>
      <div className="token-practice__sentence" role="group" aria-label="직접 끊어 볼 문장">
        {practiceUnits.map((unit, index) => {
          const breakPoint = index + 1
          const isLastUnit = index === practiceUnits.length - 1
          const isBreakSelected = selectedBreaks.has(breakPoint)

          return (
            <span className="token-practice__unit-group" key={`${unit}-${index}`}>
              <span className="token-practice__unit">{unit}</span>
              {!isLastUnit ? (
                <button
                  className={`token-practice__break ${isBreakSelected ? 'is-selected' : ''}`}
                  type="button"
                  aria-label={`${unit} 뒤에서 ${isBreakSelected ? '붙이기' : '끊기'}`}
                  aria-pressed={isBreakSelected}
                  onClick={() => toggleBreak(breakPoint)}
                  onKeyDown={(event) => handleButtonKeyDown(event, () => toggleBreak(breakPoint))}
                >
                  <span aria-hidden="true">{isBreakSelected ? '|' : '·'}</span>
                </button>
              ) : null}
            </span>
          )
        })}
      </div>
      <div className="token-practice__result" role="status" aria-live="polite">
        <span>내가 만든 조각</span>
        <strong>{selectedBreaks.size > 0 ? selectedGroups.join(' | ') : '아직 끊지 않았어요'}</strong>
        <small>정답 하나를 맞히는 활동이 아니라, AI가 문장을 나누는 방법을 느껴 보는 활동이에요. 선택한 조각은 다음 계산에 사용돼요.</small>
      </div>
      <div className="token-practice__actions">
        <button
          className="token-practice__reset"
          type="button"
          onClick={resetPractice}
          onKeyDown={(event) => handleButtonKeyDown(event, resetPractice)}
        >
          다시 해보기
        </button>
        <button
          className="token-practice__compare"
          type="button"
          disabled={selectedBreaks.size === 0}
          onClick={() => setShowComparison(true)}
          onKeyDown={(event) => handleButtonKeyDown(event, () => setShowComparison(true))}
        >
          AI 방식과 비교하기 <span aria-hidden="true">↗</span>
        </button>
      </div>
      {showComparison ? (
        <div className="token-practice__comparison" aria-label="내가 끊은 방식과 AI 토큰화 예시 비교">
          <div className="token-practice__comparison-item token-practice__comparison-item--mine">
            <span>내가 끊은 결과</span>
            <strong>{selectedGroups.join(' | ')}</strong>
          </div>
          <div className="token-practice__comparison-item token-practice__comparison-item--friendly">
            <span>아이 눈높이로 보기</span>
            <strong>{friendlyTokens.join(' | ')}</strong>
            <small>뜻이 잘 보이는 낱말 단위로 단순화했어요.</small>
          </div>
          <div className="token-practice__comparison-item token-practice__comparison-item--ai">
            <span>일반적인 AI 토큰화 예시</span>
            <strong>{comparison.aiTokens.join(' | ')}</strong>
            <small>AI는 단어를 더 작은 조각(subword)으로 나눌 수 있어요.</small>
          </div>
          <p className="token-practice__feedback" role="status" aria-live="polite">
            {matchesFriendlyShape
              ? '좋아요! 뜻이 보이는 낱말 덩어리로 잘 나눴어요. 이제 AI 예시와 비교해 볼 수 있어요.'
              : '좋은 시도예요! 나누는 방법은 하나만 있는 것이 아니고, 모델과 언어에 따라 달라질 수 있어요.'}
          </p>
          <p className="token-practice__note">
            실제 AI 토큰은 모델마다 다를 수 있어요. 위 예시는 원리를 배우기 위한 단순화된 비교이며, 실제 GPT의 내부 생각이나 Chain of Thought가 아니에요.
          </p>
        </div>
      ) : (
        <p className="token-practice__hint" aria-live="polite">
          한 곳 이상 끊은 뒤 <strong>AI 방식과 비교하기</strong>를 선택해 보세요.
        </p>
      )}
    </section>
  )
}
