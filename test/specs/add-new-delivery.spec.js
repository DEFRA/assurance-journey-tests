/**
 * Spec: Add New Delivery
 *
 * Covers the end-to-end journey of adding a new delivery, verifying it appears
 * on the projects list, navigating to the detail page, and validating:
 *   - Delivery heading & status
 *   - Commentary inset text
 *   - Action links (Manage delivery / Add Service Standard update)
 *   - Tabs (Service Standard compliance, Delivery engagement)
 *   - All 15 Service Standards with initial 'Pending' compliance confidence
 *   - Delivery engagement timeline content
 *
 * Test data is parameterised via test/data/delivery.data.js
 */

import DeliveryPage from '../page-objects/delivery.page.js'
import AdminPage from '../page-objects/admin.page.js'
import { deliveryScenarios, DELIVERY_RUN_ID } from '../data/delivery.data.js'
import {
  verifyServiceStandardComplianceTable,
  verifyDeliveryEngagementTab,
  waitForPageLoad,
  signInAndNavigateToProjects
} from '../helpers/delivery.helper.js'

/** Track every delivery name created during this run so we can clean up */
const createdDeliveryNames = []

describe('Add New Delivery', () => {
  before(async () => {
    // Navigate like a real user: Home → Sign in → View all deliveries
    await signInAndNavigateToProjects()
  })

  // ── Parameterised scenarios ───────────────────────────────────────────────
  for (const scenario of deliveryScenarios) {
    it(`Scenario: ${scenario.scenarioName}`, async () => {
      const data = {
        ...scenario
      }

      // Track the delivery name for cleanup
      createdDeliveryNames.push(data.deliveryName)

      // ── Arrange ────────────────────────────────────────────────────────────

      // Navigate to /projects and click "Add new delivery"
      await DeliveryPage.openProjectsPage()
      await waitForPageLoad()

      // Pass getter directly to expect – do NOT await page object getters
      await expect(DeliveryPage.addNewDeliveryLink).toBeDisplayed()
      await DeliveryPage.addNewDeliveryLink.click()

      // ── Assert: URL contains /projects/add ────────────────────────────────
      await browser.waitUntil(
        async () => (await browser.getUrl()).includes('/projects/add'),
        { timeout: 10000, timeoutMsg: 'URL did not contain /projects/add' }
      )
      await waitForPageLoad()

      // ── Act: Verify form fields visible then fill the form ────────────────
      await expect(DeliveryPage.deliveryName).toBeDisplayed()
      await expect(DeliveryPage.projectPhase).toBeDisplayed()
      await expect(DeliveryPage.defraCode).toBeDisplayed()
      await expect(DeliveryPage.currentStatus).toBeDisplayed()
      await expect(DeliveryPage.deliveryCommentary).toBeDisplayed()

      await DeliveryPage.fillAndSubmitDeliveryForm(data)

      // Wait 2 seconds as required
      await browser.pause(2000)

      // ── Assert: Redirected to /projects list ──────────────────────────────
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('/projects') && !url.includes('/projects/add')
        },
        { timeout: 10000, timeoutMsg: 'URL did not redirect to /projects' }
      )
      await waitForPageLoad()

      // ── Assert: Delivery name appears in the table ────────────────────────
      // Use $() directly – it returns a ChainablePromiseElement, not a plain Promise
      const deliveryNameCell = $(`td*=${data.deliveryName}`)
      await expect(deliveryNameCell).toBeDisplayed()

      // ── Assert: Delivery link is present in the table ─────────────────────
      const deliveryLink = $(`a*=${data.deliveryName}`)
      await expect(deliveryLink).toBeDisplayed()

      // ── Act: Click delivery name to open detail page ──────────────────────
      await deliveryLink.click()
      await waitForPageLoad()

      // ── Assert: URL matches /projects/<id> pattern ────────────────────────
      await browser.waitUntil(
        async () => /\/projects\/[a-zA-Z0-9]{20,}/.test(await browser.getUrl()),
        { timeout: 10000, timeoutMsg: 'URL did not match /projects/<id> pattern' }
      )

      // ── Assert: h1 contains delivery name ────────────────────────────────
      await expect(DeliveryPage.deliveryHeading).toHaveText(data.deliveryName, { containing: true })

      // ── Assert: Current delivery status block is shown ────────────────────
      await expect(DeliveryPage.currentDeliveryStatusBlock).toHaveText('Current delivery status:', { containing: true })

      // ── Assert: Commentary inset text ─────────────────────────────────────
      await expect(DeliveryPage.deliveryCommentaryInsetText).toHaveText(data.deliveryCommentary, { containing: true })

      // ── Assert: Action links present ─────────────────────────────────────
      await expect(DeliveryPage.manageDeliveryLink).toBeDisplayed()
      await expect(DeliveryPage.manageDeliveryLink).toHaveText('Manage delivery', { containing: true })

      await expect(DeliveryPage.addServiceStandardUpdateLink).toBeDisplayed()
      await expect(DeliveryPage.addServiceStandardUpdateLink).toHaveText('Add Service Standard update', { containing: true })

      // ── Assert: Two tabs exist ────────────────────────────────────────────
      await expect(DeliveryPage.serviceStandardComplianceTab).toBeDisplayed()
      await expect(DeliveryPage.serviceStandardComplianceTab).toHaveText('Service Standard compliance', { containing: true })

      await expect(DeliveryPage.deliveryEngagementTab).toBeDisplayed()
      await expect(DeliveryPage.deliveryEngagementTab).toHaveText('Delivery engagement', { containing: true })

      // ── Assert: Compliance panel is visible by default ────────────────────
      await expect($('#compliance')).toBeDisplayed()

      // ── Assert: Service Standard compliance table ─────────────────────────
      await verifyServiceStandardComplianceTable()

      // ── Act: Click Delivery engagement tab ───────────────────────────────
      await DeliveryPage.deliveryEngagementTab.click()

      // Wait for engagement panel to become visible (hidden class removed)
      await browser.waitUntil(
        async () => {
          const classes = await $('#engagement').getAttribute('class')
          return !classes.includes('govuk-tabs__panel--hidden')
        },
        { timeout: 5000, timeoutMsg: 'Delivery engagement tab did not become visible' }
      )

      // ── Assert: Delivery engagement tab content ───────────────────────────
      await expect(DeliveryPage.engagementTimelineLabel).toBeDisplayed()
      await verifyDeliveryEngagementTab(data.deliveryCommentary, data.currentStatusLabel)
    })
  }

  // ── Cleanup: Delete all deliveries created during this run ──────────────
