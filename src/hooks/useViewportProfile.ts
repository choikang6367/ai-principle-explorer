import { useSyncExternalStore } from 'react'

export type ViewportSize = 'mobile' | 'tablet' | 'desktop'
export type ViewportOrientation = 'portrait' | 'landscape'
export type ViewportHeight = 'short' | 'comfortable'
export type ViewportPointer = 'coarse' | 'fine'

export type ViewportProfile = {
  width: number
  height: number
  size: ViewportSize
  orientation: ViewportOrientation
  heightMode: ViewportHeight
  pointer: ViewportPointer
}

const fallbackProfile: ViewportProfile = {
  width: 1280,
  height: 720,
  size: 'desktop',
  orientation: 'landscape',
  heightMode: 'comfortable',
  pointer: 'fine',
}

function readViewportProfile(): ViewportProfile {
  if (typeof window === 'undefined') {
    return fallbackProfile
  }

  const width = Math.max(0, Math.round(window.innerWidth))
  const height = Math.max(0, Math.round(window.visualViewport?.height ?? window.innerHeight))
  const pointer = window.matchMedia('(pointer: coarse)').matches ? 'coarse' : 'fine'

  return {
    width,
    height,
    size: width <= 640 ? 'mobile' : width <= 900 ? 'tablet' : 'desktop',
    orientation: width >= height ? 'landscape' : 'portrait',
    heightMode: height < 640 ? 'short' : 'comfortable',
    pointer,
  }
}

let currentProfile = readViewportProfile()
const subscribers = new Set<() => void>()
let pointerQuery: MediaQueryList | null = null

function profilesMatch(left: ViewportProfile, right: ViewportProfile) {
  return (
    left.width === right.width &&
    left.height === right.height &&
    left.size === right.size &&
    left.orientation === right.orientation &&
    left.heightMode === right.heightMode &&
    left.pointer === right.pointer
  )
}

function updateProfile() {
  const nextProfile = readViewportProfile()

  if (profilesMatch(currentProfile, nextProfile)) {
    return
  }

  currentProfile = nextProfile
  subscribers.forEach((subscriber) => subscriber())
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber)

  if (subscribers.size === 1) {
    window.addEventListener('resize', updateProfile, { passive: true })
    window.addEventListener('orientationchange', updateProfile)
    window.visualViewport?.addEventListener('resize', updateProfile)
    pointerQuery = window.matchMedia('(pointer: coarse)')
    pointerQuery.addEventListener('change', updateProfile)
  }

  return () => {
    subscribers.delete(subscriber)

    if (subscribers.size === 0) {
      window.removeEventListener('resize', updateProfile)
      window.removeEventListener('orientationchange', updateProfile)
      window.visualViewport?.removeEventListener('resize', updateProfile)
      pointerQuery?.removeEventListener('change', updateProfile)
      pointerQuery = null
    }
  }
}

function getSnapshot() {
  return currentProfile
}

function getServerSnapshot() {
  return fallbackProfile
}

export function useViewportProfile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
