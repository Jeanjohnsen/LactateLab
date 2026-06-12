import { useTestStore } from '@/state/useTestStore'
import { METHODS } from '@/core'
import { intensityLabel, intensityParts } from '@/lib/running'
import { Card } from './ui'

function Kpi({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <Card className="p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="tnum mt-1 text-2xl font-medium leading-none text-slate-900 dark:text-slate-50">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-500 dark:text-slate-400">{unit}</span>}
      </p>
      <p className="tnum mt-1 h-4 text-[11px] text-slate-500 dark:text-slate-400">{sub ?? ''}</p>
    </Card>
  )
}

export function KpiCards() {
  const report = useTestStore((s) => s.report)
  const sport = useTestStore((s) => s.session.sport)
  const runningUnit = useTestStore((s) => s.runningUnit)
  const isRun = sport === 'running'

  const ftp = report.ftp
  const ftpParts = ftp == null ? null : intensityParts(ftp, sport, runningUnit)
  const ftpSub =
    ftp == null
      ? undefined
      : isRun
        ? intensityLabel(ftp, sport, runningUnit === 'pace' ? 'speed' : 'pace')
        : report.ftpPerKg != null
          ? `${report.ftpPerKg.toFixed(1)} W/kg`
          : 'add body mass for W/kg'

  const lt1 = report.lt1
  const lt1Parts = lt1 ? intensityParts(lt1.intensity, sport, runningUnit) : null
  const fat = report.fatmax
  const fatParts = fat ? intensityParts(fat.intensity, sport, runningUnit) : null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi
        label={isRun ? 'Threshold (LT2)' : 'FTP (LT2)'}
        value={ftpParts?.value ?? '—'}
        unit={ftpParts?.unit}
        sub={ftpSub}
      />
      <Kpi
        label="LT1 · aerobic"
        value={lt1Parts?.value ?? '—'}
        unit={lt1Parts?.unit}
        sub={lt1 ? `${lt1.lactate.toFixed(1)} mmol/L · ${METHODS[lt1.method].label}` : undefined}
      />
      <Kpi
        label="FatMax"
        value={fatParts?.value ?? '—'}
        unit={fatParts?.unit}
        sub={fat ? `${fat.lactate.toFixed(1)} mmol/L · fat-burning` : undefined}
      />
      <Kpi
        label="Threshold HR"
        value={report.thresholdHr != null ? String(report.thresholdHr) : '—'}
        unit={report.thresholdHr != null ? 'bpm' : undefined}
        sub={report.thresholdHr != null ? 'at LT2' : 'add heart-rate data'}
      />
    </div>
  )
}
