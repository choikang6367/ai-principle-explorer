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
  | 'tokenize'
  | 'transformer'
  | 'attention'
  | 'prediction'
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
