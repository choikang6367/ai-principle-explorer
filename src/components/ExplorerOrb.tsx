export function ExplorerOrb() {
  return (
    <div className="explorer-visual" aria-label="AI 원리 탐험의 세 가지 흐름을 보여주는 그림" role="img">
      <div className="orb-glow" />
      <div className="orb-orbit orb-orbit--outer" />
      <div className="orb-orbit orb-orbit--middle" />
      <div className="orb-orbit orb-orbit--inner" />
      <div className="orb-node orb-node--top">다음 말</div>
      <div className="orb-node orb-node--right">확률</div>
      <div className="orb-node orb-node--bottom">선택</div>
      <div className="orb-core">
        <span className="orb-core__eyebrow">AI LAB</span>
        <strong>GO</strong>
        <span className="orb-core__line" />
        <span className="orb-core__step">01 / 06</span>
      </div>
      <div className="orb-spark orb-spark--one" />
      <div className="orb-spark orb-spark--two" />
      <div className="orb-spark orb-spark--three" />
    </div>
  )
}
