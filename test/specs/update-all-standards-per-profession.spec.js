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

/**
 * Helper: Take a screenshot with a descriptive name for debugging
 * Also captures URL, title, HTML source, and browser state information
 * Uses Allure step reporting for better visibility in reports
 * @param {string} stepName - Description of the step
 */
async function takeDebugScreenshot (stepName) {
  try {
    // Use Allure step if available to create visual grouping in report
    const captureStep = async () => {
      // Capture browser state information
      const url = await browser.getUrl()
      const title = await browser.getTitle()
      const windowSize = await browser.getWindowSize()
      
      // Get page source to help debug blank screenshots
      let pageSource = ''
      try {
        pageSource = await browser.getPageSource()
      } catch (e) {
        pageSource = `Failed to get page source: ${e.message}`
      }
      
      // Take screenshot
      const screenshot = await browser.takeScreenshot()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
      const name = `${stepName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`
      
      // Create detailed context information
      const contextInfo = {
        step: stepName,
        timestamp: new Date().toISOString(),
        url: url,
        title: title,
        windowSize: `${windowSize.width}x${windowSize.height}`,
        pageSourceLength: pageSource.length,
        pageSourcePreview: pageSource.substring(0, 500) // First 500 chars
      }
      
      // Log to console with full details
      console.log(`  📸 Screenshot: ${stepName}`)
      console.log(`     URL: ${url}`)
      console.log(`     Title: ${title}`)
      console.log(`     Window: ${windowSize.width}x${windowSize.height}`)
      console.log(`     Page Source Length: ${pageSource.length} chars`)
      
      // Attach screenshot to Allure report
      if (global.allure) {
        await global.allure.addAttachment(name, Buffer.from(screenshot, 'base64'), 'image/png')
        
        // Also attach context info as JSON
        await global.allure.addAttachment(
          `${name}_context`,
          JSON.stringify(contextInfo, null, 2),
          'application/json'
        )
        
        // Attach HTML source for debugging blank pages
        await global.allure.addAttachment(
          `${name}_source`,
          pageSource,
          'text/html'
        )
      }
      
      // Add a small pause to ensure page is stable (helps with blank screenshots)
      await browser.pause(500)
      
      return contextInfo
    }
    
    // Execute with Allure step wrapper if available
    if (global.allure && typeof global.allure.startStep === 'function') {
      await global.allure.startStep(`Screenshot: ${stepName}`)
      const result = await captureStep()
      await global.allure.endStep('passed')
      return result
    } else {
      return await captureStep()
    }
    
  } catch (err) {
    console.log(`  ⚠️ Screenshot failed for "${stepName}": ${err.message}`)
    console.log(`     Stack: ${err.stack}`)
    
    if (global.allure && typeof global.allure.endStep === 'function') {
      await global.allure.endStep('failed')
    }
  }
}

