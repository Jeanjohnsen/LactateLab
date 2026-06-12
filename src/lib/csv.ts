import Papa from 'papaparse'
import type { Stage } from '@/core'

const INTENSITY_KEYS = ['intensity', 'power', 'watts', 'watt', 'speed', 'kmh', 'velocity']
const LACTATE_KEYS = ['lactate', 'lac', 'mmol', 'bla']
const HR_KEYS = ['heart_rate', 'heartrate', 'hr', 'bpm']
const RPE_KEYS = ['rpe', 'borg']

export function stagesToCsv(stages: Stage[]): string {
  return Papa.unparse({
    fields: ['intensity', 'lactate', 'heart_rate', 'rpe'],
    data: stages.map((s) => [s.intensity, s.lactate, s.heartRate ?? '', s.rpe ?? '']),
  })
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

function findKey(row: Record<string, unknown>, candidates: string[]): string | undefined {
  const keys = Object.keys(row)
  for (const c of candidates) {
    const hit = keys.find((k) => k.trim().toLowerCase() === c)
    if (hit) return hit
  }
  return undefined
}

/**
 * Parse CSV text into stages. Accepts headered files with flexible column names
 * (power/watts/speed, lactate/lac/mmol, hr/heart_rate, rpe). Falls back to
 * positional columns [intensity, lactate, hr, rpe] for headerless data.
 */
export function csvToStages(text: string): Stage[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  const rows = parsed.data.filter((r) => r && typeof r === 'object')
  if (rows.length > 0) {
    const sample = rows[0]
    const iKey = findKey(sample, INTENSITY_KEYS)
    const lKey = findKey(sample, LACTATE_KEYS)
    if (iKey && lKey) {
      const hKey = findKey(sample, HR_KEYS)
      const rKey = findKey(sample, RPE_KEYS)
      return rows
        .map((r) => {
          const intensity = num(r[iKey])
          const lactate = num(r[lKey])
          if (intensity === undefined || lactate === undefined) return null
          const stage: Stage = { intensity, lactate }
          const hr = hKey ? num(r[hKey]) : undefined
          const rpe = rKey ? num(r[rKey]) : undefined
          if (hr !== undefined) stage.heartRate = hr
          if (rpe !== undefined) stage.rpe = rpe
          return stage
        })
        .filter((s): s is Stage => s !== null)
    }
  }

  // headerless fallback: positional columns
  const positional = Papa.parse<string[]>(trimmed, { skipEmptyLines: true }).data
  return positional
    .map((cols) => {
      const intensity = num(cols[0])
      const lactate = num(cols[1])
      if (intensity === undefined || lactate === undefined) return null
      const stage: Stage = { intensity, lactate }
      const hr = num(cols[2])
      const rpe = num(cols[3])
      if (hr !== undefined) stage.heartRate = hr
      if (rpe !== undefined) stage.rpe = rpe
      return stage
    })
    .filter((s): s is Stage => s !== null)
}

/** Trigger a browser download of CSV text. */
export function downloadCsv(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
