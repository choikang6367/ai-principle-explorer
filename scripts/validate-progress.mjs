import assert from 'node:assert/strict'
import {
  EXPERIENCE_PROGRESS_VERSION,
  PROGRESS_STORAGE_KEY,
  clearSavedProgress,
  readSavedProgress,
  saveProgress,
} from '../src/data/progress.ts'

const values = new Map()
const localStorage = {
  getItem(key) {
    return values.has(key) ? values.get(key) : null
  },
  setItem(key, value) {
    values.set(key, String(value))
  },
  removeItem(key) {
    values.delete(key)
  },
}

globalThis.window = { localStorage }

const emptyProgress = {
  version: EXPERIENCE_PROGRESS_VERSION,
  stage: 'welcome',
  selectedCategory: null,
  selectedScenarioId: null,
  selectedInputTokenTexts: null,
  selectedAttentionTokenId: null,
  studentCandidateId: null,
  hasAskedQuestion: false,
}

function setSavedProgress(value) {
  values.set(PROGRESS_STORAGE_KEY, typeof value === 'string' ? value : JSON.stringify(value))
}

function readWith(value) {
  setSavedProgress(value)
  return readSavedProgress()
}

assert.deepEqual(readWith('{not-json'), emptyProgress, 'malformed JSON should use the welcome fallback')
assert.deepEqual(
  readWith({ version: EXPERIENCE_PROGRESS_VERSION + 1, stage: 'complete' }),
  emptyProgress,
  'unknown progress versions should use the welcome fallback',
)
assert.deepEqual(
  readWith({ version: EXPERIENCE_PROGRESS_VERSION, stage: 'unknown', selectedCategory: 'animal' }),
  emptyProgress,
  'unknown stages should use the welcome fallback',
)
assert.deepEqual(
  readWith({ version: EXPERIENCE_PROGRESS_VERSION, stage: 'questions', selectedCategory: 'not-a-category' }),
  { ...emptyProgress, stage: 'categories' },
  'unknown category IDs should fall back to category selection',
)
assert.deepEqual(
  readWith({
    version: EXPERIENCE_PROGRESS_VERSION,
    stage: 'tokenize',
    selectedCategory: 'animal',
    selectedScenarioId: 'not-a-scenario',
  }),
  { ...emptyProgress, stage: 'questions', selectedCategory: 'animal' },
  'unknown scenario IDs should fall back to question selection',
)
assert.deepEqual(
  readWith({
    version: EXPERIENCE_PROGRESS_VERSION,
    stage: 'tokenize',
    selectedCategory: 'animal',
    selectedScenarioId: 'people-knowledge-01',
  }),
  { ...emptyProgress, stage: 'questions', selectedCategory: 'animal' },
  'a scenario from another category should be discarded',
)
assert.deepEqual(
  readWith({
    version: EXPERIENCE_PROGRESS_VERSION,
    stage: 'ask',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
    hasAskedQuestion: true,
  }),
  {
    ...emptyProgress,
    stage: 'ask',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
    hasAskedQuestion: true,
  },
  'sent answers should restore at the ask stage',
)
assert.deepEqual(
  readWith({
    version: EXPERIENCE_PROGRESS_VERSION - 1,
    stage: 'ask',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
    hasAskedQuestion: true,
  }),
  {
    ...emptyProgress,
    stage: 'ask',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
    hasAskedQuestion: false,
  },
  'legacy progress should migrate without inventing an answer state',
)
assert.deepEqual(
  readWith({
    version: EXPERIENCE_PROGRESS_VERSION,
    stage: 'transformer',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
  }),
  {
    ...emptyProgress,
    stage: 'transformer',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
  },
  'Transformer stage should restore with a valid scenario',
)
assert.deepEqual(
  readWith({
    version: EXPERIENCE_PROGRESS_VERSION,
    stage: 'prediction',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
    selectedInputTokenTexts: ['강아지는왜', '꼬리를흔들까', '?'],
    selectedAttentionTokenId: 'animal-knowledge-02-token-02',
    studentCandidateId: 'animal-knowledge-02-cause',
    hasAskedQuestion: true,
  }),
  {
    ...emptyProgress,
    stage: 'prediction',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
    selectedInputTokenTexts: ['강아지는왜', '꼬리를흔들까', '?'],
    selectedAttentionTokenId: 'animal-knowledge-02-token-02',
    studentCandidateId: 'animal-knowledge-02-cause',
    hasAskedQuestion: true,
  },
  'custom tokenization should restore with the active lesson state',
)
assert.deepEqual(
  readWith({
    version: EXPERIENCE_PROGRESS_VERSION,
    stage: 'prediction',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
    selectedAttentionTokenId: 'not-a-token',
    studentCandidateId: 'animal-knowledge-02-cause',
  }),
  {
    ...emptyProgress,
    stage: 'attention',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
  },
  'unknown attention token IDs should fall back to attention selection',
)
assert.deepEqual(
  readWith({
    version: EXPERIENCE_PROGRESS_VERSION,
    stage: 'complete',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
    selectedAttentionTokenId: 'animal-knowledge-02-token-01',
    studentCandidateId: 'not-a-candidate',
  }),
  {
    ...emptyProgress,
    stage: 'prediction',
    selectedCategory: 'animal',
    selectedScenarioId: 'animal-knowledge-02',
    selectedAttentionTokenId: 'animal-knowledge-02-token-01',
  },
  'unknown candidate IDs should fall back to prediction selection',
)

