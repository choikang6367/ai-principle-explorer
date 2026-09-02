import { useId } from 'react'
import { defaultImagePromptSelections, getImagePromptPreset, imagePromptPresets } from '../data/imageGeneration'
import type { ImagePromptSelections } from '../types/experience'

type SubjectFocus = {
  cx: number
  cy: number
  rx: number
  ry: number
}

const subjectFocusByPreset: Record<string, SubjectFocus> = {
  'moon-expedition': { cx: 238, cy: 252, rx: 126, ry: 174 },
  'forest-painter': { cx: 452, cy: 257, rx: 152, ry: 185 },
  'ocean-discovery': { cx: 245, cy: 264, rx: 144, ry: 137 },
}

const stageLabels = ['무작위 노이즈', '큰 색 영역', '주인공 자리', '실제 윤곽', '배경 분리', '질감과 세부'] as const

function assetSource(path: string) {
  return `${import.meta.env.BASE_URL}${path}`
}

export function ImageProcessArtwork({
  selections,
  stepIndex,
  label,
}: {
  selections: ImagePromptSelections
  stepIndex: number
  label: string
}) {
  const processId = useId().replace(/:/gu, '')
  const preset = getImagePromptPreset(selections) ?? getImagePromptPreset(defaultImagePromptSelections) ?? imagePromptPresets[0]
  const focus = subjectFocusByPreset[preset.id] ?? subjectFocusByPreset['moon-expedition']
  const imagePath = assetSource(preset.imagePath)
  const safeStep = Math.min(Math.max(stepIndex, 0), stageLabels.length - 1)
  const ids = {
    coarseBlur: `process-coarse-${processId}`,
    softBlur: `process-soft-${processId}`,
    edge: `process-edge-${processId}`,
    noise: `process-noise-${processId}`,
    subjectClip: `process-subject-${processId}`,
    backgroundMask: `process-background-${processId}`,
    backgroundFeather: `process-background-feather-${processId}`,
    focusGlow: `process-focus-${processId}`,
  }

  return (
    <div className="generation-process-visual" data-process-step={safeStep} role="img" aria-label={label}>
      <svg viewBox="0 0 640 426.5" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <filter id={ids.coarseBlur} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="26" />
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0.12 .28 .46 .64 .82" />
              <feFuncG type="discrete" tableValues="0.1 .25 .42 .6 .78" />
              <feFuncB type="discrete" tableValues="0.18 .35 .52 .7 .9" />
            </feComponentTransfer>
          </filter>
          <filter id={ids.softBlur} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="10" />
            <feColorMatrix type="saturate" values="0.72" />
          </filter>
          <filter id={ids.edge} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" result="gray" />
            <feConvolveMatrix in="gray" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" divisor="1" bias="0.5" result="edges" />
            <feComponentTransfer in="edges">
              <feFuncR type="linear" slope="1.8" intercept="-0.35" />
              <feFuncG type="linear" slope="1.8" intercept="-0.35" />
              <feFuncB type="linear" slope="1.8" intercept="-0.35" />
            </feComponentTransfer>
          </filter>
          <filter id={ids.noise} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="4" seed="37" />
            <feColorMatrix type="matrix" values="1.2 0 0 0 -.08  0 .9 0 0 .04  0 0 1.35 0 -.1  0 0 0 1 0" />
          </filter>
          <clipPath id={ids.subjectClip}>
            <ellipse cx={focus.cx} cy={focus.cy} rx={focus.rx} ry={focus.ry} />
          </clipPath>
          <mask id={ids.backgroundMask}>
            <rect width="640" height="426.5" fill="white" />
            <ellipse cx={focus.cx} cy={focus.cy} rx={focus.rx} ry={focus.ry} fill={`url(#${ids.backgroundFeather})`} />
          </mask>
          <radialGradient id={ids.backgroundFeather}>
            <stop offset="0" stopColor="black" />
            <stop offset="0.68" stopColor="black" />
            <stop offset="1" stopColor="white" />
          </radialGradient>
          <radialGradient id={ids.focusGlow}>
            <stop offset="0" stopColor="#dfffee" stopOpacity="0.44" />
            <stop offset="0.7" stopColor="#89f5c5" stopOpacity="0.12" />
            <stop offset="1" stopColor="#89f5c5" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="640" height="426.5" fill="#0b1729" />

        {safeStep === 0 ? (
          <g className="generation-process-visual__noise">
            <rect width="640" height="426.5" filter={`url(#${ids.noise})`} opacity="0.9" />
            <g fill="#b9a4ff" opacity="0.48">
              <circle cx="78" cy="82" r="34" /><circle cx="197" cy="136" r="21" /><circle cx="314" cy="68" r="31" />
              <circle cx="447" cy="159" r="27" /><circle cx="568" cy="96" r="39" /><circle cx="123" cy="310" r="42" />
              <circle cx="273" cy="349" r="25" /><circle cx="414" cy="282" r="40" /><circle cx="548" cy="338" r="28" />
            </g>
            <g fill="#ff9e91" opacity="0.38">
              <rect x="39" y="189" width="58" height="42" rx="12" /><rect x="220" y="218" width="76" height="54" rx="15" />
              <rect x="477" y="225" width="70" height="46" rx="13" /><rect x="344" y="365" width="55" height="36" rx="11" />
            </g>
          </g>
        ) : null}

        {safeStep === 1 ? (
          <>
            <image href={imagePath} width="640" height="426.5" preserveAspectRatio="xMidYMid slice" filter={`url(#${ids.coarseBlur})`} />
            <rect width="640" height="426.5" fill="#b9a4ff" opacity="0.08" />
          </>
        ) : null}

        {safeStep === 2 ? (
          <>
            <image href={imagePath} width="640" height="426.5" preserveAspectRatio="xMidYMid slice" opacity="0.2" filter={`url(#${ids.coarseBlur})`} />
            <ellipse cx={focus.cx} cy={focus.cy} rx={focus.rx * 1.2} ry={focus.ry * 1.15} fill={`url(#${ids.focusGlow})`} />
            <image href={imagePath} width="640" height="426.5" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${ids.subjectClip})`} filter={`url(#${ids.softBlur})`} opacity="0.8" />
            <ellipse cx={focus.cx} cy={focus.cy} rx={focus.rx} ry={focus.ry} fill="none" stroke="#bcefd8" strokeWidth="4" strokeDasharray="10 10" opacity="0.82" />
          </>
        ) : null}

        {safeStep === 3 ? (
          <>
            <image href={imagePath} width="640" height="426.5" preserveAspectRatio="xMidYMid slice" opacity="0.16" />
            <image href={imagePath} width="640" height="426.5" preserveAspectRatio="xMidYMid slice" filter={`url(#${ids.edge})`} opacity="0.88" />
            <image href={imagePath} width="640" height="426.5" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${ids.subjectClip})`} opacity="0.28" />
          </>
        ) : null}

        {safeStep === 4 ? (
          <>
            <image href={imagePath} width="640" height="426.5" preserveAspectRatio="xMidYMid slice" filter={`url(#${ids.softBlur})`} opacity="0.72" />
            <image href={imagePath} width="640" height="426.5" preserveAspectRatio="xMidYMid slice" mask={`url(#${ids.backgroundMask})`} />
          </>
        ) : null}

        {safeStep === 5 ? (
          <>
            <image href={imagePath} width="640" height="426.5" preserveAspectRatio="xMidYMid slice" />
            <rect width="640" height="426.5" filter={`url(#${ids.noise})`} opacity="0.07" style={{ mixBlendMode: 'soft-light' }} />
            <rect x="8" y="8" width="624" height="410.5" fill="none" stroke="#e5fff3" strokeOpacity="0.2" strokeWidth="2" />
          </>
        ) : null}
      </svg>
      <span className="generation-process-visual__stage">PROCESS / {String(safeStep + 1).padStart(2, '0')}</span>
      <span className="generation-process-visual__caption">{stageLabels[safeStep]}</span>
    </div>
  )
}
