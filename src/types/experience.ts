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

export type ImageExperienceId =
  | 'cat'
  | 'dog'
  | 'fox'
  | 'apple'
  | 'orange'
  | 'car'
  | 'bus'
  | 'face'
  | 'bicycle'
  | 'soccer'

export type ImageAccent = 'mint' | 'violet' | 'amber' | 'coral' | 'blue' | 'lime'

export type ImageFeatureKind = 'color' | 'shape' | 'detail'

export type ImageFeatureMarker = 'box' | 'circle' | 'line'

export interface ImagePixelSample {
  id: string
  x: number
  y: number
  r: number
  g: number
  b: number
  label: string
}

export interface ImageFeature {
  id: string
  kind: ImageFeatureKind
  marker: ImageFeatureMarker
  label: string
  description: string
  x: number
  y: number
  width: number
  height: number
}

export interface ImagePrediction {
  label: string
  probability: number
}

export interface ImagePredictionSnapshot {
  id: string
  title: string
  revealPercent: number
  description: string
  predictions: readonly ImagePrediction[]
}

export interface ImageVisual {
  emoji: string
  caption: string
  background: string
}

export interface ImageExperience {
  id: ImageExperienceId
  name: string
  englishLabel: string
  imagePath: string
  accent: ImageAccent
  visual: ImageVisual
  choices: readonly string[]
  answer: string
  prompt: string
  pixelSamples: readonly ImagePixelSample[]
  features: readonly ImageFeature[]
  predictionSnapshots: readonly ImagePredictionSnapshot[]
  studentTip: string
  explanation: string
}

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
  | 'conversationWelcome'
  | 'intro'
  | 'categories'
  | 'questions'
  | 'ask'
  | 'learning'
  | 'tokenize'
  | 'transformer'
  | 'attention'
  | 'prediction'
  | 'generation'
  | 'review'
  | 'compare'
  | 'complete'
  | 'imageSelect'
  | 'imageView'
  | 'imageNumbers'
  | 'imageFeatures'
  | 'imagePrediction'
  | 'imageResult'

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
