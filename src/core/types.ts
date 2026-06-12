// Domain model for lactate threshold analysis. Pure data — no UI, no I/O.

export type Sport = 'cycling' | 'running' | 'rowing'

/** One stage of an incremental step test. */
export interface Stage {
  /** Power in watts (cycling/rowing) or speed in km/h (running). Higher = harder. */
  intensity: number
  /** Blood lactate, mmol/L. */
  lactate: number
  /** Heart rate, bpm (optional). */
  heartRate?: number
  /** Rating of perceived exertion (optional). */
  rpe?: number
}

export interface TestSession {
  athleteName?: string
  sport: Sport
  date?: string
  bodyMassKg?: number
  stages: Stage[]
  /** Method used to define LT2 / FTP. Defaults to mod_dmax. */
  primaryMethod?: ThresholdMethodId
}

export type ThresholdLevel = 'LT1' | 'LT2' | 'FatMax'

export type ThresholdMethodId =
  | 'fixed_2'
  | 'fixed_4'
  | 'baseline_plus'
  | 'log_log'
  | 'dmax'
  | 'mod_dmax'
  | 'segmented'
  | 'iat'
  | 'fatmax'

export interface MethodMeta {
  id: ThresholdMethodId
  label: string
  level: ThresholdLevel
  /** True for methods that estimate FTP / anaerobic threshold (LT2). */
  ftpCandidate: boolean
  blurb: string
}

/** A single detected threshold from one method. */
export interface ThresholdResult {
  method: ThresholdMethodId
  level: ThresholdLevel
  /** Power (W) or speed (km/h) at the threshold. */
  intensity: number
  /** Lactate (mmol/L) at the threshold, read off the fitted curve. */
  lactate: number
  /** Heart rate (bpm) interpolated at the threshold, if HR data present. */
  heartRate?: number
  label: string
  note?: string
  /** False when the threshold could not be resolved within the tested range. */
  ok: boolean
}

export type ZoneModelId = 'phys3' | 'coggan7' | 'running5' | 'hr5'

export interface Zone {
  index: number
  label: string
  short: string
  /** Lower bound in the zone's basis unit (null = open below). */
  lower: number | null
  /** Upper bound in the zone's basis unit (null = open above). */
  upper: number | null
  lowerPct?: number
  upperPct?: number
  /** Hex color from the zone ramp. */
  color: string
  description: string
}

export interface ZoneSet {
  model: ZoneModelId
  name: string
  basis: 'power' | 'speed' | 'hr'
  unit: string
  zones: Zone[]
}

export interface CurveFit {
  degree: number
  predict: (x: number) => number
  /** Coefficients in normalized x-space (low->high order). */
  coefficients: number[]
  normalize: { mean: number; scale: number }
  r2: number
  xMin: number
  xMax: number
}

export interface ThresholdReport {
  sport: Sport
  fit: CurveFit | null
  /** Every method that could be computed, for cross-checking. */
  results: ThresholdResult[]
  lt1: ThresholdResult | null
  lt2: ThresholdResult | null
  /** Estimated peak fat-oxidation intensity (lactate proxy, at or below LT1). */
  fatmax: ThresholdResult | null
  /** Intensity at LT2 = FTP (W) or threshold speed (km/h). */
  ftp: number | null
  ftpPerKg: number | null
  thresholdHr: number | null
  zoneSets: ZoneSet[]
  warnings: string[]
  primaryMethod: ThresholdMethodId
}

export const DEFAULT_PRIMARY_METHOD: ThresholdMethodId = 'mod_dmax'

export const METHODS: Record<ThresholdMethodId, MethodMeta> = {
  fixed_4: {
    id: 'fixed_4',
    label: 'OBLA 4.0 mmol/L',
    level: 'LT2',
    ftpCandidate: true,
    blurb: 'Power/speed at a fixed blood lactate of 4 mmol/L — the classic anaerobic-threshold proxy.',
  },
  mod_dmax: {
    id: 'mod_dmax',
    label: 'Modified Dmax',
    level: 'LT2',
    ftpCandidate: true,
    blurb: 'Max perpendicular distance from the curve to the line starting at the first >0.4 mmol/L rise. Best-validated FTP estimate.',
  },
  dmax: {
    id: 'dmax',
    label: 'Dmax',
    level: 'LT2',
    ftpCandidate: true,
    blurb: 'Max perpendicular distance from the fitted curve to the line joining the first and last points.',
  },
  segmented: {
    id: 'segmented',
    label: 'Segmented regression',
    level: 'LT2',
    ftpCandidate: true,
    blurb: 'Piecewise-linear fit; the second knot marks LT2, the first marks LT1. Robust for sparse data.',
  },
  iat: {
    id: 'iat',
    label: 'IAT (baseline + 1.5)',
    level: 'LT2',
    ftpCandidate: true,
    blurb: 'Individual anaerobic threshold: intensity at baseline lactate + 1.5 mmol/L (Dickhuth).',
  },
  fixed_2: {
    id: 'fixed_2',
    label: 'Fixed 2.0 mmol/L',
    level: 'LT1',
    ftpCandidate: false,
    blurb: 'Power/speed at a fixed blood lactate of 2 mmol/L — an aerobic-threshold proxy.',
  },
  log_log: {
    id: 'log_log',
    label: 'Log-log (Beaver)',
    level: 'LT1',
    ftpCandidate: false,
    blurb: 'Breakpoint of a two-segment fit in log-lactate vs log-intensity space. Aerobic threshold (LT1).',
  },
  baseline_plus: {
    id: 'baseline_plus',
    label: 'Baseline + 0.5 mmol/L',
    level: 'LT1',
    ftpCandidate: false,
    blurb: 'First rise of 0.5 mmol/L above the lowest measured lactate. Simple aerobic-threshold marker.',
  },
  fatmax: {
    id: 'fatmax',
    label: 'FatMax',
    level: 'FatMax',
    ftpCandidate: false,
    blurb: 'Estimated peak fat-oxidation intensity (lactate ≈ 1.5 mmol/L proxy, at or below LT1). True FatMax needs gas-exchange (RER).',
  },
}
