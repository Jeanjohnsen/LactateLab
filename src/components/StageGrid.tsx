import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTestStore } from '@/state/useTestStore'
import { parseRunningSpeed, runningSpeedToText, type RunningUnit } from '@/lib/running'
import { Card, CardHeader, Button } from './ui'

function NumberCell({
  value,
  onCommit,
  step,
  ariaLabel,
}: {
  value: number | undefined
  onCommit: (v: number | undefined) => void
  step?: number
  ariaLabel: string
}) {
  const display = (v: number | undefined) => (v === undefined || Number.isNaN(v) ? '' : String(v))
  const [text, setText] = useState(() => display(value))
  const [lastValue, setLastValue] = useState(value)
  // Re-sync local text when the committed value changes externally (load/reset/import).
  if (value !== lastValue) {
    setLastValue(value)
    setText(display(value))
  }

  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      aria-label={ariaLabel}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const n = parseFloat(e.target.value)
        onCommit(Number.isFinite(n) ? n : undefined)
      }}
      className="tnum h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-right text-sm text-slate-900 hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:bg-slate-950 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  )
}

function RunningCell({
  kmh,
  unit,
  onCommit,
  ariaLabel,
}: {
  kmh: number | undefined
  unit: RunningUnit
  onCommit: (kmh: number | undefined) => void
  ariaLabel: string
}) {
  const [text, setText] = useState(() => runningSpeedToText(kmh, unit))
  const [focused, setFocused] = useState(false)
  const [sig, setSig] = useState(`${kmh}-${unit}`)
  const cur = `${kmh}-${unit}`
  // Re-sync from the stored speed / unit, but never while the user is typing.
  if (!focused && cur !== sig) {
    setSig(cur)
    setText(runningSpeedToText(kmh, unit))
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={text}
      placeholder={unit === 'pace' ? 'm:ss' : 'km/h'}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        setText(runningSpeedToText(kmh, unit))
      }}
      onChange={(e) => {
        setText(e.target.value)
        onCommit(parseRunningSpeed(e.target.value))
      }}
      className="tnum h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-right text-sm text-slate-900 hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:bg-slate-950"
    />
  )
}

export function StageGrid() {
  const stages = useTestStore((s) => s.session.stages)
  const sport = useTestStore((s) => s.session.sport)
  const runningUnit = useTestStore((s) => s.runningUnit)
  const updateStage = useTestStore((s) => s.updateStage)
  const addStage = useTestStore((s) => s.addStage)
  const removeStage = useTestStore((s) => s.removeStage)
  const isRun = sport === 'running'

  return (
    <Card>
      <CardHeader title="Test stages">
        <Button onClick={addStage} aria-label="Add stage">
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add stage
        </Button>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[380px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-400">
              <th className="w-7 px-1 py-1 text-left font-medium">#</th>
              <th className="px-1 py-1 text-right font-medium">
                {isRun ? (runningUnit === 'pace' ? 'Pace (min/km)' : 'Speed (km/h)') : 'Power (W)'}
              </th>
              <th className="px-1 py-1 text-right font-medium">Lactate</th>
              <th className="px-1 py-1 text-right font-medium">HR</th>
              <th className="px-1 py-1 text-right font-medium">RPE</th>
              <th className="w-8 px-1 py-1" />
            </tr>
          </thead>
          <tbody>
            {stages.map((s, i) => (
              <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60">
                <td className="px-1 text-left text-xs text-slate-400">{i + 1}</td>
                <td>
                  {isRun ? (
                    <RunningCell
                      ariaLabel={`Stage ${i + 1} intensity`}
                      kmh={s.intensity}
                      unit={runningUnit}
                      onCommit={(v) => updateStage(i, { intensity: v as number })}
                    />
                  ) : (
                    <NumberCell
                      ariaLabel={`Stage ${i + 1} intensity`}
                      value={s.intensity}
                      step={5}
                      onCommit={(v) => updateStage(i, { intensity: v as number })}
                    />
                  )}
                </td>
                <td>
                  <NumberCell
                    ariaLabel={`Stage ${i + 1} lactate`}
                    value={s.lactate}
                    step={0.1}
                    onCommit={(v) => updateStage(i, { lactate: v as number })}
                  />
                </td>
                <td>
                  <NumberCell
                    ariaLabel={`Stage ${i + 1} heart rate`}
                    value={s.heartRate}
                    step={1}
                    onCommit={(v) => updateStage(i, { heartRate: v })}
                  />
                </td>
                <td>
                  <NumberCell
                    ariaLabel={`Stage ${i + 1} RPE`}
                    value={s.rpe}
                    step={1}
                    onCommit={(v) => updateStage(i, { rpe: v })}
                  />
                </td>
                <td className="text-center">
                  <button
                    aria-label={`Remove stage ${i + 1}`}
                    onClick={() => removeStage(i)}
                    className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
            {stages.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm text-slate-400">
                  No stages yet — add a stage or import / paste a CSV.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        {isRun ? 'Running: type pace (5:40 or 5.40) or speed (20). ' : ''}
        Edits recompute thresholds live; import/paste/export CSV from the toolbar.
      </p>
    </Card>
  )
}
