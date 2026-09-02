import { useId, type CSSProperties } from 'react'
import {
  defaultImagePromptSelections,
  getImagePromptChoice,
  getImagePromptSentence,
} from '../data/imageGeneration'
import type { ImagePromptSelections } from '../types/experience'

type ArtworkPalette = {
  skyStart: string
  skyEnd: string
  horizon: string
  distant: string
  groundStart: string
  groundEnd: string
  subjectOutline: string
  highlight: string
  accent: string
  glow: string
  shadow: string
  wash: string
}

type ArtworkIds = {
  sky: string
  ground: string
  moodWash: string
  pixelGrid: string
  shadow: string
  glow: string
  softGlow: string
  grain: string
}

type ArtworkProps = {
  selections: ImagePromptSelections
  className?: string
  label?: string
}

const placePalettes: Record<string, Omit<ArtworkPalette, 'highlight' | 'accent' | 'glow' | 'wash'>> = {
  'moon-surface': {
    skyStart: '#10173a',
    skyEnd: '#395d72',
    horizon: '#5b6d77',
    distant: '#2a3d59',
    groundStart: '#6f7175',
    groundEnd: '#273a4b',
    subjectOutline: '#152239',
    shadow: '#091526',
  },
  'sparkle-forest': {
    skyStart: '#122638',
    skyEnd: '#39796d',
    horizon: '#4c8d78',
    distant: '#1e4d4d',
    groundStart: '#346456',
    groundEnd: '#132f38',
    subjectOutline: '#122936',
    shadow: '#071c27',
  },
  'deep-ocean': {
    skyStart: '#062946',
    skyEnd: '#197489',
    horizon: '#49a8ae',
    distant: '#0f516c',
    groundStart: '#1a6470',
    groundEnd: '#082e4a',
    subjectOutline: '#082238',
    shadow: '#041b30',
  },
}

const moodPalettes: Record<string, Pick<ArtworkPalette, 'highlight' | 'accent' | 'glow' | 'wash'>> = {
  'warm-bright': {
    highlight: '#ffe3a0',
    accent: '#ff9e91',
    glow: '#ffd37c',
    wash: '#ffb36d',
  },
  'cool-calm': {
    highlight: '#b9ddff',
    accent: '#8ebaff',
    glow: '#a998ff',
    wash: '#548dca',
  },
  'dreamy-soft': {
    highlight: '#ffe0fb',
    accent: '#f5a9d7',
    glow: '#d6b2ff',
    wash: '#d78bd4',
  },
}

function getArtworkPalette(placeId: string | undefined, moodId: string | undefined): ArtworkPalette {
  const place = placePalettes[placeId ?? 'moon-surface'] ?? placePalettes['moon-surface']
  const mood = moodPalettes[moodId ?? 'warm-bright'] ?? moodPalettes['warm-bright']
  return { ...place, ...mood }
}

function generationStyle(selections: ImagePromptSelections, palette: ArtworkPalette): CSSProperties {
  const mood = getImagePromptChoice('mood', selections.mood)
  return {
    '--generation-accent': `var(--${mood?.accent ?? 'mint'})`,
    '--generation-art-glow': palette.glow,
  } as CSSProperties
}

function ArtworkDefinitions({ ids, palette }: { ids: ArtworkIds; palette: ArtworkPalette }) {
  return (
    <defs>
      <linearGradient id={ids.sky} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={palette.skyStart} />
        <stop offset="0.58" stopColor={palette.skyEnd} />
        <stop offset="1" stopColor={palette.distant} />
      </linearGradient>
      <linearGradient id={ids.ground} x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor={palette.groundStart} />
        <stop offset="1" stopColor={palette.groundEnd} />
      </linearGradient>
      <linearGradient id={ids.moodWash} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={palette.wash} stopOpacity="0.18" />
        <stop offset="0.52" stopColor={palette.wash} stopOpacity="0.02" />
        <stop offset="1" stopColor={palette.glow} stopOpacity="0.14" />
      </linearGradient>
      <pattern id={ids.pixelGrid} width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M16 0H0V16" fill="none" stroke={palette.highlight} strokeOpacity="0.24" strokeWidth="1" />
      </pattern>
      <filter id={ids.shadow} x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor={palette.shadow} floodOpacity="0.42" />
      </filter>
      <filter id={ids.glow} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="7" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id={ids.softGlow} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
      <filter id={ids.grain} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="19" result="texture" />
        <feColorMatrix in="texture" type="saturate" values="0" />
      </filter>
    </defs>
  )
}

