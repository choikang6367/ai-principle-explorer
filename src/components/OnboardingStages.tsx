import { useEffect, useRef, type ReactNode } from 'react'
import type { Scenario } from '../types/experience'
import { ScenarioActions, ScenarioTopline } from './ScenarioStages'

interface OnboardingStageProps {
  onBack: () => void
  onNext: () => void
}

function OnboardingHeading({
  kicker,
  id,
  title,
  accent,
  description,
}: {
  kicker: string
  id: string
  title: ReactNode
  accent: string
  description: ReactNode
}) {
  return (
    <div className="scenario-stage__heading onboarding-stage__heading">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h1 id={id} tabIndex={-1}>
          {title}
          <span className="scenario-stage__accent">{accent}</span>
        </h1>
      </div>
      <p className="scenario-stage__description">{description}</p>
    </div>
  )
}

export function AIUsageStage({ onBack, onNext }: OnboardingStageProps) {
  return (
    <section className="scenario-stage onboarding-stage ai-usage-stage stage-enter" aria-labelledby="ai-usage-title">
      <ScenarioTopline label="첫 번째 장면 / 생성형 AI 사용법" current={0} />
      <OnboardingHeading
        kicker="HOW TO USE GENERATIVE AI"
        id="ai-usage-title"
        title={<>질문을 입력하면<br /></>}
        accent="답을 출력해요."
        description={<>현재 생성형 AI는 질문이나 부탁을 입력하면,<br />그 내용을 바탕으로 답변을 만들어 화면에 보여 줘요.</>}
      />
      <div className="simulation-layout onboarding-layout">
        <article className="learning-card chat-demo-card">
          <div className="learning-card__topline">
            <span>GENERATIVE AI CHAT</span>
            <span>QUESTION → ANSWER</span>
          </div>
          <div className="chat-demo-card__window" aria-label="생성형 AI에게 질문하고 답변을 받는 예시">
            <div className="chat-demo-card__window-topline">
              <span className="chat-demo-card__status-dot" aria-hidden="true" />
              <strong>AI에게 물어보기</strong>
              <span>교육용 예시</span>
            </div>
            <div className="chat-message chat-message--user">
              <span className="chat-message__label">나의 질문</span>
              <p>왜 하늘은 파란색일까?</p>
            </div>
            <div className="chat-message chat-message--ai">
              <span className="chat-message__label">AI의 답변</span>
              <p>햇빛이 공기 중에서 흩어질 때 파란빛이 다른 색보다 더 많이 퍼져 보여서 하늘이 파랗게 보여요.</p>
            </div>
            <div className="chat-demo-card__composer" aria-label="질문 입력창 예시">
              <span>궁금한 것을 질문해 보세요...</span>
              <span className="chat-demo-card__send" aria-hidden="true">↗</span>
            </div>
          </div>
          <div className="chat-demo-card__flow" role="img" aria-label="질문을 입력하면 AI가 답변을 출력하는 흐름">
            <span>질문 입력</span>
            <b aria-hidden="true">→</b>
            <span>AI가 답변 만들기</span>
            <b aria-hidden="true">→</b>
            <span>답변 출력</span>
          </div>
          <div className="learning-card__explanation chat-demo-card__explanation">
            <span className="learning-card__explanation-label">첫 번째로 기억할 것</span>
            <p>생성형 AI는 질문을 받으면 답을 화면에 출력해요. 이제 이 답변이 안에서 어떻게 만들어지는지 직접 따라가 볼게요.</p>
          </div>
        </article>
        <aside className="info-card onboarding-info-card">
          <span className="info-card__number">01</span>
          <p className="info-card__label">기본 사용법</p>
          <h2>AI와의 대화는<br /><span>질문에서 시작해요.</span></h2>
          <p className="info-card__description">
            어려운 명령어가 없어도 괜찮아요. 알고 싶은 것을 문장으로 입력하고, AI가 만든 답변을 읽어 보면 돼요.
          </p>
          <div className="info-card__badge">다음 장면에서 완성된 질문을 골라 직접 물어봐요.</div>
        </aside>
      </div>
      <ScenarioActions
        backLabel="시작 화면"
        nextLabel="완성된 질문 골라 보기"
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

export function AskQuestionStage({
  scenario,
  answerText,
  hasAsked,
  onAsk,
  onBack,
  onNext,
}: {
  scenario: Scenario
  answerText: string
  hasAsked: boolean
  onAsk: () => void
  onBack: () => void
  onNext: () => void
}) {
  const answerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (hasAsked) {
      answerRef.current?.focus({ preventScroll: true })
    }
  }, [hasAsked])

  return (
    <section className="scenario-stage onboarding-stage ask-question-stage stage-enter" aria-labelledby="ask-question-title">
      <ScenarioTopline label="네 번째 장면 / 직접 물어보기" current={3} />
      <OnboardingHeading
        kicker="YOUR FIRST PROMPT"
        id="ask-question-title"
        title={<>이번엔 직접<br /></>}
        accent="AI에게 물어봐요."
        description={<>AI가 어떻게 대답을 만드는지 보기 위해,<br />완성된 질문 하나를 골라 직접 보내 보세요.</>}
      />
      <div className="simulation-layout onboarding-layout">
        <article className="learning-card ask-question-card">
          <div className="learning-card__topline">
            <span>YOUR QUESTION → AI ANSWER</span>
            <span>{hasAsked ? 'ANSWER READY' : 'WAITING FOR SEND'}</span>
          </div>
          <div className="ask-question-card__window">
            <div className="ask-question-card__window-topline">
              <span className="chat-demo-card__status-dot" aria-hidden="true" />
              <strong>AI 원리 탐험 채팅</strong>
              <span>질문 {scenario.questionType === 'knowledge' ? '지식형' : scenario.questionType === 'imagination' ? '상상형' : '선택·의견형'}</span>
            </div>
            <div className="ask-question-card__prompt">
              <span className="chat-message__label">선택한 완성 질문</span>
              <p>{scenario.question}</p>
            </div>
            <div
              ref={answerRef}
              className={`ask-question-card__answer ${hasAsked ? 'is-visible' : ''}`}
              aria-live="polite"
              data-ignore-global-enter
              tabIndex={hasAsked ? -1 : undefined}
            >
              {hasAsked ? (
                <>
                  <span className="chat-message__label">AI의 답변</span>
                  <p>{answerText}</p>
                </>
              ) : (
                <>
                  <span className="ask-question-card__answer-placeholder" aria-hidden="true">···</span>
                  <p>보내기를 누르면 AI의 답변이 나타나요.</p>
                </>
              )}
            </div>
            <div className="ask-question-card__composer">
              <label className="sr-only" htmlFor="selected-question-input">AI에게 보낼 질문</label>
              <input
                id="selected-question-input"
                type="text"
                value={scenario.question}
                readOnly
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === 'NumpadEnter') && !hasAsked) {
                    event.preventDefault()
                    onAsk()
                  }
                }}
              />
              <button type="button" onClick={onAsk} disabled={hasAsked}>
                {hasAsked ? '보냈어요' : 'AI에게 물어보기'}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
          <div className="ask-question-card__lesson">
            <span className="learning-card__explanation-label">지금 일어난 일</span>
            <strong>{hasAsked ? '질문 입력 → 답변 출력' : '질문을 보내면 답변이 출력돼요.'}</strong>
            <p>{hasAsked ? '답변을 확인했으니, 이제 AI가 이 문장을 어떤 순서로 만드는지 살펴볼 수 있어요.' : '질문은 준비되어 있어요. 아래 버튼을 눌러 AI에게 직접 물어보세요.'}</p>
          </div>
        </article>
        <aside className={`info-card onboarding-info-card ${hasAsked ? 'has-answer' : ''}`}>
          <span className="info-card__number">02</span>
          <p className="info-card__label">직접 질문하기</p>
          <h2>내가 고른 질문에<br /><span>AI가 답했어요.</span></h2>
          <p className="info-card__description">
            지금 본 답변은 결과만 보여 준 것이에요. 다음부터는 질문을 작은 조각으로 나누고, 여러 후보 중 다음 말을 고르는 과정을 열어 볼게요.
          </p>
          <div className="info-card__badge">{hasAsked ? '답변 완성! 다음 장면에서 만드는 과정을 살펴봐요.' : '먼저 아래 입력창의 질문을 AI에게 보내 보세요.'}</div>
        </aside>
      </div>
      <ScenarioActions
        backLabel="질문 다시 고르기"
        nextLabel="AI가 답을 만드는 과정 보기"
        nextDisabled={!hasAsked}
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}
