import type { Sport } from './types'

export function wattsPerKg(watts: number, massKg: number): number {
  return massKg > 0 ? watts / massKg : 0
}

/** km/h -> seconds per km. */
export function speedToPaceSeconds(kmh: number): number {
  return kmh > 0 ? 3600 / kmh : 0
}

/** seconds per km -> km/h. */
export function paceToSpeed(secondsPerKm: number): number {
  return secondsPerKm > 0 ? 3600 / secondsPerKm : 0
}

/** Format a running speed as a m:ss/km pace string. */
export function formatPace(kmh: number): string {
  if (kmh <= 0) return '—'
  const total = Math.round(3600 / kmh)
  let m = Math.floor(total / 60)
  let s = total - m * 60
  if (s === 60) {
    m += 1
    s = 0
  }
  return `${m}:${String(s).padStart(2, '0')}/km`
}

export function intensityUnit(sport: Sport): string {
  return sport === 'running' ? 'km/h' : 'W'
}

/** Human label for an intensity value, sport-aware. */
export function formatIntensity(value: number, sport: Sport): string {
  if (sport === 'running') return `${value.toFixed(1)} km/h`
  return `${Math.round(value)} W`
}
