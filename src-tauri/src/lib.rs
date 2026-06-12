use serde::Serialize;
use tauri_plugin_sql::{Migration, MigrationKind};

/// A single lactate reading from a sensor source.
#[derive(Serialize)]
struct SensorReading {
    lactate: f64,
    timestamp_ms: u64,
}

/// Sensor seam. v1 binds no hardware; this returns an explicit "not configured"
/// error so the UI falls back to manual entry / the mock source. Real serial or
/// BLE capture (e.g. the `serialport` / `btleplug` crates) plugs in here later.
#[tauri::command]
fn read_sensor() -> Result<SensorReading, String> {
    Err("No lactate sensor configured. Enter readings manually or use the mock source.".to_string())
}

/// Write text to an arbitrary path the user chose via the dialog plugin.
#[tauri::command]
fn save_text(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

/// Read text from a user-selected path.
#[tauri::command]
fn read_text(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create athlete and test tables",
        sql: r#"
            CREATE TABLE IF NOT EXISTS athlete (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          TEXT NOT NULL,
                sport_default TEXT,
                body_mass_kg  REAL,
                notes         TEXT,
                created_at    TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS test (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                athlete_id     INTEGER NOT NULL REFERENCES athlete(id) ON DELETE CASCADE,
                sport          TEXT NOT NULL,
                date           TEXT,
                body_mass_kg   REAL,
                primary_method TEXT,
                ftp            REAL,
                lt1            REAL,
                lt2            REAL,
                stages_json    TEXT NOT NULL,
                created_at     TEXT NOT NULL DEFAULT (datetime('now'))
            );
        "#,
        kind: MigrationKind::Up,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:lactate.db", migrations())
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![read_sensor, save_text, read_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
