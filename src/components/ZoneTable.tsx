import { useState } from 'react'
import { useTestStore } from '@/state/useTestStore'
import type { Zone, ZoneSet } from '@/core'
import type { RunningUnit } from '@/lib/running'
import { Card, CardHeader, Select } from './ui'

function boundStr(v: number, set: ZoneSet, runningUnit: RunningUnit): string {
  if (set.basis === 'speed') {
    if (runningUnit === 'pace') {
      const total = Math.round(3600 / v)
      const m = Math.floor(total / 60)
      const s = total - m * 60
      return `${m}:${String(s).padStart(2, '0')}`
    }
    return v.toFixed(1)
  }
  return `${Math.round(v)}`
}

function unitFor(set: ZoneSet, runningUnit: RunningUnit): string {
  return set.basis === 'speed' && runningUnit === 'pace' ? '/km' : set.unit
}

function rangeLabel(zone: Zone, set: ZoneSet, runningUnit: RunningUnit): string {
  const u = unitFor(set, runningUnit)
  const b = (v: number) => boundStr(v, set, runningUnit)
  if (zone.lower == null && zone.upper != null) return `< ${b(zone.upper)} ${u}`
  if (zone.upper == null && zone.lower != null) return `≥ ${b(zone.lower)} ${u}`
  if (zone.lower != null && zone.upper != null) return `${b(zone.lower)}–${b(zone.upper)} ${u}`
  return '—'
}

function pctLabel(zone: Zone): string {
  if (zone.lowerPct == null && zone.upperPct == null) return ''
  if (zone.lowerPct != null && zone.upperPct == null) return `≥ ${Math.round(zone.lowerPct)}%`
  if (zone.lowerPct === 0 && zone.upperPct != null) return `< ${Math.round(zone.upperPct)}%`
  if (zone.lowerPct != null && zone.upperPct != null)
    return `${Math.round(zone.lowerPct)}–${Math.round(zone.upperPct)}%`
  return ''
}

export function ZoneTable() {
  const report = useTestStore((s) => s.report)
  const runningUnit = useTestStore((s) => s.runningUnit)
  const [model, setModel] = useState('phys3')

  if (report.zoneSets.length === 0) {
    return (
      <Card>
        <CardHeader title="Training zones" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Zones appear once both LT1 and LT2 are detected.
        </p>
      </Card>
    )
  }

  const set = report.zoneSets.find((z) => z.model === model) ?? report.zoneSets[0]

  return (
    <Card>
      <CardHeader title="Training zones">
        <Select
          value={set.model}
          onChange={(e) => setModel(e.target.value)}
          aria-label="Zone model"
          className="h-7 text-xs"
        >
          {report.zoneSets.map((z) => (
            <option key={z.model} value={z.model}>
              {z.name}
            </option>
          ))}
        </Select>
      </CardHeader>

      <table className="w-full text-sm">
        <tbody>
          {set.zones.map((zone) => (
            <tr key={zone.index} className="border-t border-slate-100 first:border-0 dark:border-slate-800/60">
              <td className="py-1.5 pr-2 align-middle" style={{ width: 4 }}>
                <span
                  className="block h-4 w-1.5 rounded-sm"
                  style={{ backgroundColor: zone.color }}
                  aria-hidden
                />
              </td>
              <td className="py-1.5 pr-2 text-slate-700 dark:text-slate-200">
                <span className="font-medium">{zone.short}</span>{' '}
                <span className="text-slate-500 dark:text-slate-400">{zone.label.replace(/^Zone \d+ · /, '')}</span>
              </td>
              <td className="tnum py-1.5 pr-2 text-right text-slate-700 dark:text-slate-200">
                {rangeLabel(zone, set, runningUnit)}
              </td>
              <td className="tnum py-1.5 text-right text-[11px] text-slate-400">{pctLabel(zone)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-slate-400">{set.name}</p>
    </Card>
  )
}
