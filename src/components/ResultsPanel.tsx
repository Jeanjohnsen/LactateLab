import { TriangleAlert } from 'lucide-react'
import { useTestStore } from '@/state/useTestStore'
import { intensityLabel } from '@/lib/running'
import { Card, CardHeader, Badge } from './ui'

export function ResultsPanel() {
  const report = useTestStore((s) => s.report)
  const sport = useTestStore((s) => s.session.sport)
  const runningUnit = useTestStore((s) => s.runningUnit)

  return (
    <Card>
      <CardHeader title="Methods compared">
        <span className="text-[11px] text-slate-400">all detection methods</span>
      </CardHeader>

      {report.results.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter at least two stages to see threshold estimates.
        </p>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-1 py-1 font-medium">Method</th>
                <th className="px-1 py-1 font-medium">Level</th>
                <th className="px-1 py-1 text-right font-medium">Intensity</th>
                <th className="px-1 py-1 text-right font-medium">Lactate</th>
                <th className="px-1 py-1 text-right font-medium">HR</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((r, i) => {
                const chosen = r === report.lt1 || r === report.lt2
                return (
                  <tr
                    key={`${r.method}-${r.level}-${i}`}
                    className={
                      chosen
                        ? 'bg-blue-50/70 dark:bg-blue-950/40'
                        : 'border-t border-slate-100 dark:border-slate-800/60'
                    }
                  >
                    <td className="px-1 py-1.5 text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        {r.label}
                        {chosen && (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                            chosen
                          </Badge>
                        )}
                      </span>
                      {r.note && <span className="block text-[10px] text-slate-400">{r.note}</span>}
                    </td>
                    <td className="px-1 py-1.5">
                      <Badge
                        className={
                          r.level === 'LT2'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                        }
                      >
                        {r.level}
                      </Badge>
                    </td>
                    <td className="tnum px-1 py-1.5 text-right text-slate-700 dark:text-slate-200">
                      {r.ok ? (
                        intensityLabel(r.intensity, sport, runningUnit)
                      ) : (
                        <span className="text-slate-400" title={r.note}>
                          out of range
                        </span>
                      )}
                    </td>
                    <td className="tnum px-1 py-1.5 text-right text-slate-500 dark:text-slate-400">
                      {r.lactate.toFixed(1)}
                    </td>
                    <td className="tnum px-1 py-1.5 text-right text-slate-500 dark:text-slate-400">
                      {r.heartRate ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {report.warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
          {report.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-amber-700 dark:text-amber-300">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
