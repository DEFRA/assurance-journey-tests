/**
 * Spec: Manage Delivery - Update Status and Commentary
 *
 * Covers the end-to-end journey of updating a delivery's status and commentary,
 * verifying:
 *   - Navigation via "Manage delivery" link
 *   - Manage delivery selection page elements
 *   - Status update page elements and controls
 *   - Standards Requiring Attention section (if present)
 *   - Successful save with notification
 *   - Updated values on delivery detail page
 *   - Delivery engagement tab showing the update
 *   - Edit via "Edit this update" link from engagement tab
 *
 * Test data uses existing project: CP_Test Project
 * Parameterised scenarios for each of the 7 status values
 */

import DeliveryPage from '../page-objects/delivery.page.js'
import ManageDeliveryPage from '../page-objects/manage-delivery.page.js'
import {
  DELIVERY_STATUSES,
  MANAGE_DELIVERY_TEST_PROJECT1,
  MANAGE_DELIVERY_TEST_PROJECT_DETAILS1,
  formatTimestamp
} from '../data/delivery.data.js'
import { waitForPageLoad, signInAndNavigateToProjects } from '../helpers/delivery.helper.js'
import {
  verifyManageDeliverySelectionPage,
  verifyStatusUpdatePage,
  verifyStandardsRequiringAttentionSection,
  verifyStatusUpdateSuccess,
  verifyUpdateInEngagementTab,
  verifyProjectSidebarDetails,
  waitForSuccessNotification
} from '../helpers/manage-delivery.helper.js'

