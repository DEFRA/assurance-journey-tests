/**
 * Spec: Verify Service Standard Assessment Page
 *
 * Covers two scenarios for each test project (one per GDS phase):
 *
 *   Scenario 1 – Via "Add Service Standard update" link on the project detail page:
 *     • Navigate to the project detail page
 *     • Click "Add Service Standard update"
 *     • Verify the page heading
 *     • Verify the inset text (includes the project phase)
 *     • For every profession in the dropdown:
 *         – Verify the profession appears in the dropdown
 *         – Select the profession
 *         – Verify the service-standard options match the phase/profession mapping
 *
 *   Scenario 2 – Via Service Standard compliance tab → standard detail page:
 *     • Navigate to the project detail page
 *     • Click the "Service Standard compliance" tab
 *     • Click the first standard link in the compliance table
 *     • Click "Add service standard update" on the standard detail page
 *     • Perform the same page / inset-text / profession / standards verification
 *
 * Test data: test/data/service-standard-assessment.data.js
 * Projects must already exist in the test database.
 */

import AssessmentPage from '../page-objects/assessment.page.js'
import {
  ASSESSMENT_PROFESSIONS,
  PHASE_PROFESSION_MAP,
  PHASE_PROFESSION_STANDARD_MAP,
  ASSESSMENT_PROJECTS,
  SERVICE_STANDARD_TEXT,
  buildInsetText
} from '../data/service-standard-assessment.data.js'
import { waitForPageLoad } from '../helpers/delivery.helper.js'

// ── Pure helpers (extracted to keep verifyProfessionsAndStandards ≤15 CC) ──

function collectMissingProfessions (renderedProfessions, expectedProfessionLabels) {
  return expectedProfessionLabels
    .filter(label => !renderedProfessions.some(opt => opt.includes(label)))
    .map(label =>
      `"${label}" is expected in the profession dropdown but was not found.\n` +
      `  Available professions: [${renderedProfessions.join(', ')}]`
    )
}

function collectStandardFailures (phase, profession, renderedStandards, expectedStandardNumbers) {
  const missing = expectedStandardNumbers
    .filter(stdNum => {
      const expectedText = SERVICE_STANDARD_TEXT[stdNum]
      return !renderedStandards.some(opt => opt.includes(expectedText) || opt.startsWith(`${stdNum}.`))
    })
    .map(stdNum => `${stdNum}. ${SERVICE_STANDARD_TEXT[stdNum]}`)

  const extra = renderedStandards.filter(opt => {
    const match = /^(\d+)\./.exec(opt)
    const num = match ? Number.parseInt(match[1], 10) : null
    return num && !expectedStandardNumbers.includes(num)
  })

  const failures = []
  if (missing.length > 0) {
    failures.push(
      `For profession "${profession.label}" in phase "${phase}":\n` +
      `  The following standards should appear in the dropdown but were not found:\n` +
      `    [${missing.join(' | ')}]\n` +
      `  Standards currently shown in dropdown:\n` +
      `    [${renderedStandards.join(' | ')}]`
    )
  }
  if (extra.length > 0) {
    failures.push(
      `For profession "${profession.label}" in phase "${phase}":\n` +
      `  The following standards appear in the dropdown but are not expected:\n` +
      `    [${extra.join(' | ')}]\n` +
      `  Expected standard numbers: [${expectedStandardNumbers.join(', ')}]`
    )
  }
  return failures
}

// ── Helper: verify profession dropdown and service standards per profession ──
/**
 * Soft-assert implementation: collects ALL failures across every profession
 * and every standard before throwing, so you see the full picture in one run.
 * @param {string} phase  e.g. 'Discovery'
 */
