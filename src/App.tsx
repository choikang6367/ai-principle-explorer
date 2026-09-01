import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MutableRefObject, type RefObject } from 'react'
import { GenerationStage, LearningStage, ReviewStage } from './components/AIProcessStages'
import { CategoryGlyph } from './components/CategoryGlyph'
import { ExplorerOrb } from './components/ExplorerOrb'
import { AIUsageStage, AskQuestionStage } from './components/OnboardingStages'
import {
  AttentionStage,
  CompareStage,
  CompleteStage,
  PredictionStage,
  TokenizeStage,
  TransformerStage,
} from './components/ScenarioStages'
import { StageProgress } from './components/StageProgress'
import {
  ImageFeaturesStage,
  ImageNumbersStage,
  ImagePredictionStage,
  ImageResultStage,
  ImageSelectionStage,
  ImageViewStage,
} from './components/ImageExperienceStages'
import { categories } from './data/categories'
import { getImageExperienceById, imageExperiences } from './data/imageExperiences'
import {
  EXPERIENCE_PROGRESS_VERSION,
  clearSavedProgress,
  readSavedProgress,
  saveProgress,
  type ExperienceProgress,
} from './data/progress'
import { questionTypeMeta } from './data/questionBank'
import { adaptAttentionTargets, getScenarioById, getScenariosForCategory } from './data/scenarios'
import { createContextualCandidates, runTransformer } from './transformer/engine'
import { generateAnswer, reviewGeneratedAnswer } from './transformer/generation'
import { useViewportProfile } from './hooks/useViewportProfile'
import type { Category, CategoryId, ImageExperienceId, InputToken, QuestionType, Scenario, StageId } from './types/experience'

function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

const previousStageByStage: Partial<Record<StageId, StageId>> = {
  conversationWelcome: 'welcome',
  intro: 'conversationWelcome',
  categories: 'intro',
  questions: 'categories',
  ask: 'questions',
  learning: 'ask',
  tokenize: 'learning',
  transformer: 'tokenize',
  attention: 'transformer',
  prediction: 'attention',
  generation: 'prediction',
  review: 'generation',
  compare: 'review',
  complete: 'compare',
  imageView: 'imageSelect',
  imageNumbers: 'imageView',
  imageFeatures: 'imageNumbers',
  imagePrediction: 'imageFeatures',
  imageResult: 'imagePrediction',
}

const globalEnterSelectorByStage: Partial<Record<StageId, string>> = {
  welcome: '.home-stage .mode-card:not(:disabled)',
  conversationWelcome: '.welcome-stage .primary-button',
  intro: '.scenario-stage-actions .primary-button:not(:disabled)',
  categories: '.selection-panel__action:not(:disabled)',
  questions: '.selection-panel__action:not(:disabled)',
  ask: '.scenario-stage-actions .primary-button:not(:disabled)',
  learning: '.scenario-stage-actions .primary-button:not(:disabled)',
  tokenize: '.scenario-stage-actions .primary-button:not(:disabled)',
  transformer: '.transformer-walkthrough__actions .primary-button:not(:disabled)',
  attention: '.scenario-stage-actions .primary-button:not(:disabled)',
  prediction: '.scenario-stage-actions .primary-button:not(:disabled)',
  generation: '.scenario-stage-actions .primary-button:not(:disabled)',
  review: '.scenario-stage-actions .primary-button:not(:disabled)',
  compare: '.scenario-stage-actions .primary-button:not(:disabled)',
  imageSelect: '.image-selection-start:not(:disabled)',
  imageView: '.image-stage-actions .primary-button:not(:disabled)',
  imageNumbers: '.image-stage-actions .primary-button:not(:disabled)',
  imageFeatures: '.image-stage-actions .primary-button:not(:disabled)',
  imagePrediction: '.image-stage-actions .primary-button:not(:disabled)',
}

function findVisibleButton(selector: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(selector)).find(
    (button) => button.getClientRects().length > 0 && !button.disabled,
  )
}

function createActiveInputTokens(scenarioId: string, tokenTexts: readonly string[]) {
  return tokenTexts.map((text, index) => ({
    id: `${scenarioId}-practice-token-${String(index + 1).padStart(2, '0')}`,
    text,
    kind: /^[?？.!！。]+$/u.test(text) ? 'punctuation' as const : 'word' as const,
  }))
}

function getCustomTokenTexts(scenario: Scenario, tokens: readonly InputToken[]) {
  const defaultTexts = scenario.tokens.map((token) => token.text)
  const tokenTexts = tokens.map((token) => token.text)
  const matchesDefault = tokenTexts.length === defaultTexts.length &&
    tokenTexts.every((text, index) => text === defaultTexts[index])

  return matchesDefault ? null : tokenTexts
}

function MobileSelectionDock({
  actionLabel,
  onContinue,
}: {
  actionLabel: string
  onContinue: () => void
}) {
  return (
    <div className="mobile-selection-dock">
      <button
        className="selection-panel__action"
        type="button"
        onClick={onContinue}
        onKeyDown={(event) => handleButtonKeyDown(event, onContinue)}
      >
        {actionLabel}
        <span aria-hidden="true">↗</span>
      </button>
    </div>
  )
}

