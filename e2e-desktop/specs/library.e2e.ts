// Desktop-only E2E: the SQLite-backed Library (athletes + saved tests).
// Runs against the built Tauri binary via tauri-driver (see wdio.conf.ts).
// WDIO provides the `browser`, `$`, `expect`, `describe`, `it` globals.

describe('Lactate Studio desktop — SQLite library', () => {
  it('opens the library, adds an athlete, and saves the current test', async () => {
    // Open the Library drawer (desktop-only toolbar button).
    await $('button*=Library').click()

    // Add a new athlete.
    const nameInput = await $('input[aria-label="New athlete name"]')
    await nameInput.setValue('Test Runner')
    await browser.keys('Enter')
    await expect($('*=Test Runner')).toBeExisting()

    // Save the current (sample) session as a test; its athlete appears with a test.
    await $('button*=Save current test').click()
    await expect($('*=Anna Karlsson')).toBeExisting()

    // The saved test is now loadable.
    await expect($('button[aria-label^="Load test"]')).toBeExisting()
  })
})
