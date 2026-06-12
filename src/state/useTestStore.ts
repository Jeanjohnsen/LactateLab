import { create } from 'zustand'
import type { Sport, Stage, TestSession, ThresholdMethodId, ThresholdReport } from '@/core'
import { computeReport } from '@/core'
import type { RunningUnit } from '@/lib/running'
import { sampleCyclingSession } from '@/lib/sampleData'

function intensityStep(sport: Sport): number {
  return sport === 'running' ? 1 : 20
}

function nextIntensity(stages: Stage[], sport: Sport): number {
  if (stages.length === 0) return sport === 'running' ? 8 : 100
  return stages[stages.length - 1].intensity + intensityStep(sport)
}

interface TestStore {
  session: TestSession
  report: ThresholdReport
  runningUnit: RunningUnit
  setRunningUnit: (unit: RunningUnit) => void
  setSport: (sport: Sport) => void
  setAthleteName: (name: string) => void
  setDate: (date: string) => void
  setBodyMass: (massKg: number | undefined) => void
  setPrimaryMethod: (method: ThresholdMethodId) => void
  updateStage: (index: number, patch: Partial<Stage>) => void
  addStage: () => void
  removeStage: (index: number) => void
  setStages: (stages: Stage[]) => void
  loadSession: (session: TestSession) => void
  reset: () => void
}

export const useTestStore = create<TestStore>((set, get) => {
  const apply = (session: TestSession) => set({ session, report: computeReport(session) })
  const patchSession = (patch: Partial<TestSession>) => apply({ ...get().session, ...patch })

  return {
    session: sampleCyclingSession,
    report: computeReport(sampleCyclingSession),
    runningUnit: 'pace',
    setRunningUnit: (runningUnit) => set({ runningUnit }),

    setSport: (sport) => patchSession({ sport }),
    setAthleteName: (athleteName) => patchSession({ athleteName }),
    setDate: (date) => patchSession({ date }),
    setBodyMass: (bodyMassKg) => patchSession({ bodyMassKg }),
    setPrimaryMethod: (primaryMethod) => patchSession({ primaryMethod }),

    updateStage: (index, patch) => {
      const stages = get().session.stages.map((s, i) => (i === index ? { ...s, ...patch } : s))
      patchSession({ stages })
    },

    addStage: () => {
      const { stages, sport } = get().session
      const last = stages[stages.length - 1]
      const stage: Stage = {
        intensity: nextIntensity(stages, sport),
        lactate: last ? last.lactate : 1,
        heartRate: last?.heartRate,
        rpe: last?.rpe,
      }
      patchSession({ stages: [...stages, stage] })
    },

    removeStage: (index) => {
      const stages = get().session.stages.filter((_, i) => i !== index)
      patchSession({ stages })
    },

    setStages: (stages) => patchSession({ stages }),

    loadSession: (session) => apply(session),

    reset: () => apply(sampleCyclingSession),
  }
})
