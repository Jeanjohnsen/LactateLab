import { useEffect, useState } from 'react'
import { Check, FolderOpen, Pencil, Plus, Save, Trash2, Users, X } from 'lucide-react'
import { useTestStore } from '@/state/useTestStore'
import {
  createAthlete,
  deleteAthlete,
  deleteTest,
  listAthletes,
  listTests,
  loadTestSession,
  renameAthlete,
  saveTest,
  type AthleteRow,
  type TestRow,
} from '@/lib/db'
import { intensityLabel, type RunningUnit } from '@/lib/running'
import type { Sport } from '@/core'
import { Button, TextInput } from './ui'

function ftpText(t: TestRow, runningUnit: RunningUnit): string {
  if (t.ftp == null) return '—'
  return intensityLabel(t.ftp, t.sport as Sport, runningUnit)
}

export function LibraryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [athletes, setAthletes] = useState<AthleteRow[]>([])
  const [tests, setTests] = useState<TestRow[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSession = useTestStore((s) => s.loadSession)
  const runningUnit = useTestStore((s) => s.runningUnit)

  async function refreshTests(athleteId: number | null) {
    setTests(await listTests(athleteId ?? undefined))
  }
  async function refreshAll(athleteId: number | null) {
    try {
      setAthletes(await listAthletes())
      await refreshTests(athleteId)
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) void refreshAll(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) void refreshTests(selectedId).catch((e) => setError(String(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  async function onSaveCurrent() {
    setBusy(true)
    try {
      const { session, report } = useTestStore.getState()
      await saveTest(session, { ftp: report.ftp, lt1: report.lt1?.intensity ?? null, lt2: report.lt2?.intensity ?? null })
      await refreshAll(selectedId)
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function onAddAthlete() {
    const name = newName.trim()
    if (!name) return
    try {
      await createAthlete(name)
      setNewName('')
      await refreshAll(selectedId)
    } catch (e) {
      setError(String(e))
    }
  }

  async function onCommitRename() {
    if (editingId == null) return
    try {
      await renameAthlete(editingId, editingName)
      setEditingId(null)
      await refreshAll(selectedId)
    } catch (e) {
      setError(String(e))
    }
  }

  async function onDeleteAthlete(id: number) {
    try {
      await deleteAthlete(id)
      setConfirmId(null)
      if (selectedId === id) setSelectedId(null)
      else await refreshAll(selectedId)
    } catch (e) {
      setError(String(e))
    }
  }

  async function onLoadTest(id: number) {
    try {
      const s = await loadTestSession(id)
      if (s) {
        loadSession(s)
        onClose()
      }
    } catch (e) {
      setError(String(e))
    }
  }

  async function onDeleteTest(id: number) {
    try {
      await deleteTest(id)
      await refreshAll(selectedId)
    } catch (e) {
      setError(String(e))
    }
  }

  if (!open) return null

  const totalTests = athletes.reduce((sum, a) => sum + a.test_count, 0)

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
            <Users className="h-4 w-4" aria-hidden /> Athletes &amp; tests
          </h2>
          <button
            onClick={onClose}
            aria-label="Close library"
            className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Button onClick={onSaveCurrent} variant="primary" disabled={busy}>
            <Save className="h-3.5 w-3.5" aria-hidden /> {busy ? 'Saving…' : 'Save current test'}
          </Button>
          {error && <p className="mt-2 text-[12px] text-rose-600 dark:text-rose-400">{error}</p>}
        </div>

        {/* Athletes */}
        <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <div className="mb-1.5 flex items-center gap-1.5 px-1">
            <TextInput
              aria-label="New athlete name"
              placeholder="Add athlete…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void onAddAthlete()
              }}
              className="h-7 flex-1"
            />
            <Button onClick={onAddAthlete} aria-label="Add athlete">
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>

          <ul className="max-h-44 space-y-0.5 overflow-y-auto">
            <li>
              <button
                onClick={() => setSelectedId(null)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                  selectedId === null
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>All athletes</span>
                <span className="tnum text-[11px] text-slate-400">{totalTests}</span>
              </button>
            </li>
            {athletes.map((a) => (
              <li key={a.id}>
                {editingId === a.id ? (
                  <div className="flex items-center gap-1 px-1 py-1">
                    <TextInput
                      aria-label="Athlete name"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void onCommitRename()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="h-7 flex-1"
                    />
                    <Button onClick={onCommitRename} aria-label="Save name">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                ) : confirmId === a.id ? (
                  <div className="flex items-center justify-between gap-2 rounded-md bg-rose-50 px-2 py-1.5 text-xs dark:bg-rose-950/40">
                    <span className="text-rose-700 dark:text-rose-300">
                      Delete {a.name} + {a.test_count} test{a.test_count === 1 ? '' : 's'}?
                    </span>
                    <span className="flex shrink-0 gap-1">
                      <Button onClick={() => onDeleteAthlete(a.id)}>Delete</Button>
                      <Button onClick={() => setConfirmId(null)}>Cancel</Button>
                    </span>
                  </div>
                ) : (
                  <div
                    className={`group flex items-center justify-between rounded-md ${
                      selectedId === a.id ? 'bg-blue-50 dark:bg-blue-950/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedId(a.id)}
                      className={`flex flex-1 cursor-pointer items-center justify-between px-2 py-1.5 text-sm ${
                        selectedId === a.id
                          ? 'text-blue-700 dark:text-blue-200'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{a.name}</span>
                      <span className="tnum mr-1 text-[11px] text-slate-400">{a.test_count}</span>
                    </button>
                    <span className="flex shrink-0 pr-1">
                      <button
                        onClick={() => {
                          setEditingId(a.id)
                          setEditingName(a.name)
                        }}
                        aria-label={`Rename ${a.name}`}
                        className="cursor-pointer rounded p-1 text-slate-400 hover:text-blue-600"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button
                        onClick={() => setConfirmId(a.id)}
                        aria-label={`Delete ${a.name}`}
                        className="cursor-pointer rounded p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Tests */}
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-slate-400">
            {selectedId === null ? 'All tests' : `Tests · ${athletes.find((a) => a.id === selectedId)?.name ?? ''}`}
          </p>
          {tests.length === 0 ? (
            <p className="p-3 text-sm text-slate-400">No saved tests here yet.</p>
          ) : (
            <ul className="space-y-1">
              {tests.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {selectedId === null ? t.athlete_name : t.date || t.created_at.slice(0, 10)}
                      <span className="ml-2 text-[11px] font-normal capitalize text-slate-400">{t.sport}</span>
                    </p>
                    <p className="tnum text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedId === null && (t.date || t.created_at.slice(0, 10))}
                      {t.ftp != null && <> · FTP {ftpText(t, runningUnit)}</>}
                    </p>
                  </div>
                  <button
                    onClick={() => onLoadTest(t.id)}
                    aria-label={`Load test ${t.id}`}
                    className="cursor-pointer rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40"
                  >
                    <FolderOpen className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    onClick={() => onDeleteTest(t.id)}
                    aria-label={`Delete test ${t.id}`}
                    className="cursor-pointer rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
