import { useState } from 'react'
import { Toolbar } from './components/Toolbar'
import { StageGrid } from './components/StageGrid'
import { KpiCards } from './components/KpiCards'
import { LactateChart } from './components/LactateChart'
import { ResultsPanel } from './components/ResultsPanel'
import { ZoneTable } from './components/ZoneTable'
import { LibraryDrawer } from './components/LibraryDrawer'

export default function App() {
  const [libraryOpen, setLibraryOpen] = useState(false)
  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Toolbar onOpenLibrary={() => setLibraryOpen(true)} />
      <main className="mx-auto max-w-[1400px] px-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <StageGrid />
            <ResultsPanel />
          </div>
          <div className="flex flex-col gap-4 lg:col-span-7">
            <KpiCards />
            <LactateChart />
            <ZoneTable />
          </div>
        </div>
        <footer className="mx-auto mt-6 max-w-[1400px] text-center text-[11px] text-slate-400">
          Lactate Studio — threshold estimates are model-based; validate against your protocol and physiology.
        </footer>
      </main>
      <LibraryDrawer open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  )
}
