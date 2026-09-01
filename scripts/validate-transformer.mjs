import assert from 'node:assert/strict'
import { scenarios } from '../src/data/scenarios.ts'
import { runTransformer } from '../src/transformer/engine.ts'

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
  assertFinite(result.feedForwardHidden, `${label} feed-forward hidden`)
  assertFinite(result.feedForwardOutput, `${label} feed-forward output`)
  assertFinite(result.residualOutput, `${label} final residual`)
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

  return result
}

const firstResult = validateScenario(scenarios[0], 0)
const repeatedResult = runTransformer(scenarios[0].tokens, scenarios[0].candidates)
assert.deepEqual(firstResult, repeatedResult, 'the same input should produce the same calculation')

scenarios.forEach((scenario, scenarioIndex) => {
  validateScenario(scenario, scenarioIndex)
})

console.log(`Transformer validation passed: ${scenarios.length} scenarios have finite values, normalized softmax rows, causal masking, deterministic output, and candidate mapping.`)
