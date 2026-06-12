// Low-level numeric toolbox: regression, interpolation, segmentation, geometry.
// No domain knowledge here — just math, so it can be tested in isolation.

import { Matrix, solve } from 'ml-matrix'

export function mean(a: number[]): number {
  if (a.length === 0) return NaN
  let s = 0
  for (const v of a) s += v
  return s / a.length
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi)
}

/**
 * Piecewise-linear interpolation. `xs` must be sorted ascending.
 * Values of `x` outside the range are clamped to the nearest endpoint.
 */
export function linearInterpolate(xs: number[], ys: number[], x: number): number | null {
  const n = xs.length
  if (n === 0 || n !== ys.length) return null
  if (n === 1) return ys[0]
  if (x <= xs[0]) return ys[0]
  if (x >= xs[n - 1]) return ys[n - 1]
  for (let i = 1; i < n; i++) {
    if (x <= xs[i]) {
      const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1])
      return ys[i - 1] + t * (ys[i] - ys[i - 1])
    }
  }
  return ys[n - 1]
}

export interface LineFit {
  slope: number
  intercept: number
  sse: number
  r2: number
}

/** Ordinary least-squares straight-line fit. */
export function linReg(x: number[], y: number[]): LineFit {
  const n = x.length
  const mx = mean(x)
  const my = mean(y)
  let sxx = 0
  let sxy = 0
  for (let i = 0; i < n; i++) {
    sxx += (x[i] - mx) ** 2
    sxy += (x[i] - mx) * (y[i] - my)
  }
  const slope = sxx === 0 ? 0 : sxy / sxx
  const intercept = my - slope * mx
  let sse = 0
  let sst = 0
  for (let i = 0; i < n; i++) {
    const pred = slope * x[i] + intercept
    sse += (y[i] - pred) ** 2
    sst += (y[i] - my) ** 2
  }
  const r2 = sst === 0 ? 1 : 1 - sse / sst
  return { slope, intercept, sse, r2 }
}

export interface PolyFitResult {
  coefficients: number[]
  mean: number
  scale: number
  r2: number
  degree: number
  xMin: number
  xMax: number
  predict: (x: number) => number
}

/**
 * Least-squares polynomial fit. x is centered and scaled to ~[-1, 1] before
 * fitting (the Vandermonde normal equations are badly conditioned otherwise).
 * Throws if the system is singular.
 */
export function polyFit(x: number[], y: number[], degree: number): PolyFitResult {
  const n = x.length
  const m = mean(x)
  const xMin = Math.min(...x)
  const xMax = Math.max(...x)
  const scale = (xMax - xMin) / 2 || 1
  const u = x.map((xi) => (xi - m) / scale)

  const V = new Matrix(n, degree + 1)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= degree; j++) V.set(i, j, u[i] ** j)
  }
  const Vt = V.transpose()
  const A = Vt.mmul(V)
  const b = Vt.mmul(Matrix.columnVector(y))
  const coefficients = solve(A, b).to1DArray()

  const predict = (xi: number): number => {
    const ui = (xi - m) / scale
    let s = 0
    for (let j = 0; j < coefficients.length; j++) s += coefficients[j] * ui ** j
    return s
  }

  const my = mean(y)
  let ssRes = 0
  let ssTot = 0
  for (let i = 0; i < n; i++) {
    ssRes += (y[i] - predict(x[i])) ** 2
    ssTot += (y[i] - my) ** 2
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { coefficients, mean: m, scale, r2, degree, xMin, xMax, predict }
}

/**
 * First x in [xMin, xMax] where predict(x) crosses `target`, by dense scan +
 * linear refinement. Returns null if the curve never reaches `target`.
 */
