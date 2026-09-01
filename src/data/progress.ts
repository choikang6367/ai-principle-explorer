import { categories } from './categories.ts'
import { getImageExperienceById, imageExperienceIds } from './imageExperiences.ts'
import { getScenarioById } from './scenarios.ts'
import type { CategoryId, ImageExperienceId, StageId } from '../types/experience'

export const EXPERIENCE_PROGRESS_VERSION = 6 as const
export const PROGRESS_STORAGE_KEY = 'ai-principle-explorer-progress'
const MAX_PROGRESS_STORAGE_LENGTH = 4096
const LEGACY_PROGRESS_VERSION = 5

const stageOrder: readonly StageId[] = [
  'welcome',
  'conversationWelcome',
  'intro',
  'categories',
  'questions',
  'ask',
  'learning',
  'tokenize',
  'transformer',
  'attention',
  'prediction',
  'generation',
  'review',
  'compare',
  'complete',
  'imageSelect',
  'imageView',
  'imageNumbers',
  'imageFeatures',
  'imagePrediction',
  'imageResult',
]

const categoryIds = new Set<CategoryId>(categories.map((category) => category.id))

export interface ExperienceProgress {
  version: typeof EXPERIENCE_PROGRESS_VERSION
  stage: StageId
  selectedCategory: CategoryId | null
  selectedScenarioId: string | null
  selectedInputTokenTexts: readonly string[] | null
  selectedAttentionTokenId: string | null
  studentCandidateId: string | null
  hasAskedQuestion: boolean
  selectedImageId?: ImageExperienceId | null
  imageGuess?: string | null
}

