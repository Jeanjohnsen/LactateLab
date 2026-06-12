import type { TestSession } from '@/core/types'

/** Cycling step test with a clear lactate breakpoint around 290–305 W. */
export const cyclingTest: TestSession = {
  athleteName: 'Test Cyclist',
  sport: 'cycling',
  bodyMassKg: 73,
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

/** Exactly linear lactate: L = 1 + 0.02·(W−100). Crosses 2.0 at 150 W, 4.0 at 250 W. */
export const linearTest: TestSession = {
  sport: 'cycling',
  stages: [
    { intensity: 100, lactate: 1.0 },
    { intensity: 150, lactate: 2.0 },
    { intensity: 200, lactate: 3.0 },
    { intensity: 250, lactate: 4.0 },
    { intensity: 300, lactate: 5.0 },
  ],
}

/** Running step test in km/h. */
export const runningTest: TestSession = {
  sport: 'running',
  stages: [
    { intensity: 10, lactate: 1.2, heartRate: 130 },
    { intensity: 12, lactate: 1.5, heartRate: 145 },
    { intensity: 14, lactate: 2.1, heartRate: 158 },
    { intensity: 16, lactate: 3.4, heartRate: 170 },
    { intensity: 18, lactate: 6.0, heartRate: 182 },
  ],
}
