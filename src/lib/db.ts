import Database from '@tauri-apps/plugin-sql'
import type { Sport, Stage, TestSession } from '@/core'

let dbPromise: Promise<Database> | null = null

function getDb(): Promise<Database> {
  if (!dbPromise) dbPromise = Database.load('sqlite:lactate.db')
  return dbPromise
}

export interface AthleteRow {
  id: number
  name: string
  sport_default: string | null
  body_mass_kg: number | null
  test_count: number
}

export interface TestRow {
  id: number
  athlete_id: number
  athlete_name: string
  sport: string
  date: string | null
  body_mass_kg: number | null
  primary_method: string | null
  ftp: number | null
  lt1: number | null
  lt2: number | null
  stages_json: string
  created_at: string
}

export interface DerivedSummary {
  ftp: number | null
  lt1: number | null
  lt2: number | null
}

interface IdRow {
  id: number
}

/* ---------------- athletes ---------------- */

export async function listAthletes(): Promise<AthleteRow[]> {
  const db = await getDb()
  return db.select<AthleteRow[]>(
    `SELECT a.id, a.name, a.sport_default, a.body_mass_kg, COUNT(t.id) AS test_count
     FROM athlete a LEFT JOIN test t ON t.athlete_id = a.id
     GROUP BY a.id
     ORDER BY a.name COLLATE NOCASE`,
  )
}

export async function createAthlete(name: string, sport?: Sport, mass?: number): Promise<number> {
  const db = await getDb()
  const res = await db.execute(
    'INSERT INTO athlete (name, sport_default, body_mass_kg) VALUES ($1, $2, $3)',
    [name.trim() || 'Unnamed', sport ?? null, mass ?? null],
  )
  return Number(res.lastInsertId)
}

export async function renameAthlete(id: number, name: string): Promise<void> {
  const db = await getDb()
  await db.execute('UPDATE athlete SET name = $1 WHERE id = $2', [name.trim() || 'Unnamed', id])
}

/** Delete an athlete and all of their tests. */
export async function deleteAthlete(id: number): Promise<void> {
  const db = await getDb()
  await db.execute('DELETE FROM test WHERE athlete_id = $1', [id])
  await db.execute('DELETE FROM athlete WHERE id = $1', [id])
}

async function findOrCreateAthlete(name: string, sport: Sport, mass?: number): Promise<number> {
  const db = await getDb()
  const existing = await db.select<IdRow[]>('SELECT id FROM athlete WHERE name = $1 LIMIT 1', [name])
  if (existing.length > 0) return existing[0].id
  return createAthlete(name, sport, mass)
}

/* ---------------- tests ---------------- */

/** Persist the current session as a test row (find-or-create its athlete by name). */
export async function saveTest(session: TestSession, derived: DerivedSummary): Promise<void> {
  const athleteId = await findOrCreateAthlete(
    session.athleteName?.trim() || 'Unnamed',
    session.sport,
    session.bodyMassKg,
  )
  const db = await getDb()
  await db.execute(
    `INSERT INTO test (athlete_id, sport, date, body_mass_kg, primary_method, ftp, lt1, lt2, stages_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      athleteId,
      session.sport,
      session.date ?? null,
      session.bodyMassKg ?? null,
      session.primaryMethod ?? null,
      derived.ftp,
      derived.lt1,
      derived.lt2,
      JSON.stringify(session.stages),
    ],
  )
}

export async function listTests(athleteId?: number): Promise<TestRow[]> {
  const db = await getDb()
  const base = `SELECT t.*, a.name AS athlete_name
     FROM test t JOIN athlete a ON a.id = t.athlete_id`
  const order = `ORDER BY t.created_at DESC, t.id DESC`
  if (athleteId != null) {
    return db.select<TestRow[]>(`${base} WHERE t.athlete_id = $1 ${order}`, [athleteId])
  }
  return db.select<TestRow[]>(`${base} ${order}`)
}

export async function loadTestSession(id: number): Promise<TestSession | null> {
  const db = await getDb()
  const rows = await db.select<TestRow[]>(
    `SELECT t.*, a.name AS athlete_name FROM test t JOIN athlete a ON a.id = t.athlete_id WHERE t.id = $1`,
    [id],
  )
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    athleteName: r.athlete_name,
    sport: r.sport as Sport,
    date: r.date ?? undefined,
    bodyMassKg: r.body_mass_kg ?? undefined,
    primaryMethod: (r.primary_method as TestSession['primaryMethod']) ?? undefined,
    stages: JSON.parse(r.stages_json) as Stage[],
  }
}

export async function deleteTest(id: number): Promise<void> {
  const db = await getDb()
  await db.execute('DELETE FROM test WHERE id = $1', [id])
}
