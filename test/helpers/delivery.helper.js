/**
 * Helper utilities for delivery-related test verifications.
 * These functions are reusable across multiple spec files.
 */

import { SERVICE_STANDARDS } from '../data/delivery.data.js'
import DeliveryPage from '../page-objects/delivery.page.js'

/**
 * Verify the Service Standard compliance table headers and all 15 standard rows.
 * @param {string} [expectedConfidence='Pending'] - expected compliance confidence text for every row
 */
export async function verifyServiceStandardComplianceTable(expectedConfidence = 'Pending') {
  // Ensure the compliance tab is active / visible
  await browser.waitUntil(
    async () => {
      const table = await DeliveryPage.complianceTable
      return await table.isDisplayed()
    },
    { timeout: 10000, timeoutMsg: 'Compliance table not displayed' }
  )

  // ── Verify table headers ──────────────────────────────────────────────────
  const headers = await DeliveryPage.complianceTableHeaders
  await expect(headers[0]).toHaveText('Point')
  await expect(headers[1]).toHaveText('Compliance confidence')

  // ── Verify all service standard rows ────────────────────────────────────
  const rows = await DeliveryPage.complianceTableRows
  const actualCount = rows.length
  const expectedCount = SERVICE_STANDARDS.length

  if (actualCount !== expectedCount) {
    throw new Error(
      `Service Standards table row count mismatch: ` +
      `Only ${actualCount} Service Standard${actualCount === 1 ? '' : 's'} loaded on screen, ` +
      `expected ${expectedCount}. ` +
      `Please check that all Service Standards have been seeded in the database.`
    )
  }

  for (let i = 0; i < SERVICE_STANDARDS.length; i++) {
    const cells = await rows[i].$$('td')
    const pointCell = cells[0]
    const confidenceCell = cells[1]

    // Verify standard name (link text)
    await expect(pointCell).toHaveText(SERVICE_STANDARDS[i], { containing: true })

    // Verify compliance confidence against the supplied (or default) value
    await expect(confidenceCell).toHaveText(expectedConfidence, { containing: true })
  }
}

/**
 * Verify a single Service Standard row in the compliance table.
 * @param {number} standardIndex - 0-based index of the standard in SERVICE_STANDARDS
 * @param {string} [expectedConfidence='Pending'] - expected compliance confidence text for that row
 *
 * @example
 * // Verify standard 3 (index 2) has confidence 'Green'
 * await verifyServiceStandardRow(2, 'Green')
 */
export async function verifyServiceStandardRow(standardIndex, expectedConfidence = 'Pending') {
  if (standardIndex < 0 || standardIndex >= SERVICE_STANDARDS.length) {
    throw new RangeError(
      `standardIndex ${standardIndex} is out of range. Must be 0–${SERVICE_STANDARDS.length - 1}.`
    )
  }

  // Ensure the compliance tab / table is visible
  await browser.waitUntil(
    async () => {
      const table = await DeliveryPage.complianceTable
      return await table.isDisplayed()
    },
    { timeout: 10000, timeoutMsg: 'Compliance table not displayed' }
  )

  const rows = await DeliveryPage.complianceTableRows
  const targetRow = rows[standardIndex]
  const cells = await targetRow.$$('td')
  const pointCell = cells[0]
  const confidenceCell = cells[1]

  // Verify the correct standard is in this row
  await expect(pointCell).toHaveText(SERVICE_STANDARDS[standardIndex], { containing: true })

  // Verify the expected compliance confidence
  await expect(confidenceCell).toHaveText(expectedConfidence, { containing: true })
}

/**
 * Wait for the browser to navigate away from a given URL pattern.
 * @param {string} urlPattern - substring to wait to disappear from URL
 * @param {number} [timeout=10000]
 */
export async function waitForUrlToNotContain(urlPattern, timeout = 10000) {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl()
      return !url.includes(urlPattern)
    },
    { timeout, timeoutMsg: `URL still contains '${urlPattern}'` }
  )
}

/**
 * Wait for a page to be completely loaded (document.readyState === 'complete').
 * @param {number} [timeout=10000]
 */
export async function waitForPageLoad(timeout = 10000) {
  await browser.waitUntil(
    async () => {
      const readyState = await browser.execute(() => document.readyState)
      return readyState === 'complete'
    },
    { timeout, timeoutMsg: 'Page did not load completely' }
  )
}

/**
 * Verify the Delivery engagement tab content.
 * @param {string} deliveryCommentary - expected commentary text
 * @param {string} expectedStatusLabel - e.g. 'Amber', 'Green'
 */
export async function verifyDeliveryEngagementTab(deliveryCommentary, expectedStatusLabel) {
  // Label – pass getter directly without await
  await expect(DeliveryPage.engagementTimelineLabel).toBeDisplayed()

  // At least one timeline event should exist
  const events = await DeliveryPage.timelineEvents
  if (events.length === 0) {
    throw new Error('Expected at least one timeline event in the Delivery engagement tab')
  }

  const firstEvent = events[0]

  // Date heading exists
  const dateHeading = await firstEvent.$('.timeline__event-title')
  await expect(dateHeading).toBeDisplayed()

  // Status update text – check element text content rather than using invalid selector
  const firstEventText = await firstEvent.getText()
  if (firstEventText.includes('Delivery status updated:')) {
    if (expectedStatusLabel) {
      await expect(firstEvent).toHaveText(expectedStatusLabel, { containing: true })
    }
  }

  // Commentary text
  if (deliveryCommentary) {
    await expect(firstEvent).toHaveText(deliveryCommentary, { containing: true })
  }

  // Edit / Archive links – admin view only, skip gracefully if absent
  const editLink = await $('a=Edit this update')
  const archiveLink = await $('a=Archive this update')

  if (await editLink.isExisting()) {
    await expect(editLink).toBeDisplayed()
    await expect(archiveLink).toBeDisplayed()
  }
}