function HomeStage({
  onChooseConversation,
  onChooseImage,
  firstCardRef,
}: {
  onChooseConversation: () => void
  onChooseImage: () => void
  firstCardRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <section className="home-stage stage-enter" aria-labelledby="home-title">
      <div className="home-stage__topline">
        <p className="eyebrow">
          <span className="eyebrow__marker" aria-hidden="true" />
          AI 원리 탐험 <span className="eyebrow__slash">/</span> 두 가지 체험
        </p>
        <span className="home-stage__status"><span className="status-dot" aria-hidden="true" /> READY TO EXPLORE</span>
      </div>
      <div className="home-stage__heading">
        <div>
          <p className="section-kicker">CHOOSE YOUR WAY IN</p>
          <h1 id="home-title" tabIndex={-1}>
            생성형 AI를
            <br />
            <span>두 가지 눈으로 봐요.</span>
          </h1>
        </div>
        <p className="home-stage__description">
          AI는 어떻게 말을 만들고, 사진 속 대상을 알아볼까요?
          <br />
          궁금한 체험을 하나 골라 직접 따라가 봐요.
        </p>
      </div>
      <div className="mode-grid" aria-label="생성형 AI 체험 선택">
        <button
          ref={firstCardRef}
          className="mode-card mode-card--conversation"
          type="button"
          onClick={onChooseConversation}
          onKeyDown={(event) => handleButtonKeyDown(event, onChooseConversation)}
        >
          <span className="mode-card__topline">
            <span>EXPERIENCE 01</span>
            <span>WORDS / TEXT</span>
          </span>
          <span className="mode-card__visual mode-card__visual--conversation" aria-hidden="true">
            <span className="mode-card__bubble mode-card__bubble--one">안녕!</span>
            <span className="mode-card__bubble mode-card__bubble--two">다음 말은?</span>
            <span className="mode-card__signal">↗</span>
          </span>
          <span className="mode-card__title">대화할 때의 생성형 AI</span>
          <span className="mode-card__description">AI는 어떻게 다음 말을 골라 문장을 만들까요?</span>
          <span className="mode-card__footer">
            <span>질문 → 토큰 → 예상 → 문장</span>
            <span className="mode-card__arrow" aria-hidden="true">↗</span>
          </span>
        </button>
        <button
          className="mode-card mode-card--image"
          type="button"
          onClick={onChooseImage}
          onKeyDown={(event) => handleButtonKeyDown(event, onChooseImage)}
        >
          <span className="mode-card__topline">
            <span>EXPERIENCE 02</span>
            <span>PIXELS / IMAGE</span>
          </span>
          <span className="mode-card__visual mode-card__visual--image" aria-hidden="true">
            <span className="mode-card__pixel-orb">◉</span>
            <span className="mode-card__pixel-grid" />
            <span className="mode-card__signal">+</span>
          </span>
          <span className="mode-card__title">이미지를 읽을 때의 생성형 AI</span>
          <span className="mode-card__description">AI는 사진을 어떻게 숫자로 보고 무엇인지 알아낼까요?</span>
          <span className="mode-card__footer">
            <span>사진 → 픽셀 → 특징 → 가능성</span>
            <span className="mode-card__arrow" aria-hidden="true">↗</span>
          </span>
        </button>
      </div>
      <div className="home-stage__principle">
        <span className="home-stage__principle-mark" aria-hidden="true">i</span>
        <p>두 체험의 공통점: AI는 입력을 숫자로 바꾸고, 배운 패턴을 이용해 다음 결과를 예상해요.</p>
        <span className="keyboard-hint"><kbd>Enter</kbd><span>첫 번째 체험 시작</span></span>
      </div>
    </section>
  )
}

function WelcomeStage({
  onStart,
  actionRef,
}: {
  onStart: () => void
  actionRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <section className="welcome-stage stage-enter" aria-labelledby="welcome-title">
      <div className="welcome-stage__copy">
        <p className="eyebrow">
          <span className="eyebrow__marker" aria-hidden="true" />
          AI 원리 탐험 <span className="eyebrow__slash">/</span> 초등 6학년
        </p>
        <h1 id="welcome-title" tabIndex={-1}>
          생성형 AI는
          <br />
          <span>질문에 답해요.</span>
        </h1>
        <p className="welcome-stage__description">
          먼저 질문을 입력하고 답을 받는 기본 사용법부터 알아봐요.
          <br className="desktop-only" />
          그다음 완성된 질문 하나를 골라, 답이 만들어지는 과정을 차근차근 따라가 봐요.
        </p>
        <div className="welcome-stage__actions">
          <button
            ref={actionRef}
            className="primary-button"
            type="button"
            onClick={onStart}
            onKeyDown={(event) => handleButtonKeyDown(event, onStart)}
          >
            AI 사용법 보기
            <span className="primary-button__arrow" aria-hidden="true">
              ↗
            </span>
          </button>
          <span className="keyboard-hint">
            <kbd>Enter</kbd>
            <span>눌러서 시작</span>
          </span>
        </div>
        <div className="principle-strip" aria-label="체험에서 살펴볼 원리">
          <div className="principle-strip__item">
            <span className="principle-strip__number">01</span>
            <span>질문 입력</span>
          </div>
          <span className="principle-strip__connector" aria-hidden="true" />
          <div className="principle-strip__item">
            <span className="principle-strip__number">02</span>
            <span>답변 출력</span>
          </div>
          <span className="principle-strip__connector" aria-hidden="true" />
          <div className="principle-strip__item">
            <span className="principle-strip__number">03</span>
            <span>만드는 과정</span>
          </div>
        </div>
      </div>
      <div className="welcome-stage__visual">
        <ExplorerOrb />
        <div className="visual-caption">
          <span className="visual-caption__signal" aria-hidden="true" />
          <span>교육용 시뮬레이션</span>
          <span className="visual-caption__divider" aria-hidden="true" />
          <span>실제 AI 계산을 쉽게 단순화했어요</span>
        </div>
      </div>
    </section>
  )
}

