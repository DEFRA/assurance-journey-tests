import { Page } from './page.js'

/**
 * Page Object for the Add New Delivery and Delivery Detail pages.
 * Selectors derived from src/server/projects/add/views/index.njk
 * and src/server/projects/detail/views/index.njk
 */
class DeliveryPage extends Page {
  // ── Add Delivery form fields ──────────────────────────────────────────────

  /** Delivery name input  (id="name") */
  get deliveryName() {
    return $('#name')
  }

  /** GDS Phase select  (id="phase") */
  get projectPhase() {
    return $('#phase')
  }

  /** DEFRA Code input  (id="defCode") */
  get defraCode() {
    return $('#defCode')
  }

  /** Current Status select  (id="status") */
  get currentStatus() {
    return $('#status')
  }

  /** Delivery commentary textarea  (id="commentary") */
  get deliveryCommentary() {
    return $('#commentary')
  }

  /** "Add delivery" submit button */
  get addDeliveryButton() {
    return $('button[type="submit"]')
  }

  // ── Projects list page ────────────────────────────────────────────────────

  /** "Add new delivery" link on /projects */
  get addNewDeliveryLink() {
    return $('a[href="/projects/add"]')
  }

  /** All rows in the deliveries table body */
  get deliveryTableRows() {
    return $$('.govuk-table tbody tr')
  }

  // ── Delivery detail page ──────────────────────────────────────────────────

  /** h1 heading – delivery name */
  get deliveryHeading() {
    return $('h1.govuk-heading-xl')
  }

  /** "Current delivery status:" tag area */
  get currentDeliveryStatusBlock() {
    return $('div.govuk-body-m')
  }

  /** Inset text containing delivery commentary */
  get deliveryCommentaryInsetText() {
    return $('.govuk-inset-text')
  }

  /** "Manage delivery" link */
  get manageDeliveryLink() {
    return $('a[href*="/manage"]')
  }

  /** "Add Service Standard update" link */
  get addServiceStandardUpdateLink() {
    return $('a[href*="/assessment"]')
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  /** "Service Standard compliance" tab */
  get serviceStandardComplianceTab() {
    return $('a[href="#compliance"]')
  }

  /** "Delivery engagement" tab */
  get deliveryEngagementTab() {
    return $('a[href="#engagement"]')
  }

  // ── Service Standard compliance tab ──────────────────────────────────────

  /** Compliance table within the compliance tab panel */
  get complianceTable() {
    return $('#compliance .govuk-table')
  }

  /** Table header cells in compliance table */
  get complianceTableHeaders() {
    return $$('#compliance .govuk-table__head .govuk-table__header')
  }

  /** All rows in the compliance table body */
  get complianceTableRows() {
    return $$('#compliance .govuk-table__body .govuk-table__row')
  }

  // ── Delivery engagement tab ───────────────────────────────────────────────

  /** Engagement panel */
  get engagementPanel() {
    return $('#engagement')
  }

  /** "Timeline of key delivery changes and updates." paragraph */
  get engagementTimelineLabel() {
    return $('p=Timeline of key delivery changes and updates.')
  }

  /** All timeline event entries */
  get timelineEvents() {
    return $$('.timeline__event')
  }

  /** "Edit this update" link (most recent entry) */
  get editUpdateLink() {
    return $('a=Edit this update')
  }

  /** "Archive this update" link (most recent entry) */
  get archiveUpdateLink() {
    return $('a=Archive this update')
  }

  // ── Project Sidebar (visible in both tabs) ────────────────────────────────

  /** Project sidebar container */
  get projectSidebar() {
    return $('.project-sidebar')
  }

  // ── Helper methods ────────────────────────────────────────────────────────

  /**
   * Navigate to the /projects page.
   */
  async openProjectsPage() {
    return this.open('/projects')
  }

  /**
   * Navigate to the Add New Delivery form.
   */
  async openAddDeliveryForm() {
    return this.open('/projects/add')
  }

  /**
   * Fill in and submit the Add New Delivery form.
   * @param {Object} data - delivery scenario data
   */
  async fillAndSubmitDeliveryForm(data) {
    await this.deliveryName.setValue(data.deliveryName)
    await this.projectPhase.selectByIndex(data.phaseIndex)
    await this.defraCode.setValue(data.defraCode)

    try {
      await this.currentStatus.selectByAttribute('value', data.currentStatus)
    } catch {
      await this.currentStatus.selectByVisibleText(data.currentStatusLabel)
    }

    await this.deliveryCommentary.setValue(data.deliveryCommentary)
    await this.addDeliveryButton.click()
  }

  /**
   * Find a delivery row in the projects table by delivery name.
   * @param {string} deliveryName
   * @returns {WebdriverIO.Element}
   */
  async findDeliveryRowByName(deliveryName) {
    return $(`td*=${deliveryName}`)
  }

  /**
   * Find and click the delivery link by name.
   * @param {string} deliveryName
   */
  async clickDeliveryByName(deliveryName) {
    const link = await $(`a.govuk-link*=${deliveryName}`)
    await link.click()
  }
}

export default new DeliveryPage()
