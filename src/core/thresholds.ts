// Threshold-detection methods. Each consumes the raw stages + fitted curve and
// returns a ThresholdResult. Methods deliberately disagree — we surface them all.

import type { CurveFit, Stage, ThresholdLevel, ThresholdMethodId, ThresholdResult } from './types'
import { METHODS } from './types'
import { bestThreeSegment, bestTwoSegment, dmaxPoint, linearInterpolate, solveForX } from './math'

interface Ctx {
  stages: Stage[]
  x: number[]
  y: number[]
  hrX: number[]
  hrY: number[]
  fit: CurveFit
}

function buildCtx(stages: Stage[], fit: CurveFit): Ctx {
  const x = stages.map((s) => s.intensity)
  const y = stages.map((s) => s.lactate)
  const withHr = stages.filter((s) => Number.isFinite(s.heartRate as number))
  return {
    stages,
    x,
    y,
    hrX: withHr.map((s) => s.intensity),
    hrY: withHr.map((s) => s.heartRate as number),
    fit,
  }
}

function hrAt(ctx: Ctx, intensity: number): number | undefined {
  if (ctx.hrX.length === 0) return undefined
  const v = linearInterpolate(ctx.hrX, ctx.hrY, intensity)
  return v == null ? undefined : Math.round(v)
}

function make(
  ctx: Ctx,
  method: ThresholdMethodId,
  level: ThresholdLevel,
  intensity: number,
  ok: boolean,
  label?: string,
  note?: string,
): ThresholdResult {
  return {
    method,
    level,
    intensity,
    lactate: Math.max(0, ctx.fit.predict(intensity)),
    heartRate: hrAt(ctx, intensity),
    label: label ?? METHODS[method].label,
    note,
    ok,
  }
}

function fixed(ctx: Ctx, method: ThresholdMethodId, level: ThresholdLevel, target: number): ThresholdResult {
  const x = solveForX(ctx.fit.predict, target, ctx.fit.xMin, ctx.fit.xMax)
  if (x == null) {
    return make(
      ctx,
      method,
      level,
      ctx.fit.xMax,
      false,
      undefined,
      `Lactate did not reach ${target} mmol/L within the tested range.`,
    )
  }
  return make(ctx, method, level, x, true)
}

function dmax(ctx: Ctx): ThresholdResult {
  const n = ctx.x.length
  const x1 = ctx.x[0]
  const y1 = ctx.y[0]
  const xn = ctx.x[n - 1]
  const yn = ctx.y[n - 1]
  const d = dmaxPoint(ctx.fit.predict, x1, y1, xn, yn, x1, xn)
  return make(ctx, 'dmax', 'LT2', d.x, true)
}

function modDmax(ctx: Ctx): ThresholdResult {
  const n = ctx.x.length
  let start = -1
  for (let i = 1; i < n; i++) {
    if (ctx.y[i] - ctx.y[i - 1] > 0.4) {
      start = i
      break
    }
  }
  let note: string | undefined
  if (start < 0) {
    start = 0
    note = 'No >0.4 mmol/L rise found; fell back to standard Dmax.'
  }
  const x1 = ctx.x[start]
  const y1 = ctx.y[start]
  const xn = ctx.x[n - 1]
  const yn = ctx.y[n - 1]
  const d = dmaxPoint(ctx.fit.predict, x1, y1, xn, yn, x1, xn)
  return make(ctx, 'mod_dmax', 'LT2', d.x, true, undefined, note)
}

function logLog(ctx: Ctx): ThresholdResult | null {
  const n = ctx.x.length
  if (n < 4) return null
  const lx = ctx.x.map((v) => Math.log(v))
  const ly = ctx.y.map((v) => Math.log(Math.max(v, 1e-6)))
  const seg = bestTwoSegment(lx, ly)
  if (!seg) return null
  const intensity = Math.exp(seg.knotX)
  return make(ctx, 'log_log', 'LT1', intensity, true)
}

function segmented(ctx: Ctx): ThresholdResult[] {
  const three = bestThreeSegment(ctx.x, ctx.y)
  if (three) {
    return [
      make(ctx, 'segmented', 'LT1', three.knot1X, true, 'Segmented (LT1)'),
      make(ctx, 'segmented', 'LT2', three.knot2X, true, 'Segmented (LT2)'),
    ]
  }
  const two = bestTwoSegment(ctx.x, ctx.y)
  if (two) {
    return [
      make(ctx, 'segmented', 'LT2', two.knotX, true, 'Segmented (2-seg)', 'Too few stages for a 3-segment fit; using a single knot.'),
    ]
  }
  return []
}

function baselinePlus(ctx: Ctx, delta: number): ThresholdResult {
  const baseline = Math.min(...ctx.y)
  return fixedToLevel(ctx, 'baseline_plus', 'LT1', baseline + delta, `baseline ${baseline.toFixed(1)} + ${delta} mmol/L`)
}

function iat(ctx: Ctx): ThresholdResult {
  const baseline = Math.min(...ctx.y)
  return fixedToLevel(ctx, 'iat', 'LT2', baseline + 1.5, `baseline ${baseline.toFixed(1)} + 1.5 mmol/L (Dickhuth)`)
}

function fixedToLevel(
  ctx: Ctx,
  method: ThresholdMethodId,
  level: ThresholdLevel,
  target: number,
  note: string,
): ThresholdResult {
  const x = solveForX(ctx.fit.predict, target, ctx.fit.xMin, ctx.fit.xMax)
  if (x == null) {
    return make(ctx, method, level, ctx.fit.xMax, false, undefined, `Curve did not reach ${target.toFixed(1)} mmol/L in range.`)
  }
  return make(ctx, method, level, x, true, undefined, note)
}

/** Run every applicable method against the data. `stages` must be sorted ascending. */
export function computeThresholds(stages: Stage[], fit: CurveFit): ThresholdResult[] {
  const ctx = buildCtx(stages, fit)
  const out: ThresholdResult[] = []

  // LT1 family
  out.push(fixed(ctx, 'fixed_2', 'LT1', 2.0))
  const ll = logLog(ctx)
  if (ll) out.push(ll)
  out.push(baselinePlus(ctx, 0.5))

  // LT2 family
  out.push(fixed(ctx, 'fixed_4', 'LT2', 4.0))
  out.push(dmax(ctx))
  out.push(modDmax(ctx))
  out.push(...segmented(ctx))
  out.push(iat(ctx))

  return out
}

/**
 * Estimate FatMax — the intensity of peak fat oxidation. True FatMax needs
 * indirect calorimetry (RER); here we use the widely-cited lactate proxy of
 * ~1.5 mmol/L on the fitted curve, clamped at or below LT1.
 */
export function computeFatMax(stages: Stage[], fit: CurveFit, lt1Intensity: number | null): ThresholdResult {
  const ctx = buildCtx(stages, fit)
  let x = solveForX(ctx.fit.predict, 1.5, ctx.fit.xMin, ctx.fit.xMax)
  let ok = true
  let note = 'Lactate proxy (≈1.5 mmol/L). True FatMax needs gas-exchange (RER).'
  if (x == null) {
    x = ctx.fit.xMin
    ok = false
    note = 'Lowest lactate already above 1.5 mmol/L — FatMax likely below the tested range.'
  }
  if (lt1Intensity != null && x > lt1Intensity) x = lt1Intensity
  return make(ctx, 'fatmax', 'FatMax', x, ok, 'FatMax', note)
}
