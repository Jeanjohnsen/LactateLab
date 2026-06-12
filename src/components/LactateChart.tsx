import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts'
import { useTestStore } from '@/state/useTestStore'
import type { Sport } from '@/core'
import { intensityUnit } from '@/core'
import { Card, CardHeader } from './ui'

const COLOR = { curve: '#2563eb', point: '#1d4ed8', hr: '#db2777', fatmax: '#0d9488', lt1: '#d97706', lt2: '#dc2626' }

interface Row {
  x: number
  fit?: number
  lactate?: number
  hr?: number
}

function secToPace(sec: number): string {
  const total = Math.round(sec)
  const m = Math.floor(total / 60)
  const s = total - m * 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface TickProps {
  x?: number
  y?: number
  payload?: { value: number }
  anchor?: 'start' | 'middle' | 'end'
  dy?: number
  dx?: number
  fill?: string
  formatter?: (v: number) => string
}

// Custom tick: Recharts 3.8's default CartesianAxisTick renders nothing under
// React 19 (empty tick groups), so we render the tick text ourselves.
function AxisTick({ x = 0, y = 0, payload, anchor = 'middle', dy = 4, dx = 0, fill = 'currentColor', formatter }: TickProps) {
  const raw = payload?.value
  const text =
    typeof raw === 'number' ? (formatter ? formatter(raw) : String(Math.round(raw))) : String(raw ?? '')
  return (
    <text x={x + dx} y={y} dy={dy} textAnchor={anchor} fontSize={11} fill={fill}>
      {text}
    </text>
  )
}

/** Evenly-spaced "nice" tick values within [min, max]. */
function niceTicks(min: number, max: number, paceAxis: boolean): number[] {
  const span = max - min
  if (!(span > 0)) return [min]
  const rawStep = span / 5
  let step: number
  if (paceAxis) {
    step = [10, 15, 20, 30, 60, 120, 300].find((c) => c >= rawStep) ?? 300
  } else {
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
    const norm = rawStep / mag
    step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  }
  const ticks: number[] = []
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-6; t += step) {
    ticks.push(Math.round(t * 1000) / 1000)
  }
  return ticks
}

interface TooltipProps {
  active?: boolean
  label?: number
  payload?: Array<{ dataKey: string; value: number }>
  sport: Sport
  paceAxis: boolean
}

function ChartTooltip({ active, label, payload, sport, paceAxis }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const get = (key: string) => payload.find((p) => p.dataKey === key)?.value
  const lac = get('lactate') ?? get('fit')
  const hr = get('hr')
  const x = label as number
  const labelText = paceAxis
    ? `${secToPace(x)} /km`
    : `${sport === 'running' ? x.toFixed(1) : Math.round(x)} ${intensityUnit(sport)}`
  return (
    <div className="rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900/95">
      <div className="tnum font-medium text-slate-800 dark:text-slate-100">{labelText}</div>
      {lac != null && <div className="tnum text-slate-500 dark:text-slate-400">{lac.toFixed(2)} mmol/L</div>}
      {hr != null && (
        <div className="tnum" style={{ color: COLOR.hr }}>
          {Math.round(hr)} bpm
        </div>
      )}
    </div>
  )
}

function LegendChip({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
      <span
        className="inline-block h-0.5 w-3"
        style={{ backgroundColor: dashed ? 'transparent' : color, borderTop: dashed ? `1.5px dashed ${color}` : undefined }}
      />
      {label}
    </span>
  )
}

/**
 * Measure the container width directly (with a sensible fallback) instead of
 * relying on Recharts' ResponsiveContainer, whose ResizeObserver is flaky in
 * headless/automated browsers and can leave the chart at 0×0.
 */
function useChartWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(680)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth || 680)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export function LactateChart() {
  const stages = useTestStore((s) => s.session.stages)
  const sport = useTestStore((s) => s.session.sport)
  const runningUnit = useTestStore((s) => s.runningUnit)
  const report = useTestStore((s) => s.report)
  const fit = report.fit
  const paceAxis = sport === 'running' && runningUnit === 'pace'
  const toX = (speed: number) => (paceAxis ? 3600 / speed : speed)
  const [chartRef, chartW] = useChartWidth()

  const { data, xDomain, lacMax, speedDomain } = useMemo(() => {
    const raw = stages
      .filter((s) => Number.isFinite(s.intensity) && Number.isFinite(s.lactate))
      .slice()
      .sort((a, b) => a.intensity - b.intensity)
    const empty = {
      data: [] as Row[],
      xDomain: [0, 1] as [number, number],
      lacMax: 8,
      speedDomain: [0, 1] as [number, number],
    }
    if (raw.length === 0) return empty

    const ax = (speed: number) => (paceAxis ? 3600 / speed : speed)
    const sMin = raw[0].intensity
    const sMax = raw[raw.length - 1].intensity
    const sPad = (sMax - sMin) * 0.04 || 1
    const speedDomain: [number, number] = [Math.max(0, sMin - sPad), sMax + sPad]

    const sampleS: number[] = []
    if (fit) {
      const N = 60
      for (let i = 0; i <= N; i++) sampleS.push(sMin + ((sMax - sMin) * i) / N)
    }
    const rawMap = new Map(raw.map((s) => [s.intensity, s]))
    const speeds = Array.from(new Set([...raw.map((s) => s.intensity), ...sampleS])).sort((a, b) => a - b)
    const data: Row[] = speeds
      .map((s) => {
        const r = rawMap.get(s)
        return {
          x: ax(s),
          fit: fit ? Math.max(0, fit.predict(s)) : undefined,
          lactate: r?.lactate,
          hr: Number.isFinite(r?.heartRate as number) ? (r?.heartRate as number) : undefined,
        }
      })
      .sort((a, b) => a.x - b.x)

    const xs = data.map((d) => d.x)
    const axisMin = Math.min(...xs)
    const axisMax = Math.max(...xs)
    const axisPad = (axisMax - axisMin) * 0.04 || 1
    const xDomain: [number, number] = [axisMin - axisPad, axisMax + axisPad]
    const lacMax = Math.max(...raw.map((s) => s.lactate), fit ? 4 : 0)
    return { data, xDomain, lacMax, speedDomain }
  }, [stages, fit, paceAxis])

  const phys = report.zoneSets.find((z) => z.model === 'phys3')
  const hasHr = stages.some((s) => Number.isFinite(s.heartRate as number))
  const axisLabel = paceAxis ? 'Pace (min/km)' : sport === 'running' ? 'Speed (km/h)' : 'Power (W)'
  const xTicks = niceTicks(xDomain[0], xDomain[1], paceAxis)

  return (
    <Card>
      <CardHeader title="Lactate curve & breakpoints">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <LegendChip color={COLOR.curve} label="lactate" />
          {hasHr && <LegendChip color={COLOR.hr} label="HR" dashed />}
          {report.fatmax?.ok && <LegendChip color={COLOR.fatmax} label="FatMax" dashed />}
          <LegendChip color={COLOR.lt1} label="LT1" dashed />
          <LegendChip color={COLOR.lt2} label="LT2" dashed />
        </div>
      </CardHeader>

      <div ref={chartRef} className="h-[320px] w-full text-slate-500 dark:text-slate-400">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Add stages to plot the lactate curve.
          </div>
        ) : (
          <ComposedChart width={chartW} height={320} data={data} margin={{ top: 10, right: 8, bottom: 20, left: 0 }}>
              {phys?.zones.map((z) => {
                const a1 = toX(z.lower ?? speedDomain[0])
                const a2 = toX(z.upper ?? speedDomain[1])
                return (
                  <ReferenceArea
                    key={z.index}
                    yAxisId="lac"
                    x1={Math.min(a1, a2)}
                    x2={Math.max(a1, a2)}
                    fill={z.color}
                    fillOpacity={0.1}
                    stroke="none"
                  />
                )
              })}
              <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
              <XAxis
                type="number"
                dataKey="x"
                domain={xDomain}
                ticks={xTicks}
                reversed={paceAxis}
                allowDecimals={false}
                tick={<AxisTick dy={12} anchor="middle" formatter={paceAxis ? secToPace : undefined} />}
                stroke="currentColor"
                strokeOpacity={0.3}
                tickLine={false}
                label={{
                  value: axisLabel,
                  position: 'insideBottom',
                  offset: -12,
                  fontSize: 11,
                  fill: 'currentColor',
                }}
              />
              <YAxis
                yAxisId="lac"
                domain={[0, Math.ceil(lacMax) + 1]}
                width={40}
                tick={<AxisTick anchor="end" dx={-4} />}
                stroke="currentColor"
                strokeOpacity={0.3}
                tickLine={false}
                label={{ value: 'Lactate (mmol/L)', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'currentColor' }}
              />
              {hasHr && (
                <YAxis
                  yAxisId="hr"
                  orientation="right"
                  width={36}
                  tick={<AxisTick anchor="start" dx={4} fill={COLOR.hr} />}
                  stroke={COLOR.hr}
                  strokeOpacity={0.5}
                  tickLine={false}
                />
              )}
              <Tooltip content={<ChartTooltip sport={sport} paceAxis={paceAxis} />} />
              {hasHr && (
                <Line
                  yAxisId="hr"
                  type="monotone"
                  dataKey="hr"
                  stroke={COLOR.hr}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              )}
              {fit && (
                <Line
                  yAxisId="lac"
                  type="monotone"
                  dataKey="fit"
                  stroke={COLOR.curve}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              )}
              <Scatter yAxisId="lac" dataKey="lactate" fill={COLOR.point} isAnimationActive={false} />
              {report.fatmax?.ok && (
                <ReferenceLine
                  yAxisId="lac"
                  x={toX(report.fatmax.intensity)}
                  stroke={COLOR.fatmax}
                  strokeWidth={1.2}
                  strokeDasharray="2 3"
                  label={{ value: 'FatMax', position: 'bottom', fontSize: 10, fill: COLOR.fatmax }}
                />
              )}
              {report.lt1 && (
                <ReferenceLine
                  yAxisId="lac"
                  x={toX(report.lt1.intensity)}
                  stroke={COLOR.lt1}
                  strokeWidth={1.3}
                  strokeDasharray="5 3"
                  label={{ value: 'LT1', position: 'top', fontSize: 10, fill: COLOR.lt1 }}
                />
              )}
              {report.lt2 && (
                <ReferenceLine
                  yAxisId="lac"
                  x={toX(report.lt2.intensity)}
                  stroke={COLOR.lt2}
                  strokeWidth={1.6}
                  strokeDasharray="5 3"
                  label={{ value: 'LT2·FTP', position: 'top', fontSize: 10, fill: COLOR.lt2 }}
                />
              )}
          </ComposedChart>
        )}
      </div>
    </Card>
  )
}
