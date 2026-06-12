import { describe, it, expect } from 'vitest'
import { parseRunningSpeed, intensityLabel, runningSpeedToText } from './running'

describe('running pace/speed parsing', () => {
  it('parses pace written with a colon', () => {
    expect(parseRunningSpeed('5:40')).toBeCloseTo(3600 / 340, 6)
    expect(parseRunningSpeed('4:00')).toBeCloseTo(15, 6)
  })

  it('parses dotted pace under 12 as M.SS', () => {
    expect(parseRunningSpeed('5.40')).toBeCloseTo(3600 / 340, 6)
    expect(parseRunningSpeed('4.30')).toBeCloseTo(3600 / 270, 6)
    expect(parseRunningSpeed('5.4')).toBeCloseTo(3600 / 340, 6) // ".4" -> 40 s
    expect(parseRunningSpeed('5.05')).toBeCloseTo(3600 / 305, 6)
  })

  it('treats values >= 12 as speed in km/h', () => {
    expect(parseRunningSpeed('20')).toBe(20)
    expect(parseRunningSpeed('16.5')).toBe(16.5)
  })

  it('treats a bare integer < 12 as M:00 pace', () => {
    expect(parseRunningSpeed('6')).toBeCloseTo(10, 6) // 6:00/km = 10 km/h
  })

  it('accepts comma decimals and blanks', () => {
    expect(parseRunningSpeed('5,40')).toBeCloseTo(3600 / 340, 6)
    expect(parseRunningSpeed('')).toBeUndefined()
    expect(parseRunningSpeed('abc')).toBeUndefined()
  })

  it('formats and round-trips', () => {
    const kmh = parseRunningSpeed('5:40')!
    expect(intensityLabel(kmh, 'running', 'pace')).toBe('5:40 /km')
    expect(intensityLabel(kmh, 'running', 'speed')).toBe('10.6 km/h')
    expect(intensityLabel(300, 'cycling', 'pace')).toBe('300 W')
    expect(runningSpeedToText(kmh, 'pace')).toBe('5:40')
    expect(runningSpeedToText(20, 'speed')).toBe('20')
  })
})
