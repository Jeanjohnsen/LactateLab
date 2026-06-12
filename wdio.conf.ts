import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'

/**
 * Desktop E2E for the Tauri app via WebdriverIO + tauri-driver. This exercises
 * the SQLite-backed Library flow, which only exists in the native runtime.
 *
 * One-time setup (not installed by default to keep the dep tree lean):
 *   cargo install tauri-driver --locked
 *   npm i -D @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter webdriverio @types/mocha
 *   Windows: install the Microsoft Edge WebDriver (msedgedriver) matching your WebView2 version
 *   Linux:   install webkit2gtk + WebKitWebDriver  (works well on CI: ubuntu-22.04)
 *
 * Then:
 *   npm run tauri build            # build the app binary first
 *   npm run test:e2e:desktop
 */

const application = path.resolve(
  import.meta.dirname,
  'src-tauri',
  'target',
  'release',
  process.platform === 'win32' ? 'app.exe' : 'app',
)

let tauriDriver: ChildProcess | undefined

export const config = {
  runner: 'local',
  specs: ['./e2e-desktop/specs/**/*.e2e.ts'],
  maxInstances: 1,
  capabilities: [{ 'tauri:options': { application } }],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 60000 },
  hostname: '127.0.0.1',
  port: 4444,
  onPrepare: () => {
    tauriDriver = spawn('tauri-driver', [], { stdio: [null, process.stdout, process.stderr] })
  },
  onComplete: () => {
    tauriDriver?.kill()
  },
}
