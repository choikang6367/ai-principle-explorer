import assert from 'node:assert/strict'
import { scenarios } from '../src/data/scenarios.ts'
import { createContextualCandidates, runTransformer } from '../src/transformer/engine.ts'
import { generateAnswer, reviewGeneratedAnswer } from '../src/transformer/generation.ts'

assert.ok(scenarios.length > 0, 'at least one active scenario is required for the Transformer example')

const firstCandidateToken = (text) => text.trim().split(/\s+/u)[0]

function assertFinite(value, label) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFinite(item, `${label}[${index}]`))
    return
  }

  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), `${label} should be finite`)
  }
}

function assertProbabilityRow(row, label) {
  assertFinite(row, label)
  const total = row.reduce((sum, value) => sum + value, 0)
  assert.ok(Math.abs(total - 1) < 1e-9, `${label} should sum to 1, received ${total}`)
}

function assertCandidateProbabilities(candidates, label) {
  const total = candidates.reduce((sum, candidate) => sum + candidate.probability, 0)
  assert.ok(Math.abs(total - 100) < 0.11, `${label} should sum to 100, received ${total}`)
  candidates.forEach((candidate, index) => {
    assert.ok(Number.isFinite(candidate.probability), `${label} candidate ${index} should be finite`)
    assert.ok(candidate.probability >= 0 && candidate.probability <= 100, `${label} candidate ${index} should be between 0 and 100`)
  })
}

function assertLayerNormRows(matrix, label) {
  matrix.forEach((row, rowIndex) => {
    if (row.length === 0) {
      return
    }

    const mean = row.reduce((sum, value) => sum + value, 0) / row.length
    assert.ok(Math.abs(mean) < 1e-9, `${label} row ${rowIndex} should be centered around zero`)
  })
}

