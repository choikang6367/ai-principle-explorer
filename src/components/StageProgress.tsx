const learningStages = ['질문', '나누기', 'Transformer', '참고하기', '예측하기', '비교하기', '완성']

interface StageProgressProps {
  current: number
}

export function StageProgress({ current }: StageProgressProps) {
  return (
    <div className="stage-progress" aria-label={`체험 진행 ${current + 1}단계, 전체 ${learningStages.length}단계`}>
      <div className="stage-progress__label">EXPERIENCE PATH</div>
      <div className="stage-progress__track">
        {learningStages.map((stage, index) => (
          <div className={`stage-progress__item ${index <= current ? 'is-active' : ''}`} key={stage}>
            <span className="stage-progress__dot" aria-hidden="true" />
            <span>{stage}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
