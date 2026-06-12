// Training-zone models, derived directly from detected thresholds.

import type { Sport, Zone, ZoneSet } from './types'

export const ZONE_COLORS = {
  recovery: '#94a3b8',
  endurance: '#3b82f6',
  tempo: '#22c55e',
  threshold: '#f59e0b',
  vo2: '#f97316',
  anaerobic: '#ef4444',
  neuro: '#7c3aed',
  easy: '#22c55e',
  moderate: '#f59e0b',
  hard: '#ef4444',
  fatmax: '#0d9488',
} as const

function zone(
  index: number,
  label: string,
  short: string,
  lower: number | null,
  upper: number | null,
  color: string,
  description: string,
  lowerPct?: number,
  upperPct?: number,
): Zone {
  return { index, label, short, lower, upper, color, description, lowerPct, upperPct }
}

/**
 * Physiological model (Seiler): below LT1 / between / above LT2. When a FatMax
 * estimate below LT1 is supplied, Zone 1 splits into Recovery + a FatMax
 * (fat-burning) band, giving a 4-band model.
 */
export function phys3(
  lt1: number | null,
  lt2: number | null,
  basis: 'power' | 'speed',
  unit: string,
  fatmax: number | null = null,
): ZoneSet | null {
  if (lt1 == null || lt2 == null || !(lt1 < lt2)) return null
  const hasFat = fatmax != null && fatmax > 0 && fatmax < lt1
  const zones: Zone[] = []
  let i = 1
  if (hasFat) {
    zones.push(zone(i++, 'Recovery', 'Rec', null, fatmax as number, ZONE_COLORS.recovery, 'Very easy, below the fat-oxidation peak.'))
    zones.push(zone(i++, 'FatMax · Fat-burning', 'Fat', fatmax as number, lt1, ZONE_COLORS.fatmax, 'Around peak fat oxidation, up to LT1.'))
  } else {
    zones.push(zone(i++, 'Zone 1 · Easy', 'Z1', null, lt1, ZONE_COLORS.easy, 'Aerobic, below LT1. The bulk of endurance volume.'))
  }
  zones.push(zone(i++, 'Zone 2 · Threshold', 'Z2', lt1, lt2, ZONE_COLORS.moderate, 'Between LT1 and LT2 — the "grey zone".'))
  zones.push(zone(i, 'Zone 3 · Hard', 'Z3', lt2, null, ZONE_COLORS.hard, 'Above LT2. High-intensity, non-sustainable.'))
  return {
    model: 'phys3',
    name: hasFat ? 'Physiological + FatMax' : 'Physiological (3-zone)',
    basis,
    unit,
    zones,
  }
}

const COGGAN = [
  { lo: 0, hi: 0.55, label: 'Zone 1 · Active recovery', short: 'Z1', color: ZONE_COLORS.recovery, desc: 'Very easy spinning, recovery.' },
  { lo: 0.55, hi: 0.75, label: 'Zone 2 · Endurance', short: 'Z2', color: ZONE_COLORS.endurance, desc: 'All-day aerobic base pace.' },
  { lo: 0.75, hi: 0.9, label: 'Zone 3 · Tempo', short: 'Z3', color: ZONE_COLORS.tempo, desc: 'Sustained, moderately hard.' },
  { lo: 0.9, hi: 1.05, label: 'Zone 4 · Threshold', short: 'Z4', color: ZONE_COLORS.threshold, desc: 'Around FTP / LT2.' },
  { lo: 1.05, hi: 1.2, label: 'Zone 5 · VO2max', short: 'Z5', color: ZONE_COLORS.vo2, desc: '3–8 min hard intervals.' },
  { lo: 1.2, hi: 1.5, label: 'Zone 6 · Anaerobic', short: 'Z6', color: ZONE_COLORS.anaerobic, desc: 'Short, very hard efforts.' },
  { lo: 1.5, hi: Infinity, label: 'Zone 7 · Neuromuscular', short: 'Z7', color: ZONE_COLORS.neuro, desc: 'Sprints, max power.' },
] as const

/** Coggan 7-zone model as %FTP (cycling/rowing power). */
export function coggan7(ftp: number | null, unit: string): ZoneSet | null {
  if (ftp == null || ftp <= 0) return null
  return {
    model: 'coggan7',
    name: 'Coggan power (7-zone, %FTP)',
    basis: 'power',
    unit,
    zones: COGGAN.map((z, i) =>
      zone(
        i + 1,
        z.label,
        z.short,
        z.lo === 0 ? null : z.lo * ftp,
        z.hi === Infinity ? null : z.hi * ftp,
        z.color,
        z.desc,
        z.lo * 100,
        z.hi === Infinity ? undefined : z.hi * 100,
      ),
    ),
  }
}

