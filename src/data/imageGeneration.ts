import type {
  ImageCheckItem,
  ImageComparison,
  ImageComparisonPart,
  ImageDenoiseStep,
  ImagePromptChoice,
  ImagePromptClue,
  ImagePromptField,
  ImagePromptPart,
  ImagePromptSelections,
} from '../types/experience'

const choice = (
  id: string,
  label: string,
  shortLabel: string,
  description: string,
  promptText: string,
  emoji: string,
  accent: ImagePromptChoice['accent'],
  signals: readonly number[],
): ImagePromptChoice => ({ id, label, shortLabel, description, promptText, emoji, accent, signals })

export const imagePromptFields = [
  {
    id: 'subject',
    label: '주인공',
    englishLabel: 'SUBJECT',
    question: '누가 그림에 나오나요?',
    choices: [
      choice('astronaut-cat', '우주복을 입은 고양이', '우주복 고양이', '작은 헬멧을 쓴 호기심 많은 고양이', '우주복을 입은 고양이', '🐱', 'mint', [82, 61, 74]),
      choice('cape-fox', '망토를 입은 여우', '망토 여우', '주황빛 털과 파란 망토를 가진 여우', '망토를 입은 여우', '🦊', 'coral', [74, 58, 68]),
      choice('scout-robot', '작은 탐사 로봇', '탐사 로봇', '반짝이는 센서와 둥근 바퀴가 있는 로봇', '작은 탐사 로봇', '🤖', 'violet', [68, 73, 62]),
    ],
  },
  {
    id: 'scene',
    label: '행동 / 장면',
    englishLabel: 'ACTION',
    question: '무엇을 하고 있나요?',
    choices: [
      choice('hold-flag', '깃발을 들고 서 있는', '깃발 들기', '주인공이 작은 깃발을 들고 주변을 살펴봐요', '깃발을 들고 서 있는', '⚑', 'amber', [63, 76, 71]),
      choice('paint-stars', '별을 그리는', '별 그리기', '주인공이 작은 붓으로 반짝이는 별을 그려요', '별을 그리고 있는', '✦', 'violet', [58, 72, 84]),
      choice('find-rock', '빛나는 돌을 살펴보는', '돌 살펴보기', '주인공이 바닥의 빛나는 돌을 자세히 살펴봐요', '빛나는 돌을 살펴보는', '◈', 'lime', [71, 66, 79]),
    ],
  },
  {
    id: 'place',
    label: '장소',
    englishLabel: 'PLACE',
    question: '어디에 있나요?',
    choices: [
      choice('moon-surface', '달 표면', '달', '발자국과 둥근 분화구가 있는 고요한 달', '달 표면', '◐', 'violet', [79, 54, 76]),
      choice('sparkle-forest', '반짝이는 숲', '숲', '나뭇잎 사이로 작은 빛이 내려오는 숲', '반짝이는 숲', '♧', 'lime', [56, 83, 65]),
      choice('deep-ocean', '깊은 바닷속', '바닷속', '파란 물결과 빛줄기가 있는 바닷속', '깊은 바닷속', '≈', 'blue', [48, 88, 72]),
    ],
  },
  {
    id: 'style',
    label: '그림 스타일',
    englishLabel: 'STYLE',
    question: '어떤 느낌으로 그릴까요?',
    choices: [
      choice('storybook', '동화책 느낌', '동화책', '선이 부드럽고 이야기가 시작될 것 같은 그림', '동화책 느낌', '▧', 'mint', [84, 67, 58]),
      choice('watercolor', '수채화 느낌', '수채화', '물감이 살짝 번진 듯한 부드러운 그림', '수채화 느낌', '≈', 'coral', [72, 79, 61]),
      choice('pixel-art', '픽셀아트 느낌', '픽셀아트', '작은 네모 칸이 모여 만들어지는 그림', '픽셀아트 느낌', '▦', 'amber', [61, 86, 54]),
    ],
  },
  {
    id: 'mood',
    label: '분위기 / 색감',
    englishLabel: 'MOOD',
    question: '어떤 분위기일까요?',
    choices: [
      choice('warm-bright', '따뜻하고 밝은 색감', '따뜻하게', '노랑과 주황빛이 포근하게 느껴지는 분위기', '따뜻하고 밝은 색감', '☀', 'amber', [91, 72, 66]),
      choice('cool-calm', '차분하고 시원한 색감', '시원하게', '파랑과 보랏빛이 조용하게 느껴지는 분위기', '차분하고 시원한 색감', '☾', 'blue', [54, 91, 79]),
      choice('dreamy-soft', '꿈처럼 부드러운 색감', '꿈처럼', '분홍과 보랏빛이 천천히 섞이는 분위기', '꿈처럼 부드러운 색감', '✧', 'violet', [76, 82, 94]),
    ],
  },
] as const satisfies readonly ImagePromptField[]

