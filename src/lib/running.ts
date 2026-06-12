import type { Sport } from '@/core'

export type RunningUnit = 'pace' | 'speed'

/**
 * Parse a running intensity the user typed as either pace or speed into km/h
 * (stored internally as speed so all maths/zones stay consistent).
 *
 * Rules (auto-detect):
 *  - contains ":"  -> pace m:ss            ("5:40" -> 5 min 40 s/km)
 *  - value >= 12   -> speed km/h           ("20"   -> 20 km/h; "16.5" -> 16.5 km/h)
 *  - "." & < 12    -> pace M.SS            ("5.40" -> 5:40, "5.4" -> 5:40, "5.05" -> 5:05)
 *  - bare int < 12 -> pace M:00            ("6"    -> 6:00/km)
 */
export function parseRunningSpeed(raw: string): number | undefined {
  const s = raw.trim().replace(',', '.')
  if (!s) return undefined

  if (s.includes(':')) {
    const [mPart, sPart = '0'] = s.split(':')
    const m = parseInt(mPart, 10)
    const sec = parseInt(sPart || '0', 10)
    if (!Number.isFinite(m)) return undefined
    const total = m * 60 + (Number.isFinite(sec) ? sec : 0)
    return total > 0 ? 3600 / total : undefined
  }

  const n = parseFloat(s)
  if (!Number.isFinite(n) || n <= 0) return undefined

  // Fast enough to be a speed, or too slow to be a run-test pace -> treat as km/h.
  if (n >= 12) return n

  if (s.includes('.')) {
    const [mPart, fracPart = ''] = s.split('.')
    const m = parseInt(mPart || '0', 10)
    let sec = parseInt(fracPart.slice(0, 2).padEnd(2, '0'), 10)
    if (!Number.isFinite(sec) || sec > 59) sec = 0
    const total = m * 60 + sec
    return total > 0 ? 3600 / total : undefined
  }

  // bare integer < 12 -> pace M:00
  return 3600 / (n * 60)
}

/** Editable text for a stored speed, in the chosen running unit. */
export function runningSpeedToText(kmh: number | undefined, unit: RunningUnit): string {
  if (kmh === undefined || !Number.isFinite(kmh) || kmh <= 0) return ''
  if (unit === 'speed') return String(Math.round(kmh * 10) / 10)
  const total = Math.round(3600 / kmh)
  const m = Math.floor(total / 60)
  const s = total - m * 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Display value + unit suffix for an intensity, sport- and unit-aware. */
export function intensityParts(
  intensity: number,
  sport: Sport,
  runningUnit: RunningUnit,
): { value: string; unit: string } {
  if (sport === 'running') {
    if (runningUnit === 'pace') {
      const total = Math.round(3600 / intensity)
      const m = Math.floor(total / 60)
      const s = total - m * 60
      return { value: `${m}:${String(s).padStart(2, '0')}`, unit: '/km' }
    }
    return { value: (Math.round(intensity * 10) / 10).toFixed(1), unit: 'km/h' }
  }
  return { value: String(Math.round(intensity)), unit: 'W' }
}

/** One-string label, e.g. "5:40 /km" or "320 W". */
export function intensityLabel(intensity: number, sport: Sport, runningUnit: RunningUnit): string {
  const p = intensityParts(intensity, sport, runningUnit)
  return `${p.value} ${p.unit}`.trim()
}
