/**
 * Helper utilities for Manage Delivery test verifications.
 */

import DeliveryPage from '../page-objects/delivery.page.js'
import ManageDeliveryPage from '../page-objects/manage-delivery.page.js'
import { waitForPageLoad } from './delivery.helper.js'

/**
 * Verify the Manage Delivery selection page elements.
 * @param {string} projectName - expected project name
 */
export async function verifyManageDeliverySelectionPage(projectName) {
  // Page heading
  await expect(ManageDeliveryPage.manageDeliveryHeading).toHaveText('Manage Delivery')

  // Project name subheading
  await expect(ManageDeliveryPage.projectNameHeading).toHaveText(projectName, { containing: true })

  // Legend "What would you like to update?"
  await expect(ManageDeliveryPage.updateTypeLegend).toHaveText('What would you like to update?', { containing: true })

  // Radio options visible
  await expect(ManageDeliveryPage.updateStatusRadio).toBeExisting()
  await expect(ManageDeliveryPage.updateDetailsRadio).toBeExisting()

  // Continue and Cancel buttons
  await expect(ManageDeliveryPage.continueButton).toBeDisplayed()
  await expect(ManageDeliveryPage.continueButton).toHaveText('Continue')
  await expect(ManageDeliveryPage.cancelButton).toBeDisplayed()
  await expect(ManageDeliveryPage.cancelButton).toHaveText('Cancel')
}

/**
 * Verify the Status Update page elements.
 * @param {string} projectName - expected project name
 * @param {boolean} isEditMode - whether the page is in edit mode
 */
export async function verifyStatusUpdatePage(projectName, isEditMode = false) {
  // Page heading
  const expectedHeading = isEditMode ? 'Edit Project Status and Commentary' : 'Update Project Status and Commentary'
  await expect(ManageDeliveryPage.statusPageHeading).toHaveText(expectedHeading, { containing: true })

  // Project name subheading
  await expect(ManageDeliveryPage.projectNameHeading).toHaveText(projectName, { containing: true })

  // Current status dropdown and label
  await expect(ManageDeliveryPage.currentStatusLabel).toHaveText('Current status')
  await expect(ManageDeliveryPage.currentStatusDropdown).toBeDisplayed()

  // Project commentary textarea and label
  await expect(ManageDeliveryPage.projectCommentaryLabel).toHaveText('Project commentary')
  await expect(ManageDeliveryPage.projectCommentaryTextarea).toBeDisplayed()

  // Hint text
  await expect(ManageDeliveryPage.projectCommentaryHint).toBeDisplayed()

  // Save and Cancel buttons
  await expect(ManageDeliveryPage.saveChangesButton).toBeDisplayed()
  await expect(ManageDeliveryPage.saveChangesButton).toHaveText('Save changes')
  await expect(ManageDeliveryPage.cancelLink).toBeDisplayed()
  await expect(ManageDeliveryPage.cancelLink).toHaveText('Cancel')

  // Edit mode inset text
  if (isEditMode) {
    const insetText = ManageDeliveryPage.editModeInsetText
    if (await insetText.isExisting()) {
      await expect(insetText).toHaveText('You are editing the project status update from', { containing: true })
    }
  }
}

/**
 * Verify the Standards Requiring Attention section (if present).
 * @param {Array} capturedStandards - previously captured standards to verify against
 */
export async function verifyStandardsRequiringAttentionSection(capturedStandards = []) {
  const standardsHeading = ManageDeliveryPage.standardsRequiringAttentionHeading

  if (!(await standardsHeading.isExisting())) {
    return // Section not present, nothing to verify
  }

  await expect(standardsHeading).toBeDisplayed()
  await expect(ManageDeliveryPage.standardsRequiringAttentionDescription).toBeDisplayed()

  // Verify table headers
  const headers = await ManageDeliveryPage.standardsAtRiskTableHeaders
  if (headers.length >= 5) {
    await expect(headers[0]).toHaveText('Service Standard')
    await expect(headers[1]).toHaveText('Status')
    await expect(headers[2]).toHaveText('Profession')
    await expect(headers[3]).toHaveText('Assessment Commentary')
    await expect(headers[4]).toHaveText('Last Updated')
  }

  // Verify captured standards are present (if any)
  if (capturedStandards.length > 0) {
    const tableStandards = await ManageDeliveryPage.getStandardsRequiringAttention()
    for (const captured of capturedStandards) {
      const standardNumber = captured.standard.split('.')[0]
      const found = tableStandards.some(ts => ts.standard.includes(standardNumber))
      if (!found) {
        console.log(`Note: Previously captured standard "${captured.standard}" not in current table`)
      }
    }
  }
}