export const defaultImagePromptSelections: ImagePromptSelections = {
  subject: 'astronaut-cat',
  scene: 'hold-flag',
  place: 'moon-surface',
  style: 'storybook',
  mood: 'warm-bright',
}

export const imagePromptQualityCues = ['중앙 구도', '앞·뒤 깊이', '선명한 윤곽', '풍부한 세부'] as const
export const imagePromptQualitySentence = '주인공이 잘 보이는 중앙 구도와 앞·뒤 깊이가 느껴지는 배치, 선명한 윤곽과 풍부한 세부 묘사를 넣어 주세요.'

const clueCopy: Record<ImagePromptPart, { description: string; areaLabel: string; x: number; y: number; width: number; height: number }> = {
  subject: {
    description: '주인공 단서는 그림 가운데에서 누구의 모습과 크기를 만들지 안내해요.',
    areaLabel: '가운데 주인공',
    x: 31,
    y: 25,
    width: 28,
    height: 51,
  },
  scene: {
    description: '행동 단서는 주인공 주변에 어떤 물건과 자세가 나타날지 알려 줘요.',
    areaLabel: '주인공 주변의 행동',
    x: 52,
    y: 23,
    width: 30,
    height: 43,
  },
  place: {
    description: '장소 단서는 그림의 바탕, 멀리 보이는 풍경, 바닥의 모양에 영향을 줘요.',
    areaLabel: '뒤쪽 배경과 바닥',
    x: 5,
    y: 7,
    width: 90,
    height: 82,
  },
  style: {
    description: '스타일 단서는 선의 모양, 색이 섞이는 방법, 화면의 표현 방식을 안내해요.',
    areaLabel: '선과 표현 방식',
    x: 9,
    y: 13,
    width: 22,
    height: 24,
  },
  mood: {
    description: '분위기 단서는 화면 전체에 어떤 색과 빛을 더할지 안내해요.',
    areaLabel: '전체 색과 빛',
    x: 9,
    y: 67,
    width: 82,
    height: 22,
  },
}

export function getImagePromptChoice(part: ImagePromptPart, id: string | null | undefined) {
  return imagePromptFields.find((field) => field.id === part)?.choices.find((choiceOption) => choiceOption.id === id)
}

export function isImagePromptPart(value: unknown): value is ImagePromptPart {
  return imagePromptFields.some((field) => field.id === value)
}

export function isCompleteImagePromptSelections(value: unknown): value is ImagePromptSelections {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const selections = value as Record<string, unknown>
  return imagePromptFields.every((field) => typeof selections[field.id] === 'string' && Boolean(getImagePromptChoice(field.id, selections[field.id] as string)))
}

function subjectParticle(value: string) {
  const lastCharacter = value.trim().slice(-1)
  const codePoint = lastCharacter.codePointAt(0) ?? 0
  const hasFinalConsonant = codePoint >= 0xac00 && codePoint <= 0xd7a3 && (codePoint - 0xac00) % 28 !== 0
  return hasFinalConsonant ? '이' : '가'
}

export function getImagePromptSentence(selections: ImagePromptSelections) {
  const subject = getImagePromptChoice('subject', selections.subject)
  const scene = getImagePromptChoice('scene', selections.scene)
  const place = getImagePromptChoice('place', selections.place)
  const style = getImagePromptChoice('style', selections.style)
  const mood = getImagePromptChoice('mood', selections.mood)

  if (!subject || !scene || !place || !style || !mood) {
    return ''
  }

  return `${place.promptText}을 배경으로, ${subject.promptText}${subjectParticle(subject.promptText)} ${scene.promptText} 모습을 ${style.promptText} 이미지로 만들고 ${mood.promptText}으로 표현해 주세요. ${imagePromptQualitySentence}`
}