// ── Parameterised describe – one per profession ──────────────────────────────
for (const scenario of PROFESSION_UPDATE_SCENARIOS) {
  describe(`Update All Standards – ${scenario.professionLabel} (${scenario.projectName})`, () => {

    /** Map of standard number → assigned status label, populated during updates */
    const assignedStatuses = {}

    beforeEach(async () => {
      console.log('⏳ Starting beforeEach hook...')
      
      // Take screenshot before anything starts
      await takeDebugScreenshot('Before - Initial state')
      
      try {
        // Navigate to home page
        console.log('  → Navigating to home page')
        await browser.url('/')
        await takeDebugScreenshot('Before - After URL launch (home page)')
        
        // Wait for page to load with explicit body check
        console.log('  → Waiting for page body to be present')
        await browser.waitUntil(
          async () => {
            const body = await $('body')
            return await body.isExisting()
          },
          { timeout: 15000, timeoutMsg: 'Page body did not load' }
        )
        await waitForPageLoad(15000)
        await takeDebugScreenshot('Before - After home page loaded')
        
        // Log all visible links on the page for debugging
        console.log('  → Checking available links on page')
        const allLinks = await $$('a')
        const linkTexts = []
        for (const link of allLinks) {
          try {
            const text = await link.getText()
            const href = await link.getAttribute('href')
            if (text || href) {
              linkTexts.push(`"${text}" (${href})`)
            }
          } catch (e) {
            // Skip links that can't be read
          }
        }
        console.log(`  → Found ${linkTexts.length} links: ${linkTexts.slice(0, 5).join(', ')}${linkTexts.length > 5 ? '...' : ''}`)
        
        // Check if already signed in
        console.log('  → Checking if user is already signed in')
        const signOutLink = await $('a=Sign out')
        const alreadySignedIn = await signOutLink.isExisting()
        console.log(`  → Already signed in: ${alreadySignedIn}`)
        
        if (!alreadySignedIn) {
          console.log('  → Need to sign in - looking for Sign in link')
          const signInLink = await $('a=Sign in')
          const signInExists = await signInLink.isExisting()
          console.log(`  → Sign in link exists: ${signInExists}`)
          
          if (!signInExists) {
            await takeDebugScreenshot('Before - ERROR Sign in link not found')
            throw new Error('Sign in link not found on the page. Available links logged above.')
          }
          
          await signInLink.waitForClickable({ timeout: 10000 })
          await takeDebugScreenshot('Before - Before clicking Sign in')
          console.log('  → Clicking Sign in link')
          await signInLink.click()
          await takeDebugScreenshot('Before - After clicking Sign in')
          
          // Wait for navigation to complete
          await browser.pause(2000)
          await waitForPageLoad(15000)
          await takeDebugScreenshot('Before - After sign in page loaded')
        } else {
          console.log('  → User is already authenticated, skipping sign in')
        }
        
        // Click "View all deliveries"
        console.log('  → Looking for View all deliveries link')
        const viewDeliveriesLink = await $('a=View all deliveries')
        const viewDeliveriesExists = await viewDeliveriesLink.isExisting()
        console.log(`  → View all deliveries link exists: ${viewDeliveriesExists}`)
        
        if (!viewDeliveriesExists) {
          // Try alternative selectors
          console.log('  → Trying alternative selectors for deliveries link')
          const altLink = await $('a*=deliveries')
          const altExists = await altLink.isExisting()
          
          if (!altExists) {
            await takeDebugScreenshot('Before - ERROR View all deliveries link not found')
            
            // Log current page info
            const currentUrl = await browser.getUrl()
            const pageTitle = await browser.getTitle()
            console.log(`  → Current URL: ${currentUrl}`)
            console.log(`  → Current Title: ${pageTitle}`)
            
            throw new Error('View all deliveries link not found. See screenshot for current page state.')
          }
        }
        
        await viewDeliveriesLink.waitForClickable({ timeout: 10000 })
        await takeDebugScreenshot('Before - Before clicking View all deliveries')
        console.log('  → Clicking View all deliveries link')
        await viewDeliveriesLink.click()
        await takeDebugScreenshot('Before - After clicking View all deliveries')
        
        // Wait for /projects URL
        console.log('  → Waiting for navigation to /projects')
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl()
            console.log(`     Current URL: ${url}`)
            return url.includes('/projects')
          },
          { timeout: 15000, timeoutMsg: 'URL did not navigate to /projects' }
        )
        await waitForPageLoad()
        await takeDebugScreenshot('Before - After projects page loaded')
        
        console.log('✅ beforeEach hook completed successfully')
      } catch (error) {
        console.log(`❌ beforeEach hook FAILED: ${error.message}`)
        await takeDebugScreenshot('Before - FATAL ERROR in beforeEach')
        throw error
      }
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
          await takeDebugScreenshot(`Std${stdNum} - After opening project`)
        }
        // After save, browser is already on the project detail page

        await AssessmentPage.clickAddServiceStandardUpdate()
        await waitForPageLoad()
        await takeDebugScreenshot(`Std${stdNum} - After clicking Add Service Standard update`)

        // Verify page heading
        await expect(AssessmentPage.pageHeading).toHaveText('Add Service Standard update', { containing: true })

        // Select profession → wait for standards dropdown to populate
        await AssessmentPage.selectProfession(scenario.professionId)
        await takeDebugScreenshot(`Std${stdNum} - After selecting profession`)

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
          await takeDebugScreenshot(`Std${stdNum} - ERROR standard not found in dropdown`)
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
        await takeDebugScreenshot(`Std${stdNum} - After submitting assessment`)

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
      await takeDebugScreenshot('Verify - After opening project')

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
      await takeDebugScreenshot('Verify - After clicking compliance tab')

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
        await takeDebugScreenshot('Verify - FAILED compliance status mismatch')
        const divider = '\n' + '─'.repeat(60) + '\n'
        throw new Error(
          `${failures.length} compliance status mismatch(es):` +
          divider + failures.join(divider) + '\n' + '─'.repeat(60)
        )
      }
      
      await takeDebugScreenshot('Verify - SUCCESS all statuses correct')
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
      console.log('⏳ Starting beforeEach hook (Route 2)...')
      
      // Take screenshot before anything starts
      await takeDebugScreenshot('Before (Route2) - Initial state')
      
      try {
        // Navigate to home page
        console.log('  → Navigating to home page')
        await browser.url('/')
        await takeDebugScreenshot('Before (Route2) - After URL launch (home page)')
        
        // Wait for page to load with explicit body check
        console.log('  → Waiting for page body to be present')
        await browser.waitUntil(
          async () => {
            const body = await $('body')
            return await body.isExisting()
          },
          { timeout: 15000, timeoutMsg: 'Page body did not load' }
        )
        await waitForPageLoad(15000)
        await takeDebugScreenshot('Before (Route2) - After home page loaded')
        
        // Log all visible links on the page for debugging
        console.log('  → Checking available links on page')
        const allLinks = await $$('a')
        const linkTexts = []
        for (const link of allLinks) {
          try {
            const text = await link.getText()
            const href = await link.getAttribute('href')
            if (text || href) {
              linkTexts.push(`"${text}" (${href})`)
            }
          } catch (e) {
            // Skip links that can't be read
          }
        }
        console.log(`  → Found ${linkTexts.length} links: ${linkTexts.slice(0, 5).join(', ')}${linkTexts.length > 5 ? '...' : ''}`)
        
        // Check if already signed in
        console.log('  → Checking if user is already signed in')
        const signOutLink = await $('a=Sign out')
        const alreadySignedIn = await signOutLink.isExisting()
        console.log(`  → Already signed in: ${alreadySignedIn}`)
        
        if (!alreadySignedIn) {
          console.log('  → Need to sign in - looking for Sign in link')
          const signInLink = await $('a=Sign in')
          const signInExists = await signInLink.isExisting()
          console.log(`  → Sign in link exists: ${signInExists}`)
          
          if (!signInExists) {
            await takeDebugScreenshot('Before (Route2) - ERROR Sign in link not found')
            throw new Error('Sign in link not found on the page. Available links logged above.')
          }
          
          await signInLink.waitForClickable({ timeout: 10000 })
          await takeDebugScreenshot('Before (Route2) - Before clicking Sign in')
          console.log('  → Clicking Sign in link')
          await signInLink.click()
          await takeDebugScreenshot('Before (Route2) - After clicking Sign in')
          
          // Wait for navigation to complete
          await browser.pause(2000)
          await waitForPageLoad(15000)
          await takeDebugScreenshot('Before (Route2) - After sign in page loaded')
        } else {
          console.log('  → User is already authenticated, skipping sign in')
        }
        
        // Click "View all deliveries"
        console.log('  → Looking for View all deliveries link')
        const viewDeliveriesLink = await $('a=View all deliveries')
        const viewDeliveriesExists = await viewDeliveriesLink.isExisting()
        console.log(`  → View all deliveries link exists: ${viewDeliveriesExists}`)
        
        if (!viewDeliveriesExists) {
          // Try alternative selectors
          console.log('  → Trying alternative selectors for deliveries link')
          const altLink = await $('a*=deliveries')
          const altExists = await altLink.isExisting()
          
          if (!altExists) {
            await takeDebugScreenshot('Before (Route2) - ERROR View all deliveries link not found')
            
            // Log current page info
            const currentUrl = await browser.getUrl()
            const pageTitle = await browser.getTitle()
            console.log(`  → Current URL: ${currentUrl}`)
            console.log(`  → Current Title: ${pageTitle}`)
            
            throw new Error('View all deliveries link not found. See screenshot for current page state.')
          }
        }
        
        await viewDeliveriesLink.waitForClickable({ timeout: 10000 })
        await takeDebugScreenshot('Before (Route2) - Before clicking View all deliveries')
        console.log('  → Clicking View all deliveries link')
        await viewDeliveriesLink.click()
        await takeDebugScreenshot('Before (Route2) - After clicking View all deliveries')
        
        // Wait for /projects URL
        console.log('  → Waiting for navigation to /projects')
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl()
            console.log(`     Current URL: ${url}`)
            return url.includes('/projects')
          },
          { timeout: 15000, timeoutMsg: 'URL did not navigate to /projects' }
        )
        await waitForPageLoad()
        await takeDebugScreenshot('Before (Route2) - After projects page loaded')
        
        console.log('✅ beforeEach hook (Route 2) completed successfully')
      } catch (error) {
        console.log(`❌ beforeEach hook (Route 2) FAILED: ${error.message}`)
        await takeDebugScreenshot('Before (Route2) - FATAL ERROR in beforeEach')
        throw error
      }
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
          await takeDebugScreenshot(`Route2-Std${stdNum} - After opening project`)

          await AssessmentPage.clickStandardFromComplianceTab(1)
          await waitForPageLoad()
          await takeDebugScreenshot(`Route2-Std${stdNum} - After clicking standard from compliance tab`)

          // On the standard detail page click "Add service standard update"
          await AssessmentPage.clickAddUpdateFromStandardDetail()
          await waitForPageLoad()
          await takeDebugScreenshot(`Route2-Std${stdNum} - After clicking Add update from standard detail`)
        } else {
          // Subsequent standards: save redirected us back to the project page.
          // Click "Add Service Standard update" directly — no need to search again.
          await AssessmentPage.clickAddServiceStandardUpdate()
          await waitForPageLoad()
          await takeDebugScreenshot(`Route2-Std${stdNum} - After clicking Add Service Standard update`)
        }

        // Verify page heading
        await expect(AssessmentPage.pageHeading).toHaveText('Add Service Standard update', { containing: true })

        // Select profession → wait for standards dropdown to populate
        await AssessmentPage.selectProfession(scenario.professionId)
        await takeDebugScreenshot(`Route2-Std${stdNum} - After selecting profession`)

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
          await takeDebugScreenshot(`Route2-Std${stdNum} - ERROR standard not found in dropdown`)
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
        await takeDebugScreenshot(`Route2-Std${stdNum} - After submitting assessment`)

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
      await takeDebugScreenshot('Route2-Verify - After opening project')

      await AssessmentPage.serviceStandardComplianceTab.waitForDisplayed({ timeout: 5000 })
      await AssessmentPage.serviceStandardComplianceTab.click()
      await browser.waitUntil(
        async () => {
          const cls = await $('#compliance').getAttribute('class')
          return !cls.includes('govuk-tabs__panel--hidden')
        },
        { timeout: 5000, timeoutMsg: 'Compliance tab did not become visible' }
      )
      await takeDebugScreenshot('Route2-Verify - After clicking compliance tab')

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
        await takeDebugScreenshot('Route2-Verify - FAILED compliance status mismatch')
        const divider = '\n' + '─'.repeat(60) + '\n'
        throw new Error(
          `${failures.length} compliance status mismatch(es):` +
          divider + failures.join(divider) + '\n' + '─'.repeat(60)
        )
      }
      
      await takeDebugScreenshot('Route2-Verify - SUCCESS all statuses correct')
    })
  })
}