async function verifyProfessionsAndStandards (phase) {
  const failures = []

  // ── Verify inset text contains the phase ──────────────────────────────────
  const expectedInset = buildInsetText(phase)
  await expect(AssessmentPage.insetText).toHaveText(expectedInset, { containing: true })

  // ── Fetch all profession options currently rendered in the dropdown ────────
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const renderedProfessions = await AssessmentPage.getProfessionOptions()
  console.log(`  Rendered professions: ${renderedProfessions.join(', ')}`)

  const expectedProfessionIds    = PHASE_PROFESSION_MAP[phase]
  const expectedProfessionLabels = ASSESSMENT_PROFESSIONS
    .filter(p => expectedProfessionIds.includes(p.id))
    .map(p => p.label)

  // Soft-check: every expected profession should appear in the dropdown
  failures.push(...collectMissingProfessions(renderedProfessions, expectedProfessionLabels))

  // ── For each profession: select it and verify service-standard options ─────
  for (const profession of ASSESSMENT_PROFESSIONS) {
    if (!expectedProfessionIds.includes(profession.id)) continue

    if (!renderedProfessions.some(opt => opt.includes(profession.label))) {
      console.log(`  ⚠️  Profession "${profession.label}" not rendered – skipping standards check`)
      continue
    }

    await AssessmentPage.selectProfession(profession.id)

    // eslint-disable-next-line @typescript-eslint/await-thenable
    const renderedStandards = await AssessmentPage.getStandardOptions()
    console.log(`  [${profession.label}] standards (${renderedStandards.length}): ${renderedStandards.join(' | ')}`)

    const expectedStandardNumbers = PHASE_PROFESSION_STANDARD_MAP[phase][profession.id] || []
    failures.push(...collectStandardFailures(phase, profession, renderedStandards, expectedStandardNumbers))
  }

  // ── Report all collected failures at once ─────────────────────────────────
  if (failures.length > 0) {
    const divider = '\n' + '─'.repeat(80) + '\n'
    throw new Error(
      `${failures.length} issue(s) found for phase "${phase}":` +
      divider +
      failures.join(divider) +
      '\n' + '─'.repeat(80)
    )
  }
}

// ── Parameterised describe blocks – one per test project ─────────────────────
for (const project of ASSESSMENT_PROJECTS) {
  describe(`[${project.phase}] Service Standard Assessment – ${project.name}`, () => {

    // Re-authenticate before every it() so a crashed session in one test
    // does not cascade to the next.
    beforeEach(async () => {
      await browser.url('/auth/login')
      await waitForPageLoad(15000)
    })

    // ════════════════════════════════════════════════════════════════════════
    // Scenario 1: Add Service Standard update via project detail page link
    // ════════════════════════════════════════════════════════════════════════
    it(`Scenario 1: should verify assessment page and profession/standard dropdown via project detail link [${project.phase}]`, async () => {
      // ── Arrange: open the project ──────────────────────────────────────────
      await AssessmentPage.openProject(project.name)
      await waitForPageLoad()

      // ── Act: click "Add Service Standard update" link ──────────────────────
      await AssessmentPage.clickAddServiceStandardUpdate()
      await waitForPageLoad()

      // ── Assert: page heading ───────────────────────────────────────────────
      await expect(AssessmentPage.pageHeading).toBeDisplayed()
      await expect(AssessmentPage.pageHeading).toHaveText('Add Service Standard update', { containing: true })

      // ── Assert: profession dropdown is rendered ────────────────────────────
      await expect(AssessmentPage.professionSelect).toBeDisplayed()

      // ── Assert: standard dropdown is rendered ──────────────────────────────
      await expect(AssessmentPage.standardSelect).toBeDisplayed()

      // ── Assert: inset text + profession / standard verification ────────────
      await verifyProfessionsAndStandards(project.phase)
    })

    // ════════════════════════════════════════════════════════════════════════
    // Scenario 2: Add Service Standard update via compliance tab → standard detail
    // ════════════════════════════════════════════════════════════════════════
    it(`Scenario 2: should verify assessment page and profession/standard dropdown via compliance tab [${project.phase}]`, async () => {
      // ── Arrange: open the project ──────────────────────────────────────────
      await AssessmentPage.openProject(project.name)
      await waitForPageLoad()

      // ── Act: open compliance tab and click the first standard row ──────────
      await AssessmentPage.clickStandardFromComplianceTab(1)
      await waitForPageLoad()

      // ── Act: click "Add service standard update" on the standard detail page
      await AssessmentPage.clickAddUpdateFromStandardDetail()
      await waitForPageLoad()

      // ── Assert: page heading ───────────────────────────────────────────────
      await expect(AssessmentPage.pageHeading).toBeDisplayed()
      await expect(AssessmentPage.pageHeading).toHaveText('Add Service Standard update', { containing: true })

      // ── Assert: profession dropdown is rendered ────────────────────────────
      await expect(AssessmentPage.professionSelect).toBeDisplayed()

      // ── Assert: standard dropdown is rendered ──────────────────────────────
      await expect(AssessmentPage.standardSelect).toBeDisplayed()

      // ── Assert: inset text + profession / standard verification ────────────
      await verifyProfessionsAndStandards(project.phase)
    })
  })
}
