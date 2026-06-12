import { invoke } from '@tauri-apps/api/core'

export interface SensorReading {
  lactate: number
  timestampMs: number
}

/**
 * The seam for live lactate capture. The grid stays the source of truth; a
 * SensorSource just feeds new readings into it. v1 ships the manual grid plus
 * a mock source; a real device implements this same interface later.
 */
export interface SensorSource {
  readonly id: string
  readonly label: string
  read(): Promise<SensorReading>
}

/** Deterministic stand-in used until a real device is wired up. */
export class MockSensorSource implements SensorSource {
  readonly id = 'mock'
  readonly label = 'Mock sensor'
  private base = 0.8
  async read(): Promise<SensorReading> {
    this.base += 0.4
    return { lactate: Math.round(this.base * 10) / 10, timestampMs: Date.now() }
  }
}

/** Bridges to the Rust `read_sensor` command for future hardware capture. */
export class TauriSensorSource implements SensorSource {
  readonly id = 'tauri'
  readonly label = 'Hardware (Tauri)'
  async read(): Promise<SensorReading> {
    const r = await invoke<{ lactate: number; timestamp_ms: number }>('read_sensor')
    return { lactate: r.lactate, timestampMs: r.timestamp_ms }
  }
}
