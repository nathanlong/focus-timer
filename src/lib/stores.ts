import { writable } from 'svelte/store'
import type { Timer } from './types'

export const timers = writable<Timer[]>([])
export const activeTimerId = writable<string | null>(null)
export const totalFocusPoints = writable<number>(0)
