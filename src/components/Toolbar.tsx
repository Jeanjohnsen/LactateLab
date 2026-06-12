import { useRef, useState, type ChangeEvent } from 'react'
import { Activity, ClipboardPaste, Download, FolderOpen, Library, Moon, RotateCcw, Save, Sun, Upload } from 'lucide-react'
import { useTestStore } from '@/state/useTestStore'
import type { Sport, ThresholdMethodId } from '@/core'
import { METHODS } from '@/core'
import { csvToStages, downloadCsv, stagesToCsv } from '@/lib/csv'
import { isTauri, openSessionFromFile, saveSessionToFile } from '@/lib/persistence'
import type { RunningUnit } from '@/lib/running'
import { Button, Select, TextInput } from './ui'

const SPORTS: { id: Sport; label: string }[] = [
  { id: 'cycling', label: 'Cycling' },
  { id: 'running', label: 'Running' },
  { id: 'rowing', label: 'Rowing' },
]

const FTP_METHODS = (Object.values(METHODS).filter((m) => m.ftpCandidate)) as { id: ThresholdMethodId; label: string }[]

export function Toolbar({ onOpenLibrary }: { onOpenLibrary?: () => void }) {
  const session = useTestStore((s) => s.session)
  const setSport = useTestStore((s) => s.setSport)
  const setAthleteName = useTestStore((s) => s.setAthleteName)
  const setDate = useTestStore((s) => s.setDate)
  const setBodyMass = useTestStore((s) => s.setBodyMass)
  const setPrimaryMethod = useTestStore((s) => s.setPrimaryMethod)
  const setStages = useTestStore((s) => s.setStages)
  const reset = useTestStore((s) => s.reset)
  const loadSession = useTestStore((s) => s.loadSession)
  const runningUnit = useTestStore((s) => s.runningUnit)
  const setRunningUnit = useTestStore((s) => s.setRunningUnit)

  const fileRef = useRef<HTMLInputElement>(null)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const tauri = isTauri()

  async function onPaste() {
    try {
      const text = await navigator.clipboard.readText()
      const stages = csvToStages(text)
      if (stages.length > 0) setStages(stages)
    } catch {
      // clipboard blocked — user can use Import instead
    }
  }

  function onImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const stages = csvToStages(String(reader.result ?? ''))
      if (stages.length > 0) setStages(stages)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function onExport() {
    const name = (session.athleteName || 'lactate').replace(/\s+/g, '-').toLowerCase()
    downloadCsv(`${name}-${session.date || 'test'}.csv`, stagesToCsv(session.stages))
  }

  async function onSave() {
    try {
      await saveSessionToFile(session)
    } catch {
      // user cancelled or write failed
    }
  }

  async function onOpen() {
    try {
      const loaded = await openSessionFromFile()
      if (loaded) loadSession(loaded)
    } catch {
      // user cancelled or parse failed
    }
  }

  function toggleTheme() {
    setDark((d) => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <div className="mr-1 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" aria-hidden />
          <span className="font-semibold text-slate-900 dark:text-slate-50">Lactate Studio</span>
        </div>

        <TextInput
          aria-label="Athlete name"
          placeholder="Athlete"
          value={session.athleteName ?? ''}
          onChange={(e) => setAthleteName(e.target.value)}
          className="w-32"
        />

        <Select aria-label="Sport" value={session.sport} onChange={(e) => setSport(e.target.value as Sport)}>
          {SPORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>

        {session.sport === 'running' && (
          <Select
            aria-label="Running units"
            value={runningUnit}
            onChange={(e) => setRunningUnit(e.target.value as RunningUnit)}
            className="w-32"
          >
            <option value="pace">Pace (min/km)</option>
            <option value="speed">Speed (km/h)</option>
          </Select>
        )}

        <TextInput
          aria-label="Test date"
          type="date"
          value={session.date ?? ''}
          onChange={(e) => setDate(e.target.value)}
          className="w-36"
        />

        <div className="flex items-center gap-1">
          <TextInput
            aria-label="Body mass (kg)"
            type="number"
            step={0.1}
            placeholder="mass"
            value={session.bodyMassKg ?? ''}
            onChange={(e) => {
              const n = parseFloat(e.target.value)
              setBodyMass(Number.isFinite(n) ? n : undefined)
            }}
            className="w-16"
          />
          <span className="text-xs text-slate-400">kg</span>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          LT2 method
          <Select
            aria-label="Primary LT2 / FTP method"
            value={session.primaryMethod ?? 'mod_dmax'}
            onChange={(e) => setPrimaryMethod(e.target.value as ThresholdMethodId)}
          >
            {FTP_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </label>

        <div className="ml-auto flex items-center gap-1.5">
          {tauri && (
            <>
              <Button onClick={onOpen}>
                <FolderOpen className="h-3.5 w-3.5" aria-hidden /> Open
              </Button>
              <Button onClick={onSave}>
                <Save className="h-3.5 w-3.5" aria-hidden /> Save
              </Button>
              {onOpenLibrary && (
                <Button onClick={onOpenLibrary}>
                  <Library className="h-3.5 w-3.5" aria-hidden /> Library
                </Button>
              )}
            </>
          )}
          <Button onClick={onPaste}>
            <ClipboardPaste className="h-3.5 w-3.5" aria-hidden /> Paste
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" aria-hidden /> Import
          </Button>
          <Button onClick={onExport}>
            <Download className="h-3.5 w-3.5" aria-hidden /> Export
          </Button>
          <Button onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Sample
          </Button>
          <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle dark mode">
            {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onImport} />
        </div>
      </div>
    </header>
  )
}
