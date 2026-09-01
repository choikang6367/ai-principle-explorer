import { categories } from './categories.ts'
import { getScenarioById } from './scenarios.ts'
import type { CategoryId, StageId } from '../types/experience'

export const EXPERIENCE_PROGRESS_VERSION = 3 as const
export const PROGRESS_STORAGE_KEY = 'ai-principle-explorer-progress'
const MAX_PROGRESS_STORAGE_LENGTH = 4096

const stageOrder: readonly StageId[] = [
  'welcome',
  'categories',
  'questions',
  'tokenize',
  'transformer',
  'attention',
  'prediction',
  'compare',
  'complete',
]

const categoryIds = new Set<CategoryId>(categories.map((category) => category.id))

export interface ExperienceProgress {
  version: typeof EXPERIENCE_PROGRESS_VERSION
  stage: StageId
  selectedCategory: CategoryId | null
  selectedScenarioId: string | null
  selectedAttentionTokenId: string | null
  studentCandidateId: string | null
}

function emptyProgress(): ExperienceProgress {
  return {
    version: EXPERIENCE_PROGRESS_VERSION,
    stage: 'welcome',
    selectedCategory: null,
    selectedScenarioId: null,
    selectedAttentionTokenId: null,
    studentCandidateId: null,
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
    if (!isRecord(parsed) || parsed.version !== EXPERIENCE_PROGRESS_VERSION) {
      return fallback
    }

    const storedStage = isStageId(parsed.stage) ? parsed.stage : 'welcome'
    const selectedCategory = isCategoryId(parsed.selectedCategory) ? parsed.selectedCategory : null
    const storedScenarioId = typeof parsed.selectedScenarioId === 'string' ? parsed.selectedScenarioId : null
    const storedScenario = storedScenarioId ? getScenarioById(storedScenarioId) : undefined
    const selectedScenarioId = storedScenario && storedScenario.categoryId === selectedCategory
      ? storedScenario.id
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
    if (!selectedCategory && safeStage !== 'categories') {
      safeStage = 'categories'
    }
    if (isAtOrAfter(safeStage, 'tokenize') && !selectedScenarioId) {
      safeStage = 'questions'
    }
    if (isAtOrAfter(safeStage, 'attention') && !selectedAttentionTokenId) {
      safeStage = 'attention'
    }
    if (isAtOrAfter(safeStage, 'compare') && !studentCandidateId) {
      safeStage = 'prediction'
    }

    return {
      version: EXPERIENCE_PROGRESS_VERSION,
      stage: safeStage,
      selectedCategory,
      selectedScenarioId: isAtOrAfter(safeStage, 'questions') ? selectedScenarioId : null,
      selectedAttentionTokenId: isAtOrAfter(safeStage, 'attention') ? selectedAttentionTokenId : null,
      studentCandidateId: isAtOrAfter(safeStage, 'prediction') ? studentCandidateId : null,
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
