import { describe, it, expect } from 'vitest'
import {
  mean,
  clamp,
  linearInterpolate,
  linReg,
  polyFit,
  solveForX,
  perpendicularDistance,
  bestTwoSegment,
} from './math'
import { fitLactateCurve } from './curveFit'
import { computeThresholds } from './thresholds'
import { coggan7, phys3, buildZoneSets } from './zones'
import { computeReport } from './index'
import { speedToPaceSeconds, paceToSpeed, formatPace, wattsPerKg } from './units'
import { cyclingTest, linearTest, runningTest } from '@/test/fixtures/datasets'

describe('math toolbox', () => {
  it('mean and clamp', () => {
    expect(mean([1, 2, 3])).toBe(2)
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-1, 0, 3)).toBe(0)
  })

  it('linearInterpolate is exact and clamps outside the range', () => {
    const xs = [0, 10]
    const ys = [0, 100]
    expect(linearInterpolate(xs, ys, 5)).toBe(50)
    expect(linearInterpolate(xs, ys, -3)).toBe(0)
    expect(linearInterpolate(xs, ys, 99)).toBe(100)
  })

  it('linReg recovers a straight line', () => {
    const f = linReg([0, 1, 2, 3], [1, 3, 5, 7]) // y = 2x + 1
    expect(f.slope).toBeCloseTo(2, 9)
    expect(f.intercept).toBeCloseTo(1, 9)
    expect(f.r2).toBeCloseTo(1, 9)
  })

  it('polyFit recovers a quadratic', () => {
    const x = [0, 1, 2, 3, 4]
    const y = x.map((v) => 3 + 2 * v + v * v)
    const f = polyFit(x, y, 2)
    expect(f.predict(2.5)).toBeCloseTo(3 + 2 * 2.5 + 2.5 * 2.5, 6)
    expect(f.r2).toBeCloseTo(1, 9)
  })

  it('solveForX finds the crossing on a linear predictor', () => {
    const predict = (x: number) => 1 + 0.02 * (x - 100) // 4.0 at x = 250
    const x = solveForX(predict, 4.0, 100, 300)
    expect(x).not.toBeNull()
    expect(x as number).toBeCloseTo(250, 1)
  })

  it('perpendicularDistance is correct', () => {
    expect(perpendicularDistance(0, 1, 0, 0, 2, 0)).toBeCloseTo(1, 9)
    expect(perpendicularDistance(1, 0, 0, 0, 2, 0)).toBeCloseTo(0, 9)
  })

  it('bestTwoSegment locates an obvious hinge', () => {
    const x = [0, 1, 2, 3, 4, 5]
    const y = [0, 0, 0, 1, 2, 3] // flat then rising, hinge near x=2
    const seg = bestTwoSegment(x, y)
    expect(seg).not.toBeNull()
    expect(seg!.knotX).toBeGreaterThanOrEqual(1.5)
    expect(seg!.knotX).toBeLessThanOrEqual(3)
  })
})

describe('curve fit', () => {
  it('fits the cycling test with high R²', () => {
    const fit = fitLactateCurve(cyclingTest.stages)
    expect(fit).not.toBeNull()
    expect(fit!.r2).toBeGreaterThan(0.98)
    expect(fit!.xMin).toBe(120)
    expect(fit!.xMax).toBe(340)
  })

  it('returns null for fewer than 2 points', () => {
    expect(fitLactateCurve([{ intensity: 100, lactate: 1 }])).toBeNull()
  })
})

describe('threshold methods', () => {
  it('fixed thresholds are exact on linear data', () => {
    const fit = fitLactateCurve(linearTest.stages)!
    const results = computeThresholds(linearTest.stages, fit)
    const f4 = results.find((r) => r.method === 'fixed_4')!
    const f2 = results.find((r) => r.method === 'fixed_2')!
    expect(f4.ok).toBe(true)
    expect(f4.intensity).toBeCloseTo(250, 0)
    expect(f2.intensity).toBeCloseTo(150, 0)
  })

  it('produces physiologically ordered breakpoints on the cycling test', () => {
    const fit = fitLactateCurve(cyclingTest.stages)!
    const results = computeThresholds(cyclingTest.stages, fit)

    const f4 = results.find((r) => r.method === 'fixed_4')!
    const dmax = results.find((r) => r.method === 'dmax')!
    const mod = results.find((r) => r.method === 'mod_dmax')!
    const f2 = results.find((r) => r.method === 'fixed_2')!

    expect(f4.intensity).toBeGreaterThan(290)
    expect(f4.intensity).toBeLessThan(320)
    expect(dmax.intensity).toBeGreaterThan(250)
    expect(dmax.intensity).toBeLessThan(320)
    expect(mod.intensity).toBeGreaterThan(255)
    expect(mod.intensity).toBeLessThan(320)
    // an LT1 estimate must sit below an LT2 estimate
    expect(f2.intensity).toBeLessThan(f4.intensity)

    // HR is interpolated at the threshold
    expect(mod.heartRate).toBeGreaterThan(150)
    expect(mod.heartRate).toBeLessThan(185)
  })

  it('mod_dmax starts its chord at the first >0.4 mmol/L rise', () => {
    const fit = fitLactateCurve(cyclingTest.stages)!
    const results = computeThresholds(cyclingTest.stages, fit)
    const mod = results.find((r) => r.method === 'mod_dmax')!
    expect(mod.note).toBeUndefined() // a rise was found, no fallback
  })
})