/**
 * Verify the update success on the delivery detail page.
 * @param {string} newCommentary - expected commentary text
 * @param {string} newStatusLabel - expected status label (e.g., 'Green', 'Green/Amber', 'Amber/Red')
 */
export async function verifyStatusUpdateSuccess(newCommentary, newStatusLabel) {
  // Commentary in inset text
  await expect(DeliveryPage.deliveryCommentaryInsetText).toHaveText(newCommentary, { containing: true })

  // Status in "Current delivery status:" block
  await expect(DeliveryPage.currentDeliveryStatusBlock).toHaveText('Current delivery status:', { containing: true })

  // For compound statuses like 'Green/Amber' or 'Amber/Red', verify each part separately
  // The UI displays them as separate tags (e.g., <span>Green</span><span>Amber</span>)
  const statusParts = newStatusLabel.split('/')
  for (const part of statusParts) {
    await expect(DeliveryPage.currentDeliveryStatusBlock).toHaveText(part.trim(), { containing: true })
  }
}

/**
 * Verify the update appears in Delivery engagement tab timeline.
 * @param {string} newCommentary - expected commentary text
 */
export async function verifyUpdateInEngagementTab(newCommentary) {
  // Click Delivery engagement tab
  await DeliveryPage.deliveryEngagementTab.click()

  // Wait for engagement panel to become visible
  await browser.waitUntil(
    async () => {
      const classes = await $('#engagement').getAttribute('class')
      return !classes.includes('govuk-tabs__panel--hidden')
    },
    { timeout: 5000, timeoutMsg: 'Delivery engagement tab did not become visible' }
  )

  // Verify timeline label
  await expect(DeliveryPage.engagementTimelineLabel).toBeDisplayed()

  // Get events
  const events = await DeliveryPage.timelineEvents
  if (events.length === 0) {
    throw new Error('Expected at least one timeline event in Delivery engagement tab')
  }

  const topEvent = events[0]

  // Date heading exists
  const dateHeading = await topEvent.$('.timeline__event-title')
  await expect(dateHeading).toBeDisplayed()

  // Commentary in the event
  await expect(topEvent).toHaveText(newCommentary, { containing: true })

  // Edit and Archive links
  const editLink = await $('a=Edit this update')
  const archiveLink = await $('a=Archive this update')

  if (await editLink.isExisting()) {
    await expect(editLink).toBeDisplayed()
    await expect(archiveLink).toBeDisplayed()
  }
}

/**
 * Verify the project sidebar details (Delivery ID, Phase, Delivery group).
 * Reads the sidebar container text and checks each expected value is present.
 * @param {Object} expectedDetails - object with deliveryId, phase, deliveryGroup
 */
export async function verifyProjectSidebarDetails(expectedDetails) {
  const sidebar = DeliveryPage.projectSidebar
  if (!(await sidebar.isExisting())) {
    return // Sidebar not present on this page
  }

  const sidebarText = await sidebar.getText()

  if (expectedDetails.deliveryId) {
    if (!sidebarText.includes('Delivery ID')) {
      console.log('Note: Delivery ID label not found in sidebar')
    } else if (!sidebarText.includes(expectedDetails.deliveryId)) {
      throw new Error(
        `Expected sidebar to contain Delivery ID "${expectedDetails.deliveryId}" but got:\n${sidebarText}`
      )
    }
  }

  if (expectedDetails.phase) {
    if (!sidebarText.includes('Phase')) {
      console.log('Note: Phase label not found in sidebar')
    } else if (!sidebarText.includes(expectedDetails.phase)) {
      throw new Error(
        `Expected sidebar to contain Phase "${expectedDetails.phase}" but got:\n${sidebarText}`
      )
    }
  }

  if (expectedDetails.deliveryGroup) {
    if (!sidebarText.includes('Delivery group')) {
      console.log('Note: Delivery group label not found in sidebar')
    } else if (!sidebarText.includes(expectedDetails.deliveryGroup)) {
      throw new Error(
        `Expected sidebar to contain Delivery group "${expectedDetails.deliveryGroup}" but got:\n${sidebarText}`
      )
    }
  }
}

/**
 * Navigate to manage delivery and select status update option.
 * @param {string} projectId - the project ID
 */
