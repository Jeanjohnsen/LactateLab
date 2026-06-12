import { test, expect, type Page } from '@playwright/test'

async function readXTicks(page: Page) {
  // Our custom AxisTick renders <text> with an explicit x attribute (the tick
  // position), so read that rather than a group transform.
  return page.locator('.recharts-xAxis text').evaluateAll((els) =>
    els.map((el) => ({
      text: (el.textContent || '').trim(),
      x: parseFloat(el.getAttribute('x') || 'NaN'),
    })),
  )
}

test('cycling dashboard renders with an ascending power axis', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner')).toContainText('Lactate Studio')
  await expect(page.getByRole('heading', { name: 'Test stages' })).toBeVisible()
  await expect(page.getByText('FTP (LT2)')).toBeVisible()

  // The chart actually renders in a real browser (ResizeObserver fires).
  await expect(page.locator('.recharts-xAxis .recharts-cartesian-axis-tick').first()).toBeVisible()
  const ticks = (await readXTicks(page)).filter((t) => /^\d+$/.test(t.text))
  expect(ticks.length).toBeGreaterThan(1)

  // Power (W) increases left -> right.
  const sorted = [...ticks].sort((a, b) => a.x - b.x)
  const vals = sorted.map((t) => Number(t.text))
  for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThanOrEqual(vals[i - 1])
})

test('running pace mode shows a reversed pace axis', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Sport').selectOption('running')

  const paces = ['7:00', '6:30', '6:00', '5:30', '5:00', '4:40', '4:20', '4:00']
  for (let i = 0; i < paces.length; i++) {
    await page.getByLabel(`Stage ${i + 1} intensity`).fill(paces[i])
  }
  // Press Tab to blur the last cell so it commits + reformats.
  await page.keyboard.press('Tab')

  await expect(page.getByRole('columnheader', { name: 'Pace (min/km)' })).toBeVisible()
  await expect(page.getByText(/\d+:\d{2}\s*\/km/).first()).toBeVisible()

  // X-axis ticks are pace (m:ss) and reversed: pace gets faster (smaller) left -> right.
  await expect(page.locator('.recharts-xAxis .recharts-cartesian-axis-tick').first()).toBeVisible()
  const ticks = (await readXTicks(page)).filter((t) => /^\d+:\d{2}$/.test(t.text))
  expect(ticks.length).toBeGreaterThan(1)

  const toSec = (s: string) => {
    const [m, sec] = s.split(':').map(Number)
    return m * 60 + sec
  }
  const sorted = [...ticks].sort((a, b) => a.x - b.x)
  const secs = sorted.map((t) => toSec(t.text))
  for (let i = 1; i < secs.length; i++) expect(secs[i]).toBeLessThanOrEqual(secs[i - 1])
})
