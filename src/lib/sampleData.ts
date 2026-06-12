import type { TestSession } from '@/core'

/** Loaded on first run so the dashboard opens populated, not empty. */
export const sampleCyclingSession: TestSession = {
  athleteName: 'Anna Karlsson',
  sport: 'cycling',
  date: '2026-06-12',
  bodyMassKg: 73,
  primaryMethod: 'mod_dmax',
  stages: [
    { intensity: 120, lactate: 1.0, heartRate: 110, rpe: 8 },
    { intensity: 160, lactate: 1.1, heartRate: 124, rpe: 9 },
    { intensity: 200, lactate: 1.3, heartRate: 138, rpe: 11 },
    { intensity: 240, lactate: 1.8, heartRate: 150, rpe: 13 },
    { intensity: 280, lactate: 2.6, heartRate: 162, rpe: 15 },
    { intensity: 300, lactate: 3.6, heartRate: 168, rpe: 16 },
    { intensity: 320, lactate: 5.2, heartRate: 175, rpe: 18 },
    { intensity: 340, lactate: 7.5, heartRate: 182, rpe: 19 },
  ],
}

export function emptySession(sport: TestSession['sport'] = 'cycling'): TestSession {
  return { sport, primaryMethod: 'mod_dmax', stages: [], bodyMassKg: undefined }
}
