# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shmirot.spec.ts >> Shmirot App >> can delete a person
- Location: e2e/shmirot.spec.ts:79:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Delete')

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
        - heading "People" [level=1] [ref=e11]
        - button "+ Add Person" [active] [ref=e12]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Name
          - textbox "Enter name" [ref=e17]: David
        - generic [ref=e18]:
          - generic [ref=e19]: Notes
          - textbox "Optional notes..." [ref=e20]
        - generic [ref=e21]:
          - heading "Constraints" [level=4] [ref=e22]
          - generic [ref=e23]:
            - combobox [ref=e24]:
              - option "Add constraint..." [selected]
              - option "Unavailable Hours"
              - option "Unavailable Days"
              - option "Max Hours"
              - option "Must Not Work With"
              - option "Must Work With"
            - button "Add" [disabled] [ref=e25]
        - generic [ref=e26]:
          - button "Cancel" [ref=e27]
          - button "Add Person" [ref=e28]
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
  21  |     await expect(page.locator('text=+ New Schedule')).toBeVisible()
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
> 88  |     await page.click('text=Delete')
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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
  122 |     // Reload page
  123 |     await page.reload()
  124 | 
  125 |     // Person should still be there
  126 |     await expect(page.locator('.space-y-2 >> text=David')).toBeVisible()
  127 |   })
  128 | 
  129 |   test('can navigate to create schedule page', async ({ page }) => {
  130 |     await page.goto('/')
  131 |     await page.click('text=+ New Schedule')
  132 |     await expect(page.locator('h1')).toContainText('Create Schedule')
  133 |   })
  134 | 
  135 |   test('full flow: create people, schedule, and assign', async ({ page }) => {
  136 |     // Step 1: Add people
  137 |     await page.goto('/people')
  138 | 
  139 |     const names = ['David', 'Noa', 'Sarah', 'Avi']
  140 |     for (const name of names) {
  141 |       await page.click('text=+ Add Person')
  142 |       await page.fill('input[placeholder="Enter name"]', name)
  143 |       await page.click('button:has-text("Add Person")')
  144 |     }
  145 | 
  146 |     // Verify all 4 added
  147 |     for (const name of names) {
  148 |       await expect(page.locator(`.space-y-2 >> text=${name}`)).toBeVisible()
  149 |     }
  150 | 
  151 |     // Step 2: Create schedule
  152 |     await page.goto('/')
  153 |     await page.click('text=+ New Schedule')
  154 | 
  155 |     // Fill in schedule details
  156 |     await page.fill('input[placeholder="e.g. Week of April 26"]', 'Test Week')
  157 |     await page.fill('input[type="date"]:first-of-type', '2026-04-26')
  158 |     await page.fill('input[type="date"]:last-of-type', '2026-04-28')
  159 | 
  160 |     // Select all participants
  161 |     await page.click('text=Select All')
  162 | 
  163 |     // Wait for days to render
  164 |     await expect(page.locator('text=Sun 4/26')).toBeVisible()
  165 | 
  166 |     // Add shift to first day
  167 |     const addShiftButtons = page.locator('text=+ Add Shift')
  168 |     await addShiftButtons.first().click()
  169 | 
  170 |     // Copy to all days
  171 |     await page.click('text=Copy to all days')
  172 | 
  173 |     // Choose Smart assignment
  174 |     await page.click('text=Smart')
  175 | 
  176 |     // Submit
  177 |     await page.click('text=Create & Assign')
  178 | 
  179 |     // Step 3: Should be on assign page
  180 |     await expect(page.locator('h1')).toContainText('Test Week')
  181 | 
  182 |     // Should see people sidebar
  183 |     for (const name of names) {
  184 |       await expect(page.locator(`text=${name}`).first()).toBeVisible()
  185 |     }
  186 | 
  187 |     // Should see hours summary
  188 |     await expect(page.locator('text=Hours Summary')).toBeVisible()
```