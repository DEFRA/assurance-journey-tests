import { Page } from './page.js'

/**
 * Page Object for the Manage Delivery pages.
 * Covers /projects/:id/manage and /projects/:id/manage/status
 * Selectors derived from src/server/projects/manage/views/*.njk
 */
class ManageDeliveryPage extends Page {
  // ══════════════════════════════════════════════════════════════════════════
  // Manage Delivery Selection Page (/projects/:id/manage)
  // ══════════════════════════════════════════════════════════════════════════

  /** Page heading "Manage Delivery" */
  get manageDeliveryHeading() {
    return $('h1.govuk-heading-xl')
  }

  /** Project name subheading */
  get projectNameHeading() {
    return $('h2.govuk-heading-l')
  }

  /** Fieldset legend "What would you like to update?" */
  get updateTypeLegend() {
    return $('legend.govuk-fieldset__legend')
  }

  /** Radio option: "Update the delivery status and commentary" */
  get updateStatusRadio() {
    return $('#updateType')
  }

  /** Radio option label text for status update */
  get updateStatusRadioLabel() {
    return $('label[for="updateType"]')
  }

  /** Radio option: "Update delivery name, phase, ID..." */
  get updateDetailsRadio() {
    return $('#updateType-2')
  }

  /** Radio option label text for details update */
  get updateDetailsRadioLabel() {
    return $('label[for="updateType-2"]')
  }

  /** Continue button */
  get continueButton() {
    return $('button.govuk-button')
  }

  /** Cancel button/link */
  get cancelButton() {
    return $('a.govuk-button--secondary')
  }

