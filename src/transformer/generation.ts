import type {
  AnswerCheck,
  GeneratedAnswer,
  GenerationOption,
  GenerationSelection,
  GenerationStep,
  InputToken,
  PredictionCandidate,
  Scenario,
} from '../types/experience.ts'
import { runTransformer } from './engine.ts'

const MAX_OUTPUT_TOKENS = 32
const unsafeAnswerPattern = /폭탄|죽여|비밀번호|주민등록번호|해킹/u

function splitAnswer(answer: string) {
  return answer.trim().split(/\s+/u).filter(Boolean)
}

function toContextToken(text: string, index: number): InputToken {
  return {
    id: `generated-context-${index + 1}`,
    text,
    kind: 'word',
  }
}

function createGenerationCandidates(
  parentId: string,
  stepIndex: number,
  optionTexts: readonly string[],
): readonly PredictionCandidate[] {
  return optionTexts.map((text, optionIndex) => ({
    id: `${parentId}-generation-${stepIndex + 1}-${optionIndex + 1}`,
    text,
    probability: optionIndex === 0 ? 56 : optionIndex === 1 ? 27 : 17,
    explanation: '다음에 붙을 수 있는 말 조각이에요.',
    outcome: {
      title: '다음 조각',
      explanation: '문장을 한 조각씩 이어 붙이는 연습용 후보예요.',
      answer: text,
    },
  }))
}

function getModelProbability(result: ReturnType<typeof runTransformer>, candidateId: string) {
  return result.nextTokenProbabilities.reduce(
    (total, probability) => probability.candidateIds.includes(candidateId) ? total + probability.probability : total,
    0,
  )
}

function normalizePercentages(scores: readonly number[]) {
  const total = scores.reduce((sum, score) => sum + Math.max(0, score), 0)
  if (total <= Number.EPSILON) {
    return scores.map((_, index) => index === scores.length - 1 ? 100 : 0)
  }

  let roundedTotal = 0
  return scores.map((score, index) => {
    if (index === scores.length - 1) {
      return Number((100 - roundedTotal).toFixed(1))
    }

    const percentage = Number(((Math.max(0, score) / total) * 100).toFixed(1))
    roundedTotal += percentage
    return percentage
  })
}

function getAlternativeTokens(answerTokens: readonly string[], index: number) {
  const target = answerTokens[index] ?? '다음'
  const possibleAlternatives = [
    index > 0 ? answerTokens[index - 1] : '먼저',
    '그리고',
    '하지만',
    '다시',
    '확인해요.',
  ]
  const alternatives = possibleAlternatives.filter((token) => token !== target)
  return [...new Set([target, ...alternatives])].slice(0, 3)
}

function buildGenerationStep(
  parentId: string,
  stepIndex: number,
  context: readonly InputToken[],
  answerTokens: readonly string[],
  focusedTokenId: string | null,
  selection: GenerationSelection,
): GenerationStep {
  const optionTexts = getAlternativeTokens(answerTokens, stepIndex)
  const candidates = createGenerationCandidates(parentId, stepIndex, optionTexts)
  const modelResult = runTransformer(context, candidates, focusedTokenId)
  const modelProbabilities = candidates.map((candidate) => getModelProbability(modelResult, candidate.id))
  const teachingScores = modelProbabilities.map((probability, index) => {
    const lessonPreference = index === 0 ? 0.52 : index === 1 ? 0.28 : 0.2
    return lessonPreference + probability * 0.18
  })
  const percentages = normalizePercentages(teachingScores)
  const options: readonly GenerationOption[] = candidates.map((candidate, index) => ({
    id: candidate.id,
    text: candidate.text,
    probability: percentages[index] ?? 0,
  }))
  const selectedToken = optionTexts[0] ?? '다음'

  return {
    index: stepIndex,
    contextLength: context.length,
    options,
    selectedToken,
    selectionLabel: selection === 'highest-probability'
      ? '가장 높은 후보를 골랐어요.'
      : '상위 후보 안에서 하나를 골랐어요.',
  }
}

export function generateAnswer(
  candidate: PredictionCandidate,
  inputTokens: readonly InputToken[],
  focusedTokenId: string | null,
  selection: GenerationSelection = 'highest-probability',
): GeneratedAnswer {
  const answerTokens = splitAnswer(candidate.outcome.answer).slice(0, MAX_OUTPUT_TOKENS)
  const steps: GenerationStep[] = []
  const generatedTokens: string[] = []

  for (let index = 0; index < answerTokens.length; index += 1) {
    const context = [
      ...inputTokens,
      ...generatedTokens.map(toContextToken),
    ]
    const step = buildGenerationStep(
      candidate.id,
      index,
      context,
      answerTokens,
      focusedTokenId,
      selection,
    )
    steps.push(step)
    generatedTokens.push(step.selectedToken)
  }

  return {
    tokens: generatedTokens,
    text: generatedTokens.join(' ').replace(/\s+/gu, ' ').trim(),
    steps,
    selection,
    stopReason: answerTokens.length < MAX_OUTPUT_TOKENS ? 'answer-complete' : 'max-tokens',
  }
}

export function reviewGeneratedAnswer(
  scenario: Scenario,
  answer: GeneratedAnswer,
): readonly AnswerCheck[] {
  const hasAnswer = answer.text.trim().length > 0
  const hasUnsafeWords = unsafeAnswerPattern.test(answer.text)

  return [
    {
      id: 'answer-exists',
      label: '빈 답변인지 확인하기',
      status: hasAnswer ? 'pass' : 'needs-review',
      explanation: hasAnswer ? '답변 조각이 빠지지 않고 이어졌어요.' : '답변이 비어 있으니 다시 만들어야 해요.',
    },
    {
      id: 'question-fit',
      label: '질문과 맞는지 사람이 살펴보기',
      status: 'needs-review',
      explanation: 'AI가 문장을 만들었다고 해서 질문에 딱 맞는다는 뜻은 아니에요. 질문과 답을 나란히 읽어 봐요.',
    },
    {
      id: 'safety-filter',
      label: '위험하거나 상처 주는 말 걸러내기',
      status: hasUnsafeWords ? 'needs-review' : 'pass',
      explanation: hasUnsafeWords
        ? '조심해야 할 표현이 있어 사람이 한 번 더 확인해야 해요.'
        : '이번 교육용 답변에서는 조심해야 할 표현이 발견되지 않았어요.',
    },
    {
      id: 'grounding',
      label: scenario.questionType === 'knowledge' ? '사실을 근거와 맞춰 보기' : '답변의 성격 확인하기',
      status: scenario.questionType === 'knowledge' ? 'needs-review' : 'pass',
      explanation: scenario.questionType === 'knowledge'
        ? '확률이 높아도 사실이라는 뜻은 아니에요. 교과서나 믿을 만한 자료와 대조해요.'
        : '상상이나 의견은 사실처럼 단정하지 않고, 그렇게 생각한 이유를 함께 말해요.',
    },
  ]
}
