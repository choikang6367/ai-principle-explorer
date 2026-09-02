import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  defaultImagePromptSelections,
  getImageComparisonSelections,
  getImagePromptChoice,
  getImagePromptClues,
  getImagePromptPreset,
  getImagePromptSentence,
  imagePromptQualityCues,
  imageCheckItems,
  imageComparisonOptions,
  imageDenoiseSteps,
  imagePromptFields,
  imagePromptPresets,
} from '../data/imageGeneration'
import type {
  ImageCheckItem,
  ImageComparison,
  ImageComparisonPart,
  ImageDenoiseStep,
  ImagePromptClue,
  ImagePromptPart,
  ImagePromptSelections,
} from '../types/experience'
import { GeneratedArtwork } from './ImageArtwork'
import { ImageProcessArtwork } from './ImageProcessArtwork'
import { ImageResultArtwork } from './ImageResultArtwork'

const imageGenerationStageLabels = ['소개', '프롬프트', '의미 단서', '숫자 지도', '노이즈', '여러 번 정리', '잠재 공간', '비교', '검사', '완료']
const comparisonParts: readonly ImageComparisonPart[] = ['place', 'style', 'mood']

function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

function assetSource(path: string) {
  return `${import.meta.env.BASE_URL}${path}`
}

function ImageGenerationProgress({ current }: { current: number }) {
  return (
    <div className="generation-progress" aria-label={`이미지 생성 원리 ${current + 1}단계, 전체 ${imageGenerationStageLabels.length}단계`}>
      <div className="generation-progress__label">IMAGE GENERATION PATH / {String(current + 1).padStart(2, '0')} OF 10</div>
      <div className="generation-progress__track">
        {imageGenerationStageLabels.map((label, index) => (
          <div
            className={`generation-progress__item ${index <= current ? 'is-active' : ''} ${index === current ? 'is-current' : ''}`}
            key={label}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className="generation-progress__number">{String(index + 1).padStart(2, '0')}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImageGenerationTopline({ label, current }: { label: string; current: number }) {
  return (
    <div className="stage-topline generation-topline">
      <p className="eyebrow">
        <span className="eyebrow__marker" aria-hidden="true" />
        AI 원리 탐험 <span className="eyebrow__slash">/</span> {label}
      </p>
      <ImageGenerationProgress current={current} />
    </div>
  )
}

function ImageGenerationHeading({
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
    <div className="generation-heading">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h1 id={id} tabIndex={-1}>
          {title}
          <span>{accent}</span>
        </h1>
      </div>
      <p className="generation-heading__description">{description}</p>
    </div>
  )
}

function ImageGenerationActions({
  backLabel,
  nextLabel,
  nextDisabled = false,
  onBack,
  onNext,
  note = '실제 이미지 생성 모델이 아닌, 원리를 쉽게 보는 교육용 모형이에요.',
}: {
  backLabel: string
  nextLabel: string
  nextDisabled?: boolean
  onBack: () => void
  onNext: () => void
  note?: string
}) {
  return (
    <div className="stage-actions generation-actions">
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
        className="primary-button generation-next"
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        onKeyDown={(event) => handleButtonKeyDown(event, onNext)}
      >
        {nextLabel}
        <span className="primary-button__arrow" aria-hidden="true">↗</span>
      </button>
      <p className="stage-note">
        <span className="stage-note__mark" aria-hidden="true">i</span>
        {note}
      </p>
    </div>
  )
}

function ProcessImage({
  step,
  selections,
  stepIndex,
  className = '',
}: {
  step: ImageDenoiseStep
  selections: ImagePromptSelections
  stepIndex: number
  className?: string
}) {
  const [assetState, setAssetState] = useState<'loading' | 'loaded' | 'failed'>('loading')
  const isProcessStep = stepIndex < imageDenoiseSteps.length - 1

  return (
    <figure className={`generation-process-figure ${className}`}>
      <div className="generation-process-figure__frame">
        {isProcessStep ? (
          <ImageProcessArtwork selections={selections} stepIndex={stepIndex} label={step.alt} />
        ) : (
          <img
            className={`generation-process-figure__asset ${assetState === 'loaded' ? 'is-loaded' : ''} ${assetState === 'failed' ? 'is-failed' : ''}`}
            src={assetSource(step.imagePath)}
            alt={step.alt}
            onLoad={() => setAssetState('loaded')}
            onError={() => setAssetState('failed')}
          />
        )}
        {!isProcessStep && assetState !== 'loaded' ? (
          <div className={`generation-process-figure__fallback ${assetState === 'failed' ? 'is-failed' : ''}`} role={assetState === 'failed' ? 'status' : undefined}>
            <span className="generation-process-figure__fallback-icon" aria-hidden="true">◌</span>
            <strong>{assetState === 'failed' ? '그림 자료를 불러오지 못했어요.' : '그림 자료를 준비하고 있어요.'}</strong>
            <span>{step.alt}</span>
          </div>
        ) : null}
        <span className="generation-process-figure__tag">EDUCATIONAL IMAGE / {step.shortLabel}</span>
      </div>
      <figcaption>{step.description}</figcaption>
    </figure>
  )
}

function ClueMarker({ clue, selected, onSelect }: { clue: ImagePromptClue; selected: boolean; onSelect: () => void }) {
  return (
    <button
      className={`generation-clue-marker ${selected ? 'is-selected' : ''}`}
      type="button"
      style={{ left: `${clue.x}%`, top: `${clue.y}%`, width: `${clue.width}%`, height: `${clue.height}%` }}
      aria-pressed={selected}
      aria-label={`${clue.label} 단서: ${clue.phrase}. ${clue.areaLabel}`}
      onClick={onSelect}
      onKeyDown={(event) => handleButtonKeyDown(event, onSelect)}
    >
      <span>{clue.label}</span>
    </button>
  )
}

export function ImageIntroStage({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <section className="image-generation-stage generation-stage stage-enter" aria-labelledby="image-generation-intro-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 시작" current={0} />
      <ImageGenerationHeading
        kicker="IMAGE GENERATION LAB"
        id="image-generation-intro-title"
        title={<>글로 부탁하면<br /></>}
        accent="그림이 만들어져요."
        description={<>완성 그림이 갑자기 나타나는 것이 아니라, 글의 단서를 참고하면서 여러 번 다듬어지는 흐름을 따라가 봐요.</>}
      />
      <div className="generation-intro-layout">
        <article className="generation-card generation-intro-card">
          <div className="generation-card__topline"><span>EDUCATIONAL MODEL / IMAGE</span><span>NO API · NO RANDOMNESS</span></div>
          <ImageResultArtwork selections={defaultImagePromptSelections} className="generation-intro-art" />
          <div className="generation-intro-flow" aria-label="이미지 생성 원리 흐름">
            <span>프롬프트</span><b>→</b><span>숫자 단서</span><b>→</b><span>노이즈</span><b>→</b><span>여러 번 정리</span><b>→</b><span>완성 그림</span>
          </div>
          <div className="generation-model-notice">
            <span className="generation-model-notice__icon" aria-hidden="true">i</span>
            <div><strong>이 체험은 실제 이미지 생성기가 아니에요.</strong><p>확산 기반 이미지 생성 방식을 이해하기 위한 교육용 모형입니다. 화면의 단계 그림은 모델의 내부 상태나 생각을 그대로 보여 주는 것이 아니에요.</p></div>
          </div>
        </article>
        <aside className="generation-info-card">
          <span className="generation-info-card__number">01</span>
          <p className="generation-info-card__label">먼저 기억할 것</p>
          <h2>AI는 글을<br /><span>숫자 단서로 바꿔요.</span></h2>
          <p className="generation-info-card__description">어떤 이미지 모델은 글의 의미를 조건 정보로 바꾸고, 무작위 노이즈를 참고 단서에 맞게 여러 번 정리해요.</p>
          <div className="generation-info-card__badge">모델마다 구조와 생성 방식은 다를 수 있어요.</div>
        </aside>
      </div>
      <ImageGenerationActions backLabel="세 체험 고르기" nextLabel="이미지 프롬프트 만들기" onBack={onBack} onNext={onNext} />
    </section>
  )
}

export function ImagePromptStage({
  selections,
  onSelectPreset,
  onBack,
  onNext,
}: {
  selections: ImagePromptSelections
  onSelectPreset: (selections: ImagePromptSelections) => void
  onBack: () => void
  onNext: () => void
}) {
  const promptSentence = getImagePromptSentence(selections)
  const selectedPreset = getImagePromptPreset(selections)

  return (
    <section className="image-generation-stage generation-stage stage-enter" aria-labelledby="image-generation-prompt-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 프롬프트" current={1} />
      <ImageGenerationHeading
        kicker="STEP 01 / BUILD A PROMPT"
        id="image-generation-prompt-title"
        title={<>완성도 높은 장면을<br /></>}
        accent="먼저 골라 봐요."
        description={<>세 가지 창작 방향에는 주인공부터 색감까지 필요한 단서가 모두 들어 있어요.<br />그림을 고르면 다섯 가지 단서가 한 문장으로 풀립니다.</>}
      />
      <div className="generation-prompt-layout">
        <article className="generation-card generation-prompt-card">
          <div className="generation-card__topline"><span>CHOOSE A CREATIVE ROUTE</span><span>3 POLISHED RESULTS / 5 CLUES EACH</span></div>
          <div className="generation-preset-grid" role="radiogroup" aria-label="이미지 창작 방향 선택">
            {imagePromptPresets.map((preset) => {
              const selected = selectedPreset?.id === preset.id
              return (
                <button
                  className={`generation-preset-card ${selected ? 'is-selected' : ''}`}
                  data-accent={preset.accent}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  key={preset.id}
                  onClick={() => onSelectPreset(preset.selections)}
                >
                  <span className="generation-preset-card__image"><img src={assetSource(preset.imagePath)} alt="" /><b>{preset.number}</b></span>
                  <span className="generation-preset-card__copy"><small>{selected ? 'SELECTED ROUTE' : 'CREATIVE ROUTE'}</small><strong>{preset.title}</strong><span>{preset.description}</span></span>
                  <span className="generation-preset-card__check" aria-hidden="true">{selected ? '✓' : '↗'}</span>
                </button>
              )
            })}
          </div>
        </article>
        <aside className="generation-prompt-preview generation-info-card">
          <span className="generation-info-card__number">A</span>
          <p className="generation-info-card__label">선택 즉시 결과 확인</p>
          <h2>이 장면을 만든<br /><span>그림 안내 문장</span></h2>
          <ImageResultArtwork selections={selections} className="generation-prompt-result" />
          <p className="generation-prompt-preview__sentence" aria-live="polite">{promptSentence || '선택지를 모두 채우면 문장이 완성돼요.'}</p>
          <div className="generation-prompt-preview__tags" aria-label="선택한 프롬프트 단서">
            {imagePromptFields.map((field) => {
              const selected = getImagePromptChoice(field.id, selections[field.id])
              return <span key={field.id}><b>{field.label}</b>{selected?.shortLabel ?? '고르기'}</span>
            })}
          </div>
          <div className="generation-prompt-preview__quality">
            <div className="generation-prompt-preview__quality-heading"><span>DETAIL BOOST</span><small>결과를 더 분명하게 만드는 안내</small></div>
            <div className="generation-prompt-preview__quality-cues">
              {imagePromptQualityCues.map((cue) => <span key={cue}>{cue}</span>)}
            </div>
          </div>
          <p className="generation-prompt-preview__note">문장을 그대로 그림에 붙이는 것이 아니라, 관련된 의미를 숫자 단서로 바꾸어 참고한다고 배워요.</p>
        </aside>
      </div>
      <ImageGenerationActions
        backLabel="이미지 생성 소개"
        nextLabel="글을 작은 단서로 나누기"
        nextDisabled={!selectedPreset}
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

export function ImageCluesStage({
  selections,
  onBack,
  onNext,
}: {
  selections: ImagePromptSelections
  onBack: () => void
  onNext: () => void
}) {
  const clues = useMemo(() => getImagePromptClues(selections), [selections])
  const [selectedClueId, setSelectedClueId] = useState(clues[0]?.id ?? '')
  const selectedClue = clues.find((clue) => clue.id === selectedClueId) ?? clues[0]

  return (
    <section className="image-generation-stage generation-stage stage-enter" aria-labelledby="image-generation-clues-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 의미 단서" current={2} />
      <ImageGenerationHeading
        kicker="STEP 02 / PROMPT BECOMES CLUES"
        id="image-generation-clues-title"
        title={<>문장을 작은<br /></>}
        accent="의미 단서로 나눠요."
        description={<>“고양이”, “달”, “동화책”처럼 단서마다 영향을 주는 부분이 달라요.<br />단서를 눌러 그림의 어느 부분과 연결되는지 확인해 보세요.</>}
      />
      <div className="generation-clues-layout">
        <article className="generation-card generation-clues-card">
          <div className="generation-card__topline"><span>PROMPT → MEANING CLUES</span><span>SELECT A CLUE</span></div>
          <div className="generation-clue-art-wrap">
            <GeneratedArtwork selections={selections} className="generation-clue-art" />
            {clues.map((clue) => (
              <ClueMarker key={clue.id} clue={clue} selected={clue.id === selectedClue?.id} onSelect={() => setSelectedClueId(clue.id)} />
            ))}
          </div>
          <div className="generation-clue-chips" aria-label="프롬프트 의미 단서">
            {clues.map((clue) => (
              <button
                key={clue.id}
                className={`generation-clue-chip ${clue.id === selectedClue?.id ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={clue.id === selectedClue?.id}
                onClick={() => setSelectedClueId(clue.id)}
                onKeyDown={(event) => handleButtonKeyDown(event, () => setSelectedClueId(clue.id))}
              >
                <span>{clue.label}</span><strong>{clue.phrase}</strong>
              </button>
            ))}
          </div>
        </article>
        <aside className="generation-info-card generation-clue-inspector">
          <span className="generation-info-card__number">02</span>
          <p className="generation-info-card__label">지금 참고하는 단서</p>
          <h2>{selectedClue?.label ?? '이'} 단서가<br /><span>그림에 영향을 줘요.</span></h2>
          {selectedClue ? (
            <div className="generation-clue-inspector__current" aria-live="polite">
              <span className="generation-clue-inspector__phrase">“{selectedClue.phrase}”</span>
              <strong>{selectedClue.areaLabel}</strong>
              <p>{selectedClue.description}</p>
            </div>
          ) : null}
          <div className="generation-clue-inspector__rule"><span>교육용 연결</span><b>단서 → 그림 부분</b></div>
        </aside>
      </div>
      <ImageGenerationActions backLabel="프롬프트 다시 고르기" nextLabel="숫자 지도로 바꾸기" onBack={onBack} onNext={onNext} />
    </section>
  )
}

function SignalBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="generation-signal">
      <span>{label}</span>
      <div className="generation-signal__track" role="progressbar" aria-label={`${label} 숫자 단서 ${value}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <span style={{ width: `${value}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  )
}

export function ImageMapStage({
  selections,
  onBack,
  onNext,
}: {
  selections: ImagePromptSelections
  onBack: () => void
  onNext: () => void
}) {
  const clues = useMemo(() => getImagePromptClues(selections), [selections])
  const [selectedPart, setSelectedPart] = useState<ImagePromptPart>(clues[0]?.part ?? 'subject')
  const selectedClue = clues.find((clue) => clue.part === selectedPart) ?? clues[0]

  return (
    <section className="image-generation-stage generation-stage stage-enter" aria-labelledby="image-generation-map-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 숫자 지도" current={3} />
      <ImageGenerationHeading
        kicker="STEP 03 / MEANING BECOMES A MAP"
        id="image-generation-map-title"
        title={<>AI가 알아보는<br /></>}
        accent="숫자 지도를 만들어요."
        description={<>단어를 그대로 그림에 붙이는 대신, 관련된 의미를 작은 숫자 단서로 바꾼다고 생각해 봐요.<br />카드를 누르면 한 단서의 숫자 지도를 볼 수 있어요.</>}
      />
      <div className="generation-map-layout">
        <article className="generation-card generation-map-card">
          <div className="generation-card__topline"><span>MEANING → NUMERIC CLUES</span><span>TEACHING MAP</span></div>
          <GeneratedArtwork selections={selections} className="generation-map-art" />
          <div className="generation-map-list" role="list" aria-label="프롬프트 단서의 숫자 지도">
            {clues.map((clue) => (
              <button
                key={clue.id}
                className={`generation-map-row ${clue.part === selectedClue?.part ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={clue.part === selectedClue?.part}
                onClick={() => setSelectedPart(clue.part)}
                onKeyDown={(event) => handleButtonKeyDown(event, () => setSelectedPart(clue.part))}
              >
                <span className="generation-map-row__label"><b>{clue.label}</b><strong>{clue.phrase}</strong></span>
                <span className="generation-map-row__signals"><SignalBar value={clue.signals[0] ?? 0} label="색" /><SignalBar value={clue.signals[1] ?? 0} label="모양" /><SignalBar value={clue.signals[2] ?? 0} label="의미" /></span>
              </button>
            ))}
          </div>
        </article>
        <aside className="generation-info-card generation-map-inspector">
          <span className="generation-info-card__number">03</span>
          <p className="generation-info-card__label">그림 안내 카드</p>
          <h2>의미를<br /><span>숫자 지도에 담아요.</span></h2>
          {selectedClue ? (
            <div className="generation-map-inspector__current" aria-live="polite">
              <span>{selectedClue.label}</span>
              <strong>“{selectedClue.phrase}”</strong>
              <p>이 카드는 실제 모델의 내부 벡터가 아니라, 의미가 숫자 단서로 바뀌는 모습을 보여 주는 교육용 예시예요.</p>
              <div className="generation-map-inspector__mini-vector"><i /><i /><i /><i /><i /></div>
            </div>
          ) : null}
          <div className="generation-info-card__formula"><span>글의 의미</span><b>→</b><strong>AI가 알아보는 숫자 지도</strong></div>
        </aside>
      </div>
      <ImageGenerationActions backLabel="의미 단서 다시 보기" nextLabel="무작위 노이즈에서 시작하기" onBack={onBack} onNext={onNext} />
    </section>
  )
}

export function ImageNoiseStage({ selections, onBack, onNext }: { selections: ImagePromptSelections; onBack: () => void; onNext: () => void }) {
  const noiseStep = imageDenoiseSteps[0]

  return (
    <section className="image-generation-stage generation-stage stage-enter" aria-labelledby="image-generation-noise-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 무작위 노이즈" current={4} />
      <ImageGenerationHeading
        kicker="STEP 04 / START FROM NOISE"
        id="image-generation-noise-title"
        title={<>처음부터 완성 그림을<br /></>}
        accent="알고 시작하지 않아요."
        description={<>일부 확산 기반 방식은 점과 색이 뒤섞인 무작위 노이즈에서 출발해요.<br />이 체험은 그 흐름을 단순화한 교육용 모형입니다.</>}
      />
      <div className="generation-noise-layout">
        <article className="generation-card generation-noise-card">
          <div className="generation-card__topline"><span>STARTING POINT / RANDOM NOISE</span><span>0% STRUCTURE</span></div>
          <ProcessImage step={noiseStep} selections={selections} stepIndex={0} className="generation-noise-image" />
          <div className="generation-noise-callout"><span aria-hidden="true">01</span><div><strong>노이즈는 정답 그림이 아니에요.</strong><p>여러 점과 색이 섞여 있는 시작 재료예요. 다음 단계부터 글의 단서를 참고하며 구조를 정리해 봅니다.</p></div></div>
        </article>
        <aside className="generation-info-card">
          <span className="generation-info-card__number">04</span>
          <p className="generation-info-card__label">확산 방식의 비유</p>
          <h2>잡음 속에서<br /><span>그림의 방향을 찾아요.</span></h2>
          <p className="generation-info-card__description">모든 이미지 AI가 같은 방식으로 움직이는 것은 아니지만, 확산 기반 모델은 노이즈를 반복적으로 정리하는 흐름으로 설명할 수 있어요.</p>
          <div className="generation-info-card__badge">실제 모델의 내부 상태를 그대로 보는 화면은 아니에요.</div>
        </aside>
      </div>
      <ImageGenerationActions backLabel="숫자 지도 다시 보기" nextLabel="노이즈를 여러 번 정리하기" onBack={onBack} onNext={onNext} />
    </section>
  )
}

export function ImageDenoiseStage({
  selections,
  stepIndex,
  onStepChange,
  onBack,
  onNext,
}: {
  selections: ImagePromptSelections
  stepIndex: number
  onStepChange: (index: number) => void
  onBack: () => void
  onNext: () => void
}) {
  const safeStepIndex = Math.min(Math.max(stepIndex, 0), imageDenoiseSteps.length - 1)
  const step = imageDenoiseSteps[safeStepIndex]
  const activeParts: readonly ImagePromptPart[] = step.activeParts
  const clues = useMemo(() => getImagePromptClues(selections), [selections])
  const [selectedClueId, setSelectedClueId] = useState(clues[0]?.id ?? '')
  const activeClues = clues.filter((clue) => activeParts.includes(clue.part))
  const selectedClue = activeClues.find((clue) => clue.id === selectedClueId) ?? activeClues[0]
  const isFinal = safeStepIndex === imageDenoiseSteps.length - 1
  const selectedPreset = getImagePromptPreset(selections)
  const displayedStep: ImageDenoiseStep = isFinal && selectedPreset
    ? { ...step, imagePath: selectedPreset.imagePath, alt: selectedPreset.imageAlt }
    : step

  return (
    <section className="image-generation-stage generation-stage stage-enter" aria-labelledby="image-generation-denoise-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 여러 번 정리" current={5} />
      <ImageGenerationHeading
        kicker="STEP 05 / ITERATIVE REFINEMENT"
        id="image-generation-denoise-title"
        title={<>노이즈가 그림으로<br /></>}
        accent="조금씩 정리돼요."
        description={<>아래 순서표나 슬라이더를 움직여 구조가 생기는 모습을 비교해 보세요.<br />빠른 자동 재생 없이, 내가 직접 한 단계씩 살펴봅니다.</>}
      />
      <div className="generation-denoise-layout">
        <article className="generation-card generation-denoise-card">
          <div className="generation-card__topline"><span>NOISE → STRUCTURE → DETAILS</span><span>{String(safeStepIndex + 1).padStart(2, '0')} / 07</span></div>
          <div className="generation-denoise-image-wrap">
            <ProcessImage step={displayedStep} selections={selections} stepIndex={safeStepIndex} className="generation-denoise-image" />
            <div className="generation-denoise-progress" style={{ width: `${step.revealPercent}%` }} aria-hidden="true" />
          </div>
          <div className="generation-denoise-current" aria-live="polite">
            <div><span>{step.shortLabel}</span><strong>{step.title}</strong></div>
            <em>{step.revealPercent}% 구조가 보이는 중</em>
          </div>
          <div className="generation-denoise-steps" role="list" aria-label="노이즈 정리 단계 선택">
            {imageDenoiseSteps.map((denoiseStep, index) => (
              <button
                key={denoiseStep.id}
                className={`generation-denoise-step ${index === safeStepIndex ? 'is-current' : ''} ${index < safeStepIndex ? 'is-complete' : ''}`}
                type="button"
                aria-current={index === safeStepIndex ? 'step' : undefined}
                aria-label={`${index + 1}단계 ${denoiseStep.shortLabel}`}
                onClick={() => onStepChange(index)}
                onKeyDown={(event) => handleButtonKeyDown(event, () => onStepChange(index))}
              >
                <span>{String(index + 1).padStart(2, '0')}</span><strong>{denoiseStep.shortLabel}</strong>
              </button>
            ))}
          </div>
          <label className="generation-denoise-slider-label" htmlFor="image-denoise-slider">정리 단계 직접 움직이기</label>
          <input
            id="image-denoise-slider"
            className="generation-denoise-slider"
            type="range"
            min="0"
            max={imageDenoiseSteps.length - 1}
            step="1"
            value={safeStepIndex}
            onChange={(event) => onStepChange(Number(event.target.value))}
            aria-valuetext={`${safeStepIndex + 1}단계, ${step.shortLabel}`}
          />
          <p className="generation-denoise-description">{step.description}</p>
        </article>
        <aside className="generation-info-card generation-denoise-inspector">
          <span className="generation-info-card__number">05</span>
          <p className="generation-info-card__label">현재 단계의 우선 단서</p>
          <h2>
            {step.activeParts.length === 0 ? <>아직 특정 단서를<br /><span>쓰지 않아요.</span></> : null}
            {step.activeParts.length > 0 && !isFinal ? <>지금은 이 단서를<br /><span>먼저 반영해요.</span></> : null}
            {isFinal ? <>모든 단서를<br /><span>함께 확인해요.</span></> : null}
          </h2>
          <div className="generation-denoise-clues" role="list" aria-label="그림을 참고하는 프롬프트 단서">
            {clues.map((clue) => {
              const active = activeParts.includes(clue.part)
              return (
                <button
                  key={clue.id}
                  className={`generation-denoise-clue ${active ? 'is-active' : ''} ${clue.id === selectedClue?.id ? 'is-selected' : ''}`}
                  type="button"
                  disabled={!active}
                  aria-pressed={active ? clue.id === selectedClue?.id : undefined}
                  onClick={() => setSelectedClueId(clue.id)}
                  onKeyDown={(event) => handleButtonKeyDown(event, () => setSelectedClueId(clue.id))}
                >
                  <span>{clue.label}<em>{active ? '지금' : '대기'}</em></span><strong>{clue.phrase}</strong>
                </button>
              )
            })}
          </div>
          {selectedClue ? <p className="generation-denoise-clue-copy" aria-live="polite"><strong>{selectedClue.areaLabel}</strong>{selectedClue.description}</p> : null}
          {!selectedClue ? <p className="generation-denoise-clue-copy is-empty" aria-live="polite"><strong>무작위 시작점</strong>아직 주인공, 장소, 스타일 같은 단서를 구체적인 구조로 드러내지 않는 단계예요.</p> : null}
          <div className="generation-denoise-inspector__notice">단서 순서는 이해를 돕기 위한 교육용 분해예요. 실제 모델에서는 여러 조건이 겹쳐 작용할 수 있어요.</div>
        </aside>
      </div>
      <ImageGenerationActions
        backLabel="무작위 노이즈 보기"
        nextLabel="잠재 공간과 디코딩 알아보기"
        nextDisabled={!isFinal}
        onBack={onBack}
        onNext={onNext}
        note="단계별 그림은 실제 모델 내부 상태를 그대로 재현하지 않는 교육용 시각화예요."
      />
    </section>
  )
}

export function ImageLatentStage({
  selections,
  onBack,
  onNext,
}: {
  selections: ImagePromptSelections
  onBack: () => void
  onNext: () => void
}) {
  return (
    <section className="image-generation-stage generation-stage stage-enter" aria-labelledby="image-generation-latent-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 잠재 공간과 디코딩" current={6} />
      <ImageGenerationHeading
        kicker="STEP 06 / LATENT SPACE + DECODING"
        id="image-generation-latent-title"
        title={<>작은 작업실에서<br /></>}
        accent="그림의 특징을 다뤄요."
        description={<>어떤 모델은 픽셀 전체 대신 압축된 표현을 작업 공간으로 사용해요.<br />마지막에는 디코더가 그 표현을 사람이 볼 수 있는 이미지로 바꿉니다.</>}
      />
      <div className="generation-latent-layout">
        <article className="generation-card generation-latent-card">
          <div className="generation-card__topline"><span>COMPRESSED FEATURES → DECODER</span><span>CONCEPT MAP</span></div>
          <div className="generation-latent-flow" aria-label="잠재 공간과 디코딩의 비유">
            <div className="generation-workshop"><span className="generation-workshop__label">작은 작업실</span><div className="generation-workshop__grid" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} />)}</div><strong>압축된 그림 특징</strong><small>색 · 모양 · 배치</small></div>
            <div className="generation-latent-arrow" aria-hidden="true">→</div>
            <div className="generation-decoder"><span className="generation-decoder__label">디코더</span><div className="generation-decoder__stack" aria-hidden="true"><i /><i /><i /></div><strong>사람이 보는 그림으로</strong><small>표현을 펼쳐요</small></div>
            <div className="generation-latent-arrow" aria-hidden="true">→</div>
            <ImageResultArtwork selections={selections} className="generation-latent-art" />
          </div>
          <div className="generation-latent-caption"><span>비유로 이해하기</span><p>작은 작업실은 그림의 중요한 특징을 압축해서 다루는 공간을 떠올리게 해요. 실제 모델의 구조와 크기는 모델마다 다릅니다.</p></div>
        </article>
        <aside className="generation-info-card">
          <span className="generation-info-card__number">06</span>
          <p className="generation-info-card__label">잠재 공간</p>
          <h2>압축된 표현을<br /><span>다시 펼쳐 보여 줘요.</span></h2>
          <p className="generation-info-card__description">잠재 공간은 그림의 특징을 압축해 작업하는 작은 작업실 같은 비유예요. 디코딩은 그 표현을 사람이 볼 수 있는 이미지로 바꾸는 과정이에요.</p>
          <div className="generation-info-card__badge">모든 이미지 모델이 같은 잠재 공간 구조를 사용하는 것은 아니에요.</div>
        </aside>
      </div>
      <ImageGenerationActions backLabel="정리 단계 다시 보기" nextLabel="프롬프트 변화 비교하기" onBack={onBack} onNext={onNext} />
    </section>
  )
}

function ComparisonCue({ comparison }: { comparison: ImageComparison }) {
  const [assetState, setAssetState] = useState<'loading' | 'loaded' | 'failed'>('loading')

  return (
    <div className="generation-comparison-cue">
      <img
        className={assetState === 'failed' ? 'is-failed' : ''}
        src={assetSource(comparison.cueImagePath)}
        alt={comparison.cueImageAlt}
        onLoad={() => setAssetState('loaded')}
        onError={() => setAssetState('failed')}
      />
      {assetState === 'failed' ? <span role="status">비교 그림을 불러오지 못했지만, 양쪽 구성 그림과 설명으로 비교할 수 있어요.</span> : null}
      <small>바뀐 단서의 예시 자료</small>
    </div>
  )
}

function comparisonChangeLabel(selections: ImagePromptSelections, comparison: ImageComparison) {
  const before = getImagePromptChoice(comparison.part, selections[comparison.part])
  const afterSelections = getImageComparisonSelections(selections, comparison)
  const after = getImagePromptChoice(comparison.part, afterSelections[comparison.part])
  return `${before?.label ?? '현재 선택'} → ${after?.label ?? '다른 선택'}`
}

export function ImageCompareStage({
  selections,
  selectedPart,
  onSelectPart,
  onBack,
  onNext,
}: {
  selections: ImagePromptSelections
  selectedPart: ImageComparisonPart
  onSelectPart: (part: ImageComparisonPart) => void
  onBack: () => void
  onNext: () => void
}) {
  const comparison = imageComparisonOptions.find((option) => option.part === selectedPart) ?? imageComparisonOptions[0]
  const beforeSelections = selections
  const afterSelections = comparison ? getImageComparisonSelections(selections, comparison) : selections
  const beforeChoice = getImagePromptChoice(selectedPart, beforeSelections[selectedPart])
  const afterChoice = getImagePromptChoice(selectedPart, afterSelections[selectedPart])

  const selectComparisonByKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = comparisonParts.indexOf(selectedPart)
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      onSelectPart(comparisonParts[(currentIndex + 1) % comparisonParts.length])
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      onSelectPart(comparisonParts[(currentIndex - 1 + comparisonParts.length) % comparisonParts.length])
    }
  }

  return (
    <section className="image-generation-stage generation-stage stage-enter" aria-labelledby="image-generation-compare-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 프롬프트 비교" current={7} />
      <ImageGenerationHeading
        kicker="STEP 07 / ONE CLUE CHANGES"
        id="image-generation-compare-title"
        title={<>단서 하나를 바꾸면<br /></>}
        accent="그림의 방향도 달라져요."
        description={<>장소, 스타일, 분위기 중 하나만 바꾼 전후를 비교해 봐요.<br />프롬프트가 결과에 영향을 주지만, 완벽하게 통제하는 리모컨은 아니에요.</>}
      />
      <div className="generation-compare-layout">
        <article className="generation-card generation-compare-card">
          <div className="generation-card__topline"><span>BEFORE ↔ AFTER</span><span>DETERMINISTIC TEACHING MODEL</span></div>
          <div className="generation-compare-tabs" role="tablist" aria-label="바꿔 볼 프롬프트 단서">
            {imageComparisonOptions.map((option) => (
              <button
                key={option.id}
                className={`generation-compare-tab ${option.part === selectedPart ? 'is-selected' : ''}`}
                type="button"
                role="tab"
                aria-selected={option.part === selectedPart}
                aria-controls="generation-compare-panel"
                tabIndex={option.part === selectedPart ? 0 : -1}
                onClick={() => onSelectPart(option.part)}
                onKeyDown={selectComparisonByKey}
              >
                <span>{option.label}</span><strong>{comparisonChangeLabel(selections, option)}</strong>
              </button>
            ))}
          </div>
          {comparison ? (
            <div className="generation-compare-panel" id="generation-compare-panel" role="tabpanel" aria-live="polite">
              <div className="generation-compare-pair">
                <div className="generation-compare-side generation-compare-side--before">
                  <div className="generation-compare-side__label"><span>BEFORE</span><strong>{beforeChoice?.label}</strong></div>
                  <GeneratedArtwork selections={beforeSelections} className="generation-compare-art" label={`변경 전 교육용 구성 그림: ${getImagePromptSentence(beforeSelections)}`} />
                  <p>{getImagePromptSentence(beforeSelections)}</p>
                </div>
                <div className="generation-compare-divider" aria-hidden="true">→</div>
                <div className="generation-compare-side generation-compare-side--after">
                  <div className="generation-compare-side__label"><span>AFTER / {comparison.label} CHANGE</span><strong>{afterChoice?.label}</strong></div>
                  <GeneratedArtwork selections={afterSelections} className="generation-compare-art" label={`변경 후 교육용 구성 그림: ${getImagePromptSentence(afterSelections)}`} />
                  <p>{getImagePromptSentence(afterSelections)}</p>
                </div>
              </div>
              <div className="generation-compare-explanation"><strong>{comparison.description}</strong><span>이 체험에서는 같은 선택 조합이 늘 같은 결과를 보여 주도록 결정적으로 만들었어요.</span></div>
              <ComparisonCue comparison={comparison} />
            </div>
          ) : null}
        </article>
        <aside className="generation-info-card">
          <span className="generation-info-card__number">07</span>
          <p className="generation-info-card__label">프롬프트의 영향</p>
          <h2>단서를 바꾸면<br /><span>참고할 방향이 바뀌어요.</span></h2>
          <p className="generation-info-card__description">실제 이미지 생성 결과는 무작위 시작값이나 모델 설정에 따라 달라질 수 있어요. 이 교육용 모형은 비교가 쉽도록 결과를 결정적으로 보여 줍니다.</p>
          <div className="generation-info-card__formula"><span>프롬프트 단서</span><b>↔</b><strong>결과에 미치는 영향</strong></div>
        </aside>
      </div>
      <ImageGenerationActions backLabel="잠재 공간 다시 보기" nextLabel="완성 이미지를 검사하기" onBack={onBack} onNext={onNext} />
    </section>
  )
}

export function ImageCheckStage({
  selections,
  completedCheckIds,
  onToggleCheck,
  onBack,
  onNext,
}: {
  selections: ImagePromptSelections
  completedCheckIds: readonly string[]
  onToggleCheck: (checkId: string, checked: boolean) => void
  onBack: () => void
  onNext: () => void
}) {
  const completedCount = imageCheckItems.filter((item) => completedCheckIds.includes(item.id)).length
  const allChecked = completedCount === imageCheckItems.length

  return (
    <section className="image-generation-stage generation-stage stage-enter" aria-labelledby="image-generation-check-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 결과 검사" current={8} />
      <ImageGenerationHeading
        kicker="STEP 08 / CHECK BEFORE TRUSTING"
        id="image-generation-check-title"
        title={<>완성된 그림을<br /></>}
        accent="그대로 믿지 말아요."
        description={<>이미지 생성 결과는 정답이나 증거가 아니에요.<br />아래 체크리스트를 직접 확인하며 결과를 살펴보는 습관을 연습해요.</>}
      />
      <div className="generation-check-layout">
        <article className="generation-card generation-check-card">
          <div className="generation-card__topline"><span>FINAL REVIEW / HUMAN CHECK</span><span>{completedCount} / {imageCheckItems.length} CHECKED</span></div>
          <div className="generation-check-preview">
            <ImageResultArtwork selections={selections} className="generation-check-art" label={`검사할 완성 그림: ${getImagePromptSentence(selections)}`} />
            <div className="generation-check-prompt"><span>처음 만든 프롬프트</span><p>{getImagePromptSentence(selections)}</p></div>
          </div>
          <div className="generation-checklist" role="group" aria-label="이미지 결과 검사 항목">
            {imageCheckItems.map((item) => {
              const checked = completedCheckIds.includes(item.id)
              return <CheckItem key={item.id} item={item} checked={checked} onToggle={(nextChecked) => onToggleCheck(item.id, nextChecked)} />
            })}
          </div>
        </article>
        <aside className="generation-info-card generation-check-info">
          <span className="generation-info-card__number">08</span>
          <p className="generation-info-card__label">사람의 마지막 확인</p>
          <h2>그림이 보여도<br /><span>확인이 필요해요.</span></h2>
          <p className="generation-info-card__description">사람의 손, 글자, 얼굴, 개수는 틀릴 수 있고, 사진처럼 보여도 실제 사건이나 인물의 증거가 아니에요.</p>
          <div className="generation-safety-warning"><strong>중요한 안내</strong><p>이 체크리스트는 연습용 안전 점검이며 실제 안전 보증이나 저작권 보장을 대신하지 않아요.</p></div>
        </aside>
      </div>
      <ImageGenerationActions
        backLabel="프롬프트 비교하기"
        nextLabel="전체 흐름 요약하기"
        nextDisabled={!allChecked}
        onBack={onBack}
        onNext={onNext}
        note="이미지 생성 결과는 사실 증거나 저작권 보장을 의미하지 않아요."
      />
    </section>
  )
}

function CheckItem({ item, checked, onToggle }: { item: ImageCheckItem; checked: boolean; onToggle: (checked: boolean) => void }) {
  return (
    <label className={`generation-check-item ${checked ? 'is-checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} />
      <span className="generation-check-item__box" aria-hidden="true">{checked ? '✓' : ''}</span>
      <span className="generation-check-item__copy"><strong>{item.label}</strong><small>{item.description}</small></span>
      <span className="generation-check-item__status">{checked ? item.statusLabel : '확인하기'}</span>
    </label>
  )
}

export function ImageCompleteStage({
  selections,
  completedCheckIds,
  onBack,
  onRestartPrompt,
  onChooseConversation,
}: {
  selections: ImagePromptSelections
  completedCheckIds: readonly string[]
  onBack: () => void
  onRestartPrompt: () => void
  onChooseConversation: () => void
}) {
  const clues = getImagePromptClues(selections)

  return (
    <section className="image-generation-stage generation-stage image-generation-complete stage-enter" aria-labelledby="image-generation-complete-title">
      <ImageGenerationTopline label="이미지 생성 원리 / 완료" current={9} />
      <ImageGenerationHeading
        kicker="DONE / LOOK, QUESTION, CHECK"
        id="image-generation-complete-title"
        title={<>한 장의 그림에도<br /></>}
        accent="여러 단계가 숨어 있어요."
        description={<>처음의 프롬프트부터 숫자 단서, 노이즈 정리, 검사까지 한 화면에 다시 모아 봐요.<br />완료 상태는 안전하게 저장되어 새로고침 후에도 이어집니다.</>}
      />
      <div className="generation-complete-layout">
        <article className="generation-card generation-complete-card">
          <div className="generation-card__topline"><span>IMAGE GENERATION / COMPLETE</span><span className="generation-complete-status"><i aria-hidden="true" /> SAVED</span></div>
          <div className="generation-complete-hero">
            <ImageResultArtwork selections={selections} className="generation-complete-art" label={`완료된 그림: ${getImagePromptSentence(selections)}`} />
            <div className="generation-complete-prompt"><span>처음 만든 프롬프트</span><p>{getImagePromptSentence(selections)}</p></div>
          </div>
          <div className="generation-complete-summary-grid">
            <section><span className="generation-summary-label">01 / 단서</span><div className="generation-summary-chips">{clues.map((clue) => <span key={clue.id}><b>{clue.label}</b>{clue.phrase}</span>)}</div></section>
            <section><span className="generation-summary-label">02 / 노이즈 정리</span><div className="generation-summary-steps">{imageDenoiseSteps.map((step, index) => <span key={step.id} className={index === imageDenoiseSteps.length - 1 ? 'is-final' : ''}><b>{String(index + 1).padStart(2, '0')}</b>{step.shortLabel}</span>)}</div></section>
            <section><span className="generation-summary-label">03 / 사람이 확인한 것</span><p className="generation-summary-check">{completedCheckIds.length}개 검사 항목을 확인했어요. 생성 결과를 그대로 믿지 않고 다시 살펴보는 습관이 중요해요.</p></section>
          </div>
          <div className="generation-complete-takeaway"><span aria-hidden="true">✦</span><div><strong>오늘의 핵심</strong><p>프롬프트의 의미가 숫자 단서가 되고, 노이즈가 여러 단계에 걸쳐 정리되며, 마지막에는 사람이 결과를 확인해요.</p></div></div>
        </article>
        <aside className="generation-info-card generation-complete-info">
          <span className="generation-info-card__number">09</span>
          <p className="generation-info-card__label">전체 흐름</p>
          <h2>질문하고,<br /><span>다듬고, 확인해요.</span></h2>
          <div className="generation-complete-flow" aria-label="완료한 이미지 생성 흐름"><span>프롬프트</span><b>→</b><span>숫자 지도</span><b>→</b><span>노이즈</span><b>→</b><span>정리</span><b>→</b><span>검사</span></div>
          <p className="generation-info-card__description">새로운 프롬프트를 고르면 또 다른 조합을 비교할 수 있어요. 글 생성 원리 탐험으로 돌아가 두 방식의 공통점도 찾아보세요.</p>
        </aside>
      </div>
      <div className="stage-actions generation-complete-actions">
        <button className="back-button" type="button" onClick={onBack} onKeyDown={(event) => handleButtonKeyDown(event, onBack)}><span aria-hidden="true">←</span>검사 다시 보기</button>
        <p className="stage-note"><span className="stage-note__mark" aria-hidden="true">i</span>완료 상태와 프롬프트 선택은 새로고침 후에도 복원돼요.</p>
        <div className="generation-complete-actions__buttons">
          <button className="secondary-button" type="button" onClick={onRestartPrompt} onKeyDown={(event) => handleButtonKeyDown(event, onRestartPrompt)}>다른 프롬프트로 다시 만들기 <span aria-hidden="true">↗</span></button>
          <button className="primary-button" type="button" onClick={onChooseConversation} onKeyDown={(event) => handleButtonKeyDown(event, onChooseConversation)}>글 생성 원리 탐험하기 <span className="primary-button__arrow" aria-hidden="true">↗</span></button>
        </div>
      </div>
    </section>
  )
}
