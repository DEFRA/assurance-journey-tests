/**
 * Spec: Update All Service Standards Per Profession
 *
 * For each profession (one dedicated project per profession):
 *   1. Open the project → compliance tab → click standard 1 → "Add service standard update"
 *   2. Select the profession → iterate over every standard in the dropdown:
 *        a. Select the standard, status, commentary → Save update
 *        b. Wait for success URL ("notification=Assessment%20saved%20successfully")
 *        c. Navigate back to assessment page for the next standard
 *   3. After all standards are saved, go to the project detail → compliance tab
 *   4. Verify: each updated standard shows the correct status tag
 *   5. Verify: all other standards remain "Pending" (unaffected)
 *
 * Test data: test/data/update-standards.data.js
 * Projects must already exist in the test database.
 */

import AssessmentPage from '../page-objects/assessment.page.js'
import {
  PROFESSION_UPDATE_SCENARIOS,
  statusForIndex,
  buildCommentary
} from '../data/update-standards.data.js'
import { SERVICE_STANDARDS } from '../data/delivery.data.js'
import { waitForPageLoad, signInAndNavigateToProjects } from '../helpers/delivery.helper.js'

// ── Parameterised describe – one per profession ──────────────────────────────
for (const scenario of PROFESSION_UPDATE_SCENARIOS) {
  describe(`Update All Standards – ${scenario.professionLabel} (${scenario.projectName})`, () => {

    /** Map of standard number → assigned status label, populated during updates */
    const assignedStatuses = {}

    beforeEach(async () => {
      await signInAndNavigateToProjects()
    })

     // ════════════════════════════════════════════════════════════════════════
    // Step 1: Save an assessment for every standard in this profession
    // ════════════════════════════════════════════════════════════════════════
    it(`should update all ${scenario.standards.length} standards for ${scenario.professionLabel}`, async () => {
      for (let i = 0; i < scenario.standards.length; i++) {
        const stdNum = scenario.standards[i]
        const status = statusForIndex(i)
        const commentary = buildCommentary(scenario.professionLabel, stdNum, status.label)

        console.log(` Standard ${stdNum} → ${status.label}: ${commentary}`)

        if (i === 0) {
          // First iteration: navigate to the project via search
          await AssessmentPage.openProject(scenario.projectName)
          await waitForPageLoad()
        }
        // After save, browser is already on the project detail page

        await AssessmentPage.clickAddServiceStandardUpdate()
        await waitForPageLoad()

        // Verify page heading
        await expect(AssessmentPage.pageHeading).toHaveText('Add Service Standard update', { containing: true })

        // Select profession → wait for standards dropdown to populate
        await AssessmentPage.selectProfession(scenario.professionId)

        // Grab all available standard option values to find the one matching stdNum
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const optionTexts = await AssessmentPage.getStandardOptions()
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const optionValues = await AssessmentPage.getStandardOptionValues()

        // Find the option whose text starts with "N." where N = stdNum
        let targetValue = null
        for (let j = 0; j < optionTexts.length; j++) {
          if (optionTexts[j].startsWith(`${stdNum}.`)) {
            targetValue = optionValues[j]
            break
          }
        }

        if (!targetValue) {
          throw new Error(
            `Standard "${stdNum}. ..." not found in dropdown for "${scenario.professionLabel}".\n` +
            `Available: [${optionTexts.join(' | ')}]`
          )
        }

        // Submit the assessment
        await AssessmentPage.submitAssessment({
          professionId: scenario.professionId,
          standardValue: targetValue,
          statusValue: status.value,
          commentary
        })

        // Record the assigned status for later verification
        assignedStatuses[stdNum] = status.label

        console.log(`  Standard ${stdNum} saved as ${status.label}`)
      }
    })

    // ════════════════════════════════════════════════════════════════════════
    // Step 2: Verify the compliance tab shows correct statuses
    // ════════════════════════════════════════════════════════════════════════
    it(`should show correct statuses in compliance tab after all updates for ${scenario.professionLabel}`, async () => {
      // Open the project detail page
      await AssessmentPage.openProject(scenario.projectName)
      await waitForPageLoad()

      // Switch to compliance tab
      await AssessmentPage.serviceStandardComplianceTab.waitForDisplayed({ timeout: 5000 })
      await AssessmentPage.serviceStandardComplianceTab.click()
      await browser.waitUntil(
        async () => {
          const cls = await $('#compliance').getAttribute('class')
          return !cls.includes('govuk-tabs__panel--hidden')
        },
        { timeout: 5000, timeoutMsg: 'Compliance tab did not become visible' }
      )

      // Read the whole compliance table
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const tableData = await AssessmentPage.getComplianceTableData()
      console.log(`  Compliance table (${tableData.length} rows):`)

      const failures = []

      for (let stdIdx = 0; stdIdx < SERVICE_STANDARDS.length; stdIdx++) {
        const stdNum = stdIdx + 1
        const row = tableData.find(r => r.standard.startsWith(`${stdNum}.`))

        if (!row) {
          // Standard might not be in the table if it was soft-deleted from DB
          continue
        }

        if (assignedStatuses[stdNum]) {
          // This standard was updated – verify its status
          const expectedStatus = assignedStatuses[stdNum]
          if (row.status.includes(expectedStatus)) {
            console.log(`     ${stdNum}. → ${row.status}`)
          } else {
            failures.push(
              `Standard ${stdNum}: expected status "${expectedStatus}", ` +
              `got "${row.status}"`
            )
          }
        } else if (row.status.includes('Pending')) {
          console.log(`     ${stdNum}. → Pending (unaffected, as expected)`)
        } else {
          failures.push(
            `Standard ${stdNum}: expected "Pending" (unaffected), ` +
            `got "${row.status}"`
          )
        }
      }

      if (failures.length > 0) {
        const divider = '\n' + '─'.repeat(60) + '\n'
        throw new Error(
          `${failures.length} compliance status mismatch(es):` +
          divider + failures.join(divider) + '\n' + '─'.repeat(60)
        )
      }
    })
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// Route 2: Via Compliance tab → Standard detail → "Add service standard update"
// ══════════════════════════════════════════════════════════════════════════════
for (const scenario of PROFESSION_UPDATE_SCENARIOS) {
  describe(`Update All Standards (via Compliance Tab) – ${scenario.professionLabel} (${scenario.projectName})`, () => {

    const assignedStatuses = {}

    beforeEach(async () => {
      await signInAndNavigateToProjects()
    })

    // ════════════════════════════════════════════════════════════════════════
    // Step 1: Save an assessment for every standard via compliance tab route
    // ════════════════════════════════════════════════════════════════════════
    it(`should update all ${scenario.standards.length} standards for ${scenario.professionLabel} via compliance tab`, async () => {
      for (let i = 0; i < scenario.standards.length; i++) {
        const stdNum = scenario.standards[i]
        const status = statusForIndex(i)
        const commentary = buildCommentary(scenario.professionLabel, stdNum, status.label)

        console.log(`   [Compliance route] Standard ${stdNum} → ${status.label}`)

        if (i === 0) {
          // First standard only: navigate via compliance tab → standard detail
          await AssessmentPage.openProject(scenario.projectName)
          await waitForPageLoad()

          await AssessmentPage.clickStandardFromComplianceTab(1)
          await waitForPageLoad()

          // On the standard detail page click "Add service standard update"
          await AssessmentPage.clickAddUpdateFromStandardDetail()
          await waitForPageLoad()
        } else {
          // Subsequent standards: save redirected us back to the project page.
          // Click "Add Service Standard update" directly — no need to search again.
          await AssessmentPage.clickAddServiceStandardUpdate()
          await waitForPageLoad()
        }

        // Verify page heading
        await expect(AssessmentPage.pageHeading).toHaveText('Add Service Standard update', { containing: true })

        // Select profession → wait for standards dropdown to populate
        await AssessmentPage.selectProfession(scenario.professionId)

        // eslint-disable-next-line @typescript-eslint/await-thenable
        const optionTexts = await AssessmentPage.getStandardOptions()
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const optionValues = await AssessmentPage.getStandardOptionValues()

        let targetValue = null
        for (let j = 0; j < optionTexts.length; j++) {
          if (optionTexts[j].startsWith(`${stdNum}.`)) {
            targetValue = optionValues[j]
            break
          }
        }

        if (!targetValue) {
          throw new Error(
            `Standard "${stdNum}. ..." not found in dropdown for "${scenario.professionLabel}".\n` +
            `Available: [${optionTexts.join(' | ')}]`
          )
        }

        await AssessmentPage.submitAssessment({
          professionId: scenario.professionId,
          standardValue: targetValue,
          statusValue: status.value,
          commentary
        })

        assignedStatuses[stdNum] = status.label
        console.log(`   Standard ${stdNum} saved as ${status.label}`)
      }
    })

    // ════════════════════════════════════════════════════════════════════════
    // Step 2: Verify the compliance tab shows correct statuses
    // ════════════════════════════════════════════════════════════════════════
    it(`should show correct statuses in compliance tab after compliance-tab-route updates for ${scenario.professionLabel}`, async () => {
      await AssessmentPage.openProject(scenario.projectName)
      await waitForPageLoad()

      await AssessmentPage.serviceStandardComplianceTab.waitForDisplayed({ timeout: 5000 })
      await AssessmentPage.serviceStandardComplianceTab.click()
      await browser.waitUntil(
        async () => {
          const cls = await $('#compliance').getAttribute('class')
          return !cls.includes('govuk-tabs__panel--hidden')
        },
        { timeout: 5000, timeoutMsg: 'Compliance tab did not become visible' }
      )

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const tableData = await AssessmentPage.getComplianceTableData()
      console.log(`  Compliance table (${tableData.length} rows):`)

      const failures = []

      for (let stdIdx = 0; stdIdx < SERVICE_STANDARDS.length; stdIdx++) {
        const stdNum = stdIdx + 1
        const row = tableData.find(r => r.standard.startsWith(`${stdNum}.`))

        if (!row) continue

        if (assignedStatuses[stdNum]) {
          const expectedStatus = assignedStatuses[stdNum]
          if (row.status.includes(expectedStatus)) {
            console.log(`     ${stdNum}. → ${row.status}`)
          } else {
            failures.push(
              `Standard ${stdNum}: expected "${expectedStatus}", got "${row.status}"`
            )
          }
        } else if (row.status.includes('Pending')) {
          console.log(`     ${stdNum}. → Pending (unaffected)`)
        } else {
          failures.push(
            `Standard ${stdNum}: expected "Pending", got "${row.status}"`
          )
        }
      }

      if (failures.length > 0) {
        const divider = '\n' + '─'.repeat(60) + '\n'
        throw new Error(
          `${failures.length} compliance status mismatch(es):` +
          divider + failures.join(divider) + '\n' + '─'.repeat(60)
        )
      }
    })
  })
}