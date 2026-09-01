import type { InputToken, PredictionCandidate } from '../types/experience.ts'

export type TransformerVector = readonly number[]
export type TransformerMatrix = readonly TransformerVector[]

export interface TransformerProbability {
  token: string
  probability: number
  candidateIds: readonly string[]
}

export interface TransformerHeadResult {
  index: number
  queries: TransformerMatrix
  keys: TransformerMatrix
  values: TransformerMatrix
  scores: TransformerMatrix
  maskedScores: TransformerMatrix
  causalMask: readonly boolean[][]
  attentionProbabilities: TransformerMatrix
  context: TransformerMatrix
}

export interface TransformerCalculation {
  tokens: readonly string[]
  tokenIds: readonly string[]
  vocabulary: readonly string[]
  tokenEmbeddings: TransformerMatrix
  positionEmbeddings: TransformerMatrix
  positionAddedEmbeddings: TransformerMatrix
  queriesByHead: readonly TransformerMatrix[]
  keysByHead: readonly TransformerMatrix[]
  valuesByHead: readonly TransformerMatrix[]
  heads: readonly TransformerHeadResult[]
  concatenatedHeadResults: TransformerMatrix
  attentionOutput: TransformerMatrix
  residualAfterAttention: TransformerMatrix
  feedForwardHidden: TransformerMatrix
  feedForwardOutput: TransformerMatrix
  residualOutput: TransformerMatrix
  logits: readonly number[]
  nextTokenProbabilities: readonly TransformerProbability[]
  selectedNextToken: string
  selectedCandidateId: string | null
}

type MutableMatrix = number[][]

const MODEL_DIMENSION = 4
const HEAD_DIMENSION = 2
const HEAD_COUNT = 2
const MASKED_SCORE = -1_000_000

const FIXED_TOKEN_EMBEDDINGS: Readonly<Record<string, TransformerVector>> = {
  강아지는: [0.78, 0.12, 0.22, 0.08],
  왜: [0.1, 0.64, 0.18, 0.42],
  꼬리를: [0.62, 0.24, 0.74, 0.16],
  흔들까요: [0.48, 0.2, 0.58, 0.66],
  '?': [0.02, 0.08, 0.04, 0.72],
  기분이: [0.71, 0.34, 0.6, 0.16],
  몸의: [0.5, 0.52, 0.22, 0.44],
  다른: [0.28, 0.76, 0.46, 0.32],
}

const POSITION_EMBEDDINGS: readonly TransformerVector[] = [
  [0, 0.04, 0, 0.03],
  [0.03, 0, 0.04, 0],
  [0, 0.03, 0.05, 0],
  [0.04, 0, 0, 0.05],
  [0, 0.05, 0.03, 0],
  [0.02, 0, 0.04, 0.04],
  [0.05, 0.02, 0, 0.03],
  [0, 0.04, 0.02, 0.05],
]

const QUERY_WEIGHTS: readonly TransformerMatrix[] = [
  [
    [0.5, 0.1],
    [-0.2, 0.45],
    [0.3, -0.25],
    [0.15, 0.35],
  ],
  [
    [0.2, -0.35],
    [0.42, 0.16],
    [-0.1, 0.52],
    [0.38, 0.08],
  ],
]

const KEY_WEIGHTS: readonly TransformerMatrix[] = [
  [
    [0.45, -0.1],
    [0.18, 0.4],
    [0.32, 0.12],
    [-0.2, 0.36],
  ],
  [
    [0.12, 0.38],
    [0.5, -0.18],
    [0.26, 0.28],
    [0.1, 0.44],
  ],
]

const VALUE_WEIGHTS: readonly TransformerMatrix[] = [
  [
    [0.3, 0.08],
    [0.12, 0.42],
    [0.5, -0.14],
    [0.2, 0.3],
  ],
  [
    [0.16, 0.35],
    [0.44, 0.06],
    [-0.12, 0.48],
    [0.38, 0.18],
  ],
]