function CategoryCard({
  category,
  isSelected,
  buttonRef,
  onSelect,
  onKeyDown,
}: {
  category: Category
  isSelected: boolean
  buttonRef: (element: HTMLButtonElement | null) => void
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      ref={buttonRef}
      className={`category-card ${isSelected ? 'is-selected' : ''}`}
      data-accent={category.accent}
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <span className="category-card__topline">
        <span>{category.number}</span>
        <span className="category-card__status" aria-hidden="true">
          {isSelected ? 'SELECTED' : 'EXPLORE'}
        </span>
      </span>
      <span className="category-card__glyph">
        <CategoryGlyph glyph={category.glyph} />
      </span>
      <span className="category-card__name">{category.label}</span>
      <span className="category-card__english">{category.englishLabel}</span>
      <span className="category-card__description">{category.description}</span>
      <span className="category-card__corner" aria-hidden="true">
        ↗
      </span>
    </button>
  )
}

function CategoryStage({
  selectedCategory,
  onSelect,
  onContinue,
  onBack,
  categoryRefs,
}: {
  selectedCategory: CategoryId | null
  onSelect: (categoryId: CategoryId) => void
  onContinue: () => void
  onBack: () => void
  categoryRefs: MutableRefObject<Array<HTMLButtonElement | null>>
}) {
  const selected = categories.find((category) => category.id === selectedCategory)

  const moveFocus = (index: number, direction: 1 | -1) => {
    const nextIndex = (index + direction + categories.length) % categories.length
    categoryRefs.current[nextIndex]?.focus()
  }

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    categoryId: CategoryId,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(categoryId)
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
    <section className="category-stage stage-enter" aria-labelledby="category-title">
      <div className="stage-topline">
        <p className="eyebrow">
          <span className="eyebrow__marker" aria-hidden="true" />
          두 번째 장면 <span className="eyebrow__slash">/</span> 질문 주제 고르기
        </p>
        <StageProgress current={1} />
      </div>
      <div className="category-stage__heading">
        <div>
          <p className="section-kicker">START WITH A QUESTION</p>
          <h1 id="category-title" tabIndex={-1}>
            먼저 주제를 <span>골라 볼까요?</span>
          </h1>
        </div>
        <p className="category-stage__description">
          마음이 가는 주제를 하나 골라 보세요.
          <br />
          다음 화면에서 준비된 질문 중 하나를 골라 직접 물어봅니다.
        </p>
      </div>
      <div className="category-layout">
        <div className="category-grid" aria-label="탐험 주제 선택">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={category.id === selectedCategory}
              buttonRef={(element) => {
                categoryRefs.current[index] = element
              }}
              onSelect={() => onSelect(category.id)}
              onKeyDown={(event) => handleCardKeyDown(event, index, category.id)}
            />
          ))}
        </div>
        <aside className={`selection-panel ${selected ? 'has-selection' : ''}`} aria-live="polite">
          {selected ? (
            <>
              <p className="selection-panel__label">선택한 탐험 주제</p>
              <div className="selection-panel__title-row">
                <span className="selection-panel__number">{selected.number}</span>
                <h2>{selected.label}</h2>
              </div>
              <p className="selection-panel__description">{selected.description}</p>
              <div className="selection-panel__next">
                <span className="selection-panel__next-label">NEXT UP</span>
                <strong>질문 고르기</strong>
                <span className="selection-panel__next-arrow" aria-hidden="true">
                  →
                </span>
              </div>
              <button
                className="selection-panel__action"
                type="button"
                onClick={onContinue}
                onKeyDown={(event) => handleButtonKeyDown(event, onContinue)}
              >
                이 주제로 질문 고르기
                <span aria-hidden="true">↗</span>
              </button>
            </>
          ) : (
            <>
              <span className="selection-panel__pulse" aria-hidden="true" />
              <p className="selection-panel__empty-label">READY WHEN YOU ARE</p>
              <h2>주제를 고르면<br />탐험이 시작돼요.</h2>
              <p className="selection-panel__empty-description">
                카드에 초점을 맞춘 뒤 Enter를 눌러도 좋아요.
              </p>
            </>
          )}
        </aside>
      </div>
      {selected ? <MobileSelectionDock actionLabel="이 주제로 질문 고르기" onContinue={onContinue} /> : null}
      <div className="stage-actions">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
          onKeyDown={(event) => handleButtonKeyDown(event, onBack)}
        >
          <span aria-hidden="true">←</span>
          시작 화면
        </button>
        <p className="keyboard-hint keyboard-hint--wide">
          <kbd>←</kbd>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>→</kbd>
          <span>주제 이동</span>
          <span className="keyboard-hint__divider" aria-hidden="true" />
          <kbd>Enter</kbd>
          <span>선택</span>
        </p>
        <p className="stage-note">
          <span className="stage-note__mark" aria-hidden="true">i</span>
          AI의 원리를 쉽게 체험하기 위한 교육용 모형이에요.
        </p>
      </div>
    </section>
  )
}

