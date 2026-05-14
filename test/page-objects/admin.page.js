/**
 * Page Object: Admin page (/admin)
 *
 * Provides selectors and helpers for admin bulk operations,
 * specifically the Bulk Operations tab → View Deliveries → Delete flow.
 */
class AdminPage {
  // ── Navigation ──────────────────────────────────────────────────────────────
  async open () {
    await browser.url('/admin')
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────
  get bulkOperationsTab () { return $('a[href="#bulk"]') }

  // ── Bulk Operations panel ───────────────────────────────────────────────────
  get viewDeliveriesSummary () { return $('span.govuk-details__summary-text') }

  get deliveriesTable () { return $('#bulk .govuk-table') }

  // ── Notification banner ─────────────────────────────────────────────────────
  get notificationBanner () { return $('.govuk-notification-banner') }

  // ── Confirm-delete page ─────────────────────────────────────────────────────
  get confirmDeleteButton () { return $('button.govuk-button--warning') }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Navigate to the Bulk Operations tab and expand the View Deliveries section.
   */
  async openBulkDeliveries () {
    await this.open()
    await browser.pause(1000)

    // Click the Bulk Operations tab
    const bulkTab = await this.bulkOperationsTab
    await bulkTab.waitForDisplayed({ timeout: 5000 })
    await bulkTab.click()
    await browser.pause(1000)

    // Expand the View Deliveries details if collapsed
    const detailsElements = await $$('#bulk details')
    if (detailsElements.length > 0) {
      const details = detailsElements[0]
      const isOpen = await details.getAttribute('open')
      // open attribute is null when collapsed
      if (isOpen === null || isOpen === 'false') {
        const summary = await details.$('.govuk-details__summary')
        await summary.click()
        await browser.pause(1000)
      }
    }
  }

  /**
   * Find a delivery row by its exact name and click its Delete button.
   * Returns true if found and clicked, false if the delivery wasn't listed.
   */
  async deleteDeliveryByName (name) {
    // Wait for the table to be present
    const table = await $('#bulk .govuk-table')
    await table.waitForDisplayed({ timeout: 5000 })

    const rows = await $$('#bulk .govuk-table__body .govuk-table__row')
    console.log(`Found ${rows.length} delivery rows in admin table`)

    for (const row of rows) {
      const cells = await row.$$('.govuk-table__cell')
      if (cells.length === 0) continue
      const cellText = await cells[0].getText()
      console.log(`  Row name: "${cellText.trim()}"`)

      if (cellText.trim() === name) {
        // The Delete button is an <a> tag with govuk-button--warning class
        const deleteLink = await row.$('.govuk-button--warning')
        if (await deleteLink.isExisting()) {
          await deleteLink.scrollIntoView()
          await browser.pause(300)
          await deleteLink.click()
          return true
        }
      }
    }
    return false
  }

  /**
   * On the confirm-delete page, click "Yes, delete".
   */
  async confirmDelete () {
    await expect(this.confirmDeleteButton).toBeDisplayed()
    await this.confirmDeleteButton.click()
  }
}

export default new AdminPage()