const ATTENTION_OUTPUT_WEIGHTS: TransformerMatrix = [
  [0.42, 0.08, 0.16, -0.12],
  [0.1, 0.36, -0.08, 0.24],
  [0.2, -0.14, 0.48, 0.06],
  [-0.06, 0.22, 0.18, 0.4],
]

const FEED_FORWARD_WEIGHTS: TransformerMatrix = [
  [0.42, -0.14, 0.22, 0.18],
  [0.08, 0.5, 0.1, -0.26],
  [0.2, 0.18, 0.46, 0.12],
  [-0.16, 0.22, 0.14, 0.44],
]

const FEED_FORWARD_BIAS: TransformerVector = [0.02, 0.04, 0.01, 0.03]

const FEED_FORWARD_OUTPUT_WEIGHTS: TransformerMatrix = [
  [0.36, 0.1, 0.18, -0.08],
  [0.14, 0.4, -0.12, 0.2],
  [0.22, -0.06, 0.38, 0.16],
  [-0.1, 0.18, 0.2, 0.34],
]

const FEED_FORWARD_OUTPUT_BIAS: TransformerVector = [0.01, 0.02, 0.03, 0.01]

const OUTPUT_COLUMNS: readonly TransformerVector[] = [
  [0.38, -0.12, 0.24, 0.3],
  [-0.16, 0.34, 0.18, -0.22],
  [0.2, 0.16, -0.28, 0.24],
  [0.12, -0.24, 0.32, 0.1],
  [0.26, 0.08, 0.12, -0.18],
  [-0.08, 0.28, 0.2, 0.22],
]

const OUTPUT_BIAS: readonly number[] = [0.18, 0.04, -0.02, -0.06, 0.01, -0.04]