//   after(async () => {
//     if (createdDeliveryNames.length === 0) return

//     for (const name of createdDeliveryNames) {
//       // Safety check – only delete deliveries whose name matches our run ID
//       if (!name.includes(`AutoTest_${DELIVERY_RUN_ID}`)) {
//         console.log(`⚠️  Skipping deletion of "${name}" – does not match run ID`)
//         continue
//       }

//       try {
//         // Navigate to Admin → Bulk Operations → View Deliveries
//         await AdminPage.openBulkDeliveries()
//         await waitForPageLoad()

//         // Find the delivery row and click Delete
//         const found = await AdminPage.deleteDeliveryByName(name)
//         if (!found) {
//           console.log(`⚠️  Delivery "${name}" not found in admin table – skipping`)
//           continue
//         }

//         // Confirm deletion on the confirm-delete page
//         await waitForPageLoad()
//         await AdminPage.confirmDelete()
//         await waitForPageLoad()

//         // Verify success notification
//         await expect(AdminPage.notificationBanner).toBeDisplayed()
//         await expect(AdminPage.notificationBanner).toHaveText('Delivery deleted successfully', { containing: true })
//         console.log(`  Deleted delivery: "${name}"`)
//       } catch (err) {
//         console.error(`❌  Failed to delete delivery "${name}":`, err.message)
//       }
//     }
//   })
})
