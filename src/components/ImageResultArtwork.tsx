import { defaultImagePromptSelections, getImagePromptPreset, imagePromptPresets } from '../data/imageGeneration'
import type { ImagePromptSelections } from '../types/experience'

function assetSource(path: string) {
  return `${import.meta.env.BASE_URL}${path}`
}

export function ImageResultArtwork({
  selections,
  className = '',
  label,
}: {
  selections: ImagePromptSelections
  className?: string
  label?: string
}) {
  const preset = getImagePromptPreset(selections) ?? getImagePromptPreset(defaultImagePromptSelections) ?? imagePromptPresets[0]

  return (
    <figure className={`generation-result-art ${className}`} data-accent={preset.accent}>
      <img src={assetSource(preset.imagePath)} alt={label ?? preset.imageAlt} />
      <span className="generation-result-art__number">ROUTE / {preset.number}</span>
      <figcaption><strong>{preset.title}</strong><span>{preset.description}</span></figcaption>
    </figure>
  )
}