export function getImagePromptClues(selections: ImagePromptSelections): readonly ImagePromptClue[] {
  return imagePromptFields.map((field) => {
    const choiceOption = getImagePromptChoice(field.id, selections[field.id])
    const copy = clueCopy[field.id]

    return {
      id: `${field.id}-clue`,
      part: field.id,
      label: field.label,
      phrase: choiceOption?.promptText ?? '선택한 단서 없음',
      description: copy.description,
      areaLabel: copy.areaLabel,
      x: copy.x,
      y: copy.y,
      width: copy.width,
      height: copy.height,
      signals: choiceOption?.signals ?? [0, 0, 0],
    }
  })
}

export const imageDenoiseSteps = [
  {
    id: 'noise',
    shortLabel: '무작위',
    title: '무작위 노이즈에서 시작해요',
    description: '처음에는 점과 색이 뒤섞여 있어요. 아직 주인공이나 장소의 모습이 정해져 보이지 않아요.',
    imagePath: 'images/image-generation/01-noise.svg',
    alt: '검정과 보라, 민트, 주황 점이 무작위로 섞인 교육용 노이즈 그림',
    revealPercent: 0,
  },
  {
    id: 'color-blocks',
    shortLabel: '큰 색',
    title: '큰 색 영역이 먼저 나타나요',
    description: '조건 단서를 참고하면서 하늘, 바닥처럼 큰 색의 덩어리가 먼저 자리를 잡기 시작해요.',
    imagePath: 'images/image-generation/02-color-blocks.svg',
    alt: '짙은 하늘과 밝은 바닥처럼 큰 색 영역이 나뉘기 시작한 교육용 그림',
    revealPercent: 17,
  },
  {
    id: 'subject-shape',
    shortLabel: '주인공',
    title: '주인공이 있을 자리가 생겨요',
    description: '“누가 나오는가”라는 단서가 그림 가운데의 크기와 위치에 영향을 주기 시작해요.',
    imagePath: 'images/image-generation/03-subject-shape.svg',
    alt: '그림 가운데에 단순한 주인공 모양이 나타난 교육용 단계 그림',
    revealPercent: 34,
  },
  {
    id: 'outline',
    shortLabel: '윤곽',
    title: '윤곽과 물건의 모양을 정리해요',
    description: '주인공의 외곽선과 장면에 필요한 물건의 위치가 조금씩 또렷해져요.',
    imagePath: 'images/image-generation/04-outline.svg',
    alt: '주인공의 윤곽선과 주변 물건의 선이 드러난 교육용 단계 그림',
    revealPercent: 51,
  },
  {
    id: 'background',
    shortLabel: '배경',
    title: '장소와 앞뒤 관계를 구분해요',
    description: '장소 단서를 참고해 배경과 바닥, 멀리 있는 풍경이 서로 다른 층처럼 정리돼요.',
    imagePath: 'images/image-generation/05-background.svg',
    alt: '주인공 뒤에 배경 풍경과 바닥이 구분되어 나타난 교육용 단계 그림',
    revealPercent: 68,
  },
  {
    id: 'details',
    shortLabel: '세부',
    title: '세부 묘사와 색을 더해요',
    description: '스타일과 분위기 단서를 참고해 빛, 질감, 작은 무늬 같은 세부가 더해져요.',
    imagePath: 'images/image-generation/06-details.svg',
    alt: '주인공과 배경에 빛과 작은 무늬가 더해진 교육용 단계 그림',
    revealPercent: 84,
  },
  {
    id: 'final',
    shortLabel: '완성',
    title: '완성된 그림처럼 보이게 정리해요',
    description: '준비된 교육용 단계 그림의 마지막 모습이에요. 실제 모델의 내부 화면을 그대로 보여 주는 것은 아니에요.',
    imagePath: 'images/image-generation/07-final.svg',
    alt: '고양이 모양 주인공이 달 표면에서 깃발을 든 교육용 완성 그림 예시',
    revealPercent: 100,
  },
] as const satisfies readonly ImageDenoiseStep[]

