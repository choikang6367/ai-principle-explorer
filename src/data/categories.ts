import type { Category } from '../types/experience'

export const categories = [
  {
    id: 'animal',
    number: '01',
    label: '동물',
    englishLabel: 'LIVING THINGS',
    description: '동물의 행동과 특징을 따라가 봐요.',
    glyph: 'animal',
    accent: 'mint',
  },
  {
    id: 'people',
    number: '02',
    label: '사람',
    englishLabel: 'HUMAN NATURE',
    description: '사람의 마음과 행동을 여러 각도에서 살펴봐요.',
    glyph: 'people',
    accent: 'violet',
  },
  {
    id: 'everyday',
    number: '03',
    label: '일상',
    englishLabel: 'EVERYDAY MODE',
    description: '평범한 하루 속 기술과 궁금증을 새롭게 봐요.',
    glyph: 'everyday',
    accent: 'lime',
  },
  {
    id: 'science',
    number: '04',
    label: '과학',
    englishLabel: 'HOW IT WORKS',
    description: '주변에서 일어나는 현상의 원리를 살펴봐요.',
    glyph: 'science',
    accent: 'amber',
  },
  {
    id: 'school',
    number: '05',
    label: '학교',
    englishLabel: 'SCHOOL LIFE',
    description: '매일 만나는 학교와 배움의 질문을 골라 봐요.',
    glyph: 'school',
    accent: 'blue',
  },
] as const satisfies readonly Category[]
