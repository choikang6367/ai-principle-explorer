export type CategoryId =
  | 'animal'
  | 'people'
  | 'everyday'
  | 'science'
  | 'school'

export type CategoryGlyph =
  | 'animal'
  | 'people'
  | 'everyday'
  | 'science'
  | 'school'

export type QuestionType = 'knowledge' | 'imagination' | 'opinion'

export interface Category {
  id: CategoryId
  number: string
  label: string
  englishLabel: string
  description: string
  glyph: CategoryGlyph
  accent: 'mint' | 'violet' | 'amber' | 'coral' | 'blue' | 'lime'
}

export type StageId =
  | 'welcome'
  | 'categories'
  | 'questions'
  | 'learning'
  | 'tokenize'
  | 'transformer'
  | 'attention'
  | 'prediction'
  | 'generation'
  | 'review'
  | 'compare'
  | 'complete'

export type TokenKind = 'word' | 'punctuation'

export interface InputToken {
  id: string
  text: string
  kind: TokenKind
}

export interface AttentionTarget {
  tokenId: string
  sourceTokenId?: string
  weight: number
  label: string
  explanation: string
}

export interface CandidateOutcome {
  title: string
  explanation: string
  answer: string
}

export interface PredictionCandidate {
  id: string
  text: string
  probability: number
  explanation: string
  outcome: CandidateOutcome
}

export interface TokenizationComparison {
  aiTokens: readonly string[]
}

export type ScenarioDifficulty = 1 | 2 | 3

export interface Scenario {
  id: string
  categoryId: CategoryId
  questionType: QuestionType
  question: string
  difficulty: ScenarioDifficulty
  learnerGoal: string
  tokenizationHint: string
  tokenizationComparison?: TokenizationComparison
  tokens: readonly InputToken[]
  attentionHint: string
  attentionTargets: readonly AttentionTarget[]
  predictionHint: string
  candidates: readonly PredictionCandidate[]
  aiCandidateId: string
  completionHint: string
}

export type GenerationSelection = 'highest-probability' | 'top-k'

export interface GenerationOption {
  id: string
  text: string
  probability: number
}

export interface GenerationStep {
  index: number
  contextLength: number
  options: readonly GenerationOption[]
  selectedToken: string
  selectionLabel: string
}

export interface GeneratedAnswer {
  tokens: readonly string[]
  text: string
  steps: readonly GenerationStep[]
  selection: GenerationSelection
  stopReason: 'answer-complete' | 'max-tokens'
}

export type AnswerCheckStatus = 'pass' | 'needs-review'

export interface AnswerCheck {
  id: string
  label: string
  status: AnswerCheckStatus
  explanation: string
}