const RUNNING = [
  { lo: 0, hi: 0.8, label: 'Zone 1 · Recovery', short: 'Z1', color: ZONE_COLORS.recovery, desc: 'Easy jog.' },
  { lo: 0.8, hi: 0.9, label: 'Zone 2 · Endurance', short: 'Z2', color: ZONE_COLORS.endurance, desc: 'Aerobic base running.' },
  { lo: 0.9, hi: 0.96, label: 'Zone 3 · Tempo', short: 'Z3', color: ZONE_COLORS.tempo, desc: 'Steady, controlled.' },
  { lo: 0.96, hi: 1.03, label: 'Zone 4 · Threshold', short: 'Z4', color: ZONE_COLORS.threshold, desc: 'Around threshold pace.' },
  { lo: 1.03, hi: Infinity, label: 'Zone 5 · VO2 / Anaerobic', short: 'Z5', color: ZONE_COLORS.hard, desc: 'Hard intervals and faster.' },
] as const

/** Running 5-zone model as % of threshold speed (vLT2). */
export function running5(thresholdSpeed: number | null, unit: string): ZoneSet | null {
  if (thresholdSpeed == null || thresholdSpeed <= 0) return null
  return {
    model: 'running5',
    name: 'Running (5-zone, % threshold speed)',
    basis: 'speed',
    unit,
    zones: RUNNING.map((z, i) =>
      zone(
        i + 1,
        z.label,
        z.short,
        z.lo === 0 ? null : z.lo * thresholdSpeed,
        z.hi === Infinity ? null : z.hi * thresholdSpeed,
        z.color,
        z.desc,
        z.lo * 100,
        z.hi === Infinity ? undefined : z.hi * 100,
      ),
    ),
  }
}

const HR = [
  { lo: 0, hi: 0.85, label: 'Zone 1', short: 'Z1', color: ZONE_COLORS.recovery, desc: 'Recovery.' },
  { lo: 0.85, hi: 0.9, label: 'Zone 2', short: 'Z2', color: ZONE_COLORS.endurance, desc: 'Aerobic.' },
  { lo: 0.9, hi: 0.95, label: 'Zone 3', short: 'Z3', color: ZONE_COLORS.tempo, desc: 'Tempo.' },
  { lo: 0.95, hi: 1.0, label: 'Zone 4', short: 'Z4', color: ZONE_COLORS.threshold, desc: 'Sub-threshold.' },
  { lo: 1.0, hi: Infinity, label: 'Zone 5', short: 'Z5', color: ZONE_COLORS.hard, desc: 'At/above threshold HR.' },
] as const

/** Heart-rate 5-zone model as % of threshold HR (LTHR). */
export function hr5(thresholdHr: number | null): ZoneSet | null {
  if (thresholdHr == null || thresholdHr <= 0) return null
  return {
    model: 'hr5',
    name: 'Heart rate (5-zone, %LTHR)',
    basis: 'hr',
    unit: 'bpm',
    zones: HR.map((z, i) =>
      zone(
        i + 1,
        z.label,
        z.short,
        z.lo === 0 ? null : z.lo * thresholdHr,
        z.hi === Infinity ? null : z.hi * thresholdHr,
        z.color,
        z.desc,
        z.lo * 100,
        z.hi === Infinity ? undefined : z.hi * 100,
      ),
    ),
  }
}

export function buildZoneSets(
  sport: Sport,
  lt1: number | null,
  lt2: number | null,
  ftp: number | null,
  thresholdHr: number | null,
  fatmax: number | null = null,
): ZoneSet[] {
  const unit = sport === 'running' ? 'km/h' : 'W'
  const basis: 'power' | 'speed' = sport === 'running' ? 'speed' : 'power'
  const sets: (ZoneSet | null)[] = [phys3(lt1, lt2, basis, unit, fatmax)]
  if (sport === 'running') {
    sets.push(running5(ftp, unit))
  } else {
    sets.push(coggan7(ftp, unit))
  }
  sets.push(hr5(thresholdHr))
  return sets.filter((s): s is ZoneSet => s !== null)
}
