import { questionBank } from './questionBank.ts'
import type {
  AttentionTarget,
  InputToken,
  PredictionCandidate,
  QuestionType,
  Scenario,
  ScenarioDifficulty,
} from '../types/experience'

const questionMarkPattern = /[?？]$/u

const typeCopy: Record<QuestionType, {
  learnerGoal: string
  attentionHint: string
  predictionHint: string
  completionHint: string
}> = {
  knowledge: {
    learnerGoal: '관찰한 단서와 원인·결과를 연결해, 사실을 차근차근 설명하는 연습을 해요.',
    attentionHint: '질문의 대상, 방향, 결과를 알려 주는 말에 손전등을 비춰 봐요.',
    predictionHint: '앞의 단서를 원인과 과정으로 연결하는 후보가 어떤 것인지 살펴봐요.',
    completionHint: '확률이 높은 후보도 사실을 자동으로 보증하지 않아요. 근거를 한 번 더 확인해요.',
  },
  imagination: {
    learnerGoal: '정답 하나를 찾기보다, 가능한 장면과 결과를 여러 방향으로 상상해 보는 연습을 해요.',
    attentionHint: '무엇을 상상하는지, 어떤 변화가 생기는지 알려 주는 말에 주목해 봐요.',
    predictionHint: '하나의 미래만 고르지 않고, 좋은 점과 어려움까지 넓혀 보는 후보를 비교해요.',
    completionHint: '상상형 질문에는 한 가지 정답이 없어요. 선택한 방향에 어울리는 근거를 덧붙여 봐요.',
  },
  opinion: {
    learnerGoal: '서로 다른 관점을 비교하고, 내 선택에 이유를 붙여 말하는 연습을 해요.',
    attentionHint: '무엇을 판단하거나 비교하는지 알려 주는 말에 조금 더 주목해 봐요.',
    predictionHint: '장점과 주의할 점을 함께 살펴보며 여러 의견 후보를 비교해요.',
    completionHint: '의견은 사람과 상황에 따라 달라질 수 있어요. 내 기준과 이유를 함께 말해 보세요.',
  },
}

function removeQuestionMark(question: string) {
  return question.replace(questionMarkPattern, '')
}

function createInputTokens(id: string, question: string): readonly InputToken[] {
  const punctuation = question.match(questionMarkPattern)?.[0]
  const body = punctuation ? question.slice(0, -punctuation.length) : question
  const words = body.split(/\s+/u).filter(Boolean)
  const wordTokens = words.map((text, index) => ({
    id: `${id}-token-${String(index + 1).padStart(2, '0')}`,
    text,
    kind: 'word' as const,
  }))

  return punctuation
    ? [...wordTokens, {
      id: `${id}-token-${String(wordTokens.length + 1).padStart(2, '0')}`,
      text: punctuation,
      kind: 'punctuation' as const,
    }]
    : wordTokens
}

function splitIntoAiChunks(text: string) {
  const characters = Array.from(text)
  const chunks: string[] = []

  for (let index = 0; index < characters.length; index += 2) {
    chunks.push(characters.slice(index, index + 2).join(''))
  }

  return chunks
}

function createTokenizationComparison(tokens: readonly InputToken[]) {
  return {
    aiTokens: tokens.flatMap((token) => token.kind === 'punctuation' ? [token.text] : splitIntoAiChunks(token.text)),
  }
}

function findQuestionCueIndex(tokens: readonly InputToken[]) {
  const cuePattern = /왜|어떻게|얼마나|무엇|어떤|어디|누구|좋을까|가능할까|될까|있을까|어땠을까/u
  return tokens.findIndex((token) => token.kind === 'word' && cuePattern.test(token.text))
}

function createAttentionTargets(questionType: QuestionType, tokens: readonly InputToken[]): readonly AttentionTarget[] {
  const wordTokens = tokens.filter((token) => token.kind === 'word')
  const cueIndex = findQuestionCueIndex(tokens)
  const preferredIndexes = [0, cueIndex >= 0 ? cueIndex : 1, Math.max(0, wordTokens.length - 1)]
  const indexes: number[] = []

  for (const index of preferredIndexes) {
    if (index < wordTokens.length && !indexes.includes(index)) {
      indexes.push(index)
    }
  }

  for (let index = 0; indexes.length < Math.min(3, wordTokens.length) && index < wordTokens.length; index += 1) {
    if (!indexes.includes(index)) {
      indexes.push(index)
    }
  }

  const labelsByType: Record<QuestionType, readonly string[]> = {
    knowledge: ['무엇을 볼까?', '질문의 방향은?', '어떤 결과일까?'],
    imagination: ['무엇을 상상할까?', '어떤 변화일까?', '어디까지 넓힐까?'],
    opinion: ['무엇을 판단할까?', '어떤 기준일까?', '어떤 결과일까?'],
  }
  const labels = labelsByType[questionType]
  const weights = [0.9, 0.78, 0.86]

  return indexes.map((tokenIndex, index) => {
    const token = wordTokens[tokenIndex]
    const explanationsByType: Record<QuestionType, string> = {
      knowledge: `“${token.text}”는 질문에서 설명해야 할 대상이나 단서를 알려 줘요.`,
      imagination: `“${token.text}”를 바탕으로 가능한 장면과 변화를 상상해 볼 수 있어요.`,
      opinion: `“${token.text}”는 답을 고를 때 비교하거나 판단할 기준을 생각하게 해요.`,
    }

    return {
      tokenId: token.id,
      weight: weights[index] ?? 0.72,
      label: labels[index] ?? '답의 단서',
      explanation: explanationsByType[questionType],
    }
  })
}

