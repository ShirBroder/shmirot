# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shmirot.spec.ts >> Shmirot App >> home page shows empty state
- Location: e2e/shmirot.spec.ts:18:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=+ New Schedule')
Expected: visible
Error: strict mode violation: locator('text=+ New Schedule') resolved to 2 elements:
    1) <a href="/schedule/new" data-discover="true" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Schedule</a> aka getByRole('link', { name: '+ New Schedule' })
    2) <p class="text-gray-500 text-center py-8">No schedules yet. Click "+ New Schedule" to start.</p> aka getByText('No schedules yet. Click "+')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=+ New Schedule')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]: Shmirot
    - link "Home" [ref=e6] [cursor=pointer]:
      - /url: /
    - link "People" [ref=e7] [cursor=pointer]:
      - /url: /people
  - main [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]:
        - heading "Schedules" [level=1] [ref=e11]
        - generic [ref=e12]:
          - button "Export Backup" [ref=e13]
          - button "Import Backup" [ref=e14]
          - link "+ New Schedule" [ref=e15] [cursor=pointer]:
            - /url: /schedule/new
      - paragraph [ref=e16]: No schedules yet. Click "+ New Schedule" to start.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | test.describe('Shmirot App', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Clear localStorage before each test
  6   |     await page.goto('/')
  7   |     await page.evaluate(() => localStorage.clear())
  8   |     await page.reload()
  9   |   })
  10  | 
  11  |   test('shows navigation bar with app name', async ({ page }) => {
  12  |     await page.goto('/')
  13  |     await expect(page.locator('nav')).toContainText('Shmirot')
  14  |     await expect(page.locator('nav')).toContainText('Home')
  15  |     await expect(page.locator('nav')).toContainText('People')
  16  |   })
  17  | 
  18  |   test('home page shows empty state', async ({ page }) => {
  19  |     await page.goto('/')
  20  |     await expect(page.locator('text=No schedules yet')).toBeVisible()
> 21  |     await expect(page.locator('text=+ New Schedule')).toBeVisible()
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  22  |   })
  23  | 
  24  |   test('people page shows empty state', async ({ page }) => {
  25  |     await page.goto('/people')
  26  |     await expect(page.locator('text=No people added yet')).toBeVisible()
  27  |   })
  28  | 
  29  |   test('can add a person', async ({ page }) => {
  30  |     await page.goto('/people')
  31  |     await page.click('text=+ Add Person')
  32  |     await page.fill('input[placeholder="Enter name"]', 'David')
  33  |     await page.fill('textarea[placeholder="Optional notes..."]', 'Morning person')
  34  |     await page.click('button:has-text("Add Person")')
  35  | 
  36  |     await expect(page.locator('text=David')).toBeVisible()
  37  |     await expect(page.locator('text=Morning person')).toBeVisible()
  38  |   })
  39  | 
  40  |   test('can add multiple people', async ({ page }) => {
  41  |     await page.goto('/people')
  42  | 
  43  |     // Add first person
  44  |     await page.click('text=+ Add Person')
  45  |     await page.fill('input[placeholder="Enter name"]', 'David')
  46  |     await page.click('button:has-text("Add Person")')
  47  | 
  48  |     // Add second person
  49  |     await page.click('text=+ Add Person')
  50  |     await page.fill('input[placeholder="Enter name"]', 'Noa')
  51  |     await page.click('button:has-text("Add Person")')
  52  | 
  53  |     // Add third person
  54  |     await page.click('text=+ Add Person')
  55  |     await page.fill('input[placeholder="Enter name"]', 'Sarah')
  56  |     await page.click('button:has-text("Add Person")')
  57  | 
  58  |     await expect(page.locator('.space-y-2 >> text=David')).toBeVisible()
  59  |     await expect(page.locator('.space-y-2 >> text=Noa')).toBeVisible()
  60  |     await expect(page.locator('.space-y-2 >> text=Sarah')).toBeVisible()
  61  |   })
  62  | 
  63  |   test('can edit a person', async ({ page }) => {
  64  |     await page.goto('/people')
  65  | 
  66  |     // Add person
  67  |     await page.click('text=+ Add Person')
  68  |     await page.fill('input[placeholder="Enter name"]', 'David')
  69  |     await page.click('button:has-text("Add Person")')
  70  | 
  71  |     // Edit person
  72  |     await page.click('text=Edit')
  73  |     await page.fill('input[placeholder="Enter name"]', 'David B')
  74  |     await page.click('button:has-text("Save")')
  75  | 
  76  |     await expect(page.locator('text=David B')).toBeVisible()
  77  |   })
  78  | 
  79  |   test('can delete a person', async ({ page }) => {
  80  |     await page.goto('/people')
  81  | 
  82  |     // Add person
  83  |     await page.click('text=+ Add Person')
  84  |     await page.fill('input[placeholder="Enter name"]', 'David')
  85  |     await page.click('button:has-text("Add Person")')
  86  | 
  87  |     // Delete person
  88  |     await page.click('text=Delete')
  89  |     await page.click('button:has-text("Confirm")')
  90  | 
  91  |     await expect(page.locator('text=No people added yet')).toBeVisible()
  92  |   })
  93  | 
  94  |   test('can add constraint to a person', async ({ page }) => {
  95  |     await page.goto('/people')
  96  | 
  97  |     // Add person
  98  |     await page.click('text=+ Add Person')
  99  |     await page.fill('input[placeholder="Enter name"]', 'David')
  100 | 
  101 |     // Add unavailable days constraint
  102 |     await page.selectOption('select', 'unavailable_days')
  103 |     await page.click('button:has-text("Add")')
  104 | 
  105 |     // Select Friday
  106 |     await page.click('button:has-text("Fri")')
  107 | 
  108 |     await page.click('button:has-text("Add Person")')
  109 | 
  110 |     // Verify constraint count shown
  111 |     await expect(page.locator('text=1 constraint')).toBeVisible()
  112 |   })
  113 | 
  114 |   test('people data persists across page reloads', async ({ page }) => {
  115 |     await page.goto('/people')
  116 | 
  117 |     // Add person
  118 |     await page.click('text=+ Add Person')
  119 |     await page.fill('input[placeholder="Enter name"]', 'David')
  120 |     await page.click('button:has-text("Add Person")')
  121 | 
```