import { useState, type CSSProperties, type KeyboardEvent, type MutableRefObject, type ReactNode } from 'react'
import type {
  ImageExperience,
  ImageFeature,
  ImagePixelSample,
  ImagePrediction,
} from '../types/experience'

const imageStageLabels = ['사진 보기', '숫자로 보기', '특징 찾기', 'AI의 예상', '결과']

function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

function imageStyle(experience: ImageExperience): CSSProperties {
  return {
    '--image-accent': `var(--${experience.accent})`,
  } as CSSProperties
}

function assetSource(path: string) {
  return `${import.meta.env.BASE_URL}${path}`
}

function ImageVisual({
  experience,
  className = '',
  children,
  ariaLabel,
  interactive = false,
}: {
  experience: ImageExperience
  className?: string
  children?: ReactNode
  ariaLabel?: string
  interactive?: boolean
}) {
  const [assetState, setAssetState] = useState<'pending' | 'loaded' | 'failed'>('pending')

  return (
    <div
      className={`image-visual ${className}`}
      data-accent={experience.accent}
      data-surface={experience.visual.background}
      role={interactive ? 'group' : 'img'}
      aria-label={ariaLabel ?? `${experience.name} 이미지`}
      style={imageStyle(experience)}
    >
      <div className={`image-visual__placeholder ${assetState === 'loaded' ? 'is-hidden' : ''}`} aria-hidden="true">
        <span className="image-visual__placeholder-kicker">IMAGE SAMPLE</span>
        <span className="image-visual__emoji">{experience.visual.emoji}</span>
        <span className="image-visual__caption">{experience.visual.caption}</span>
      </div>
      <img
        className={`image-visual__asset ${assetState === 'loaded' ? 'is-visible' : ''}`}
        src={assetSource(experience.imagePath)}
        alt=""
        aria-hidden="true"
        onLoad={() => setAssetState('loaded')}
        onError={() => setAssetState('failed')}
      />
      <div className="image-visual__grain" aria-hidden="true" />
      <div className="image-visual__scanline" aria-hidden="true" />
      {children}
    </div>
  )
}