function QuestionCard({
  scenario,
  index,
  isSelected,
  buttonRef,
  onSelect,
  onKeyDown,
}: {
  scenario: Scenario
  index: number
  isSelected: boolean
  buttonRef: (element: HTMLButtonElement | null) => void
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}) {
  const typeMeta = questionTypeMeta.find((type) => type.id === scenario.questionType)

  return (
    <button
      ref={buttonRef}
      className={`question-card ${isSelected ? 'is-selected' : ''}`}
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <span className="question-card__topline">
        <span>QUESTION {String(index + 1).padStart(2, '0')}</span>
        <span className="question-card__status" aria-hidden="true">
          {isSelected ? 'SELECTED' : 'CHOOSE'}
        </span>
      </span>
      <span className="question-card__question">{scenario.question}</span>
      <span className="question-card__type">{typeMeta?.label ?? '질문 탐구'}</span>
      <span className="question-card__goal">{scenario.learnerGoal}</span>
      <span className="question-card__footer">
        <span className="question-card__difficulty" aria-label={`난이도 ${scenario.difficulty}단계`}>
          {Array.from({ length: 3 }, (_, difficultyIndex) => (
            <span
              className={difficultyIndex < scenario.difficulty ? 'is-filled' : ''}
              key={difficultyIndex}
              aria-hidden="true"
            />
          ))}
        </span>
        <span>직접 물어보기</span>
      </span>
    </button>
  )
}

