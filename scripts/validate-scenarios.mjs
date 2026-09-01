import { categories } from '../src/data/categories.ts'
import { scenarios } from '../src/data/scenarios.ts'

const errors = []
const categoryIds = new Set(categories.map((category) => category.id))
const questionTypes = new Set(['knowledge', 'imagination', 'opinion'])
const expectedAiCandidatePrefixes = {
  knowledge: '원인과 과정을',
  imagination: '새로운 장면을',
  opinion: '상황에 따라',
}
const scenarioIds = new Set()

function report(message) {
  errors.push(message)
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    report(`${label} must be a non-empty string`)
  }
}

if (scenarios.length !== 150) {
  report(`expected exactly 150 active scenarios, found ${scenarios.length}`)
}

for (const category of categories) {
  const categoryScenarios = scenarios.filter((scenario) => scenario.categoryId === category.id)
  if (categoryScenarios.length !== 30) {
    report(`category ${category.id} should have 30 scenarios, found ${categoryScenarios.length}`)
  }

  for (const questionType of questionTypes) {
    const typeCount = categoryScenarios.filter((scenario) => scenario.questionType === questionType).length
    if (typeCount !== 10) {
      report(`category ${category.id} should have 10 ${questionType} scenarios, found ${typeCount}`)
    }
  }
}

for (const scenario of scenarios) {
  const scenarioLabel = `scenario ${scenario.id}`

  if (scenarioIds.has(scenario.id)) {
    report(`${scenarioLabel} has a duplicate id`)
  }
  scenarioIds.add(scenario.id)

  if (!categoryIds.has(scenario.categoryId)) {
    report(`${scenarioLabel} references unknown category ${scenario.categoryId}`)
  }
  if (!questionTypes.has(scenario.questionType)) {
    report(`${scenarioLabel} has an unknown question type ${scenario.questionType}`)
  }
  const expectedAiCandidatePrefix = expectedAiCandidatePrefixes[scenario.questionType]
  if (expectedAiCandidatePrefix && !scenario.candidates[0]?.text.startsWith(expectedAiCandidatePrefix)) {
    report(`${scenarioLabel} should use the ${scenario.questionType} AI candidate strategy`)
  }

  requireText(scenario.question, `${scenarioLabel}.question`)
  requireText(scenario.learnerGoal, `${scenarioLabel}.learnerGoal`)
  requireText(scenario.tokenizationHint, `${scenarioLabel}.tokenizationHint`)
  requireText(scenario.attentionHint, `${scenarioLabel}.attentionHint`)
  requireText(scenario.predictionHint, `${scenarioLabel}.predictionHint`)
  requireText(scenario.completionHint, `${scenarioLabel}.completionHint`)

  const comparisonTokens = scenario.tokenizationComparison?.aiTokens
  if (!Array.isArray(comparisonTokens) || comparisonTokens.length === 0) {
    report(`${scenarioLabel}.tokenizationComparison.aiTokens must contain at least one token`)
  } else {
    comparisonTokens.forEach((token, tokenIndex) => {
      requireText(token, `${scenarioLabel}.tokenizationComparison.aiTokens[${tokenIndex}]`)
    })
    const sourceText = scenario.tokens.map((token) => token.text).join('')
    if (comparisonTokens.join('') !== sourceText) {
      report(`${scenarioLabel}.tokenizationComparison.aiTokens must preserve the source token text`)
    }
  }

  const tokenIds = new Set()
  for (const token of scenario.tokens) {
    if (tokenIds.has(token.id)) {
      report(`${scenarioLabel} has a duplicate token id ${token.id}`)
    }
    tokenIds.add(token.id)
    requireText(token.id, `${scenarioLabel}.token.id`)
    requireText(token.text, `${scenarioLabel}.token.text`)
    if (token.kind !== 'word' && token.kind !== 'punctuation') {
      report(`${scenarioLabel}.token ${token.id} has an unknown kind ${token.kind}`)
    }
  }

  const attentionIds = new Set()
  for (const target of scenario.attentionTargets) {
    if (attentionIds.has(target.tokenId)) {
      report(`${scenarioLabel} references attention token ${target.tokenId} more than once`)
    }
    attentionIds.add(target.tokenId)

    if (!tokenIds.has(target.tokenId)) {
      report(`${scenarioLabel}.attentionTargets references missing token ${target.tokenId}`)
    }
    if (!Number.isFinite(target.weight) || target.weight <= 0 || target.weight > 1) {
      report(`${scenarioLabel}.attentionTargets ${target.tokenId} has an invalid weight ${target.weight}`)
    }
    requireText(target.label, `${scenarioLabel}.attentionTargets ${target.tokenId}.label`)
    requireText(target.explanation, `${scenarioLabel}.attentionTargets ${target.tokenId}.explanation`)
  }

  const candidateIds = new Set()
  let probabilityTotal = 0
  for (const candidate of scenario.candidates) {
    if (candidateIds.has(candidate.id)) {
      report(`${scenarioLabel} has a duplicate candidate id ${candidate.id}`)
    }
    candidateIds.add(candidate.id)
    probabilityTotal += candidate.probability

    requireText(candidate.id, `${scenarioLabel}.candidate.id`)
    requireText(candidate.text, `${scenarioLabel}.candidate.text`)
    requireText(candidate.explanation, `${scenarioLabel}.candidate.explanation`)
    if (!Number.isFinite(candidate.probability) || candidate.probability < 0 || candidate.probability > 100) {
      report(`${scenarioLabel}.candidate ${candidate.id} has an invalid probability ${candidate.probability}`)
    }
    requireText(candidate.outcome.title, `${scenarioLabel}.candidate ${candidate.id}.outcome.title`)
    requireText(candidate.outcome.explanation, `${scenarioLabel}.candidate ${candidate.id}.outcome.explanation`)
    requireText(candidate.outcome.answer, `${scenarioLabel}.candidate ${candidate.id}.outcome.answer`)
  }

  if (probabilityTotal !== 100) {
    report(`${scenarioLabel} candidate probabilities total ${probabilityTotal}, expected 100`)
  }
  if (!candidateIds.has(scenario.aiCandidateId)) {
    report(`${scenarioLabel}.aiCandidateId ${scenario.aiCandidateId} does not match a candidate`)
  }
}

if (errors.length > 0) {
  console.error(`Scenario validation failed with ${errors.length} error(s):`)
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
} else {
  console.log(`Scenario validation passed: ${scenarios.length} scenarios across ${categories.length} categories.`)
}
