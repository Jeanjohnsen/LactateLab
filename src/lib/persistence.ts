import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import type { TestSession } from '@/core'

/** True when running inside the Tauri desktop shell (vs a plain browser). */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** Save the whole session as a .json file the user picks. Returns false if cancelled. */
export async function saveSessionToFile(session: TestSession): Promise<boolean> {
  const defaultName = `${(session.athleteName || 'session').replace(/\s+/g, '-').toLowerCase()}.lactate.json`
  const path = await save({
    title: 'Save lactate session',
    defaultPath: defaultName,
    filters: [{ name: 'Lactate session', extensions: ['json'] }],
  })
  if (!path) return false
  await invoke('save_text', { path, contents: JSON.stringify(session, null, 2) })
  return true
}

/** Open a previously saved session file. Returns null if cancelled. */
export async function openSessionFromFile(): Promise<TestSession | null> {
  const path = await open({
    title: 'Open lactate session',
    multiple: false,
    directory: false,
    filters: [{ name: 'Lactate session', extensions: ['json'] }],
  })
  if (!path || Array.isArray(path)) return null
  const text = await invoke<string>('read_text', { path })
  return JSON.parse(text) as TestSession
}