const originalJsonParse = JSON.parse
JSON.parse = () => {
  throw new Error('oversized saved progress should not be parsed')
}
try {
  assert.deepEqual(readWith('x'.repeat(4097)), emptyProgress, 'oversized saved progress should use the welcome fallback')
} finally {
  JSON.parse = originalJsonParse
}

saveProgress({
  version: EXPERIENCE_PROGRESS_VERSION,
  stage: 'ask',
  selectedCategory: 'animal',
  selectedScenarioId: 'animal-knowledge-02',
  selectedInputTokenTexts: null,
  selectedAttentionTokenId: null,
  studentCandidateId: null,
  hasAskedQuestion: true,
})
assert.notEqual(localStorage.getItem(PROGRESS_STORAGE_KEY), null, 'saveProgress should persist non-welcome progress')
assert.equal(JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)).hasAskedQuestion, true, 'saveProgress should persist the answer state')
clearSavedProgress()
assert.equal(localStorage.getItem(PROGRESS_STORAGE_KEY), null, 'clearSavedProgress should remove persisted progress')

saveProgress({
  version: EXPERIENCE_PROGRESS_VERSION,
  stage: 'questions',
  selectedCategory: 'animal',
  selectedScenarioId: 'x'.repeat(5000),
  selectedInputTokenTexts: null,
  selectedAttentionTokenId: null,
  studentCandidateId: null,
  hasAskedQuestion: false,
})
assert.equal(localStorage.getItem(PROGRESS_STORAGE_KEY), null, 'oversized progress should not be persisted')

globalThis.window = {
  localStorage: {
    getItem() {
      throw new Error('storage unavailable')
    },
    setItem() {
      throw new Error('storage unavailable')
    },
    removeItem() {
      throw new Error('storage unavailable')
    },
  },
}
assert.deepEqual(readSavedProgress(), emptyProgress, 'storage read failures should use the welcome fallback')
saveProgress({
  version: EXPERIENCE_PROGRESS_VERSION,
  stage: 'questions',
  selectedCategory: 'animal',
  selectedScenarioId: null,
  selectedInputTokenTexts: null,
  selectedAttentionTokenId: null,
  studentCandidateId: null,
  hasAskedQuestion: false,
})
clearSavedProgress()
globalThis.window = { localStorage }

console.log('Progress validation passed: malformed, stale, oversized, and invalid saved states plus storage failures are handled safely.')
