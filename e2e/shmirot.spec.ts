import { test, expect } from '@playwright/test'

test.describe('Shmirot App', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('shows navigation bar with app name', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav')).toContainText('Shmirot')
    await expect(page.locator('nav')).toContainText('Home')
    await expect(page.locator('nav')).toContainText('People')
  })

  test('home page shows empty state', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=No schedules yet')).toBeVisible()
    await expect(page.locator('text=+ New Schedule')).toBeVisible()
  })

  test('people page shows empty state', async ({ page }) => {
    await page.goto('/people')
    await expect(page.locator('text=No people added yet')).toBeVisible()
  })

  test('can add a person', async ({ page }) => {
    await page.goto('/people')
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'David')
    await page.fill('textarea[placeholder="Optional notes..."]', 'Morning person')
    await page.click('button:has-text("Add Person")')

    await expect(page.locator('text=David')).toBeVisible()
    await expect(page.locator('text=Morning person')).toBeVisible()
  })

  test('can add multiple people', async ({ page }) => {
    await page.goto('/people')

    // Add first person
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'David')
    await page.click('button:has-text("Add Person")')

    // Add second person
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'Noa')
    await page.click('button:has-text("Add Person")')

    // Add third person
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'Sarah')
    await page.click('button:has-text("Add Person")')

    await expect(page.locator('.space-y-2 >> text=David')).toBeVisible()
    await expect(page.locator('.space-y-2 >> text=Noa')).toBeVisible()
    await expect(page.locator('.space-y-2 >> text=Sarah')).toBeVisible()
  })

  test('can edit a person', async ({ page }) => {
    await page.goto('/people')

    // Add person
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'David')
    await page.click('button:has-text("Add Person")')

    // Edit person
    await page.click('text=Edit')
    await page.fill('input[placeholder="Enter name"]', 'David B')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=David B')).toBeVisible()
  })

  test('can delete a person', async ({ page }) => {
    await page.goto('/people')

    // Add person
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'David')
    await page.click('button:has-text("Add Person")')

    // Delete person
    await page.click('text=Delete')
    await page.click('button:has-text("Confirm")')

    await expect(page.locator('text=No people added yet')).toBeVisible()
  })

  test('can add constraint to a person', async ({ page }) => {
    await page.goto('/people')

    // Add person
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'David')

    // Add unavailable days constraint
    await page.selectOption('select', 'unavailable_days')
    await page.click('button:has-text("Add")')

    // Select Friday
    await page.click('button:has-text("Fri")')

    await page.click('button:has-text("Add Person")')

    // Verify constraint count shown
    await expect(page.locator('text=1 constraint')).toBeVisible()
  })

  test('people data persists across page reloads', async ({ page }) => {
    await page.goto('/people')

    // Add person
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'David')
    await page.click('button:has-text("Add Person")')

    // Reload page
    await page.reload()

    // Person should still be there
    await expect(page.locator('.space-y-2 >> text=David')).toBeVisible()
  })

  test('can navigate to create schedule page', async ({ page }) => {
    await page.goto('/')
    await page.click('text=+ New Schedule')
    await expect(page.locator('h1')).toContainText('Create Schedule')
  })

  test('full flow: create people, schedule, and assign', async ({ page }) => {
    // Step 1: Add people
    await page.goto('/people')

    const names = ['David', 'Noa', 'Sarah', 'Avi']
    for (const name of names) {
      await page.click('text=+ Add Person')
      await page.fill('input[placeholder="Enter name"]', name)
      await page.click('button:has-text("Add Person")')
    }

    // Verify all 4 added
    for (const name of names) {
      await expect(page.locator(`.space-y-2 >> text=${name}`)).toBeVisible()
    }

    // Step 2: Create schedule
    await page.goto('/')
    await page.click('text=+ New Schedule')

    // Fill in schedule details
    await page.fill('input[placeholder="e.g. Week of April 26"]', 'Test Week')
    await page.fill('input[type="date"]:first-of-type', '2026-04-26')
    await page.fill('input[type="date"]:last-of-type', '2026-04-28')

    // Select all participants
    await page.click('text=Select All')

    // Wait for days to render
    await expect(page.locator('text=Sun 4/26')).toBeVisible()

    // Add shift to first day
    const addShiftButtons = page.locator('text=+ Add Shift')
    await addShiftButtons.first().click()

    // Copy to all days
    await page.click('text=Copy to all days')

    // Choose Smart assignment
    await page.click('text=Smart')

    // Submit
    await page.click('text=Create & Assign')

    // Step 3: Should be on assign page
    await expect(page.locator('h1')).toContainText('Test Week')

    // Should see people sidebar
    for (const name of names) {
      await expect(page.locator(`text=${name}`).first()).toBeVisible()
    }

    // Should see hours summary
    await expect(page.locator('text=Hours Summary')).toBeVisible()

    // Step 4: Click Done to go to view page
    await page.click('text=Done')
    await expect(page.locator('h1')).toContainText('Test Week')
    await expect(page.locator('text=Edit Assignments')).toBeVisible()

    // Step 5: Go back home
    await page.click('nav >> text=Home')
    await expect(page.locator('text=Test Week')).toBeVisible()
  })

  test('schedule view shows violation and unassigned indicators', async ({ page }) => {
    // Add people
    await page.goto('/people')
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'David')
    await page.click('button:has-text("Add Person")')

    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'Noa')
    await page.click('button:has-text("Add Person")')

    // Create schedule with manual mode (no auto-assign)
    await page.goto('/')
    await page.click('text=+ New Schedule')
    await page.fill('input[placeholder="e.g. Week of April 26"]', 'Manual Test')
    await page.fill('input[type="date"]:first-of-type', '2026-04-26')
    await page.fill('input[type="date"]:last-of-type', '2026-04-26')
    await page.click('text=Select All')

    await expect(page.locator('text=Sun 4/26')).toBeVisible()
    await page.locator('text=+ Add Shift').first().click()

    // Set required count to 2
    await page.fill('input[type="number"]', '2')

    // Choose manual mode
    await page.getByLabel('Manual').check()
    await page.click('text=Create & Assign')

    // On assign page — shifts should be unassigned
    // Click Done to see view page
    await page.click('text=Done')

    // Should show unassigned slots
    await expect(page.locator('text=unassigned slot')).toBeVisible()
  })

  test('randomize and smart assign buttons work on assign page', async ({ page }) => {
    // Add people
    await page.goto('/people')
    const names = ['David', 'Noa', 'Sarah']
    for (const name of names) {
      await page.click('text=+ Add Person')
      await page.fill('input[placeholder="Enter name"]', name)
      await page.click('button:has-text("Add Person")')
    }

    // Create schedule
    await page.goto('/')
    await page.click('text=+ New Schedule')
    await page.fill('input[placeholder="e.g. Week of April 26"]', 'Reassign Test')
    await page.fill('input[type="date"]:first-of-type', '2026-04-26')
    await page.fill('input[type="date"]:last-of-type', '2026-04-26')
    await page.click('text=Select All')
    await expect(page.locator('text=Sun 4/26')).toBeVisible()
    await page.locator('text=+ Add Shift').first().click()
    await page.fill('input[type="number"]', '2')
    await page.getByLabel('Manual').check()
    await page.click('text=Create & Assign')

    // Click Randomize
    await page.click('text=Randomize')
    // Hours summary should show some hours assigned
    await expect(page.locator('text=Hours Summary')).toBeVisible()

    // Click Smart Assign
    await page.click('text=Smart Assign')
    await expect(page.locator('text=Hours Summary')).toBeVisible()
  })

  test('can delete a schedule from home page', async ({ page }) => {
    // Add a person first
    await page.goto('/people')
    await page.click('text=+ Add Person')
    await page.fill('input[placeholder="Enter name"]', 'David')
    await page.click('button:has-text("Add Person")')

    // Create schedule
    await page.goto('/')
    await page.click('text=+ New Schedule')
    await page.fill('input[placeholder="e.g. Week of April 26"]', 'Delete Me')
    await page.fill('input[type="date"]:first-of-type', '2026-04-26')
    await page.fill('input[type="date"]:last-of-type', '2026-04-26')
    await page.click('text=Select All')
    await page.getByLabel('Manual').check()
    await page.click('text=Create & Assign')

    // Go home
    await page.click('nav >> text=Home')
    await expect(page.locator('text=Delete Me')).toBeVisible()

    // Delete
    await page.click('text=Delete')
    await page.click('button:has-text("Confirm")')
    await expect(page.locator('text=No schedules yet')).toBeVisible()
  })
})