function emptyProgress(): ExperienceProgress {
  return {
    version: EXPERIENCE_PROGRESS_VERSION,
    stage: 'welcome',
    selectedCategory: null,
    selectedScenarioId: null,
    selectedInputTokenTexts: null,
    selectedAttentionTokenId: null,
    studentCandidateId: null,
    hasAskedQuestion: false,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStageId(value: unknown): value is StageId {
  return typeof value === 'string' && stageOrder.includes(value as StageId)
}

function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && categoryIds.has(value as CategoryId)
}

function isImageExperienceId(value: unknown): value is ImageExperienceId {
  return typeof value === 'string' && imageExperienceIds.has(value as ImageExperienceId)
}

function isImageStageId(value: StageId): value is Extract<StageId, `image${string}`> {
  return value.startsWith('image')
}

function isAtOrAfter(stage: StageId, checkpoint: StageId) {
  return stageOrder.indexOf(stage) >= stageOrder.indexOf(checkpoint)
}

export function readSavedProgress(): ExperienceProgress {
  const fallback = emptyProgress()

  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const saved = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!saved || saved.length > MAX_PROGRESS_STORAGE_LENGTH) {
      return fallback
    }

    const parsed: unknown = JSON.parse(saved)
    if (!isRecord(parsed) || (parsed.version !== EXPERIENCE_PROGRESS_VERSION && parsed.version !== LEGACY_PROGRESS_VERSION)) {
      return fallback
    }

    const storedStage = isStageId(parsed.stage) ? parsed.stage : 'welcome'

    if (isImageStageId(storedStage)) {
      const selectedImageId = isImageExperienceId(parsed.selectedImageId) ? parsed.selectedImageId : null
      const selectedImage = getImageExperienceById(selectedImageId)
      const safeImageStage = storedStage !== 'imageSelect' && !selectedImage
        ? 'imageSelect'
        : storedStage
      const imageGuess = selectedImage && typeof parsed.imageGuess === 'string' && selectedImage.choices.some((choice) => choice === parsed.imageGuess)
        ? parsed.imageGuess
        : null

      return {
        ...fallback,
        stage: safeImageStage,
        selectedImageId: selectedImage?.id ?? null,
        imageGuess,
      }
    }

    const selectedCategory = isCategoryId(parsed.selectedCategory) ? parsed.selectedCategory : null
    const storedScenarioId = typeof parsed.selectedScenarioId === 'string' ? parsed.selectedScenarioId : null
    const storedScenario = storedScenarioId ? getScenarioById(storedScenarioId) : undefined
    const selectedScenarioId = storedScenario && storedScenario.categoryId === selectedCategory
      ? storedScenario.id
      : null

    const storedInputTokenTexts = Array.isArray(parsed.selectedInputTokenTexts) &&
      parsed.selectedInputTokenTexts.length <= 64 &&
      parsed.selectedInputTokenTexts.every((text): text is string => typeof text === 'string' && text.length > 0)
      ? parsed.selectedInputTokenTexts
      : null
    const sourceText = storedScenario?.tokens.map((token) => token.text).join('') ?? ''
    const selectedInputTokenTexts = selectedScenarioId && storedInputTokenTexts && storedInputTokenTexts.length > 0 &&
      storedInputTokenTexts.join('') === sourceText
      ? storedInputTokenTexts
      : null

    const storedAttentionTokenId = typeof parsed.selectedAttentionTokenId === 'string'
      ? parsed.selectedAttentionTokenId
      : null
    const selectedAttentionTokenId = selectedScenarioId && storedAttentionTokenId && storedScenario?.attentionTargets.some(
      (target) => target.tokenId === storedAttentionTokenId,
    )
      ? storedAttentionTokenId
      : null

    const storedCandidateId = typeof parsed.studentCandidateId === 'string' ? parsed.studentCandidateId : null
    const studentCandidateId = selectedScenarioId && storedCandidateId && storedScenario?.candidates.some(
      (candidate) => candidate.id === storedCandidateId,
    )
      ? storedCandidateId
      : null

    let safeStage = storedStage
    if (safeStage === 'welcome') {
      return fallback
    }
    if (!selectedCategory && safeStage !== 'conversationWelcome' && safeStage !== 'intro' && safeStage !== 'categories') {
      safeStage = 'categories'
    }
    if (isAtOrAfter(safeStage, 'ask') && !selectedScenarioId) {
      safeStage = 'questions'
    }
    if (isAtOrAfter(safeStage, 'attention') && !selectedAttentionTokenId) {
      safeStage = 'attention'
    }
    if (isAtOrAfter(safeStage, 'compare') && !studentCandidateId) {
      safeStage = 'prediction'
    }

    const hasAskedQuestion = Boolean(
      selectedScenarioId &&
      isAtOrAfter(safeStage, 'ask') &&
      parsed.version === EXPERIENCE_PROGRESS_VERSION &&
      parsed.hasAskedQuestion === true,
    )

    return {
      version: EXPERIENCE_PROGRESS_VERSION,
      stage: safeStage,
      selectedCategory,
      selectedScenarioId: isAtOrAfter(safeStage, 'questions') ? selectedScenarioId : null,
      selectedInputTokenTexts: isAtOrAfter(safeStage, 'tokenize') ? selectedInputTokenTexts : null,
      selectedAttentionTokenId: isAtOrAfter(safeStage, 'attention') ? selectedAttentionTokenId : null,
      studentCandidateId: isAtOrAfter(safeStage, 'prediction') ? studentCandidateId : null,
      hasAskedQuestion,
    }
  } catch {
    return fallback
  }
}

export function saveProgress(progress: ExperienceProgress) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (progress.stage === 'welcome') {
      window.localStorage.removeItem(PROGRESS_STORAGE_KEY)
      return
    }
    const serialized = JSON.stringify(progress)
    if (serialized.length > MAX_PROGRESS_STORAGE_LENGTH) {
      return
    }
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, serialized)
  } catch {
    // Private browsing and restricted storage should not interrupt the lesson.
  }
}

export function clearSavedProgress() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY)
  } catch {
    // Ignore storage failures so the in-memory lesson remains usable.
  }
}
