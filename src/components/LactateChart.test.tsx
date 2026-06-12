import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LactateChart } from './LactateChart'
import { useTestStore } from '@/state/useTestStore'
import { runningTest } from '@/test/fixtures/datasets'

describe('LactateChart', () => {
  it('renders the reversed pace axis for a running test without throwing', () => {
    useTestStore.getState().loadSession(runningTest)
    useTestStore.getState().setRunningUnit('pace')
    render(<LactateChart />)
    expect(screen.getByText('lactate')).toBeInTheDocument()
  })

  it('renders the speed axis for a running test in speed mode', () => {
    useTestStore.getState().loadSession(runningTest)
    useTestStore.getState().setRunningUnit('speed')
    render(<LactateChart />)
    expect(screen.getByText('lactate')).toBeInTheDocument()
  })
})