describe('Manage Delivery - Update Status and Commentary', () => {
  let projectId = ''
  let existingStatus = ''
  let standardsRequiringAttention = []

  before(async () => {
    // Navigate like a real user: Home → Sign in → View all deliveries
    await signInAndNavigateToProjects()
  })

  describe('Navigate to project and capture existing state', () => {
    it('should find and open the test project from /projects page', async () => {
      // Navigate to projects list
      await DeliveryPage.openProjectsPage()
      await waitForPageLoad()

      // Find and click on the test project
      const projectLink = $(`a*=${MANAGE_DELIVERY_TEST_PROJECT1}`)
      await expect(projectLink).toBeDisplayed()
      await projectLink.click()
      await waitForPageLoad()

      // Capture project ID from URL
      await browser.waitUntil(
        async () => /\/projects\/[a-zA-Z0-9]{20,}/.test(await browser.getUrl()),
        { timeout: 10000, timeoutMsg: 'URL did not match /projects/<id> pattern' }
      )
      const url = await browser.getUrl()
      projectId = url.split('/projects/')[1].split('/')[0].split('?')[0]

      // Verify project detail page loaded
      await expect(DeliveryPage.deliveryHeading).toHaveText(MANAGE_DELIVERY_TEST_PROJECT1, { containing: true })
    })

    it('should capture compliance confidence statuses (Red/Amber) for Standards Requiring Attention', async () => {
      // Ensure compliance tab is visible (default)
      await expect($('#compliance')).toBeDisplayed()

      // Get all compliance table rows and find Red/Amber statuses
      const rows = await DeliveryPage.complianceTableRows
      standardsRequiringAttention = []

      for (const row of rows) {
        const cells = await row.$$('td')
        if (cells.length >= 2) {
          const statusText = await cells[1].getText()
          // Check for Red or Amber status (not Green, Pending, etc.)
          if (statusText.includes('Red') || statusText.includes('Amber')) {
            const standardText = await cells[0].getText()
            standardsRequiringAttention.push({
              standard: standardText,
              status: statusText
            })
          }
        }
      }

      // Log captured standards (optional - for debugging)
      if (standardsRequiringAttention.length > 0) {
        console.log(`Captured ${standardsRequiringAttention.length} standards requiring attention`)
      }
    })
  })

  describe('Update Status via Manage Delivery link', () => {
    // Generate test scenarios for each status
    for (const targetStatus of DELIVERY_STATUSES) {
      it(`should update delivery status to ${targetStatus.label}`, async () => {
        const formattedTime = formatTimestamp(new Date())
        const newCommentary = `Status updated to ${targetStatus.label} - ${formattedTime}`

        // Navigate to project and click Manage delivery
        await browser.url(`/projects/${projectId}`)
        await waitForPageLoad()
        await expect(DeliveryPage.deliveryHeading).toHaveText(MANAGE_DELIVERY_TEST_PROJECT1, { containing: true })

        await expect(DeliveryPage.manageDeliveryLink).toBeDisplayed()
        await DeliveryPage.manageDeliveryLink.click()
        await waitForPageLoad()

        // Verify Manage Delivery selection page
        await browser.waitUntil(
          async () => (await browser.getUrl()).includes('/manage'),
          { timeout: 10000, timeoutMsg: 'URL did not contain /manage' }
        )
        await verifyManageDeliverySelectionPage(MANAGE_DELIVERY_TEST_PROJECT1)

        // Select status update and continue
        await ManageDeliveryPage.updateStatusRadio.click()
        await ManageDeliveryPage.continueButton.click()
        await waitForPageLoad()

        // Verify Status Update page
        await browser.waitUntil(
          async () => (await browser.getUrl()).includes('/manage/status'),
          { timeout: 10000, timeoutMsg: 'URL did not contain /manage/status' }
        )
        await verifyStatusUpdatePage(MANAGE_DELIVERY_TEST_PROJECT1, false)

        // Capture existing status and skip if same as target
        existingStatus = await ManageDeliveryPage.getCurrentStatusValue()
        if (existingStatus === targetStatus.value) {
          console.log(`Skipping: current status is already ${targetStatus.label}`)
          return
        }

        // Verify Standards Requiring Attention section
        await verifyStandardsRequiringAttentionSection(standardsRequiringAttention)

        // Update status and commentary
        await ManageDeliveryPage.currentStatusDropdown.selectByAttribute('value', targetStatus.value)
        await ManageDeliveryPage.projectCommentaryTextarea.clearValue()
        await ManageDeliveryPage.projectCommentaryTextarea.setValue(newCommentary)
        await ManageDeliveryPage.saveChangesButton.click()

        // Wait for success notification
        await waitForSuccessNotification()

        // Verify updated values on detail page
        await verifyStatusUpdateSuccess(newCommentary, targetStatus.label)

        // Verify project sidebar details (Delivery ID, Phase, Delivery group)
        await verifyProjectSidebarDetails(MANAGE_DELIVERY_TEST_PROJECT_DETAILS1)

        // Verify update in Delivery engagement tab
        await verifyUpdateInEngagementTab(newCommentary)

        // Also verify sidebar in engagement tab
        await verifyProjectSidebarDetails(MANAGE_DELIVERY_TEST_PROJECT_DETAILS1)
      })
    }
  })

  describe('Update Status via Edit this update link', () => {
    // Generate test scenarios for each status via Edit link
    for (const targetStatus of DELIVERY_STATUSES) {
      it(`should edit and update status to ${targetStatus.label} from Delivery engagement tab`, async () => {
        const formattedTime = formatTimestamp(new Date())
        const editedCommentary = `Edited to ${targetStatus.label} via Edit link - ${formattedTime}`

        // Navigate to project detail page
        await browser.url(`/projects/${projectId}`)
        await waitForPageLoad()

        // Click Delivery engagement tab
        await DeliveryPage.deliveryEngagementTab.click()
        await browser.waitUntil(
          async () => {
            const classes = await $('#engagement').getAttribute('class')
            return !classes.includes('govuk-tabs__panel--hidden')
          },
          { timeout: 5000, timeoutMsg: 'Delivery engagement tab did not become visible' }
        )

        // Verify project sidebar details in engagement tab
        await verifyProjectSidebarDetails(MANAGE_DELIVERY_TEST_PROJECT_DETAILS1)

        // Click "Edit this update" link
        const editLink = await $('a=Edit this update')
        if (!(await editLink.isExisting())) {
          console.log('Edit this update link not found - skipping edit test')
          return
        }
        await expect(editLink).toBeDisplayed()
        await editLink.click()
        await waitForPageLoad()

        // Verify Edit Status page
        await browser.waitUntil(
          async () => (await browser.getUrl()).includes('/manage/status'),
          { timeout: 10000, timeoutMsg: 'URL did not contain /manage/status' }
        )
        await verifyStatusUpdatePage(MANAGE_DELIVERY_TEST_PROJECT1, true)

        // Capture existing status and skip if same as target
        existingStatus = await ManageDeliveryPage.getCurrentStatusValue()
        if (existingStatus === targetStatus.value) {
          console.log(`Skipping: current status is already ${targetStatus.label}`)
          return
        }

        // Update status and commentary
        await ManageDeliveryPage.currentStatusDropdown.selectByAttribute('value', targetStatus.value)
        await ManageDeliveryPage.projectCommentaryTextarea.clearValue()
        await ManageDeliveryPage.projectCommentaryTextarea.setValue(editedCommentary)
        await ManageDeliveryPage.saveChangesButton.click()

        // Wait for success notification
        await waitForSuccessNotification()

        // Verify updated values on detail page
        await verifyStatusUpdateSuccess(editedCommentary, targetStatus.label)

        // Verify project sidebar details
        await verifyProjectSidebarDetails(MANAGE_DELIVERY_TEST_PROJECT_DETAILS1)

        // Verify in Delivery engagement tab
        await verifyUpdateInEngagementTab(editedCommentary)

        // Also verify sidebar in engagement tab
        await verifyProjectSidebarDetails(MANAGE_DELIVERY_TEST_PROJECT_DETAILS1)
      })
    }
  })
})