export function ImageStageProgress({ current }: { current: number }) {
  return (
    <div className="image-stage-progress" aria-label={`이미지 체험 ${current + 1}단계, 전체 ${imageStageLabels.length}단계`}>
      <div className="image-stage-progress__label">IMAGE READING PATH / {String(current + 1).padStart(2, '0')} OF 05</div>
      <div className="image-stage-progress__track">
        {imageStageLabels.map((label, index) => (
          <div
            className={`image-stage-progress__item ${index <= current ? 'is-active' : ''} ${index === current ? 'is-current' : ''}`}
            key={label}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className="image-stage-progress__dot" aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImageStageTopline({ label, current }: { label: string; current: number }) {
  return (
    <div className="stage-topline image-stage-topline">
      <p className="eyebrow">
        <span className="eyebrow__marker" aria-hidden="true" />
        AI 원리 탐험 <span className="eyebrow__slash">/</span> {label}
      </p>
      <ImageStageProgress current={current} />
    </div>
  )
}

function ImageStageHeading({
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
    <div className="image-stage-heading">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h1 id={id} tabIndex={-1}>
          {title}
          <span>{accent}</span>
        </h1>
      </div>
      <p className="image-stage-heading__description">{description}</p>
    </div>
  )
}

function ImageStageActions({
  backLabel,
  nextLabel,
  nextDisabled = false,
  onBack,
  onNext,
}: {
  backLabel: string
  nextLabel: string
  nextDisabled?: boolean
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="stage-actions image-stage-actions">
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
        className="primary-button image-stage-next"
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
        실제 AI 계산이 아닌, 원리를 쉽게 보는 교육용 모형이에요.
      </p>
    </div>
  )
}

function MiniImage({ experience }: { experience: ImageExperience }) {
  const [assetState, setAssetState] = useState<'pending' | 'loaded' | 'failed'>('pending')

  return (
    <span className="mini-image" data-surface={experience.visual.background} aria-hidden="true">
      <span className={`mini-image__fallback ${assetState === 'loaded' ? 'is-hidden' : ''}`}>
        {experience.visual.emoji}
      </span>
      <img
        className={`mini-image__asset ${assetState === 'loaded' ? 'is-visible' : ''}`}
        src={assetSource(experience.imagePath)}
        alt=""
        onLoad={() => setAssetState('loaded')}
        onError={() => setAssetState('failed')}
      />
      <span className="mini-image__shine" />
    </span>
  )
}

export function ImageSelectionStage({
  experiences,
  selectedImageId,
  imageRefs,
  onSelect,
  onContinue,
  onBack,
}: {
  experiences: readonly ImageExperience[]
  selectedImageId: string | null
  imageRefs: MutableRefObject<Array<HTMLButtonElement | null>>
  onSelect: (imageId: string) => void
  onContinue: () => void
  onBack: () => void
}) {
  const selected = experiences.find((experience) => experience.id === selectedImageId)

  const moveFocus = (index: number, direction: 1 | -1) => {
    const nextIndex = (index + direction + experiences.length) % experiences.length
    imageRefs.current[nextIndex]?.focus()
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number, imageId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(imageId)
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
    <section className="image-selection-stage stage-enter" aria-labelledby="image-selection-title">
      <div className="stage-topline image-selection-topline">
        <p className="eyebrow">
          <span className="eyebrow__marker" aria-hidden="true" />
          두 번째 체험 <span className="eyebrow__slash">/</span> 분석할 사진 고르기
        </p>
        <div className="image-selection-count">10개의 사진 · 하나를 골라 보세요</div>
      </div>
      <ImageStageHeading
        kicker="IMAGE READING LAB"
        id="image-selection-title"
        title={<>어떤 사진을<br /></>}
        accent="AI에게 보여줄까요?"
        description={<>사진을 고르면 사람이 보는 방법부터 시작해요.<br />그다음 AI가 사진을 숫자와 특징으로 바꾸는 과정을 따라가 봅니다.</>}
      />
      <div className="image-selection-layout">
        <div className="image-selection-grid" aria-label="분석할 사진 선택">
          {experiences.map((experience, index) => {
            const isSelected = experience.id === selectedImageId

            return (
              <button
                key={experience.id}
                ref={(element) => {
                  imageRefs.current[index] = element
                }}
                className={`image-choice-card ${isSelected ? 'is-selected' : ''}`}
                data-accent={experience.accent}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(experience.id)}
                onKeyDown={(event) => handleCardKeyDown(event, index, experience.id)}
              >
                <span className="image-choice-card__topline">
                  <span>PHOTO {String(index + 1).padStart(2, '0')}</span>
                  <span>{isSelected ? 'SELECTED' : 'EXPLORE'}</span>
                </span>
                <MiniImage experience={experience} />
                <span className="image-choice-card__name">{experience.name}</span>
                <span className="image-choice-card__english">{experience.englishLabel}</span>
                <span className="image-choice-card__corner" aria-hidden="true">↗</span>
              </button>
            )
          })}
        </div>
        <aside className={`image-selection-panel ${selected ? 'has-selection' : ''}`} aria-live="polite">
          {selected ? (
            <>
              <p className="image-selection-panel__label">선택한 사진</p>
              <div className="image-selection-panel__preview">
                <MiniImage experience={selected} />
                <div>
                  <h2>{selected.name}</h2>
                  <span>{selected.englishLabel}</span>
                </div>
              </div>
              <p className="image-selection-panel__description">{selected.studentTip}</p>
              <button
                className="primary-button image-selection-start"
                type="button"
                onClick={onContinue}
                onKeyDown={(event) => handleButtonKeyDown(event, onContinue)}
              >
                이 사진으로 시작하기
                <span className="primary-button__arrow" aria-hidden="true">↗</span>
              </button>
            </>
          ) : (
            <>
              <span className="selection-panel__pulse" aria-hidden="true" />
              <p className="image-selection-panel__label">PICK A PHOTO</p>
              <h2>사진을 고르면<br />분석이 시작돼요.</h2>
              <p className="image-selection-panel__empty-description">카드에 초점을 맞춘 뒤 Enter를 눌러도 좋아요.</p>
            </>
          )}
        </aside>
      </div>
      <div className="stage-actions image-selection-actions">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
          onKeyDown={(event) => handleButtonKeyDown(event, onBack)}
        >
          <span aria-hidden="true">←</span>
          처음으로
        </button>
        <p className="keyboard-hint keyboard-hint--wide">
          <kbd>←</kbd>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>→</kbd>
          <span>사진 이동</span>
          <span className="keyboard-hint__divider" aria-hidden="true" />
          <kbd>Enter</kbd>
          <span>선택</span>
        </p>
        <p className="stage-note">
          <span className="stage-note__mark" aria-hidden="true">i</span>
          모든 사진은 공개 라이선스 자료로 구성했어요.
        </p>
      </div>
    </section>
  )
}

export function ImageViewStage({
  experience,
  selectedGuess,
  onSelectGuess,
  onBack,
  onNext,
}: {
  experience: ImageExperience
  selectedGuess: string | null
  onSelectGuess: (guess: string) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <section className="image-stage stage-enter" aria-labelledby="image-view-title">
      <ImageStageTopline label="첫 번째 장면 / 사진 보기" current={0} />
      <ImageStageHeading
        kicker="STEP 01 / A PERSON LOOKS"
        id="image-view-title"
        title={<>사람은 사진을<br /></>}
        accent="한눈에 볼 수 있어요."
        description={<>먼저 AI의 답을 보지 않고, 내가 사진을 보는 방법을 생각해 봐요.<br />사람의 시선과 AI의 처리 방법은 어떻게 다를까요?</>}
      />
      <div className="image-stage-layout">
        <article className="image-learning-card image-view-card">
          <div className="image-learning-card__topline">
            <span>PHOTO → MY FIRST THOUGHT</span>
            <span>WAITING FOR A GUESS</span>
          </div>
          <div className="image-view-question">
            <span>내가 먼저 생각해 보기</span>
            <h2>{experience.prompt}</h2>
          </div>
          <ImageVisual experience={experience} className="image-view-visual" ariaLabel={`${experience.name} 실제 사진`} />
          <div className="image-guess-area">
            <div className="image-guess-area__topline">
              <span>MY GUESS</span>
              <span>하나를 선택해 보세요</span>
            </div>
            <div className="image-guess-options" role="group" aria-label="사진에 대한 나의 예상">
              {experience.choices.map((choice) => (
                <button
                  key={choice}
                  className={`image-guess-option ${selectedGuess === choice ? 'is-selected' : ''}`}
                  type="button"
                  aria-pressed={selectedGuess === choice}
                  onClick={() => onSelectGuess(choice)}
                  onKeyDown={(event) => handleButtonKeyDown(event, () => onSelectGuess(choice))}
                >
                  <span className="image-guess-option__radio" aria-hidden="true" />
                  {choice}
                </button>
              ))}
            </div>
          </div>
          <div className="image-lesson-note">
            <span className="learning-card__explanation-label">지금 기억할 것</span>
            <p>사람은 사진을 보고 빠르게 의미를 떠올릴 수 있어요. 다음 장면에서는 같은 사진이 AI에게 어떻게 보이는지 확인해 봅니다.</p>
          </div>
        </article>
        <aside className="image-info-card">
          <span className="image-info-card__number">01</span>
          <p className="image-info-card__label">사람의 시선</p>
          <h2>우리는 사진을<br /><span>뜻으로 바로 읽어요.</span></h2>
          <p className="image-info-card__description">사진을 보자마자 “고양이”, “자동차”처럼 이름과 의미가 떠오르죠. AI는 이 이름을 처음부터 보는 것이 아니에요.</p>
          <div className="image-info-card__badge">먼저 나의 생각을 고른 뒤 다음 장면으로 이동해요.</div>
        </aside>
      </div>
      <ImageStageActions
        backLabel="사진 다시 고르기"
        nextLabel="사진을 숫자로 바꿔 보기"
        nextDisabled={!selectedGuess}
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

function PixelValue({ sample }: { sample: ImagePixelSample }) {
  return (
    <div className="pixel-value" aria-live="polite">
      <div className="pixel-value__topline">
        <span>SELECTED PIXEL</span>
        <span className="pixel-value__swatch" style={{ backgroundColor: `rgb(${sample.r}, ${sample.g}, ${sample.b})` }} aria-hidden="true" />
      </div>
      <strong>{sample.label}</strong>
      <div className="pixel-value__channels">
        <span><b>R</b>{sample.r}</span>
        <span><b>G</b>{sample.g}</span>
        <span><b>B</b>{sample.b}</span>
      </div>
    </div>
  )
}

export function ImageNumbersStage({
  experience,
  onBack,
  onNext,
}: {
  experience: ImageExperience
  onBack: () => void
  onNext: () => void
}) {
  const [selectedPixelId, setSelectedPixelId] = useState(experience.pixelSamples[0]?.id ?? '')
  const selectedSample = experience.pixelSamples.find((sample) => sample.id === selectedPixelId) ?? experience.pixelSamples[0]

  return (
    <section className="image-stage stage-enter" aria-labelledby="image-numbers-title">
      <ImageStageTopline label="두 번째 장면 / 숫자로 보기" current={1} />
      <ImageStageHeading
        kicker="STEP 02 / PIXELS BECOME NUMBERS"
        id="image-numbers-title"
        title={<>AI에게 사진은<br /></>}
        accent="숫자들의 모음이에요."
        description={<>사진을 확대하면 작은 칸, 픽셀이 보여요.<br />픽셀을 눌러 색과 밝기가 숫자로 표현되는 모습을 확인해 보세요.</>}
      />
      <div className="image-stage-layout">
        <article className="image-learning-card image-numbers-card">
          <div className="image-learning-card__topline">
            <span>PHOTO → PIXELS → NUMBERS</span>
            <span>CLICK A PIXEL</span>
          </div>
          <div className="image-numbers-visual-wrap">
            <ImageVisual
              experience={experience}
              className="image-numbers-visual"
              interactive
              ariaLabel={`${experience.name} 이미지의 픽셀을 선택하는 영역`}
            >
              <div className="image-pixel-grid" aria-hidden="true" />
              {experience.pixelSamples.map((sample) => (
                <button
                  key={sample.id}
                  className={`image-pixel-point ${sample.id === selectedPixelId ? 'is-selected' : ''}`}
                  type="button"
                  style={{ left: `${sample.x}%`, top: `${sample.y}%` }}
                  aria-label={`${sample.label}, RGB ${sample.r}, ${sample.g}, ${sample.b}`}
                  onClick={() => setSelectedPixelId(sample.id)}
                >
                  <span aria-hidden="true" />
                </button>
              ))}
            </ImageVisual>
          </div>
          {selectedSample ? <PixelValue sample={selectedSample} /> : null}
          <div className="image-lesson-note">
            <span className="learning-card__explanation-label">사진 → 숫자</span>
            <p>우리는 사진을 보고 바로 이름을 떠올리지만, AI는 색과 밝기를 나타내는 많은 숫자로 바꾸어 살펴봐요.</p>
          </div>
        </article>
        <aside className="image-info-card">
          <span className="image-info-card__number">02</span>
          <p className="image-info-card__label">픽셀 읽기</p>
          <h2>AI는 먼저<br /><span>숫자를 살펴봐요.</span></h2>
          <p className="image-info-card__description">R, G, B는 색의 세 가지 양을 나타내는 예시예요. 어려운 계산보다 “사진이 숫자로 바뀐다”는 점을 기억하면 충분해요.</p>
          <div className="image-info-card__formula"><span>사진</span><b>→</b><strong>색과 밝기의 숫자</strong></div>
        </aside>
      </div>
      <ImageStageActions
        backLabel="사진 보기"
        nextLabel="작은 특징 찾아 보기"
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

function FeatureHighlight({
  feature,
  isSelected,
  onSelect,
}: {
  feature: ImageFeature
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      className={`feature-highlight feature-highlight--${feature.kind} feature-highlight--${feature.marker} ${isSelected ? 'is-selected' : ''}`}
      type="button"
      style={{ left: `${feature.x}%`, top: `${feature.y}%`, width: `${feature.width}%`, height: `${feature.height}%` }}
      aria-label={`${feature.label}: ${feature.description}`}
      onClick={onSelect}
    >
      <span>{feature.label}</span>
    </button>
  )
}

export function ImageFeaturesStage({
  experience,
  onBack,
  onNext,
}: {
  experience: ImageExperience
  onBack: () => void
  onNext: () => void
}) {
  const [revealedCount, setRevealedCount] = useState(Math.min(1, experience.features.length))
  const [selectedFeatureId, setSelectedFeatureId] = useState(experience.features[0]?.id ?? '')
  const revealedFeatures = experience.features.slice(0, revealedCount)
  const selectedFeature = experience.features.find((feature) => feature.id === selectedFeatureId) ?? revealedFeatures[revealedFeatures.length - 1]
  const hasAllFeatures = revealedCount >= experience.features.length

  const revealNextFeature = () => {
    const nextFeature = experience.features[revealedCount]
    if (!nextFeature) {
      return
    }
    setSelectedFeatureId(nextFeature.id)
    setRevealedCount((count) => count + 1)
  }

  return (
    <section className="image-stage stage-enter" aria-labelledby="image-features-title">
      <ImageStageTopline label="세 번째 장면 / 특징 찾기" current={2} />
      <ImageStageHeading
        kicker="STEP 03 / SMALL FEATURES"
        id="image-features-title"
        title={<>AI가 사진에서<br /></>}
        accent="작은 특징을 찾아요."
        description={<>AI는 사진 전체를 한 번에 “이름”으로 읽지 않아요.<br />색, 선, 모양처럼 작은 단서를 하나씩 찾아봅니다.</>}
      />
      <div className="image-stage-layout">
        <article className="image-learning-card image-features-card">
          <div className="image-learning-card__topline">
            <span>LOOKING FOR FEATURES</span>
            <span>{String(revealedCount).padStart(2, '0')} / {String(experience.features.length).padStart(2, '0')} FOUND</span>
          </div>
          <div className="image-feature-visual-wrap">
            <ImageVisual
              experience={experience}
              className="image-feature-visual"
              ariaLabel={`${experience.name} 이미지 위에 발견한 특징을 표시한 영역`}
            >
              {revealedFeatures.map((feature) => (
                <FeatureHighlight
                  key={feature.id}
                  feature={feature}
                  isSelected={feature.id === selectedFeatureId}
                  onSelect={() => setSelectedFeatureId(feature.id)}
                />
              ))}
            </ImageVisual>
          </div>
          <div className="image-feature-legend" aria-label="특징 종류">
            <span><i className="image-feature-legend__dot image-feature-legend__dot--color" />색과 밝기</span>
            <span><i className="image-feature-legend__dot image-feature-legend__dot--shape" />선과 모양</span>
            <span><i className="image-feature-legend__dot image-feature-legend__dot--detail" />더 복잡한 단서</span>
          </div>
          <div className="image-lesson-note">
            <span className="learning-card__explanation-label">지금 보고 있는 것</span>
            <p>{hasAllFeatures ? '작은 특징을 모두 확인했어요. 이제 이 특징들을 함께 비교해 볼게요.' : '하이라이트가 켜진 부분을 눌러 보고, 아래 버튼으로 다음 특징을 찾아보세요.'}</p>
          </div>
        </article>
        <aside className="image-info-card image-feature-inspector">
          <span className="image-info-card__number">03</span>
          <p className="image-info-card__label">발견한 특징</p>
          <h2>작은 단서가<br /><span>차곡차곡 쌓여요.</span></h2>
          {selectedFeature ? (
            <div className="image-feature-current" aria-live="polite">
              <span>NOW LOOKING</span>
              <strong>{selectedFeature.label}</strong>
              <p>{selectedFeature.description}</p>
            </div>
          ) : null}
          <div className="image-feature-list" aria-label="발견한 특징 목록">
            {experience.features.map((feature, index) => {
              const isRevealed = index < revealedCount
              return (
                <button
                  key={feature.id}
                  className={`image-feature-list__item ${isRevealed ? 'is-revealed' : ''} ${selectedFeatureId === feature.id ? 'is-selected' : ''}`}
                  type="button"
                  disabled={!isRevealed}
                  onClick={() => setSelectedFeatureId(feature.id)}
                >
                  <span aria-hidden="true">{isRevealed ? '✓' : String(index + 1).padStart(2, '0')}</span>
                  {feature.label}
                </button>
              )
            })}
          </div>
          {!hasAllFeatures ? (
            <button
              className="secondary-button image-feature-reveal-button"
              type="button"
              onClick={revealNextFeature}
            >
              다음 특징 보기
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <div className="image-feature-complete"><span aria-hidden="true">✓</span> 특징 조합 준비 완료</div>
          )}
        </aside>
      </div>
      <ImageStageActions
        backLabel="숫자로 보기"
        nextLabel="AI의 예상 확인하기"
        nextDisabled={!hasAllFeatures}
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

function PredictionBars({ predictions }: { predictions: readonly ImagePrediction[] }) {
  return (
    <div className="image-prediction-bars" aria-label="AI가 계산한 예상 확률">
      {predictions.map((prediction, index) => (
        <div className={`image-prediction-row ${index === 0 ? 'is-leading' : ''}`} key={prediction.label}>
          <div className="image-prediction-row__topline">
            <span>{prediction.label}</span>
            <strong>{prediction.probability}%</strong>
          </div>
          <div className="image-prediction-row__track" role="progressbar" aria-label={`${prediction.label} ${prediction.probability}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={prediction.probability}>
            <span style={{ width: `${prediction.probability}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function leadingPrediction(predictions: readonly ImagePrediction[]) {
  return predictions.reduce((leading, current) => current.probability > leading.probability ? current : leading, predictions[0])
}

export function ImagePredictionStage({
  experience,
  onBack,
  onNext,
}: {
  experience: ImageExperience
  onBack: () => void
  onNext: () => void
}) {
  const [snapshotIndex, setSnapshotIndex] = useState(0)
  const snapshot = experience.predictionSnapshots[snapshotIndex] ?? experience.predictionSnapshots[experience.predictionSnapshots.length - 1]
  const isFinalSnapshot = snapshotIndex >= experience.predictionSnapshots.length - 1

  return (
    <section className="image-stage stage-enter" aria-labelledby="image-prediction-title">
      <ImageStageTopline label="네 번째 장면 / AI의 예상" current={3} />
      <ImageStageHeading
        kicker="STEP 04 / MORE INFORMATION, NEW GUESS"
        id="image-prediction-title"
        title={<>정보가 늘어나면<br /></>}
        accent="AI의 예상도 바뀔 수 있어요."
        description={<>AI는 여러 후보가 얼마나 가능성 있는지 계산해요.<br />사진을 더 보여 줄 때 막대가 어떻게 달라지는지 확인해 보세요.</>}
      />
      <div className="image-stage-layout">
        <article className="image-learning-card image-prediction-card">
          <div className="image-learning-card__topline">
            <span>FEATURES → POSSIBILITIES</span>
            <span>{isFinalSnapshot ? 'FULL VIEW' : `VIEW ${snapshotIndex + 1} / ${experience.predictionSnapshots.length}`}</span>
          </div>
          <div className="image-prediction-visual-wrap">
            <ImageVisual experience={experience} className="image-prediction-visual" ariaLabel={`${experience.name} 이미지와 정보 공개 범위`}>
              {!isFinalSnapshot ? (
                <div className="image-prediction-cover" style={{ width: `${100 - snapshot.revealPercent}%` }}>
                  <span>아직 보지 않은 부분</span>
                </div>
              ) : null}
              <div className="image-prediction-reveal-label"><span>{snapshot.revealPercent}%</span> 사진을 확인했어요</div>
            </ImageVisual>
          </div>
          <div className="image-prediction-state" aria-live="polite">
            <div className="image-prediction-state__topline"><span>현재 정보</span><strong>{snapshot.title}</strong></div>
            <p>{snapshot.description}</p>
          </div>
          <PredictionBars predictions={snapshot.predictions} />
          {!isFinalSnapshot ? (
            <button
              className="secondary-button image-prediction-more"
              type="button"
              onClick={() => setSnapshotIndex((index) => Math.min(index + 1, experience.predictionSnapshots.length - 1))}
            >
              사진의 더 많은 부분 보기
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <div className="image-prediction-complete"><span aria-hidden="true">✓</span> 가장 높은 가능성을 확인했어요</div>
          )}
        </article>
        <aside className="image-info-card">
          <span className="image-info-card__number">04</span>
          <p className="image-info-card__label">가능성 계산</p>
          <h2>AI는 정답을<br /><span>무조건 아는 게 아니에요.</span></h2>
          <p className="image-info-card__description">배운 패턴과 지금 찾은 특징을 비교해서, 무엇일 가능성이 높은지 숫자로 나타내요. 정보가 적을 때는 헷갈릴 수도 있어요.</p>
          <div className="image-info-card__formula"><span>특징 조합</span><b>→</b><strong>가능성 비교</strong></div>
        </aside>
      </div>
      <ImageStageActions
        backLabel="특징 다시 보기"
        nextLabel="사람과 AI의 생각 비교하기"
        nextDisabled={!isFinalSnapshot}
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  )
}

export function ImageResultStage({
  experience,
  selectedGuess,
  onBack,
  onOtherImage,
  onRestart,
}: {
  experience: ImageExperience
  selectedGuess: string | null
  onBack: () => void
  onOtherImage: () => void
  onRestart: () => void
}) {
  const finalSnapshot = experience.predictionSnapshots[experience.predictionSnapshots.length - 1]
  const aiPrediction = leadingPrediction(finalSnapshot.predictions)
  const isCorrect = selectedGuess === experience.answer

  return (
    <section className="image-stage image-result-stage stage-enter" aria-labelledby="image-result-title">
      <ImageStageTopline label="마지막 장면 / 결과 비교" current={4} />
      <ImageStageHeading
        kicker="STEP 05 / PERSON + AI"
        id="image-result-title"
        title={<>사람과 AI는<br /></>}
        accent="어떻게 다르게 볼까요?"
        description={<>처음의 나의 선택과 AI의 최종 예상 결과를 나란히 비교해 봐요.<br />AI가 어떤 특징을 함께 사용했는지도 다시 확인할 수 있어요.</>}
      />
      <div className="image-result-layout">
        <article className="image-result-card">
          <div className="image-learning-card__topline">
            <span>MY THOUGHT ↔ AI'S GUESS</span>
            <span>FINAL RESULT</span>
          </div>
          <div className="image-result-card__image-row">
            <ImageVisual experience={experience} className="image-result-visual" ariaLabel={`${experience.name} 최종 이미지`} />
            <div className="image-result-card__summary">
              <span className="image-result-card__summary-label">최종 AI 예상</span>
              <strong>{aiPrediction.label}</strong>
              <span>{aiPrediction.probability}% 가능성</span>
            </div>
          </div>
          <div className="image-result-choices">
            <div className="image-result-choice image-result-choice--student">
              <span>나의 선택</span>
              <strong>{selectedGuess ?? '선택하지 않음'}</strong>
            </div>
            <div className="image-result-choice image-result-choice--ai">
              <span>AI의 예상</span>
              <strong>{aiPrediction.label}</strong>
              <em>{aiPrediction.probability}%</em>
            </div>
          </div>
          <div className={`image-result-verdict ${isCorrect ? 'is-correct' : ''}`} aria-live="polite">
            <span aria-hidden="true">{isCorrect ? '✓' : '↗'}</span>
            <div>
              <strong>{isCorrect ? '나의 생각과 AI의 예상이 같아요.' : '나의 생각과 AI의 예상이 달라도 괜찮아요.'}</strong>
              <p>{isCorrect ? '사진을 보고 찾은 단서가 AI가 찾은 특징과 잘 맞았어요.' : '정보가 적을 때는 누구나 다르게 예상할 수 있어요. 더 많은 특징을 확인하면 생각이 달라질 수 있답니다.'}</p>
            </div>
          </div>
          <div className="image-result-features">
            <span className="learning-card__explanation-label">AI가 함께 찾은 특징</span>
            <div>
              {experience.features.map((feature) => <span key={feature.id}>✓ {feature.label}</span>)}
            </div>
          </div>
          <div className="image-lesson-note image-result-lesson-note">
            <span className="learning-card__explanation-label">오늘의 핵심</span>
            <p>{experience.explanation}</p>
          </div>
        </article>
        <aside className="image-info-card image-result-info-card">
          <span className="image-info-card__number">05</span>
          <p className="image-info-card__label">전체 흐름 정리</p>
          <h2>사진은 숫자가 되고,<br /><span>특징은 예상이 돼요.</span></h2>
          <div className="image-result-flow" aria-label="이미지 분석 과정">
            <span>사진</span><b>→</b><span>픽셀·숫자</span><b>→</b><span>특징</span><b>→</b><span>가능성</span>
          </div>
          <p className="image-info-card__description">AI는 사람처럼 처음부터 답을 알고 있는 것이 아니라, 입력된 정보를 바꾸고 배운 패턴과 비교해서 다음 결과를 예상해요.</p>
        </aside>
      </div>
      <div className="stage-actions image-result-actions">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
          onKeyDown={(event) => handleButtonKeyDown(event, onBack)}
        >
          <span aria-hidden="true">←</span>
          예상 다시 보기
        </button>
        <p className="stage-note">
          <span className="stage-note__mark" aria-hidden="true">i</span>
          같은 원리를 다른 사진에서도 확인해 볼 수 있어요.
        </p>
        <div className="image-result-actions__buttons">
          <button className="secondary-button" type="button" onClick={onOtherImage}>다른 사진으로 해보기 <span aria-hidden="true">↗</span></button>
          <button className="primary-button" type="button" onClick={onRestart}>처음으로 <span className="primary-button__arrow" aria-hidden="true">↗</span></button>
        </div>
      </div>
    </section>
  )
}