function validateScenario(scenario, scenarioIndex) {
  const label = `scenario ${scenarioIndex + 1} (${scenario.id})`
  const result = runTransformer(scenario.tokens, scenario.candidates)

  assert.equal(result.tokens.length, scenario.tokens.length, `${label} should preserve token count`)
  assert.equal(result.tokenIds.length, scenario.tokens.length, `${label} should preserve token IDs`)
  assertFinite(result.tokenEmbeddings, `${label} token embeddings`)
  assertFinite(result.positionEmbeddings, `${label} position embeddings`)
  assertFinite(result.positionAddedEmbeddings, `${label} position-added embeddings`)
  assertFinite(result.queriesByHead, `${label} queries`)
  assertFinite(result.keysByHead, `${label} keys`)
  assertFinite(result.valuesByHead, `${label} values`)
  assertFinite(result.concatenatedHeadResults, `${label} concatenated heads`)
  assertFinite(result.attentionOutput, `${label} attention output`)
  assertFinite(result.residualAfterAttention, `${label} attention residual`)
  assertFinite(result.normalizedAfterAttention, `${label} normalized attention residual`)
  assertFinite(result.feedForwardHidden, `${label} feed-forward hidden`)
  assertFinite(result.feedForwardOutput, `${label} feed-forward output`)
  assertFinite(result.residualOutput, `${label} final residual`)
  assertFinite(result.normalizedOutput, `${label} normalized output`)
  assertLayerNormRows(result.normalizedAfterAttention, `${label} attention normalization`)
  assertLayerNormRows(result.normalizedOutput, `${label} output normalization`)
  assertFinite(result.logits, `${label} logits`)

  result.heads.forEach((head, headIndex) => {
    assertFinite(head.scores, `${label} head ${headIndex} scores`)
    assertFinite(head.maskedScores, `${label} head ${headIndex} masked scores`)
    assertFinite(head.attentionProbabilities, `${label} head ${headIndex} attention probabilities`)

    head.attentionProbabilities.forEach((row, rowIndex) => {
      assertProbabilityRow(row, `${label} head ${headIndex} row ${rowIndex}`)
      row.forEach((probability, columnIndex) => {
        if (columnIndex > rowIndex) {
          assert.equal(probability, 0, `${label} future token probability should be 0 at head ${headIndex}, row ${rowIndex}, column ${columnIndex}`)
        }
      })
    })
  })

  result.nextTokenProbabilities.forEach((item, index) => {
    assert.ok(Number.isFinite(item.probability), `${label} output probability ${index} should be finite`)
  })
  assertProbabilityRow(
    result.nextTokenProbabilities.map((item) => item.probability),
    `${label} next token probabilities`,
  )

  const candidateTokens = scenario.candidates.map((candidate) => firstCandidateToken(candidate.text))
  assert.ok(candidateTokens.includes(result.selectedNextToken), `${label} selected token should exist among the candidate prefixes`)
  assert.ok(result.selectedCandidateId, `${label} selected candidate should be mapped`)
  assert.ok(
    scenario.candidates.some((candidate) => candidate.id === result.selectedCandidateId),
    `${label} selected candidate ID should exist in the scenario`,
  )

  const focusedTokenId = scenario.attentionTargets[0]?.tokenId ?? null
  const focusedResult = runTransformer(scenario.tokens, scenario.candidates, focusedTokenId)
  assert.equal(focusedResult.focusedTokenId, focusedTokenId, `${label} should retain the selected attention token`)
  assert.ok(
    focusedResult.nextTokenProbabilities.some((probability, index) =>
      Math.abs(probability.probability - (result.nextTokenProbabilities[index]?.probability ?? 0)) > 1e-9,
    ),
    `${label} selected attention should change the next-token calculation`,
  )
  const contextualCandidates = createContextualCandidates(scenario.candidates, focusedResult)
  assertCandidateProbabilities(contextualCandidates, `${label} contextual candidates`)
  assert.ok(
    contextualCandidates.some((candidate) => candidate.id === focusedResult.selectedCandidateId),
    `${label} focused output should map to a contextual candidate`,
  )

  const regroupedTokens = scenario.tokens.length > 1
    ? [{ id: `${scenario.id}-regrouped`, text: scenario.tokens.slice(0, 2).map((token) => token.text).join(' '), kind: 'word' }]
    : scenario.tokens
  const regroupedResult = runTransformer(regroupedTokens, scenario.candidates)
  assert.notDeepEqual(regroupedResult.tokens, result.tokens, `${label} custom tokenization should change the calculation input`)

  const generatedAnswer = generateAnswer(
    contextualCandidates[0],
    scenario.tokens,
    focusedTokenId,
  )
  assert.ok(generatedAnswer.text.length > 0, `${label} generated answer should not be empty`)
  assert.equal(generatedAnswer.steps.length, generatedAnswer.tokens.length, `${label} generation should record every appended token`)
  generatedAnswer.steps.forEach((step, stepIndex) => {
    assert.equal(step.index, stepIndex, `${label} generation step indexes should be sequential`)
    assert.ok(step.contextLength >= scenario.tokens.length, `${label} generation should append to the original context`)
    assertCandidateProbabilities(step.options, `${label} generation step ${stepIndex + 1}`)
    assert.equal(step.selectedToken, step.options[0]?.text, `${label} generation should select the highest teaching candidate`)
  })
  const checks = reviewGeneratedAnswer(scenario, generatedAnswer)
  assert.equal(checks.length, 4, `${label} should run all answer checks`)

  return result
}

const firstResult = validateScenario(scenarios[0], 0)
const repeatedResult = runTransformer(scenarios[0].tokens, scenarios[0].candidates)
assert.deepEqual(firstResult, repeatedResult, 'the same input should produce the same calculation')

scenarios.forEach((scenario, scenarioIndex) => {
  validateScenario(scenario, scenarioIndex)
})

console.log(`Transformer validation passed: ${scenarios.length} scenarios have finite values, normalized softmax rows, causal masking, deterministic output, and candidate mapping.`)