function StarField({ palette }: { palette: ArtworkPalette }) {
  return (
    <g className="generation-art__star-field" fill={palette.highlight}>
      <circle cx="74" cy="63" r="2.5" /><circle cx="155" cy="104" r="3.5" /><circle cx="245" cy="48" r="2" />
      <circle cx="397" cy="53" r="3" /><circle cx="584" cy="137" r="2.5" /><circle cx="471" cy="177" r="2" />
      <path d="m114 155 6 14 14 6-14 6-6 14-6-14-14-6 14-6ZM366 89l5 11 11 5-11 5-5 11-5-11-11-5 11-5Z" />
      <path d="M205 164h18M214 155v18M545 57h16M553 49v16" stroke={palette.highlight} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function MoonBackdrop({ palette, ids }: { palette: ArtworkPalette; ids: ArtworkIds }) {
  return (
    <>
      <StarField palette={palette} />
      <circle cx="518" cy="83" r="82" fill={palette.glow} opacity="0.16" filter={`url(#${ids.softGlow})`} />
      <circle className="generation-art__orb" cx="518" cy="83" r="57" fill={palette.highlight} />
      <g fill={palette.horizon} opacity="0.24">
        <ellipse cx="492" cy="61" rx="13" ry="6" /><ellipse cx="535" cy="101" rx="18" ry="8" />
        <ellipse cx="510" cy="119" rx="9" ry="4" /><ellipse cx="551" cy="67" rx="8" ry="4" />
      </g>
      <path d="M0 285 74 245l64 27 73-53 68 46 83-68 79 47 77-29 96 39v94H0Z" fill={palette.distant} opacity="0.54" />
      <path d="M0 304q87-42 174-6t155-10q94-48 176-3t135-15v150H0Z" fill={`url(#${ids.ground})`} />
      <path d="M0 326q108-24 204 7t195-9q116-30 241-2" fill="none" stroke={palette.horizon} strokeOpacity="0.62" strokeWidth="3" />
      <g className="generation-art__moon-craters" fill={palette.shadow} opacity="0.27">
        <ellipse cx="72" cy="354" rx="25" ry="8" /><ellipse cx="167" cy="383" rx="38" ry="11" />
        <ellipse cx="519" cy="359" rx="31" ry="9" /><ellipse cx="580" cy="397" rx="17" ry="6" />
        <path d="M250 350q19-12 38 0t38 0" fill="none" stroke={palette.shadow} strokeWidth="4" />
      </g>
      <g fill={palette.highlight} opacity="0.7">
        <path d="m97 369 9-3 7 5-9 4Z" /><path d="m440 386 11-4 10 4-10 5Z" />
      </g>
    </>
  )
}

function ForestBackdrop({ palette, ids }: { palette: ArtworkPalette; ids: ArtworkIds }) {
  return (
    <>
      <circle cx="112" cy="76" r="67" fill={palette.glow} opacity="0.12" filter={`url(#${ids.softGlow})`} />
      <circle cx="112" cy="76" r="34" fill={palette.highlight} opacity="0.92" />
      <path d="M45 113q39-25 74 0 32-25 75 0" fill="none" stroke={palette.highlight} strokeOpacity="0.25" strokeWidth="9" strokeLinecap="round" />
      <path d="M0 268q72-74 148-12t165-10q100-70 174-14t153-22v132H0Z" fill={palette.distant} opacity="0.8" />
      <g className="generation-art__forest-canopy" fill={palette.distant} opacity="0.95">
        <path d="m23 327 46-135 49 135Z" /><path d="m115 327 61-177 63 177Z" /><path d="m478 327 55-158 57 158Z" />
        <path d="m563 327 32-103 34 103Z" />
      </g>
      <path d="M0 302q93-39 177 4t175-9q94-47 180-3t108-18v144H0Z" fill={`url(#${ids.ground})`} />
      <path d="M0 335q94-25 185 2t176-10q112-28 193-2t86-7" fill="none" stroke={palette.horizon} strokeOpacity="0.65" strokeWidth="4" />
      <g className="generation-art__forest-details" stroke={palette.horizon} strokeLinecap="round">
        <path d="M42 329v-42m0 16-13-12m13 3 14-15M160 330v-54m0 20-17-15m17 4 18-20M555 333v-42m0 12-14-13m14 4 15-16" strokeWidth="5" />
        <path d="M77 226h4M279 191h5M590 242h4" stroke={palette.highlight} strokeWidth="5" />
      </g>
      <g className="generation-art__fireflies" fill={palette.highlight} filter={`url(#${ids.glow})`}>
        <circle cx="81" cy="198" r="4" /><circle cx="222" cy="235" r="3" /><circle cx="479" cy="205" r="4" /><circle cx="572" cy="178" r="3" />
      </g>
    </>
  )
}

function OceanBackdrop({ palette, ids }: { palette: ArtworkPalette; ids: ArtworkIds }) {
  return (
    <>
      <path d="M0 0h640v110q-86-21-160 0t-164 0q-93-24-160 0T0 110Z" fill="#bcefff" opacity="0.08" />
      <g className="generation-art__ocean-rays" fill={palette.highlight} opacity="0.1">
        <path d="m118 0 90 0-30 228-44 0Z" /><path d="m285 0 66 0 8 215-49 0Z" /><path d="m460 0 82 0-57 240-44 0Z" />
      </g>
      <g className="generation-art__surface" fill="none" stroke={palette.highlight} strokeOpacity="0.55" strokeLinecap="round">
        <path d="M0 106q48-24 96 0t96 0 96 0 96 0 96 0 96 0 64 0" strokeWidth="5" />
        <path d="M0 124q44-17 88 0t88 0 88 0 88 0 88 0 88 0 112 0" strokeWidth="2" />
      </g>
      <g className="generation-art__bubbles" fill="none" stroke={palette.highlight} strokeOpacity="0.62">
        <circle cx="79" cy="214" r="7" /><circle cx="99" cy="183" r="4" /><circle cx="539" cy="164" r="6" /><circle cx="562" cy="137" r="3" />
      </g>
      <path d="M0 327q95-48 181-4t174-11q94-46 183-4t102-15v127H0Z" fill={`url(#${ids.ground})`} />
      <path d="M0 354q82-30 160 0t170-13q96-31 184 0t126-5" fill="none" stroke={palette.horizon} strokeOpacity="0.58" strokeWidth="4" />
      <g className="generation-art__ocean-plants" fill="none" strokeLinecap="round">
        <path d="M40 365q-8-54 18-84m-11 62q-25-28-34-58m37 41q20-29 29-57M590 375q-7-57 21-92m-12 68q-22-28-32-61" stroke={palette.horizon} strokeWidth="8" />
        <path d="M78 390q22-32 45-18 16 10 34-20M498 390q20-34 42-18 22 14 44-18" stroke={palette.accent} strokeWidth="6" />
      </g>
      <g fill={palette.glow} filter={`url(#${ids.glow})`}>
        <circle cx="92" cy="248" r="5" /><circle cx="144" cy="218" r="3" /><circle cx="566" cy="226" r="4" />
      </g>
    </>
  )
}

function ArtworkBackground({ placeId, palette, ids }: { placeId: string | undefined; palette: ArtworkPalette; ids: ArtworkIds }) {
  return (
    <g className="generation-art__background">
      <rect className="generation-art__sky" width="640" height="420" fill={`url(#${ids.sky})`} />
      <rect className="generation-art__mood-wash" width="640" height="420" fill={`url(#${ids.moodWash})`} />
      {placeId === 'sparkle-forest' ? <ForestBackdrop palette={palette} ids={ids} /> : null}
      {placeId === 'deep-ocean' ? <OceanBackdrop palette={palette} ids={ids} /> : null}
      {placeId !== 'sparkle-forest' && placeId !== 'deep-ocean' ? <MoonBackdrop palette={palette} ids={ids} /> : null}
    </g>
  )
}

function FineDetailOverlay({ palette, ids }: { palette: ArtworkPalette; ids: ArtworkIds }) {
  return (
    <g className="generation-art__fine-detail" pointerEvents="none">
      <g fill="none" stroke={palette.highlight} strokeLinecap="round">
        <path d="M27 348q54-15 104 2t104-3M405 363q48-16 98-1t108-5" strokeOpacity="0.22" strokeWidth="2" />
        <path d="M78 291q13-12 28-2m401 5q15-13 31-1" strokeOpacity="0.3" strokeWidth="2.5" />
        <path d="M184 327q8-8 17 0m329 32q8-8 17 0" strokeOpacity="0.38" strokeWidth="2" />
      </g>
      <g className="generation-art__micro-detail" fill={palette.highlight} opacity="0.58">
        <circle cx="38" cy="64" r="1.4" /><circle cx="195" cy="44" r="1.2" /><circle cx="302" cy="74" r="1.5" />
        <circle cx="428" cy="39" r="1.3" /><circle cx="603" cy="203" r="1.4" /><circle cx="84" cy="241" r="1.1" />
        <path d="m151 69 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm409 85 2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5Z" />
      </g>
      <rect className="generation-art__grain" width="640" height="420" filter={`url(#${ids.grain})`} opacity="0.055" />
    </g>
  )
}

function CatSubject({ palette }: { palette: ArtworkPalette }) {
  return (
    <g className="generation-art__cat" stroke={palette.subjectOutline} strokeLinejoin="round" strokeLinecap="round">
      <path d="M280 307q-48 39-56 3-5-28 33-47" fill="none" stroke="#d4895e" strokeWidth="18" />
      <path d="M267 247q4-27 26-37h58q30 6 41 37l11 75H263Z" fill="#587a92" strokeWidth="6" />
      <path d="M274 262q46 14 112 0" fill="none" stroke="#adc9d4" strokeOpacity="0.65" strokeWidth="4" />
      <path d="M286 303v42m75-42v42M273 347h28m47 0h29" fill="none" stroke="#c2d8e0" strokeWidth="16" />
      <path d="M274 237q-27 18-42 47m118-46q31 20 46 50" fill="none" stroke="#a8c5d2" strokeWidth="13" />
      <rect x="302" y="250" width="40" height="26" rx="5" fill="#213b57" strokeWidth="4" />
      <circle cx="314" cy="263" r="4" fill={palette.highlight} stroke="none" /><circle cx="329" cy="263" r="4" fill={palette.accent} stroke="none" />
      <path d="M320 241v-11" fill="none" stroke="#dbeaf0" strokeWidth="4" />
      <circle cx="320" cy="155" r="69" fill="#c8e2e8" fillOpacity="0.22" stroke="#dcecf0" strokeWidth="8" />
      <path d="M267 155 278 98l38 29q24-13 48 0l38-29-9 61q-6 43-62 51-56-8-64-55Z" fill="#d99767" strokeWidth="6" />
      <path d="m283 111-1-25 29 34M357 120l30-34-4 29" fill="#b96851" strokeWidth="4" />
      <path d="m290 109 8-10 11 16M369 114l11-15 5 12" fill="#f1b4a1" stroke="none" />
      <path d="M278 151q14-25 39-25t43 25q-4 43-40 48-36-5-42-48Z" fill="#e4a977" stroke="none" />
      <ellipse cx="304" cy="155" rx="8" ry="11" fill="#17263b" stroke="none" /><ellipse cx="348" cy="155" rx="8" ry="11" fill="#17263b" stroke="none" />
      <circle cx="306" cy="152" r="2.5" fill="#f4fbfa" stroke="none" /><circle cx="350" cy="152" r="2.5" fill="#f4fbfa" stroke="none" />
      <path d="m326 171 7 5-7 5-7-5Z" fill="#a85755" stroke="none" />
      <path d="M326 181q-9 10-18 2m18-2q9 10 18 2M286 173l-28-5m29 13-31 3m78-11 28-5m-29 13 31 3" fill="none" strokeWidth="3" />
      <path d="M260 145q-15-8-22-1m22 10q-16-2-23 5m144-14q15-8 22-1m-22 10q16-2 23 5" fill="none" stroke="#e9b98d" strokeWidth="3" />
      <path d="M267 140q4-54 53-55 52 0 56 55" fill="none" stroke="#f1fbf6" strokeOpacity="0.78" strokeWidth="6" />
      <path d="M276 102q40-35 80 0" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="5" />
    </g>
  )
}

function FoxSubject({ palette }: { palette: ArtworkPalette }) {
  return (
    <g className="generation-art__fox" stroke={palette.subjectOutline} strokeLinejoin="round" strokeLinecap="round">
      <path d="M274 294q-60 38-69-2-7-32 43-51 39-15 53 13" fill="none" stroke="#d96f4d" strokeWidth="25" />
      <path d="M279 229q-17 16-25 51l-6 73h138l-14-85q-5-24-26-39Z" fill="#5b769a" strokeWidth="6" />
      <path d="M267 251q31 23 105-3l-5 40q-47 19-96-1Z" fill="#7899b7" strokeWidth="4" />
      <path d="M284 306v40m80-40v40M272 348h29m52 0h30" fill="none" stroke="#c2d8e0" strokeWidth="16" />
      <path d="M280 242q-31 13-48 44m119-48q30 17 46 49" fill="none" stroke="#d5e3e7" strokeWidth="12" />
      <path d="M270 161q-2-30 18-48l-7-41 43 32q17-7 34 0l42-32-8 45q20 19 16 48-8 49-68 58-59-9-70-62Z" fill="#e17c53" strokeWidth="7" />
      <path d="m282 113-1-29 32 30M371 114l29-30-4 30" fill="#b95649" strokeWidth="4" />
      <path d="m286 112 10-11 13 15M373 114l11-13 5 12" fill="#f0b8a2" stroke="none" />
      <path d="M289 169q30-30 72 0-4 37-35 44-32-7-37-44Z" fill="#fff0d4" stroke="none" />
      <path d="M301 151q8-10 18-2m27 2q8-10 18-2" fill="none" strokeWidth="5" />
      <ellipse cx="316" cy="153" rx="5" ry="8" fill="#17263b" stroke="none" /><ellipse cx="350" cy="153" rx="5" ry="8" fill="#17263b" stroke="none" />
      <circle cx="317" cy="151" r="2" fill="#fff" stroke="none" /><circle cx="351" cy="151" r="2" fill="#fff" stroke="none" />
      <path d="m328 173 9 6-9 6-9-6Z" fill="#17263b" stroke="none" />
      <path d="M329 184q-10 9-19 1m19-1q10 9 19 1" fill="none" strokeWidth="3" />
      <path d="M287 173h-30m31 10h-34m84-10h30m-31 10h34" fill="none" stroke="#f4c69f" strokeWidth="3" />
      <path d="M292 218q36 20 70 0" fill="none" stroke="#eff8f4" strokeOpacity="0.68" strokeWidth="5" />
    </g>
  )
}

function RobotSubject({ palette }: { palette: ArtworkPalette }) {
  return (
    <g className="generation-art__robot" stroke={palette.subjectOutline} strokeLinejoin="round" strokeLinecap="round">
      <path d="M274 243q-24 3-42 28m134-28q25 3 44 29" fill="none" stroke="#a6c0cd" strokeWidth="14" />
      <circle cx="232" cy="274" r="10" fill="#d4e6e8" strokeWidth="4" /><circle cx="410" cy="275" r="10" fill="#d4e6e8" strokeWidth="4" />
      <path d="M262 223q4-17 21-25h75q20 6 25 25l8 101H254Z" fill="#89a7b7" strokeWidth="7" />
      <path d="M274 253h98M275 300h98" fill="none" stroke="#c7e1e2" strokeOpacity="0.42" strokeWidth="4" />
      <rect x="290" y="269" width="67" height="34" rx="7" fill="#1a3047" strokeWidth="5" />
      <circle cx="311" cy="285" r="7" fill={palette.highlight} stroke="none" /><circle cx="337" cy="285" r="7" fill={palette.accent} stroke="none" />
      <path d="M304 321v27m58-27v27M294 349h29m29 0h29" fill="none" stroke="#c2d8e0" strokeWidth="15" />
      <rect x="274" y="116" width="103" height="96" rx="30" fill="#91afbd" strokeWidth="7" />
      <rect x="291" y="141" width="69" height="43" rx="14" fill="#152a42" strokeWidth="5" />
      <circle cx="313" cy="162" r="7" fill={palette.highlight} stroke="none" /><circle cx="339" cy="162" r="7" fill={palette.accent} stroke="none" />
      <path d="M312 194q13 9 26 0" fill="none" stroke="#d6eaeb" strokeWidth="4" />
      <path d="M325 116V89m0 0 21-15" fill="none" stroke="#d6e5e5" strokeWidth="7" />
      <circle cx="348" cy="73" r="7" fill={palette.highlight} strokeWidth="3" />
      <path d="M281 125q19-20 45-20t44 20" fill="none" stroke="#e0eff0" strokeOpacity="0.65" strokeWidth="5" />
    </g>
  )
}

function SceneObjects({ sceneId, palette, ids }: { sceneId: string | undefined; palette: ArtworkPalette; ids: ArtworkIds }) {
  if (sceneId === 'paint-stars') {
    return (
      <g className="generation-art__scene-object" stroke={palette.subjectOutline} strokeLinejoin="round" strokeLinecap="round">
        <path d="M446 239v89m52-89v89M438 328h69" fill="none" stroke="#b7c9c9" strokeWidth="6" />
        <rect x="430" y="145" width="84" height="95" rx="7" fill="#edf0dc" strokeWidth="6" />
        <rect x="442" y="157" width="60" height="70" rx="4" fill={palette.distant} stroke="none" />
        <path d="m466 190 8-17 8 17 19 2-14 12 4 18-17-9-16 9 4-18-14-12Z" fill={palette.highlight} stroke="none" />
        <circle cx="453" cy="173" r="4" fill={palette.accent} stroke="none" /><circle cx="491" cy="210" r="4" fill={palette.glow} stroke="none" />
        <path d="M414 273q20-16 39-6" fill="none" stroke={palette.accent} strokeWidth="10" />
        <path d="m437 267 27-64" fill="none" stroke="#f1f6ee" strokeWidth="7" />
        <path d="m464 204 21-9" fill="none" stroke={palette.accent} strokeWidth="10" />
        <circle cx="487" cy="192" r="5" fill={palette.highlight} stroke="none" filter={`url(#${ids.glow})`} />
      </g>
    )
  }

  if (sceneId === 'find-rock') {
    return (
      <g className="generation-art__scene-object" stroke={palette.subjectOutline} strokeLinejoin="round" strokeLinecap="round">
        <path d="m422 341 36-28 48 19-17 34-58 5Z" fill={palette.glow} strokeWidth="5" filter={`url(#${ids.shadow})`} />
        <path d="m439 333 20-13 19 8-18 16Z" fill={palette.highlight} stroke="none" opacity="0.82" />
        <circle cx="423" cy="278" r="31" fill="none" stroke="#dcefed" strokeWidth="6" />
        <path d="m444 300 31 32" fill="none" stroke="#dcefed" strokeWidth="7" />
        <path d="M400 324q22-28 38-3" fill="none" stroke={palette.accent} strokeWidth="4" strokeDasharray="5 7" />
        <path d="m480 304 4-11 4 11 11 4-11 4-4 11-4-11-11-4Z" fill={palette.highlight} stroke="none" filter={`url(#${ids.glow})`} />
      </g>
    )
  }

  return (
    <g className="generation-art__scene-object" stroke={palette.subjectOutline} strokeLinejoin="round" strokeLinecap="round">
      <path d="M466 139v203" fill="none" stroke="#d9bc75" strokeWidth="7" />
      <path d="M470 143h108l-40 45-68-6Z" fill={palette.accent} strokeWidth="5" />
      <path d="M479 153h72" stroke={palette.highlight} strokeOpacity="0.55" strokeWidth="4" />
      <path d="M459 339h16m-8-7v15" stroke="#d9bc75" strokeWidth="4" />
    </g>
  )
}

function SceneInteraction({ sceneId, subjectId, palette }: { sceneId: string | undefined; subjectId: string | undefined; palette: ArtworkPalette }) {
  const armStroke = subjectId === 'scout-robot' ? '#c5dde1' : subjectId === 'cape-fox' ? '#f1a47c' : '#e6b080'

  if (sceneId === 'paint-stars') {
    return <path d="M381 253q22-46 55-60" fill="none" stroke={armStroke} strokeWidth="14" strokeLinecap="round" />
  }

  if (sceneId === 'find-rock') {
    return <path d="M383 269q21 23 48 31" fill="none" stroke={armStroke} strokeWidth="14" strokeLinecap="round" />
  }

  return (
    <>
      <path d="M383 249q28-22 76-11" fill="none" stroke={armStroke} strokeWidth="14" strokeLinecap="round" />
      <circle cx="456" cy="238" r="9" fill={armStroke} stroke={palette.subjectOutline} strokeWidth="4" />
    </>
  )
}

function SubjectArtwork({ subjectId, sceneId, palette, ids }: { subjectId: string | undefined; sceneId: string | undefined; palette: ArtworkPalette; ids: ArtworkIds }) {
  return (
    <>
      <ellipse className="generation-art__subject-shadow" cx="321" cy="356" rx="106" ry="18" fill={palette.shadow} opacity="0.45" />
      <g className="generation-art__subject" filter={`url(#${ids.shadow})`}>
        {subjectId === 'scout-robot' ? <RobotSubject palette={palette} /> : null}
        {subjectId === 'cape-fox' ? <FoxSubject palette={palette} /> : null}
        {subjectId !== 'scout-robot' && subjectId !== 'cape-fox' ? <CatSubject palette={palette} /> : null}
        <SceneInteraction sceneId={sceneId} subjectId={subjectId} palette={palette} />
      </g>
    </>
  )
}

function StyleOverlay({ styleId, palette, ids }: { styleId: string | undefined; palette: ArtworkPalette; ids: ArtworkIds }) {
  if (styleId === 'pixel-art') {
    return <rect className="generation-art__pixel-grid" width="640" height="420" fill={`url(#${ids.pixelGrid})`} />
  }

  if (styleId === 'watercolor') {
    return (
      <g className="generation-art__watercolor-wash" fill={palette.highlight} opacity="0.16">
        <circle cx="106" cy="103" r="54" /><circle cx="556" cy="239" r="77" /><circle cx="223" cy="363" r="64" />
        <path d="M0 249q83-36 158 0t160 0 170 0 152 0v62H0Z" />
      </g>
    )
  }

  return (
    <g className="generation-art__storybook-detail" fill="none" stroke={palette.highlight} strokeOpacity="0.42" strokeLinecap="round">
      <path d="M24 285q24-17 49-5m495 2q24-18 52-4" strokeWidth="3" />
      <path d="M49 307v24m8-12-8-8m8 7 9-10M590 308v22m-8-10 8-8m-8 8-10-11" strokeWidth="3" />
      <circle cx="210" cy="77" r="4" /><circle cx="429" cy="119" r="3" />
    </g>
  )
}

export function GeneratedArtwork({ selections, className = '', label }: ArtworkProps) {
  const artworkId = useId().replace(/:/gu, '')
  const ids: ArtworkIds = {
    sky: `generation-art-sky-${artworkId}`,
    ground: `generation-art-ground-${artworkId}`,
    moodWash: `generation-art-mood-${artworkId}`,
    pixelGrid: `generation-art-pixel-${artworkId}`,
    shadow: `generation-art-shadow-${artworkId}`,
    glow: `generation-art-glow-${artworkId}`,
    softGlow: `generation-art-soft-glow-${artworkId}`,
    grain: `generation-art-grain-${artworkId}`,
  }
  const subject = getImagePromptChoice('subject', selections.subject) ?? getImagePromptChoice('subject', defaultImagePromptSelections.subject)
  const scene = getImagePromptChoice('scene', selections.scene) ?? getImagePromptChoice('scene', defaultImagePromptSelections.scene)
  const place = getImagePromptChoice('place', selections.place) ?? getImagePromptChoice('place', defaultImagePromptSelections.place)
  const style = getImagePromptChoice('style', selections.style) ?? getImagePromptChoice('style', defaultImagePromptSelections.style)
  const mood = getImagePromptChoice('mood', selections.mood) ?? getImagePromptChoice('mood', defaultImagePromptSelections.mood)
  const palette = getArtworkPalette(place?.id, mood?.id)
  const artLabel = label ?? `선택한 프롬프트를 반영한 교육용 구성 그림: ${getImagePromptSentence(selections)}`

  return (
    <div
      className={`generation-art ${className}`}
      data-place={place?.id}
      data-style={style?.id}
      data-mood={mood?.id}
      data-subject={subject?.id}
      data-scene={scene?.id}
      style={generationStyle(selections, palette)}
      role="img"
      aria-label={artLabel}
    >
      <svg className="generation-art__svg" viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <ArtworkDefinitions ids={ids} palette={palette} />
        <ArtworkBackground placeId={place?.id} palette={palette} ids={ids} />
        <SceneObjects sceneId={scene?.id} palette={palette} ids={ids} />
        <SubjectArtwork subjectId={subject?.id} sceneId={scene?.id} palette={palette} ids={ids} />
        <StyleOverlay styleId={style?.id} palette={palette} ids={ids} />
        <FineDetailOverlay palette={palette} ids={ids} />
        {mood?.id === 'dreamy-soft' ? (
          <g className="generation-art__dream-glow" fill={palette.glow} filter={`url(#${ids.glow})`}>
            <circle cx="157" cy="280" r="5" /><circle cx="489" cy="90" r="4" /><circle cx="541" cy="275" r="5" />
          </g>
        ) : null}
        <rect className="generation-art__vignette" width="640" height="420" fill="none" stroke={palette.subjectOutline} strokeOpacity="0.2" strokeWidth="24" />
      </svg>
      <span className="generation-art__badge">EDUCATIONAL COMPOSITE</span>
      <span className="generation-art__caption">{subject?.shortLabel} · {scene?.shortLabel} · {place?.shortLabel} · {style?.shortLabel}</span>
    </div>
  )
}