export function solveForX(
  predict: (x: number) => number,
  target: number,
  xMin: number,
  xMax: number,
  samples = 500,
): number | null {
  let prevX = xMin
  let prevY = predict(xMin)
  if (Math.abs(prevY - target) < 1e-9) return xMin
  for (let i = 1; i <= samples; i++) {
    const xi = xMin + ((xMax - xMin) * i) / samples
    const yi = predict(xi)
    if ((prevY - target) * (yi - target) <= 0 && yi !== prevY) {
      const t = (target - prevY) / (yi - prevY)
      return prevX + t * (xi - prevX)
    }
    prevX = xi
    prevY = yi
  }
  return null
}

/** Perpendicular distance from point (px,py) to the line through (x1,y1)-(x2,y2). */
export function perpendicularDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const denom = Math.hypot(dx, dy)
  if (denom === 0) return 0
  return Math.abs(dy * (px - x1) - dx * (py - y1)) / denom
}

export interface DmaxPoint {
  x: number
  y: number
  dist: number
}

/**
 * Point on the fitted curve (between xStart..xEnd) with maximum perpendicular
 * distance to the chord (x1,y1)-(x2,y2). This is the Dmax breakpoint.
 */
export function dmaxPoint(
  predict: (x: number) => number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  xStart: number,
  xEnd: number,
  samples = 500,
): DmaxPoint {
  let best: DmaxPoint = { x: xStart, y: predict(xStart), dist: -1 }
  for (let i = 0; i <= samples; i++) {
    const x = xStart + ((xEnd - xStart) * i) / samples
    const y = predict(x)
    const d = perpendicularDistance(x, y, x1, y1, x2, y2)
    if (d > best.dist) best = { x, y, dist: d }
  }
  return best
}

export interface TwoSegment {
  knotIndex: number
  knotX: number
  left: LineFit
  right: LineFit
  sse: number
}

/**
 * Best two-segment (one breakpoint) piecewise-linear fit by exhaustive search
 * over interior knots. Knot location is the intersection of the two lines.
 */
export function bestTwoSegment(x: number[], y: number[]): TwoSegment | null {
  const n = x.length
  if (n < 4) return null
  let best: TwoSegment | null = null
  for (let k = 1; k <= n - 2; k++) {
    const left = linReg(x.slice(0, k + 1), y.slice(0, k + 1))
    const right = linReg(x.slice(k), y.slice(k))
    const sse = left.sse + right.sse
    if (!best || sse < best.sse) {
      best = { knotIndex: k, knotX: x[k], left, right, sse }
    }
  }
  if (best) best.knotX = intersectX(best.left, best.right, x[best.knotIndex], x[0], x[n - 1])
  return best
}

export interface ThreeSegment {
  k1: number
  k2: number
  knot1X: number
  knot2X: number
  sse: number
  segments: LineFit[]
}

/** Best three-segment (two breakpoint) piecewise-linear fit by exhaustive search. */
export function bestThreeSegment(x: number[], y: number[]): ThreeSegment | null {
  const n = x.length
  if (n < 6) return null
  let best: ThreeSegment | null = null
  for (let k1 = 1; k1 <= n - 4; k1++) {
    for (let k2 = k1 + 1; k2 <= n - 2; k2++) {
      const s1 = linReg(x.slice(0, k1 + 1), y.slice(0, k1 + 1))
      const s2 = linReg(x.slice(k1, k2 + 1), y.slice(k1, k2 + 1))
      const s3 = linReg(x.slice(k2), y.slice(k2))
      const sse = s1.sse + s2.sse + s3.sse
      if (!best || sse < best.sse) {
        best = {
          k1,
          k2,
          knot1X: intersectX(s1, s2, x[k1], x[0], x[n - 1]),
          knot2X: intersectX(s2, s3, x[k2], x[0], x[n - 1]),
          sse,
          segments: [s1, s2, s3],
        }
      }
    }
  }
  return best
}

function intersectX(a: LineFit, b: LineFit, fallback: number, lo: number, hi: number): number {
  if (Math.abs(a.slope - b.slope) < 1e-9) return fallback
  const x = (b.intercept - a.intercept) / (a.slope - b.slope)
  return clamp(x, lo, hi)
}