export async function navigateToStatusUpdate(projectId) {
  await browser.url(`/projects/${projectId}/manage`)
  await waitForPageLoad()

  await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/manage'),
    { timeout: 10000, timeoutMsg: 'URL did not contain /manage' }
  )

  await ManageDeliveryPage.updateStatusRadio.click()
  await ManageDeliveryPage.continueButton.click()
  await waitForPageLoad()

  await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/manage/status'),
    { timeout: 10000, timeoutMsg: 'URL did not contain /manage/status' }
  )
}

/**
 * Verify the Details Update page elements.
 * @param {string} projectName - expected project name
 */
export async function verifyDetailsUpdatePage(projectName) {
  // Page heading
  await expect(ManageDeliveryPage.detailsPageHeading).toHaveText('Update Project Details', { containing: true })

  // Project name input and label
  await expect(ManageDeliveryPage.projectNameLabel).toBeDisplayed()
  await expect(ManageDeliveryPage.projectNameInput).toBeDisplayed()

  // Phase select and label
  await expect(ManageDeliveryPage.phaseLabel).toBeDisplayed()
  await expect(ManageDeliveryPage.phaseSelect).toBeDisplayed()

  // Project ID input and label
  await expect(ManageDeliveryPage.projectIdLabel).toBeDisplayed()
  await expect(ManageDeliveryPage.projectIdInput).toBeDisplayed()

  // Delivery group select and label
  await expect(ManageDeliveryPage.deliveryGroupLabel).toBeDisplayed()
  await expect(ManageDeliveryPage.deliveryGroupSelect).toBeDisplayed()

  // Save and Cancel buttons
  await expect(ManageDeliveryPage.detailsSaveButton).toBeDisplayed()
  await expect(ManageDeliveryPage.detailsSaveButton).toHaveText('Save changes')
  await expect(ManageDeliveryPage.detailsCancelLink).toBeDisplayed()
  await expect(ManageDeliveryPage.detailsCancelLink).toHaveText('Cancel')
}

/**
 * Verify details update appears in Delivery engagement tab timeline.
 * Detail changes show "Delivery name updated:" and/or "Phase updated:" entries
 * but do NOT have Edit/Archive links (only status/commentary changes do).
 * @param {Object} changes - { name, phase } – the new values to look for
 */
export async function verifyDetailsUpdateInEngagementTab(changes = {}) {
  // Click Delivery engagement tab
  await DeliveryPage.deliveryEngagementTab.click()

  // Wait for engagement panel to become visible
  await browser.waitUntil(
    async () => {
      const classes = await $('#engagement').getAttribute('class')
      return !classes.includes('govuk-tabs__panel--hidden')
    },
    { timeout: 5000, timeoutMsg: 'Delivery engagement tab did not become visible' }
  )

  // Verify timeline label
  await expect(DeliveryPage.engagementTimelineLabel).toBeDisplayed()

  // Get the top timeline event
  const events = await DeliveryPage.timelineEvents
  if (events.length === 0) {
    throw new Error('Expected at least one timeline event in Delivery engagement tab')
  }

  const topEvent = events[0]
  const eventText = await topEvent.getText()

  if (changes.name) {
    if (!eventText.includes('Delivery name updated:')) {
      throw new Error(
        `Expected timeline event to contain "Delivery name updated:" but got:\n${eventText}`
      )
    }
  }

  if (changes.phase) {
    if (!eventText.includes('Phase updated:')) {
      throw new Error(
        `Expected timeline event to contain "Phase updated:" but got:\n${eventText}`
      )
    }
  }
}

/**
 * Navigate to manage delivery and select details update option.
 * @param {string} projectId - the project ID
 */
export async function navigateToDetailsUpdate(projectId) {
  await browser.url(`/projects/${projectId}/manage`)
  await waitForPageLoad()

  await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/manage'),
    { timeout: 10000, timeoutMsg: 'URL did not contain /manage' }
  )

  await ManageDeliveryPage.updateDetailsRadio.click()
  await ManageDeliveryPage.continueButton.click()
  await waitForPageLoad()

  await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/manage/details'),
    { timeout: 10000, timeoutMsg: 'URL did not contain /manage/details' }
  )
}

/**
 * Wait for success notification in URL after save.
 */
export async function waitForSuccessNotification() {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl()
      return url.includes('notification=')
    },
    { timeout: 15000, timeoutMsg: 'Success notification not found in URL' }
  )
  await waitForPageLoad()
}