export const imageComparisonOptions = [
  {
    id: 'compare-place',
    part: 'place',
    label: '장소',
    alternativeChoiceId: 'sparkle-forest',
    changeLabel: '달 표면 → 반짝이는 숲',
    description: '장소가 달라지면 배경의 색, 바닥, 멀리 보이는 풍경을 안내하는 단서가 달라져요.',
    cueImagePath: 'images/image-generation/compare-place.svg',
    cueImageAlt: '달 표면과 반짝이는 숲의 배경 단서가 대비된 교육용 비교 그림',
  },
  {
    id: 'compare-style',
    part: 'style',
    label: '스타일',
    alternativeChoiceId: 'pixel-art',
    changeLabel: '동화책 느낌 → 픽셀아트 느낌',
    description: '스타일이 달라지면 선을 표현하는 방법과 색이 놓이는 모양이 달라질 수 있어요.',
    cueImagePath: 'images/image-generation/compare-style.svg',
    cueImageAlt: '부드러운 선과 픽셀 칸의 표현 방식이 대비된 교육용 비교 그림',
  },
  {
    id: 'compare-mood',
    part: 'mood',
    label: '분위기',
    alternativeChoiceId: 'cool-calm',
    changeLabel: '따뜻하고 밝게 → 차분하고 시원하게',
    description: '분위기나 색감이 달라지면 화면 전체의 빛과 색 조합이 달라져요.',
    cueImagePath: 'images/image-generation/compare-mood.svg',
    cueImageAlt: '따뜻한 색과 시원한 색의 분위기가 대비된 교육용 비교 그림',
  },
] as const satisfies readonly ImageComparison[]

export const imageCheckItems = [
  {
    id: 'prompt-match',
    label: '프롬프트와 맞는가?',
    description: '주인공, 행동, 장소, 스타일, 분위기가 부탁한 내용과 비슷한지 살펴봐요.',
    statusLabel: '프롬프트 확인',
  },
  {
    id: 'missing-overlap',
    label: '이상하게 겹치거나 빠진 부분은 없는가?',
    description: '물건이 서로 붙거나 사라진 곳, 장면에서 어색한 부분이 없는지 찾아봐요.',
    statusLabel: '구성 확인',
  },
  {
    id: 'hands-letters-count',
    label: '손, 글자, 개수가 틀릴 수 있는가?',
    description: '손가락, 얼굴, 글자, 물건의 개수는 이미지에서 특히 틀릴 수 있어요.',
    statusLabel: '오류 가능성 확인',
  },
  {
    id: 'not-evidence',
    label: '진짜 사건이나 인물의 증거가 아닌가?',
    description: '사진처럼 보여도 진짜로 일어난 일이나 실제 인물이라는 증거는 아니에요.',
    statusLabel: '사실 여부 확인',
  },
  {
    id: 'bias-safety',
    label: '편견이나 부적절한 표현은 없는가?',
    description: '누군가를 불편하게 하거나 한쪽 모습만 정답처럼 보이게 하는 표현이 없는지 생각해요.',
    statusLabel: '안전과 편견 확인',
  },
  {
    id: 'privacy-copyright',
    label: '다른 사람의 얼굴과 개인정보를 함부로 쓰지 않았는가?',
    description: '허락 없이 다른 사람의 얼굴이나 개인정보를 넣지 않고, 이미지가 저작권을 보장하지 않는다는 점도 기억해요.',
    statusLabel: '사생활과 권리 확인',
  },
] as const satisfies readonly ImageCheckItem[]

export const imagePromptParts: readonly ImagePromptPart[] = imagePromptFields.map((field) => field.id)
export const imageComparisonParts: readonly ImageComparisonPart[] = imageComparisonOptions.map((comparison) => comparison.part)

export function replaceImagePromptSelection(
  selections: ImagePromptSelections,
  part: ImagePromptPart,
  choiceId: string,
): ImagePromptSelections {
  return { ...selections, [part]: choiceId }
}

export function getImageComparisonSelections(
  selections: ImagePromptSelections,
  comparison: ImageComparison,
): ImagePromptSelections {
  const currentChoice = getImagePromptChoice(comparison.part, selections[comparison.part])
  const alternativeChoice = getImagePromptChoice(comparison.part, comparison.alternativeChoiceId)
  const fallbackChoice = imagePromptFields.find((field) => field.id === comparison.part)?.choices.find((choiceOption) => choiceOption.id !== currentChoice?.id)

  return replaceImagePromptSelection(
    selections,
    comparison.part,
    alternativeChoice?.id !== currentChoice?.id ? alternativeChoice?.id ?? fallbackChoice?.id ?? selections[comparison.part] : fallbackChoice?.id ?? selections[comparison.part],
  )
}