interface CandidateTemplate {
  key: string
  text: string
  probability: number
  explanation: string
  title: string
  outcomeExplanation: string
  answer: string
}

function createCandidateTemplates(questionType: QuestionType, question: string): readonly CandidateTemplate[] {
  const focus = removeQuestionMark(question)

  if (questionType === 'knowledge') {
    return [
      {
        key: 'cause',
        text: '원인과 과정을 차근차근 설명해요',
        probability: 56,
        explanation: `“${focus}”의 단서를 원인과 결과로 연결하는 후보예요.`,
        title: '원인 → 과정 → 결과로 이어져요',
        outcomeExplanation: '질문의 대상과 관찰한 변화를 이어서, 왜 그런 일이 생기는지 설명하는 답으로 이어져요.',
        answer: `“${focus}”에 답할 때는 질문 속 대상을 먼저 확인하고, 관찰한 사실과 원인을 차례로 연결해 설명할 수 있어요.`,
      },
      {
        key: 'clue',
        text: '관찰한 단서를 서로 연결해요',
        probability: 27,
        explanation: '질문에 들어 있는 말들을 모아 현상을 설명하려는 후보예요.',
        title: '여러 단서를 한 문장에 모아요',
        outcomeExplanation: '대상, 행동, 상황처럼 질문에 들어 있는 단서를 한 문장으로 묶어 답의 방향을 만들어요.',
        answer: `“${focus}”를 설명할 때 질문 속 단서를 하나씩 살펴보고, 서로 어떻게 이어지는지 말할 수 있어요.`,
      },
      {
        key: 'compare',
        text: '비슷한 경우와 비교해 봐요',
        probability: 17,
        explanation: '비슷하지만 다른 현상과 비교해 차이를 찾아보려는 후보예요.',
        title: '같은 점과 다른 점을 살펴봐요',
        outcomeExplanation: '비슷한 사례와 비교하면 질문의 특징이 더 잘 보일 수 있지만, 조건을 빠뜨리지 않는지 확인해야 해요.',
        answer: `“${focus}”의 답을 다른 경우와 비교해 볼 수 있어요. 다만 겉모습이 비슷하다고 원인까지 같다고 단정하면 안 돼요.`,
      },
    ]
  }

  if (questionType === 'imagination') {
    return [
      {
        key: 'scene',
        text: '새로운 장면을 상상해 봐요',
        probability: 45,
        explanation: `“${focus}”에서 출발해 가능한 장면을 하나 만들어 보는 후보예요.`,
        title: '상상한 장면을 구체적으로 그려요',
        outcomeExplanation: '상상 속 주인공과 상황을 정하고, 어떤 일이 일어나는지 순서대로 그려 보는 답으로 이어져요.',
        answer: `“${focus}”를 상상할 때는 먼저 장면과 주인공을 정하고, 그 뒤에 어떤 일이 일어나는지 구체적으로 말해 볼 수 있어요.`,
      },
      {
        key: 'tradeoff',
        text: '좋은 점과 어려운 점을 함께 봐요',
        probability: 33,
        explanation: '한 가지 변화가 가져올 편리함과 새로운 문제를 함께 살펴보는 후보예요.',
        title: '가능성과 걱정을 나란히 놓아요',
        outcomeExplanation: '상상 속 변화의 재미있는 점뿐 아니라 불편하거나 조심할 점까지 함께 생각하는 답으로 이어져요.',
        answer: `“${focus}”를 생각할 때는 기대되는 점과 어려워질 수 있는 점을 함께 적어 보면 더 풍성한 상상이 돼요.`,
      },
      {
        key: 'rule',
        text: '내가 정한 규칙으로 확장해요',
        probability: 22,
        explanation: '질문에 나만의 규칙이나 조건을 더해 이야기를 넓혀 보는 후보예요.',
        title: '조건을 하나 더해 이야기를 키워요',
        outcomeExplanation: '“만약 ~라면” 같은 조건을 넣으면 같은 질문에서도 여러 방향의 답을 만들어 볼 수 있어요.',
        answer: `“${focus}”에 나만의 조건을 하나 더하면, 다른 사람과도 서로 다른 답을 만들어 비교해 볼 수 있어요.`,
      },
    ]
  }

  return [
    {
      key: 'context',
      text: '상황에 따라 다르다고 살펴봐요',
      probability: 48,
      explanation: `“${focus}”의 답이 사람과 상황에 따라 달라질 수 있음을 반영한 후보예요.`,
      title: '상황을 먼저 확인해요',
      outcomeExplanation: '어떤 상황인지에 따라 같은 선택도 다르게 보일 수 있다는 점을 설명하는 답으로 이어져요.',
      answer: `“${focus}”에 대한 생각은 상황과 사람에 따라 달라질 수 있어요. 먼저 어떤 조건인지 확인해 보는 게 좋아요.`,
    },
    {
      key: 'balance',
      text: '장점과 주의할 점을 비교해요',
      probability: 30,
      explanation: '한 선택의 좋은 점과 아쉬운 점을 함께 놓고 비교하는 후보예요.',
      title: '두 면을 함께 비교해요',
      outcomeExplanation: '좋은 점만 고르거나 문제점만 강조하지 않고, 선택에 따라 달라지는 두 면을 함께 보여 줘요.',
      answer: `“${focus}”를 판단할 때는 좋은 점과 주의할 점을 함께 비교한 뒤, 어떤 기준을 더 중요하게 볼지 정할 수 있어요.`,
    },
    {
      key: 'choice',
      text: '내 기준을 먼저 정하고 골라요',
      probability: 22,
      explanation: '정답을 바로 고르기보다 나에게 중요한 기준을 세우려는 후보예요.',
      title: '선택에 이유를 붙여요',
      outcomeExplanation: '무엇을 중요하게 생각하는지 먼저 정하면, 내 의견을 더 분명하고 설득력 있게 말할 수 있어요.',
      answer: `“${focus}”에 답할 때 내가 중요하게 생각하는 기준을 먼저 정하고, 그 기준으로 선택한 이유를 말해 볼 수 있어요.`,
    },
  ]
}