describe('zones', () => {
  it('coggan7 bounds are exact fractions of FTP', () => {
    const set = coggan7(300, 'W')!
    expect(set.zones).toHaveLength(7)
    const z4 = set.zones[3] // Threshold 90–105%
    expect(z4.lower).toBe(270)
    expect(z4.upper).toBe(315)
    expect(z4.lowerPct).toBe(90)
    expect(set.zones[0].lower).toBeNull()
    expect(set.zones[6].upper).toBeNull()
  })

  it('phys3 boundaries are the thresholds, and require LT1 < LT2', () => {
    const set = phys3(250, 300, 'power', 'W')!
    expect(set.zones[0].upper).toBe(250)
    expect(set.zones[1].lower).toBe(250)
    expect(set.zones[1].upper).toBe(300)
    expect(set.zones[2].lower).toBe(300)
    expect(phys3(300, 250, 'power', 'W')).toBeNull()
  })

  it('buildZoneSets picks Coggan for cycling and running5 for running', () => {
    const cyc = buildZoneSets('cycling', 250, 300, 300, 168)
    expect(cyc.map((z) => z.model)).toContain('coggan7')
    const run = buildZoneSets('running', 14, 16, 16, 170)
    expect(run.map((z) => z.model)).toContain('running5')
  })
})

describe('units', () => {
  it('speed/pace conversions are exact', () => {
    expect(speedToPaceSeconds(12)).toBe(300)
    expect(paceToSpeed(300)).toBe(12)
    expect(formatPace(12)).toBe('5:00/km')
    expect(formatPace(10)).toBe('6:00/km')
    expect(wattsPerKg(300, 75)).toBe(4)
  })
})

describe('computeReport integration', () => {
  it('analyses the cycling test end to end', () => {
    const report = computeReport(cyclingTest)
    expect(report.fit).not.toBeNull()
    expect(report.ftp).not.toBeNull()
    expect(report.ftp as number).toBeGreaterThan(275)
    expect(report.ftp as number).toBeLessThan(320)
    expect(report.ftpPerKg as number).toBeCloseTo((report.ftp as number) / 73, 3)
    expect(report.thresholdHr as number).toBeGreaterThan(150)
    expect(report.lt1).not.toBeNull()
    expect(report.lt2).not.toBeNull()
    expect((report.lt1 as { intensity: number }).intensity).toBeLessThan(
      (report.lt2 as { intensity: number }).intensity,
    )
    expect(report.zoneSets.map((z) => z.model)).toContain('coggan7')
    expect(report.warnings).toHaveLength(0)
  })

  it('estimates FatMax at or below LT1 and adds a fat-burning zone band', () => {
    const report = computeReport(cyclingTest)
    expect(report.fatmax).not.toBeNull()
    expect(report.fatmax!.ok).toBe(true)
    expect(report.fatmax!.intensity).toBeGreaterThan(120)
    expect(report.fatmax!.intensity).toBeLessThanOrEqual((report.lt1 as { intensity: number }).intensity + 0.5)
    const phys = report.zoneSets.find((z) => z.model === 'phys3')!
    expect(phys.zones.some((z) => z.short === 'Fat')).toBe(true)
  })

  it('handles running (speed, no W/kg) with running zones', () => {
    const report = computeReport(runningTest)
    expect(report.ftp as number).toBeGreaterThan(14)
    expect(report.ftp as number).toBeLessThan(18)
    expect(report.ftpPerKg).toBeNull()
    expect(report.thresholdHr as number).toBeGreaterThan(150)
    expect(report.zoneSets.map((z) => z.model)).toContain('running5')
  })

  it('warns on sparse data but does not throw', () => {
    const report = computeReport({ sport: 'cycling', stages: cyclingTest.stages.slice(0, 3) })
    expect(report.fit).not.toBeNull()
    expect(report.warnings.join(' ')).toMatch(/stage/i)
  })

  it('returns an empty report for a single stage', () => {
    const report = computeReport({ sport: 'cycling', stages: [{ intensity: 100, lactate: 1 }] })
    expect(report.fit).toBeNull()
    expect(report.warnings.join(' ')).toMatch(/at least 2/i)
  })
})
