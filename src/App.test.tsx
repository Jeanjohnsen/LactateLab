import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App (runtime smoke test)', () => {
  it('mounts the full dashboard with the sample session, no errors thrown', () => {
    render(<App />)

    // shell + every panel mounts
    expect(screen.getByText('Lactate Studio')).toBeInTheDocument()
    expect(screen.getByText('Test stages')).toBeInTheDocument()
    expect(screen.getByText('Methods compared')).toBeInTheDocument()
    expect(screen.getByText('Lactate curve & breakpoints')).toBeInTheDocument()
    expect(screen.getByText('Training zones')).toBeInTheDocument()

    // KPI cards render with computed values from the sample data
    expect(screen.getByText('FTP (LT2)')).toBeInTheDocument()
    expect(screen.getAllByText(/Modified Dmax/i).length).toBeGreaterThan(0)

    // editable grid is wired up
    expect(screen.getByLabelText('Stage 1 intensity')).toBeInTheDocument()
    expect(screen.getByLabelText('Add stage')).toBeInTheDocument()
  })
})
