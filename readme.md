# Lactate Studio

A desktop app for **lactate threshold testing**. Enter the readings from an incremental
"step test" and Lactate Studio fits the lactate curve, detects the physiological
breakpoints (**LT1**, **LT2**, **FatMax**), estimates **FTP / threshold pace**, and derives
**training zones** — live, as you edit, for cycling, running, and rowing.

Built with **Tauri 2 · React 19 · TypeScript · Vite · Tailwind**. The calculation engine is
pure, dependency-light TypeScript with a full unit-test suite, so the science is testable
in isolation and the same UI can later run as a web app.

---

## Table of contents

- [Background: the science](#background-the-science)
- [Features](#features)
- [Threshold-detection methods](#threshold-detection-methods)
- [Training-zone models](#training-zone-models)
- [Getting started](#getting-started)
- [Building the desktop installer](#building-the-desktop-installer)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Data, import/export & persistence](#data-importexport--persistence)
- [Sensor adapter (future hardware)](#sensor-adapter-future-hardware)
- [Tech stack](#tech-stack)
- [Accuracy & caveats](#accuracy--caveats)
- [Toolchain note (important)](#toolchain-note-important)
- [Roadmap](#roadmap)
- [Disclaimer](#disclaimer)

---

## Background: the science

An endurance **step test** ramps intensity in stages (e.g. +20 W or +1 km/h every 3–4 min).
At the end of each stage you record the **intensity**, a fingertip **blood-lactate** sample
(mmol/L), and usually **heart rate**. Plotting lactate against intensity produces a curve
with two characteristic deflections:

- **LT1 — aerobic threshold.** The first rise of lactate above baseline. Below it, efforts
  are comfortably aerobic; it anchors easy/endurance training.
- **LT2 — anaerobic threshold (≈ MLSS / FTP).** The second, steeper rise where lactate
  production outpaces clearance. The highest sustainable intensity; the basis for **FTP**
  (cycling) or **threshold pace** (running).
- **FatMax — peak fat-oxidation intensity.** A moderate intensity, at or just below LT1,
  where the body burns fat fastest. *True FatMax requires gas-exchange (RER) measurement;*
  Lactate Studio estimates it from lactate (~1.5 mmol/L proxy) and labels it as such.

Because no single algorithm is universally "correct", Lactate Studio computes **several
established methods** and shows them side by side — you pick the one that matches your
protocol. Transparency is the point.

---

## Features

- **Editable stage grid** — type, paste from a spreadsheet, or import CSV. Add/remove rows;
  every edit recomputes the whole analysis live.
- **Multi-sport** — cycling & rowing (power, W) and running. For running, type **pace**
  (`5:40` or `5.40`) or **speed** (`20`) — auto-detected (≥ 12 is read as km/h) — and toggle
  the whole UI between pace (min/km) and speed (km/h).
- **Transparent threshold detection** — Modified Dmax, Dmax, OBLA 4 mmol/L, segmented
  regression, IAT, log-log, fixed 2 mmol/L, baseline+Δ. Choose the primary LT2/FTP method.
- **FatMax** — estimated peak fat-oxidation intensity, shown as a KPI, a chart marker, and a
  dedicated fat-burning zone band.
- **Live dual-axis chart** — fitted lactate curve + raw points, heart rate, breakpoint
  markers (FatMax / LT1 / LT2), and shaded training-zone bands. In running pace mode the
  x-axis switches to **pace (min/km), reversed** so intensity still increases left→right.
- **Training zones** — physiological (with FatMax), Coggan 7-zone %FTP (cycling), running
  5-zone (% threshold speed), and HR 5-zone (%LTHR).
- **KPI cards** — FTP (with W/kg), LT1, FatMax, threshold HR.
- **Persistence & athletes** — a local SQLite **library** to manage athletes (add, rename,
  delete) and their saved tests (save/browse/load/delete, filter per athlete); single-file
  JSON **Save/Open** for sharing; CSV import/export for data.
- **Desktop niceties** — dark mode, keyboard-accessible inputs, `prefers-reduced-motion`,
  offline-first (fonts bundled), small native installer.

---

## Threshold-detection methods

| Method | Level | What it does |
|--------|-------|--------------|
| **Modified Dmax** *(default)* | LT2 | Max perpendicular distance from the curve to the line starting at the first >0.4 mmol/L rise. Best-validated FTP proxy. |
| **Dmax** | LT2 | Max perpendicular distance from the curve to the line joining the first and last points. |
| **OBLA 4.0 mmol/L** | LT2 | Intensity at a fixed 4 mmol/L blood lactate. The classic anaerobic-threshold marker. |
| **Segmented regression** | LT1 + LT2 | Piecewise-linear fit; the two knots mark LT1 and LT2. Robust for sparse data. |
| **IAT (Dickhuth)** | LT2 | Intensity at baseline lactate + 1.5 mmol/L. |
| **Log-log (Beaver)** | LT1 | Breakpoint of a two-segment fit in log-lactate vs log-intensity space. |
| **Fixed 2.0 mmol/L** | LT1 | Intensity at a fixed 2 mmol/L blood lactate. |
| **Baseline + 0.5 mmol/L** | LT1 | First rise of 0.5 mmol/L above the lowest measured lactate. |
| **FatMax** | FatMax | Intensity at ~1.5 mmol/L (lactate proxy), clamped at or below LT1. |

The curve is a least-squares 3rd-order polynomial (order is reduced automatically for
sparse data). FTP = the intensity at LT2 from your chosen primary method; the others are
shown alongside for cross-checking, and large disagreements are flagged.

---

## Training-zone models

Switch models in the zone panel; the chart bands follow the physiological model.

- **Physiological (+ FatMax)** — Recovery (< FatMax) · FatMax/fat-burning (FatMax–LT1) ·
  Threshold (LT1–LT2) · Hard (> LT2). Falls back to a clean 3-zone split if FatMax can't be
  estimated.
- **Coggan power (7-zone, %FTP)** — Active Recovery, Endurance, Tempo, Threshold, VO2max,
  Anaerobic, Neuromuscular (cycling/rowing).
- **Running (5-zone, % threshold speed)** — Recovery, Endurance, Tempo, Threshold,
  VO2/Anaerobic.
- **Heart rate (5-zone, %LTHR)** — derived from the heart rate at LT2.

Zone colours follow the cool→warm convention athletes recognise (with always-on text
labels, never colour alone).

---

## Getting started

### Prerequisites

- **Node.js** 20+ and npm.
- **Rust toolchain** via [rustup] — only needed for the native desktop build. The repo pins
  `1.85.0` in `src-tauri/rust-toolchain.toml`; rustup installs it on first build (see the
  [toolchain note](#toolchain-note-important) for why).
- **WebView2** runtime — preinstalled on Windows 11.

### Install & run

```bash
npm install
npm run dev          # web app at http://localhost:5173
npm run tauri dev    # native desktop window (compiles Rust on first run)
```

`npm run dev` is the fastest loop and exercises everything except the desktop-only features
(SQLite library, JSON Save/Open, sensor command).

---

## Building the desktop installer

```bash
npm run tauri build
```

On Windows this produces (`bundle.targets` is `"all"`):

- `…/bundle/nsis/Lactate Studio_<version>_x64-setup.exe` — NSIS installer
- `…/bundle/msi/Lactate Studio_<version>_x64_en-US.msi` — MSI installer
- `src-tauri/target/release/app.exe` — standalone executable

The web bundle is built first (`npm run build` → `dist/`), then embedded in the native app.

### Cross-platform installers (CI)

Tauri builds for the **host OS only** — a macOS `.dmg`/`.app` must be built on macOS and Linux
`.deb`/`.AppImage` on Linux. The repo includes a GitHub Actions matrix that does this:

- `.github/workflows/release.yml` — on a pushed tag (`v*`) or manual dispatch, builds on
  `windows-latest`, `macos-latest` (Apple silicon + Intel), and `ubuntu-22.04` via
  [`tauri-action`], and publishes a **draft GitHub Release** with every installer attached.
- `.github/workflows/ci.yml` — on push / PR: lint, build, Vitest, and the Playwright E2E.

To cut a release: push the project to GitHub, then `git tag v0.1.0 && git push --tags`.

[`tauri-action`]: https://github.com/tauri-apps/tauri-action

---

## Testing

```bash
npm run test               # vitest unit/component (run once)
npm run test:e2e           # Playwright web E2E (starts the dev server, headless Chromium)
npm run lint               # eslint
npm run test:e2e:desktop   # WebdriverIO + tauri-driver (desktop SQLite flow — optional setup)
```

Three layers:

1. **Calculation-core eval suite (Vitest)** — the math toolbox (regression, interpolation,
   segmentation, geometry), each method recovering known thresholds on reference datasets,
   exact zone/unit arithmetic, FatMax ≤ LT1, and the pace/speed parser.
2. **Component + smoke tests (Vitest + Testing Library)** — mounts the dashboard and the
   chart (pace **and** speed modes) and confirms they render with no runtime errors.
3. **Web E2E (Playwright)** — drives the real app in Chromium: dashboard, pace input, and the
   chart axes — asserting the cycling axis ascends and the running **pace axis is reversed**
   (faster pace to the right).

**Desktop E2E (optional).** `e2e-desktop/` + `wdio.conf.ts` exercise the SQLite Library in the
native runtime via WebdriverIO + `tauri-driver`. It needs a one-time setup (a platform
WebDriver + the wdio packages — see the header of `wdio.conf.ts`) and isn't wired into the
default install, to keep the dependency tree lean.

---

## Project structure

| Path | Purpose |
|------|---------|
| `src/core/` | Pure calculation engine — `curveFit`, `thresholds` (incl. FatMax), `zones`, `units`, `math` — and its tests. The heart; zero UI deps. |
| `src/state/` | Zustand store; recomputes the `ThresholdReport` on every edit. |
| `src/components/` | Dashboard — `StageGrid`, `LactateChart`, `KpiCards`, `ResultsPanel`, `ZoneTable`, `Toolbar`, `LibraryDrawer`, shared `ui`. |
| `src/lib/` | `csv` (papaparse), `persistence` (JSON via Tauri), `db` (SQLite), `sensor` (adapter), `sampleData`, `cn`. |
| `src-tauri/` | Rust shell — SQLite migrations, `read_sensor` / `save_text` / `read_text` commands, dialog + sql plugins, window config. |
| `docs/market-brief.md` | Market scan (competitors, sizing, positioning). |

---

## Data, import/export & persistence

Three complementary mechanisms:

- **CSV** (any platform) — Import/Export in the toolbar, or paste from a spreadsheet.
  Flexible headers are accepted: `intensity`/`power`/`watts`/`speed`, `lactate`/`lac`/`mmol`,
  `hr`/`heart_rate`/`bpm`, `rpe`. Headerless files are read positionally
  (`intensity, lactate, hr, rpe`). Export writes `intensity,lactate,heart_rate,rpe`.
- **JSON session** (desktop) — `Save` / `Open` writes the full session (athlete, sport, date,
  mass, method, stages) to a `.json` file via native dialogs. Good for sharing a single test.
- **SQLite library** (desktop) — the **Library** drawer saves tests into a local
  `lactate.db` (in the app data dir), auto-creating the athlete by name, and lets you browse,
  load, and delete past tests. Schema: `athlete` and `test` (stages stored as JSON), created
  by a migration that runs on launch.

---

## Sensor adapter (future hardware)

Live capture is designed-for but not bound to a device in v1. The seam is a small TypeScript
`SensorSource` interface (`src/lib/sensor.ts`) with a deterministic `MockSensorSource` and a
`TauriSensorSource` that calls the Rust `read_sensor` command (`src-tauri/src/lib.rs`). A real
serial/BLE analyzer (e.g. via the `serialport` / `btleplug` crates) implements the same
interface without touching the UI — the grid stays the source of truth.

---

## Tech stack

| Concern | Choice |
|---------|--------|
| Desktop shell | Tauri 2 (Rust) |
| UI | React 19 + TypeScript + Vite |
| Styling | Tailwind v4 + custom primitives |
| Charts | Recharts **2.15** (ComposedChart: scatter + line, dual axis, reference lines/areas) with a custom axis-tick component (Recharts 3 doesn't render ticks under React 19) |
| State | Zustand |
| Math | hand-rolled least-squares + `ml-matrix` |
| CSV | papaparse |
| Persistence | `tauri-plugin-sql` (SQLite) + `tauri-plugin-dialog` |
| Fonts | IBM Plex Sans + JetBrains Mono (bundled via fontsource, offline-first) |
| Tests | Vitest + Testing Library · Playwright (web E2E) · WebdriverIO + tauri-driver (desktop) |

---

## Accuracy & caveats

- **Methods disagree by design.** Pick the LT2 method that matches your protocol; the app
  flags large spreads between methods.
- **Sparse tests are flagged.** Below ~4–5 stages the polynomial fit and breakpoints are
  less reliable; the app reduces the fit order and warns.
- **FatMax is a lactate proxy.** True FatMax needs indirect calorimetry (RER). The estimate
  here (≈1.5 mmol/L, clamped ≤ LT1) is a practical approximation, not a metabolic-cart value.
- **W/kg needs body mass; pace↔speed is exact.** Both are unit-tested.
- Estimates are decision support, not medical or coaching prescriptions — validate against
  your own physiology and protocol.

---

## Toolchain note (important)

On Rust **1.94** (and 1.88+), a trait-coherence regression breaks Tauri's `tauri-utils` /
`cookie` (blanket `From` impls vs `time`'s associated-type impls), and `time` 0.3.48's MSRV
is 1.88. The repo works around this without changing app code:

- `src-tauri/rust-toolchain.toml` pins Rust **1.85.0**.
- `src-tauri/.cargo/config.toml` enables the MSRV-aware resolver
  (`incompatible-rust-versions = "fallback"`) and `Cargo.toml` sets `rust-version = "1.85"`,
  so `time`, `serde_with`, `plist`, etc. resolve to 1.85-compatible versions.

When the Tauri ecosystem ships releases compatible with newer rustc, these pins can be
removed.

---

## Roadmap

- Per-athlete trends across saved tests (the library already supports add/rename/delete +
  per-athlete filtering).
- Live sensor capture (serial/BLE) using the existing adapter seam.
- PDF / printable test report export.
- Code-split the bundle to trim the Recharts chunk.
- Optional cloud sync (the SQLite schema maps cleanly to Postgres/Supabase).

---

## Disclaimer

Lactate Studio is a training-analysis tool, not a medical device. Threshold and FatMax
estimates are model-based approximations. Use them as decision support alongside professional
judgement.

[rustup]: https://rustup.rs