  /** Hint text for the radio group */
  get updateTypeHint() {
    return $('#updateType-hint')
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Update Status and Commentary Page (/projects/:id/manage/status)
  // ══════════════════════════════════════════════════════════════════════════

  /** Page heading – "Update Project Status and Commentary" or "Edit..." */
  get statusPageHeading() {
    return $('h1.govuk-heading-xl')
  }

  /** Current status dropdown (id="status") */
  get currentStatusDropdown() {
    return $('#status')
  }

  /** Current status label */
  get currentStatusLabel() {
    return $('label[for="status"]')
  }

  /** Project commentary textarea (id="commentary") */
  get projectCommentaryTextarea() {
    return $('#commentary')
  }

  /** Project commentary label */
  get projectCommentaryLabel() {
    return $('label[for="commentary"]')
  }

  /** Project commentary hint */
  get projectCommentaryHint() {
    return $('#commentary-hint')
  }

  /** Save changes button */
  get saveChangesButton() {
    return $('button.govuk-button')
  }

  /** Cancel link on status page */
  get cancelLink() {
    return $('a.govuk-button--secondary')
  }

  /** Details component: "Suggested update based on concerning standards" */
  get suggestedUpdateDetails() {
    return $('details.govuk-details')
  }

  /** Summary text within the details component */
  get suggestedUpdateSummary() {
    return $('summary.govuk-details__summary')
  }

  // ── Standards Requiring Attention section ─────────────────────────────────

  /** Section heading "Standards Requiring Attention" */
  get standardsRequiringAttentionHeading() {
    return $('h2=Standards Requiring Attention')
  }

  /** Paragraph below the heading */
  get standardsRequiringAttentionDescription() {
    return $('p=The following standards have concerning assessments that you may want to address in your project commentary:')
  }

  /** Standards at risk table */
  get standardsAtRiskTable() {
    return $('.app-standards-table')
  }

  /** Standards at risk table headers */
  get standardsAtRiskTableHeaders() {
    return $$('.app-standards-table .govuk-table__head .govuk-table__header')
  }

  /** Standards at risk table rows */
  get standardsAtRiskTableRows() {
    return $$('.app-standards-table .govuk-table__body .govuk-table__row')
  }

  // ── Edit mode elements ────────────────────────────────────────────────────

  /** Inset text showing edit mode info */
  get editModeInsetText() {
    return $('div.govuk-inset-text')
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Update Details Page (/projects/:id/manage/details)
  // ══════════════════════════════════════════════════════════════════════════

  /** Page heading on details page */
  get detailsPageHeading() {
    return $('h1.govuk-heading-xl')
  }

  /** Project name input (id="name") */
  get projectNameInput() {
    return $('#name')
  }

  /** Project name label */
  get projectNameLabel() {
    return $('label[for="name"]')
  }

  /** GDS Phase select (id="phase") */
  get phaseSelect() {
    return $('#phase')
  }

  /** Phase label */
  get phaseLabel() {
    return $('label[for="phase"]')
  }

  /** Project ID / Defra code input (id="defCode") */
  get projectIdInput() {
    return $('#defCode')
  }

  /** Project ID label */
  get projectIdLabel() {
    return $('label[for="defCode"]')
  }

  /** Delivery group select (id="deliveryGroupId") */
  get deliveryGroupSelect() {
    return $('#deliveryGroupId')
  }

  /** Delivery group label */
  get deliveryGroupLabel() {
    return $('label[for="deliveryGroupId"]')
  }

  /** Save changes button on details page (same selector as status page) */
  get detailsSaveButton() {
    return $('button.govuk-button')
  }

  /** Cancel link on details page */
  get detailsCancelLink() {
    return $('a.govuk-button--secondary')
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Breadcrumbs
  // ══════════════════════════════════════════════════════════════════════════

  /** Breadcrumb: Deliveries link */
  get breadcrumbDeliveries() {
    return $('a[href="/projects"]')
  }

  /** Breadcrumb: Manage delivery link */
  get breadcrumbManageDelivery() {
    return $('a[href*="/manage"]')
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Helper Methods
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Navigate to manage delivery page for a project.
   * @param {string} projectId - the project ID
   */
  async openManagePage(projectId) {
    return this.open(`/projects/${projectId}/manage`)
  }

  /**
   * Navigate directly to status update page.
   * @param {string} projectId - the project ID
   */
  async openStatusPage(projectId) {
    return this.open(`/projects/${projectId}/manage/status`)
  }

  /**
   * Navigate directly to details update page.
   * @param {string} projectId - the project ID
   */
  async openDetailsPage(projectId) {
    return this.open(`/projects/${projectId}/manage/details`)
  }

  /**
   * Select "Update delivery name, phase, ID..." and click Continue.
   */
  async selectDetailsUpdateAndContinue() {
    await this.updateDetailsRadio.click()
    await this.continueButton.click()
  }

  /**
   * Capture current values on the details form.
   * @returns {Promise<{name: string, phase: string, defCode: string, deliveryGroup: string}>}
   */
  async captureCurrentDetails() {
    return {
      name: await this.projectNameInput.getValue(),
      phase: await this.phaseSelect.getValue(),
      defCode: await this.projectIdInput.getValue(),
      deliveryGroup: await this.deliveryGroupSelect.getValue()
    }
  }

  /**
   * Fill and submit the details form.
   * @param {Object} details - { name, phase, defCode, deliveryGroup }
   */
  async updateDetails({ name, phase, defCode, deliveryGroup }) {
    if (name !== undefined) {
      await this.projectNameInput.clearValue()
      await this.projectNameInput.setValue(name)
    }
    if (phase !== undefined) {
      await this.phaseSelect.selectByAttribute('value', phase)
    }
    if (defCode !== undefined) {
      await this.projectIdInput.clearValue()
      await this.projectIdInput.setValue(defCode)
    }
    if (deliveryGroup !== undefined) {
      await this.deliveryGroupSelect.selectByVisibleText(deliveryGroup)
    }
    await this.detailsSaveButton.click()
  }

  /**
   * Select "Update the delivery status and commentary" and click Continue.
   */
  async selectStatusUpdateAndContinue() {
    await this.updateStatusRadio.click()
    await this.continueButton.click()
  }

  /**
   * Get the current selected status value from the dropdown.
   * @returns {Promise<string>} the current status value
   */
  async getCurrentStatusValue() {
    return await this.currentStatusDropdown.getValue()
  }

  /**
   * Get the current commentary text from the textarea.
   * @returns {Promise<string>} the current commentary
   */
  async getCurrentCommentary() {
    return await this.projectCommentaryTextarea.getValue()
  }

  /**
   * Update status and commentary and save.
   * @param {string} newStatus - new status value (e.g., 'GREEN', 'AMBER')
   * @param {string} newCommentary - new commentary text
   */
  async updateStatusAndCommentary(newStatus, newCommentary) {
    await this.currentStatusDropdown.selectByAttribute('value', newStatus)
    await this.projectCommentaryTextarea.clearValue()
    await this.projectCommentaryTextarea.setValue(newCommentary)
    await this.saveChangesButton.click()
  }

  /**
   * Get all standards requiring attention from the table.
   * @returns {Promise<Array>} array of { standard, status, profession, commentary, lastUpdated }
   */
  async getStandardsRequiringAttention() {
    const rows = await this.standardsAtRiskTableRows
    const standards = []

    for (const row of rows) {
      const cells = await row.$$('td')
      if (cells.length >= 5) {
        standards.push({
          standard: await cells[0].getText(),
          status: await cells[1].getText(),
          profession: await cells[2].getText(),
          commentary: await cells[3].getText(),
          lastUpdated: await cells[4].getText()
        })
      }
    }

    return standards
  }

  /**
   * Verify the Standards Requiring Attention table headers.
   */
  async verifyStandardsAtRiskTableHeaders() {
    const headers = await this.standardsAtRiskTableHeaders
    const expectedHeaders = ['Service Standard', 'Status', 'Profession', 'Assessment Commentary', 'Last Updated']

    for (let i = 0; i < expectedHeaders.length; i++) {
      await expect(headers[i]).toHaveText(expectedHeaders[i])
    }
  }
}

export default new ManageDeliveryPage()