function createScenario(prompt: (typeof questionBank)[number], index: number): Scenario {
  const tokens = createInputTokens(prompt.id, prompt.question)
  const copy = typeCopy[prompt.questionType]
  const candidateTemplates = createCandidateTemplates(prompt.questionType, prompt.question)
  const candidates: readonly PredictionCandidate[] = candidateTemplates.map((candidate) => ({
    id: `${prompt.id}-${candidate.key}`,
    text: candidate.text,
    probability: candidate.probability,
    explanation: candidate.explanation,
    outcome: {
      title: candidate.title,
      explanation: candidate.outcomeExplanation,
      answer: candidate.answer,
    },
  }))

  return {
    id: prompt.id,
    categoryId: prompt.categoryId,
    questionType: prompt.questionType,
    question: prompt.question,
    difficulty: ([1, 2, 3][index % 3] ?? 1) as ScenarioDifficulty,
    learnerGoal: copy.learnerGoal,
    tokenizationHint: `이 질문은 읽기 쉬운 ${tokens.filter((token) => token.kind === 'word').length}개 낱말과 물음표로 나눴어요. 실제 AI는 모델에 따라 더 작은 조각으로 나눌 수 있어요.`,
    tokenizationComparison: createTokenizationComparison(tokens),
    tokens,
    attentionHint: copy.attentionHint,
    attentionTargets: createAttentionTargets(prompt.questionType, tokens),
    predictionHint: copy.predictionHint,
    candidates,
    aiCandidateId: candidates[0]?.id ?? `${prompt.id}-cause`,
    completionHint: copy.completionHint,
  }
}

const scenarioCatalog: readonly Scenario[] = questionBank.map(createScenario)

export const scenarios = scenarioCatalog

export function getScenariosForCategory(categoryId: Scenario['categoryId']) {
  return scenarios.filter((scenario) => scenario.categoryId === categoryId)
}

export function getScenarioById(scenarioId: string) {
  return scenarios.find((scenario) => scenario.id === scenarioId)
}

export function adaptAttentionTargets(
  scenario: Scenario,
  inputTokens: readonly InputToken[],
): readonly AttentionTarget[] {
  const availableTokens = [...inputTokens]

  return scenario.attentionTargets.flatMap((target) => {
    const originalToken = scenario.tokens.find((token) => token.id === target.tokenId)
    const originalText = originalToken?.text ?? ''
    const sameIdIndex = availableTokens.findIndex((token) => token.id === target.tokenId)
    const unusedTokenIndex = sameIdIndex >= 0
      ? sameIdIndex
      : availableTokens.findIndex((token) =>
        token.text === originalText || token.text.includes(originalText) || originalText.includes(token.text),
      )
    const token = unusedTokenIndex >= 0
      ? availableTokens[unusedTokenIndex]
      : inputTokens.find((candidate) =>
        candidate.text === originalText || candidate.text.includes(originalText) || originalText.includes(candidate.text),
      )

    if (!token) {
      return []
    }

    if (unusedTokenIndex >= 0) {
      availableTokens.splice(unusedTokenIndex, 1)
    }
    return [{
      ...target,
      tokenId: token.id,
      sourceTokenId: target.tokenId,
      explanation: token.text === originalText
        ? target.explanation
        : `“${token.text}”처럼 합쳐진 조각 안에서 ${target.explanation}`,
    }]
  })
}
