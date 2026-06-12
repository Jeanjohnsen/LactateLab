import type { CurveFit, Stage } from './types'
import { polyFit } from './math'

/**
 * Fit a lactate-vs-intensity curve. Uses a 3rd-order polynomial when there are
 * enough points, dropping the degree for sparse data (and again if the system
 * is singular). Returns null if fewer than 2 distinct points are available.
 */
export function fitLactateCurve(stages: Stage[]): CurveFit | null {
  const pts = stages
    .filter((s) => Number.isFinite(s.intensity) && Number.isFinite(s.lactate))
    .slice()
    .sort((a, b) => a.intensity - b.intensity)

  // collapse duplicate intensities (a vertical pair breaks the fit)
  const x: number[] = []
  const y: number[] = []
  for (const p of pts) {
    if (x.length > 0 && p.intensity === x[x.length - 1]) continue
    x.push(p.intensity)
    y.push(p.lactate)
  }
  if (x.length < 2) return null

  let degree = Math.min(3, x.length - 1)
  while (degree >= 1) {
    try {
      const f = polyFit(x, y, degree)
      if (f.coefficients.every(Number.isFinite)) {
        return {
          degree: f.degree,
          predict: f.predict,
          coefficients: f.coefficients,
          normalize: { mean: f.mean, scale: f.scale },
          r2: f.r2,
          xMin: f.xMin,
          xMax: f.xMax,
        }
      }
    } catch {
      // singular normal equations — try a lower degree
    }
    degree -= 1
  }
  return null
}
