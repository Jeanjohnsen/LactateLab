// Public API of the calculation core. computeReport is the single entry point:
// TestSession in -> ThresholdReport out, as plain data.

import type {
  Stage,
  TestSession,
  ThresholdLevel,
  ThresholdMethodId,
  ThresholdReport,
  ThresholdResult,
} from './types'
import { DEFAULT_PRIMARY_METHOD } from './types'
import { fitLactateCurve } from './curveFit'
import { computeFatMax, computeThresholds } from './thresholds'
import { buildZoneSets } from './zones'
import { wattsPerKg } from './units'

export * from './types'
export * from './units'
export * from './zones'
export { fitLactateCurve } from './curveFit'
export { computeFatMax, computeThresholds } from './thresholds'

function cleanStages(stages: Stage[]): Stage[] {
  return stages
    .filter((s) => Number.isFinite(s.intensity) && Number.isFinite(s.lactate) && s.intensity > 0)
    .slice()
    .sort((a, b) => a.intensity - b.intensity)
}

function pickLevel(
  results: ThresholdResult[],
  preference: ThresholdMethodId[],
  level: ThresholdLevel,
): ThresholdResult | null {
  for (const m of preference) {
    const r = results.find((res) => res.method === m && res.level === level && res.ok)
    if (r) return r
  }
  return results.find((res) => res.level === level && res.ok) ?? null
}

export function computeReport(session: TestSession): ThresholdReport {
  const { sport } = session
  const primaryMethod = session.primaryMethod ?? DEFAULT_PRIMARY_METHOD
  const stages = cleanStages(session.stages)
  const warnings: string[] = []

  const fit = fitLactateCurve(stages)
  if (!fit) {
    return {
      sport,
      fit: null,
      results: [],
      lt1: null,
      lt2: null,
      fatmax: null,
      ftp: null,
      ftpPerKg: null,
      thresholdHr: null,
      zoneSets: [],
      warnings: ['Need at least 2 valid stages (intensity + lactate) to analyse.'],
      primaryMethod,
    }
  }

  if (stages.length < 4) {
    warnings.push(
      `Only ${stages.length} stage${stages.length === 1 ? '' : 's'}: breakpoints are less reliable below 4–5 stages.`,
    )
  }
  if (fit.r2 < 0.9) {
    warnings.push(`Curve fit is loose (R² = ${fit.r2.toFixed(2)}); lactate readings may be noisy.`)
  }

  const results = computeThresholds(stages, fit)

  const lt2 =
    results.find((r) => r.method === primaryMethod && r.level === 'LT2' && r.ok) ??
    pickLevel(results, ['mod_dmax', 'fixed_4', 'dmax', 'segmented', 'iat'], 'LT2')
  const lt1 = pickLevel(results, ['log_log', 'fixed_2', 'baseline_plus', 'segmented'], 'LT1')
  const fatmax = computeFatMax(stages, fit, lt1?.intensity ?? null)

  const ftp = lt2 ? lt2.intensity : null
  const thresholdHr = lt2?.heartRate ?? null
  const ftpPerKg =
    ftp != null && session.bodyMassKg && sport !== 'running' ? wattsPerKg(ftp, session.bodyMassKg) : null

  if (lt1 && lt2 && lt1.intensity >= lt2.intensity) {
    warnings.push('LT1 ≥ LT2 — the data is too flat or noisy to separate the two thresholds.')
  }

  const ftpCandidates = results.filter((r) => r.level === 'LT2' && r.ok).map((r) => r.intensity)
  if (ftpCandidates.length > 1) {
    const lo = Math.min(...ftpCandidates)
    const hi = Math.max(...ftpCandidates)
    const mid = (lo + hi) / 2
    if (mid > 0 && (hi - lo) / mid > 0.15) {
      const fmt = (v: number) => (sport === 'running' ? v.toFixed(1) : String(Math.round(v)))
      warnings.push(`LT2 estimates span ${fmt(lo)}–${fmt(hi)} across methods — choose the one matching your protocol.`)
    }
  }

  const zoneSets = buildZoneSets(
    sport,
    lt1?.intensity ?? null,
    lt2?.intensity ?? null,
    ftp,
    thresholdHr,
    fatmax.ok ? fatmax.intensity : null,
  )

  return { sport, fit, results, lt1, lt2, fatmax, ftp, ftpPerKg, thresholdHr, zoneSets, warnings, primaryMethod }
}
