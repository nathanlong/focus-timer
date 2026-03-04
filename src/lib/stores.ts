import { writable } from 'svelte/store'
import type { Timer, FocusThresholds } from './types'
import { DEFAULT_THRESHOLDS } from './types'

export const timers = writable<Timer[]>([])
export const activeTimerId = writable<string | null>(null)
export const totalFocusPoints = writable<number>(0)
export const settings = writable<FocusThresholds>({ ...DEFAULT_THRESHOLDS })