function QuestionStage({
  category,
  selectedScenarioId,
  onSelect,
  onContinue,
  onBack,
  scenarioRefs,
}: {
  category: Category
  selectedScenarioId: string | null
  onSelect: (scenarioId: string) => void
  onContinue: () => void
  onBack: () => void
  scenarioRefs: MutableRefObject<Array<HTMLButtonElement | null>>
}) {
  const categoryScenarios = getScenariosForCategory(category.id)
  const initialQuestionType = categoryScenarios.find((scenario) => scenario.id === selectedScenarioId)?.questionType ?? 'knowledge'
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>(initialQuestionType)
  const visibleScenarios = categoryScenarios.filter((scenario) => scenario.questionType === selectedQuestionType)
  const selected = visibleScenarios.find((scenario) => scenario.id === selectedScenarioId)

  const moveFocus = (index: number, direction: 1 | -1) => {
    const nextIndex = (index + direction + visibleScenarios.length) % visibleScenarios.length
    scenarioRefs.current[nextIndex]?.focus()
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number, scenarioId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(scenarioId)
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
    <section className="question-stage stage-enter" aria-labelledby="question-title">
      <div className="stage-topline">
        <p className="eyebrow">
          <span className="eyebrow__marker" aria-hidden="true" />
          세 번째 장면 <span className="eyebrow__slash">/</span> 완성된 질문 고르기
        </p>
        <StageProgress current={2} />
      </div>
      <div className="question-stage__heading">
        <div>
          <p className="section-kicker">{category.englishLabel}</p>
          <h1 id="question-title" tabIndex={-1}>
            어떤 질문을
            <br />
            <span>직접 물어볼까요?</span>
          </h1>
        </div>
        <p className="question-stage__description">
          {category.label} 주제에서 완성된 질문 하나를 골라 보세요.
          <br />
          AI가 어떻게 대답을 만드는지 보기 위해, 고른 질문을 입력창에서 직접 보내 봅니다. 총 {categoryScenarios.length}개예요.
        </p>
      </div>
      <div className={`question-type-picker ${selected ? 'has-selection' : ''}`} aria-label="질문 유형 필터">
        <div className="question-type-picker__intro">
          <span>QUESTION MIX</span>
          <strong>어떤 방식으로 생각해 볼까요?</strong>
        </div>
        <div className="question-type-picker__options">
          {questionTypeMeta.map((type) => {
            const count = categoryScenarios.filter((scenario) => scenario.questionType === type.id).length
            const isSelected = type.id === selectedQuestionType
            const selectType = () => {
              setSelectedQuestionType(type.id)
              scenarioRefs.current = []
            }

            return (
              <button
                key={type.id}
                className={`question-type-option ${isSelected ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={isSelected}
                onClick={selectType}
                onKeyDown={(event) => handleButtonKeyDown(event, selectType)}
              >
                <span className="question-type-option__topline">
                  <span>{type.label}</span>
                  <strong>{count}</strong>
                </span>
                <span className="question-type-option__short-label">{type.shortLabel}</span>
                <span className="question-type-option__description">{type.description}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="question-layout">
        <div className="question-list" aria-label={`${category.label} 질문 선택`}>
          {visibleScenarios.map((scenario, index) => (
            <QuestionCard
              key={scenario.id}
              scenario={scenario}
              index={index}
              isSelected={scenario.id === selectedScenarioId}
              buttonRef={(element) => {
                scenarioRefs.current[index] = element
              }}
              onSelect={() => onSelect(scenario.id)}
              onKeyDown={(event) => handleCardKeyDown(event, index, scenario.id)}
            />
          ))}
        </div>
        <aside className={`selection-panel question-preview-panel ${selected ? 'has-selection' : ''}`} aria-live="polite">
          {selected ? (
            <>
              <p className="selection-panel__label">선택한 탐험 질문</p>
              <div className="question-preview-panel__number">QUESTION {String(visibleScenarios.indexOf(selected) + 1).padStart(2, '0')} / {questionTypeMeta.find((type) => type.id === selected.questionType)?.shortLabel}</div>
              <h2>{selected.question}</h2>
              <p className="selection-panel__description">{selected.learnerGoal}</p>
              <button
                className="selection-panel__action"
                type="button"
                onClick={onContinue}
                onKeyDown={(event) => handleButtonKeyDown(event, onContinue)}
              >
                이 질문으로 직접 물어보기
                <span aria-hidden="true">↗</span>
              </button>
            </>
          ) : (
            <>
              <span className="selection-panel__pulse" aria-hidden="true" />
              <p className="selection-panel__empty-label">PICK A QUESTION</p>
              <h2>궁금한 질문을<br />골라 보세요.</h2>
              <p className="selection-panel__empty-description">
                질문에 초점을 맞춘 뒤 Enter를 눌러도 좋아요.
              </p>
            </>
          )}
        </aside>
      </div>
      {selected ? <MobileSelectionDock actionLabel="이 질문으로 직접 물어보기" onContinue={onContinue} /> : null}
      <div className="stage-actions">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
          onKeyDown={(event) => handleButtonKeyDown(event, onBack)}
        >
          <span aria-hidden="true">←</span>
          주제 다시 고르기
        </button>
        <p className="keyboard-hint keyboard-hint--wide">
          <kbd>←</kbd>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>→</kbd>
          <span>질문 이동</span>
          <span className="keyboard-hint__divider" aria-hidden="true" />
          <kbd>Enter</kbd>
          <span>선택</span>
        </p>
        <p className="stage-note">
          <span className="stage-note__mark" aria-hidden="true">i</span>
          AI의 원리를 쉽게 체험하기 위한 교육용 모형이에요.
        </p>
      </div>
    </section>
  )
}

function App() {
  const [initialProgress] = useState<ExperienceProgress>(() => readSavedProgress())
  const viewport = useViewportProfile()
  const [stage, setStage] = useState<StageId>(initialProgress.stage)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(initialProgress.selectedCategory)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(initialProgress.selectedScenarioId)
  const [selectedAttentionTokenId, setSelectedAttentionTokenId] = useState<string | null>(initialProgress.selectedAttentionTokenId)
  const [studentCandidateId, setStudentCandidateId] = useState<string | null>(initialProgress.studentCandidateId)
  const [customInputTokenTexts, setCustomInputTokenTexts] = useState<readonly string[] | null>(initialProgress.selectedInputTokenTexts)
  const [hasAskedQuestion, setHasAskedQuestion] = useState(initialProgress.hasAskedQuestion)
  const [selectedImageId, setSelectedImageId] = useState<ImageExperienceId | null>(initialProgress.selectedImageId ?? null)
  const [imageStudentGuess, setImageStudentGuess] = useState<string | null>(initialProgress.imageGuess ?? null)
  const homeButtonRef = useRef<HTMLButtonElement | null>(null)
  const startButtonRef = useRef<HTMLButtonElement | null>(null)
  const imageRefs = useRef<Array<HTMLButtonElement | null>>([])
  const categoryRefs = useRef<Array<HTMLButtonElement | null>>([])
  const scenarioRefs = useRef<Array<HTMLButtonElement | null>>([])
  const attentionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const candidateRefs = useRef<Array<HTMLButtonElement | null>>([])
  const stageChangedAtRef = useRef(0)

  useEffect(() => {
    stageChangedAtRef.current = performance.now()
    window.scrollTo({ top: 0, left: 0 })
    document.querySelector('.app-shell')?.scrollTo({ top: 0, left: 0 })

    if (stage === 'welcome') {
      homeButtonRef.current?.focus({ preventScroll: true })
      return
    }

    if (stage === 'conversationWelcome') {
      startButtonRef.current?.focus({ preventScroll: true })
      return
    }

    document.querySelector<HTMLElement>('.stage-frame h1')?.focus({ preventScroll: true })
  }, [stage])

  useEffect(() => {
    saveProgress({
      version: EXPERIENCE_PROGRESS_VERSION,
      stage,
      selectedCategory,
      selectedScenarioId,
      selectedInputTokenTexts: customInputTokenTexts,
      selectedAttentionTokenId,
      studentCandidateId,
      hasAskedQuestion,
      selectedImageId,
      imageGuess: imageStudentGuess,
    })
  }, [stage, selectedCategory, selectedScenarioId, customInputTokenTexts, selectedAttentionTokenId, studentCandidateId, hasAskedQuestion, selectedImageId, imageStudentGuess])

  useEffect(() => {
    const handleGlobalKeyDown = (event: WindowEventMap['keydown']) => {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      if (event.key === 'Escape' || event.key === 'Esc') {
        const nextStage = previousStageByStage[stage]

        if (nextStage) {
          event.preventDefault()
          setStage(nextStage)
        }
        return
      }

      if (event.key !== 'Enter' && event.key !== 'NumpadEnter') {
        return
      }

      if (performance.now() - stageChangedAtRef.current < 120) {
        return
      }

      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('button, a, input, textarea, select, [contenteditable="true"], [data-ignore-global-enter]')) {
        return
      }

      const selector = globalEnterSelectorByStage[stage]
      const button = selector ? findVisibleButton(selector) : undefined
      if (!button) {
        return
      }

      event.preventDefault()
      button.click()
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [stage])

  const handleCategorySelect = (categoryId: CategoryId) => {
    setSelectedCategory(categoryId)
    setSelectedScenarioId(null)
    setHasAskedQuestion(false)
    setSelectedAttentionTokenId(null)
    setStudentCandidateId(null)
    setCustomInputTokenTexts(null)
    attentionRefs.current = []
    candidateRefs.current = []
  }

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId)
    setHasAskedQuestion(false)
    setSelectedAttentionTokenId(null)
    setStudentCandidateId(null)
    setCustomInputTokenTexts(null)
    attentionRefs.current = []
    candidateRefs.current = []
  }

  const resetImageExperience = () => {
    setSelectedImageId(null)
    setImageStudentGuess(null)
    imageRefs.current = []
  }

  const handleImageSelect = (imageId: string) => {
    const imageExperience = getImageExperienceById(imageId)
    if (!imageExperience) {
      return
    }
    setSelectedImageId(imageExperience.id)
    setImageStudentGuess(null)
  }

  const handleAttentionSelect = (tokenId: string) => {
    setSelectedAttentionTokenId(tokenId)
    setStudentCandidateId(null)
    candidateRefs.current = []
  }

  const selectedCategoryData = categories.find((category) => category.id === selectedCategory)
  const selectedScenario = selectedScenarioId ? getScenarioById(selectedScenarioId) : undefined
  const selectedImageData = getImageExperienceById(selectedImageId)
  const customInputTokens = selectedScenario && customInputTokenTexts
    ? createActiveInputTokens(selectedScenario.id, customInputTokenTexts)
    : null
  const activeInputTokens = selectedScenario ? customInputTokens ?? selectedScenario.tokens : []
  const activeAttentionTargets = selectedScenario
    ? adaptAttentionTargets(selectedScenario, activeInputTokens)
    : []
  const activeFocusTokenId = activeAttentionTargets.find(
    (target) => (target.sourceTokenId ?? target.tokenId) === selectedAttentionTokenId,
  )?.tokenId ?? null
  const contextualPrediction = useMemo(() => {
    if (!selectedScenario || !activeFocusTokenId) {
      return null
    }

    const result = runTransformer(activeInputTokens, selectedScenario.candidates, activeFocusTokenId)
    return {
      result,
      candidates: createContextualCandidates(selectedScenario.candidates, result),
    }
  }, [activeFocusTokenId, activeInputTokens, selectedScenario])
  const predictionCandidates = contextualPrediction?.candidates ?? selectedScenario?.candidates ?? []
  const studentCandidate = predictionCandidates.find((candidate) => candidate.id === studentCandidateId)
  const aiCandidate = predictionCandidates.find(
    (candidate) => candidate.id === contextualPrediction?.result.selectedCandidateId,
  ) ?? selectedScenario?.candidates.find((candidate) => candidate.id === selectedScenario.aiCandidateId)
  const generatedStudentAnswer = useMemo(
    () => selectedScenario && studentCandidate
      ? generateAnswer(studentCandidate, activeInputTokens, activeFocusTokenId)
      : null,
    [activeFocusTokenId, activeInputTokens, selectedScenario, studentCandidate],
  )
  const generatedAiAnswer = useMemo(
    () => selectedScenario && aiCandidate
      ? generateAnswer(aiCandidate, activeInputTokens, activeFocusTokenId)
      : null,
    [activeFocusTokenId, activeInputTokens, aiCandidate, selectedScenario],
  )
  const answerChecks = useMemo(
    () => selectedScenario && generatedStudentAnswer
      ? reviewGeneratedAnswer(selectedScenario, generatedStudentAnswer)
      : [],
    [generatedStudentAnswer, selectedScenario],
  )
  const isImageFlowStage = stage === 'imageView' || stage === 'imageNumbers' || stage === 'imageFeatures' || stage === 'imagePrediction' || stage === 'imageResult'

  return (
    <div
      className="app-shell"
      data-viewport={viewport.size}
      data-viewport-height={viewport.heightMode}
      data-orientation={viewport.orientation}
      data-pointer={viewport.pointer}
    >
      <div className="background-grid" aria-hidden="true" />
      <div className="background-glow background-glow--one" aria-hidden="true" />
      <div className="background-glow background-glow--two" aria-hidden="true" />
      <header className="site-header">
        <button
          className="brand-lockup"
          type="button"
          aria-label="AI 원리 탐험 시작 화면으로 이동"
          onClick={() => setStage('welcome')}
        >
          <span className="brand-lockup__symbol" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="brand-lockup__text">
            <strong>AI 원리 탐험</strong>
            <small>MADE TO UNDERSTAND</small>
          </span>
        </button>
        <div className="site-header__meta">
          <span className="status-dot" aria-hidden="true" />
          <span>학습 모드</span>
          <span className="site-header__key">ESC</span>
        </div>
      </header>
      <main className="stage-frame">
        {stage === 'welcome' ? (
          <HomeStage
            onChooseConversation={() => setStage('conversationWelcome')}
            onChooseImage={() => setStage('imageSelect')}
            firstCardRef={homeButtonRef}
          />
        ) : stage === 'conversationWelcome' ? (
          <WelcomeStage onStart={() => setStage('intro')} actionRef={startButtonRef} />
        ) : stage === 'intro' ? (
          <AIUsageStage
            onBack={() => setStage('conversationWelcome')}
            onNext={() => setStage('categories')}
          />
        ) : stage === 'categories' ? (
          <CategoryStage
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
            onContinue={() => {
              if (selectedCategoryData) {
                setStage('questions')
              }
            }}
            onBack={() => setStage('intro')}
            categoryRefs={categoryRefs}
          />
        ) : stage === 'imageSelect' ? (
          <ImageSelectionStage
            experiences={imageExperiences}
            selectedImageId={selectedImageId}
            imageRefs={imageRefs}
            onSelect={handleImageSelect}
            onContinue={() => {
              if (selectedImageData) {
                setImageStudentGuess(null)
                setStage('imageView')
              }
            }}
            onBack={() => setStage('welcome')}
          />
        ) : isImageFlowStage ? (
          selectedImageData ? (
            stage === 'imageView' ? (
              <ImageViewStage
                experience={selectedImageData}
                selectedGuess={imageStudentGuess}
                onSelectGuess={setImageStudentGuess}
                onBack={() => setStage('imageSelect')}
                onNext={() => setStage('imageNumbers')}
              />
            ) : stage === 'imageNumbers' ? (
              <ImageNumbersStage
                experience={selectedImageData}
                onBack={() => setStage('imageView')}
                onNext={() => setStage('imageFeatures')}
              />
            ) : stage === 'imageFeatures' ? (
              <ImageFeaturesStage
                experience={selectedImageData}
                onBack={() => setStage('imageNumbers')}
                onNext={() => setStage('imagePrediction')}
              />
            ) : stage === 'imagePrediction' ? (
              <ImagePredictionStage
                experience={selectedImageData}
                onBack={() => setStage('imageFeatures')}
                onNext={() => setStage('imageResult')}
              />
            ) : (
              <ImageResultStage
                experience={selectedImageData}
                selectedGuess={imageStudentGuess}
                onBack={() => setStage('imagePrediction')}
                onOtherImage={() => {
                  setSelectedImageId(null)
                  setImageStudentGuess(null)
                  imageRefs.current = []
                  setStage('imageSelect')
                }}
                onRestart={() => {
                  clearSavedProgress()
                  resetImageExperience()
                  setStage('welcome')
                }}
              />
            )
          ) : (
            <ImageSelectionStage
              experiences={imageExperiences}
              selectedImageId={selectedImageId}
              imageRefs={imageRefs}
              onSelect={handleImageSelect}
              onContinue={() => {
                if (selectedImageData) {
                  setImageStudentGuess(null)
                  setStage('imageView')
                }
              }}
              onBack={() => setStage('welcome')}
            />
          )
        ) : selectedCategoryData ? (
          stage === 'questions' ? (
            <QuestionStage
              category={selectedCategoryData}
              selectedScenarioId={selectedScenario?.id ?? null}
              onSelect={handleScenarioSelect}
              onContinue={() => {
                if (selectedScenario) {
                  setStage('ask')
                }
              }}
              onBack={() => setStage('categories')}
              scenarioRefs={scenarioRefs}
            />
          ) : stage === 'ask' && selectedScenario ? (
            <AskQuestionStage
              scenario={selectedScenario}
              answerText={aiCandidate?.outcome.answer ?? selectedScenario.candidates[0]?.outcome.answer ?? ''}
              hasAsked={hasAskedQuestion}
              onAsk={() => setHasAskedQuestion(true)}
              onBack={() => setStage('questions')}
              onNext={() => {
                if (hasAskedQuestion) {
                  setStage('learning')
                }
              }}
            />
          ) : stage === 'learning' && selectedScenario ? (
            <LearningStage
              category={selectedCategoryData}
              scenario={selectedScenario}
              onBack={() => setStage('ask')}
              onNext={() => setStage('tokenize')}
            />
          ) : stage === 'tokenize' && selectedScenario ? (
            <TokenizeStage
              category={selectedCategoryData}
              scenario={selectedScenario}
              initialTokens={customInputTokens ?? undefined}
              onBack={() => setStage('learning')}
              onNext={(tokens) => {
                setCustomInputTokenTexts(getCustomTokenTexts(selectedScenario, tokens))
                setSelectedAttentionTokenId(null)
                setStudentCandidateId(null)
                setStage('transformer')
              }}
            />
          ) : stage === 'transformer' && selectedScenario ? (
            <TransformerStage
              category={selectedCategoryData}
              scenario={selectedScenario}
              inputTokens={activeInputTokens}
              onBack={() => setStage('tokenize')}
              onNext={() => setStage('attention')}
            />
          ) : stage === 'attention' && selectedScenario ? (
            <AttentionStage
              category={selectedCategoryData}
              scenario={selectedScenario}
              tokens={activeInputTokens}
              attentionTargets={activeAttentionTargets}
              selectedTokenId={selectedAttentionTokenId}
              attentionRefs={attentionRefs}
              onSelectToken={handleAttentionSelect}
              onBack={() => setStage('transformer')}
              onNext={() => {
                if (selectedAttentionTokenId) {
                  setStage('prediction')
                }
              }}
            />
          ) : stage === 'prediction' && selectedScenario ? (
            <PredictionStage
              category={selectedCategoryData}
              scenario={selectedScenario}
              tokens={activeInputTokens}
              attentionTargets={activeAttentionTargets}
              candidates={predictionCandidates}
              predictionResult={contextualPrediction?.result ?? runTransformer(activeInputTokens, selectedScenario.candidates, activeFocusTokenId)}
              selectedTokenId={selectedAttentionTokenId}
              selectedCandidateId={studentCandidateId}
              candidateRefs={candidateRefs}
              onSelectCandidate={setStudentCandidateId}
              onBack={() => setStage('attention')}
              onNext={() => {
                if (studentCandidateId) {
                  setStage('generation')
                }
              }}
            />
          ) : stage === 'generation' && selectedScenario && studentCandidate && generatedStudentAnswer ? (
            <GenerationStage
              category={selectedCategoryData}
              scenario={selectedScenario}
              candidate={studentCandidate}
              answer={generatedStudentAnswer}
              onBack={() => setStage('prediction')}
              onNext={() => setStage('review')}
            />
          ) : stage === 'review' && selectedScenario && studentCandidate && generatedStudentAnswer ? (
            <ReviewStage
              category={selectedCategoryData}
              scenario={selectedScenario}
              candidate={studentCandidate}
              answer={generatedStudentAnswer}
              checks={answerChecks}
              onBack={() => setStage('generation')}
              onNext={() => setStage('compare')}
            />
          ) : stage === 'compare' && selectedScenario && studentCandidate && aiCandidate ? (
            <CompareStage
              category={selectedCategoryData}
              studentCandidate={studentCandidate}
              aiCandidate={aiCandidate}
              studentAnswer={generatedStudentAnswer}
              aiAnswer={generatedAiAnswer}
              onBack={() => setStage('review')}
              onNext={() => setStage('complete')}
            />
          ) : stage === 'complete' && selectedScenario && studentCandidate && aiCandidate ? (
            <CompleteStage
              category={selectedCategoryData}
              scenario={selectedScenario}
              studentCandidate={studentCandidate}
              aiCandidate={aiCandidate}
              generatedAnswer={generatedStudentAnswer}
              onBack={() => setStage('compare')}
              onOtherQuestion={() => {
                setSelectedScenarioId(null)
                setHasAskedQuestion(false)
                setSelectedAttentionTokenId(null)
                setStudentCandidateId(null)
                setCustomInputTokenTexts(null)
                setStage('questions')
              }}
              onRestart={() => {
                clearSavedProgress()
                setSelectedCategory(null)
                setSelectedScenarioId(null)
                setHasAskedQuestion(false)
                setSelectedAttentionTokenId(null)
                setStudentCandidateId(null)
                setCustomInputTokenTexts(null)
                setStage('welcome')
              }}
            />
          ) : (
            <CategoryStage
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
              onContinue={() => setStage('questions')}
              onBack={() => setStage('intro')}
              categoryRefs={categoryRefs}
            />
          )
        ) : (
          <CategoryStage
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
            onContinue={() => setStage('questions')}
            onBack={() => setStage('intro')}
            categoryRefs={categoryRefs}
          />
        )}
      </main>
      <footer className="site-footer">
        <span>AI EXPLORER / 2026</span>
        <span className="site-footer__line" aria-hidden="true" />
        <span>질문하고, 비교하고, 이해하기</span>
      </footer>
    </div>
  )
}

export default App
