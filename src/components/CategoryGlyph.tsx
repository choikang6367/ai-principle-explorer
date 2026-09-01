import type { CategoryGlyph as CategoryGlyphName } from '../types/experience'

interface CategoryGlyphProps {
  glyph: CategoryGlyphName
}

export function CategoryGlyph({ glyph }: CategoryGlyphProps) {
  if (glyph === 'animal') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="15" cy="16" r="5" />
        <circle cx="33" cy="16" r="5" />
        <path d="M11 29c0-6 5.8-10 13-10s13 4 13 10c0 5-5.8 9-13 9s-13-4-13-9Z" />
        <path d="M20 30c1.5 1.5 2.5 2 4 2s2.5-.5 4-2M24 28v4" />
      </svg>
    )
  }

  if (glyph === 'people') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="18" cy="16" r="5" />
        <circle cx="31" cy="17" r="4.5" />
        <path d="M8 36c0-7 4.2-11 10-11s10 4 10 11M26 36c0-5.5 3-9 7-9 4.2 0 7 3.5 7 9" />
        <path d="M14 21c1.2 1.2 2.6 1.7 4 1.7s2.8-.5 4-1.7" />
      </svg>
    )
  }

  if (glyph === 'science') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M19 8h10M22 8v12l-10 17c-1 2 0 3 3 3h18c3 0 4-1 3-3L26 20V8" />
        <path d="M16 31h16M20 26h8" />
        <circle cx="28" cy="34" r="1.5" />
      </svg>
    )
  }

  if (glyph === 'school') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="m8 14 16-6 16 6-16 6-16-6Z" />
        <path d="M13 19v12c6 4 16 4 22 0V19M24 20v18M16 38h16" />
        <circle cx="39" cy="15" r="2" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="10" />
      <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4 4M33.5 33.5l4 4M37.5 10.5l-4 4M14.5 33.5l-4 4" />
      <circle cx="24" cy="24" r="3" />
    </svg>
  )
}