function finite(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

function finiteVector(vector: readonly number[]) {
  return vector.map((value) => finite(value))
}

function finiteMatrix(matrix: readonly (readonly number[])[]) {
  return matrix.map((row) => finiteVector(row))
}

function addVectors(left: readonly number[], right: readonly number[]) {
  const length = Math.max(left.length, right.length)
  return Array.from({ length }, (_, index) => finite((left[index] ?? 0) + (right[index] ?? 0)))
}

function dot(left: readonly number[], right: readonly number[]) {
  const length = Math.min(left.length, right.length)
  let total = 0

  for (let index = 0; index < length; index += 1) {
    total = finite(total + finite(left[index]) * finite(right[index]))
  }

  return total
}

function matrixMultiply(left: readonly (readonly number[])[], right: readonly (readonly number[])[]): MutableMatrix {
  const outputWidth = right[0]?.length ?? 0

  return left.map((row) =>
    Array.from({ length: outputWidth }, (_, columnIndex) =>
      dot(row, right.map((rightRow) => rightRow[columnIndex] ?? 0)),
    ),
  )
}

function addBias(matrix: readonly (readonly number[])[], bias: readonly number[]) {
  return matrix.map((row) => addVectors(row, bias))
}

function relu(vector: readonly number[]) {
  return vector.map((value) => Math.max(0, finite(value)))
}

function createFallbackEmbedding(text: string) {
  const codeSum = Array.from(text).reduce(
    (total, character, index) => total + (character.codePointAt(0) ?? 0) * (index + 1),
    0,
  )
  const template = [0.12, 0.28, 0.44, 0.6]

  return template.map((base, index) => base + ((codeSum + index * 7) % 5) * 0.04)
}

function getTokenEmbedding(text: string) {
  return finiteVector(FIXED_TOKEN_EMBEDDINGS[text] ?? createFallbackEmbedding(text))
}

function getPositionEmbedding(index: number) {
  return finiteVector(POSITION_EMBEDDINGS[index % POSITION_EMBEDDINGS.length] ?? [0, 0, 0, 0])
}

function firstCandidateToken(text: string) {
  return text.trim().split(/\s+/u)[0] || '다음'
}

function buildVocabulary(candidates: readonly PredictionCandidate[]) {
  const entries: Array<{ token: string; candidateIds: string[] }> = []

  for (const candidate of candidates) {
    const token = firstCandidateToken(candidate.text)
    const existing = entries.find((entry) => entry.token === token)

    if (existing) {
      existing.candidateIds.push(candidate.id)
    } else {
      entries.push({ token, candidateIds: [candidate.id] })
    }
  }

  if (entries.length === 0) {
    entries.push({ token: '다음', candidateIds: [] })
  }

  return entries
}

function createCausalMask(length: number) {
  return Array.from({ length }, (_, rowIndex) =>
    Array.from({ length }, (_, columnIndex) => columnIndex <= rowIndex),
  )
}

function softmax(values: readonly number[], allowed: readonly boolean[] = values.map(() => true)) {
  if (values.length === 0) {
    return []
  }

  const validValues = values
    .map((value, index) => (allowed[index] ? finite(value) : null))
    .filter((value): value is number => value !== null)
  const maxValue = validValues.length > 0 ? Math.max(...validValues) : 0
  const exponentials = values.map((value, index) => {
    if (!allowed[index]) {
      return 0
    }

    const shifted = Math.max(-60, Math.min(60, finite(value) - maxValue))
    return finite(Math.exp(shifted))
  })
  const total = exponentials.reduce((sum, value) => finite(sum + value), 0)

  if (total <= Number.EPSILON) {
    const validCount = allowed.filter(Boolean).length || values.length
    return values.map((_, index) => (allowed[index] ? 1 / validCount : 0))
  }

  return exponentials.map((value) => finite(value / total))
}

function buildHeadResult(
  index: number,
  queries: TransformerMatrix,
  keys: TransformerMatrix,
  values: TransformerMatrix,
  causalMask: readonly boolean[][],
): TransformerHeadResult {
  const scale = Math.sqrt(HEAD_DIMENSION)
  const scores = queries.map((query) => keys.map((key) => finite(dot(query, key) / scale)))
  const maskedScores = scores.map((row, rowIndex) =>
    row.map((score, columnIndex) => (causalMask[rowIndex]?.[columnIndex] ? score : MASKED_SCORE)),
  )
  const attentionProbabilities = maskedScores.map((row, rowIndex) =>
    softmax(row, causalMask[rowIndex] ?? row.map(() => true)),
  )
  const context = attentionProbabilities.map((probabilityRow) =>
    Array.from({ length: HEAD_DIMENSION }, (_, columnIndex) =>
      finite(dot(probabilityRow, values.map((valueRow) => valueRow[columnIndex] ?? 0))),
    ),
  )

  return {
    index,
    queries: finiteMatrix(queries),
    keys: finiteMatrix(keys),
    values: finiteMatrix(values),
    scores: finiteMatrix(scores),
    maskedScores: finiteMatrix(maskedScores),
    causalMask,
    attentionProbabilities: finiteMatrix(attentionProbabilities),
    context: finiteMatrix(context),
  }
}

function getReadoutColumn(index: number) {
  return OUTPUT_COLUMNS[index % OUTPUT_COLUMNS.length] ?? [0, 0, 0, 0]
}

export function runTransformer(
  inputTokens: readonly InputToken[],
  candidates: readonly PredictionCandidate[],
): TransformerCalculation {
  const tokens = inputTokens.length > 0
    ? inputTokens
    : [{ id: 'empty-input', text: '<empty>', kind: 'word' as const }]
  const vocabularyEntries = buildVocabulary(candidates)
  const tokenTexts = tokens.map((token) => token.text)
  const tokenIds = tokens.map((token) => token.id)
  const tokenEmbeddings = tokens.map((token) => getTokenEmbedding(token.text))
  const positionEmbeddings = tokens.map((_, index) => getPositionEmbedding(index))
  const positionAddedEmbeddings = tokenEmbeddings.map((embedding, index) =>
    addVectors(embedding, positionEmbeddings[index] ?? []),
  )
  const causalMask = createCausalMask(tokens.length)
  const heads = Array.from({ length: HEAD_COUNT }, (_, index) => {
    const queries = matrixMultiply(positionAddedEmbeddings, QUERY_WEIGHTS[index] ?? QUERY_WEIGHTS[0])
    const keys = matrixMultiply(positionAddedEmbeddings, KEY_WEIGHTS[index] ?? KEY_WEIGHTS[0])
    const values = matrixMultiply(positionAddedEmbeddings, VALUE_WEIGHTS[index] ?? VALUE_WEIGHTS[0])
    return buildHeadResult(index, queries, keys, values, causalMask)
  })
  const queriesByHead = heads.map((head) => head.queries)
  const keysByHead = heads.map((head) => head.keys)
  const valuesByHead = heads.map((head) => head.values)
  const concatenatedHeadResults = tokens.map((_, rowIndex) =>
    heads.flatMap((head) => head.context[rowIndex] ?? [0, 0]),
  )
  const attentionOutput = matrixMultiply(concatenatedHeadResults, ATTENTION_OUTPUT_WEIGHTS)
  const residualAfterAttention = positionAddedEmbeddings.map((embedding, index) =>
    addVectors(embedding, attentionOutput[index] ?? []),
  )
  const feedForwardHidden = addBias(
    matrixMultiply(residualAfterAttention, FEED_FORWARD_WEIGHTS),
    FEED_FORWARD_BIAS,
  ).map((row) => relu(row))
  const feedForwardOutput = addBias(
    matrixMultiply(feedForwardHidden, FEED_FORWARD_OUTPUT_WEIGHTS),
    FEED_FORWARD_OUTPUT_BIAS,
  )
  const residualOutput = residualAfterAttention.map((row, index) =>
    addVectors(row, feedForwardOutput[index] ?? []),
  )
  const finalState = residualOutput[residualOutput.length - 1] ?? Array(MODEL_DIMENSION).fill(0)
  const logits = vocabularyEntries.map((_, index) =>
    finite(dot(finalState, getReadoutColumn(index)) + (OUTPUT_BIAS[index % OUTPUT_BIAS.length] ?? 0)),
  )
  const outputProbabilities = softmax(logits)
  const nextTokenProbabilities = vocabularyEntries.map((entry, index) => ({
    token: entry.token,
    probability: finite(outputProbabilities[index] ?? 0),
    candidateIds: entry.candidateIds,
  }))
  const selectedIndex = nextTokenProbabilities.reduce(
    (bestIndex, probability, index, probabilities) =>
      probability.probability > (probabilities[bestIndex]?.probability ?? -1) ? index : bestIndex,
    0,
  )
  const selectedEntry = vocabularyEntries[selectedIndex] ?? vocabularyEntries[0]

  return {
    tokens: tokenTexts,
    tokenIds,
    vocabulary: vocabularyEntries.map((entry) => entry.token),
    tokenEmbeddings: finiteMatrix(tokenEmbeddings),
    positionEmbeddings: finiteMatrix(positionEmbeddings),
    positionAddedEmbeddings: finiteMatrix(positionAddedEmbeddings),
    queriesByHead,
    keysByHead,
    valuesByHead,
    heads,
    concatenatedHeadResults: finiteMatrix(concatenatedHeadResults),
    attentionOutput: finiteMatrix(attentionOutput),
    residualAfterAttention: finiteMatrix(residualAfterAttention),
    feedForwardHidden: finiteMatrix(feedForwardHidden),
    feedForwardOutput: finiteMatrix(feedForwardOutput),
    residualOutput: finiteMatrix(residualOutput),
    logits: finiteVector(logits),
    nextTokenProbabilities,
    selectedNextToken: selectedEntry?.token ?? '다음',
    selectedCandidateId: selectedEntry?.candidateIds[0] ?? null,
  }
}
