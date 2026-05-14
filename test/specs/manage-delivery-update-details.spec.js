/**
 * Spec: Manage Delivery - Update Details
 *
 * Covers the end-to-end journey of updating a delivery's details
 * (project name, GDS phase, project ID, delivery group), verifying:
 *   - Navigation via "Manage delivery" → "Update delivery details" radio
 *   - Details update page elements and controls
 *   - Successful save with notification
 *   - Updated values reflected in the sidebar
 *   - Delivery engagement tab showing detail change entries
 *   - Original values restored after all tests
 *
 * Test data uses existing project: CP_Test Project
 * Parameterised scenarios for each of the 5 GDS phases
 */

import DeliveryPage from '../page-objects/delivery.page.js'
import ManageDeliveryPage from '../page-objects/manage-delivery.page.js'
import {
  MANAGE_DELIVERY_TEST_PROJECT2,
  generateDetailsUpdateScenarios
} from '../data/delivery.data.js'
import { waitForPageLoad } from '../helpers/delivery.helper.js'
import {
  verifyDetailsUpdatePage,
  verifyDetailsUpdateInEngagementTab,
  verifyProjectSidebarDetails,
  navigateToDetailsUpdate,
  waitForSuccessNotification
} from '../helpers/manage-delivery.helper.js'

const detailsScenarios = generateDetailsUpdateScenarios()

describe('Manage Delivery - Update Details', () => {
  let projectId = ''
  let originalDetails = null

  before(async () => {
    // Use dev-login bypass for authentication
    await browser.url('/auth/login')
    await waitForPageLoad(15000)
  })

  describe('Navigate to project and capture existing state', () => {
    it('should find and open the test project from /projects page', async () => {
      await DeliveryPage.openProjectsPage()
      await waitForPageLoad()

      const projectLink = $(`a*=${MANAGE_DELIVERY_TEST_PROJECT2}`)
      await expect(projectLink).toBeDisplayed()
      await projectLink.click()
      await waitForPageLoad()

      // Capture project ID from URL
      const url = await browser.getUrl()
      const match = url.match(/\/projects\/([^/?]+)/)
      expect(match).toBeTruthy()
      projectId = match[1]
    })

    it('should navigate to details page and capture original values', async () => {
      await navigateToDetailsUpdate(projectId)

      // Capture original values so we can restore later
      originalDetails = await ManageDeliveryPage.captureCurrentDetails()
    })
  })

  describe('Verify details update page elements', () => {
    it('should display all expected form elements on the details page', async () => {
      // Already on details page from previous step
      await verifyDetailsUpdatePage(MANAGE_DELIVERY_TEST_PROJECT2)
    })
  })

  describe('Parameterised details update scenarios', () => {
    detailsScenarios.forEach((scenario, index) => {
      describe(`Scenario: ${scenario.scenarioName}`, () => {
        it(`should update delivery details to ${scenario.newPhase} phase`, async () => {
          // Navigate to details update page
          await navigateToDetailsUpdate(projectId)

          // Update details
          await ManageDeliveryPage.updateDetails({
            name: scenario.newName,
            phase: scenario.newPhase,
            defCode: scenario.newDefCode
          })

          // Wait for success notification
          await waitForSuccessNotification()

          // Verify URL contains success notification
          const url = await browser.getUrl()
          expect(url).toContain('notification=')
        })

        it(`should show updated details in sidebar after ${scenario.newPhase} update`, async () => {
          // We should be on the detail page after save
          await verifyProjectSidebarDetails({
            deliveryId: scenario.newDefCode,
            phase: scenario.newPhase
          })
        })

        it(`should show detail changes in engagement tab after ${scenario.newPhase} update`, async () => {
          await verifyDetailsUpdateInEngagementTab({
            name: scenario.newName,
            phase: scenario.newPhase
          })
        })
      })
    })
  })

  describe('Restore original details', () => {
    it('should restore the project to its original details', async () => {
      await navigateToDetailsUpdate(projectId)

      // Restore original values
      await ManageDeliveryPage.updateDetails({
        name: originalDetails.name,
        phase: originalDetails.phase,
        defCode: originalDetails.defCode
      })

      await waitForSuccessNotification()

      // Verify sidebar shows original details
      await verifyProjectSidebarDetails({
        deliveryId: originalDetails.defCode,
        phase: originalDetails.phase
      })
    })
  })

  after(async () => {
    await browser.deleteAllCookies()
  })
})
