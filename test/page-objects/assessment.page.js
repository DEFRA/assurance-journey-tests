/**
 * Page Object: Service Standard Assessment page
 * (/projects/:id/assessment)
 *
 * Also covers the project detail page for navigating into the compliance tab
 * and clicking a specific service-standard row link.
 */
class AssessmentPage {
  // ── Page heading ──────────────────────────────────────────────────────────
  get pageHeading () { return $('h1.govuk-heading-xl') }

  // ── Inset text ────────────────────────────────────────────────────────────
  get insetText () { return $('.govuk-inset-text') }

  // ── Profession dropdown ───────────────────────────────────────────────────
  get professionSelect () { return $('#professionId') }

  // ── Service Standard dropdown ─────────────────────────────────────────────
  get standardSelect () { return $('#standardId') }

  // ── Status dropdown ───────────────────────────────────────────────────────
  get statusSelect () { return $('#status') }

  // ── Commentary fields ─────────────────────────────────────────────────────
  get greenCommentaryTextarea () { return $('#commentary-green') }
  get issueDescriptionTextarea () { return $('#issue-description') }
  get pathToGreenTextarea () { return $('#path-to-green') }

  // ── Save / Submit ─────────────────────────────────────────────────────────
  get saveUpdateButton () { return $('button.govuk-button:not(.govuk-button--secondary)') }

  // ── Project detail – compliance tab ──────────────────────────────────────
  get serviceStandardComplianceTab () { return $('a[href="#compliance"]') }

  /** All rows inside the compliance table body */
  get complianceTableRows () { return $$('#compliance .govuk-table__body .govuk-table__row') }

  // ── Project detail – Add Service Standard update link ────────────────────
  // Uses link text match since the href contains a dynamic project ID
  get addServiceStandardUpdateLink () { return $('a=Add Service Standard update') }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Navigate to the projects list, type the project name into the search box,
   * submit the form (GET), then click the matching project link in the results.
   *
   * NOTE: The accessible-autocomplete component uses confirmOnBlur:false and
   * autoselect:false so programmatic setValue() does not reliably open the
   * listbox in headless Chrome. Submitting the form via the search button is
   * the robust automation path – the server returns a filtered table of links.
   *
   * @param {string} projectName
   */
  async openProject (projectName) {
    // Navigate to /projects if not already there
    const currentUrl = await browser.getUrl()
    if (!currentUrl.includes('/projects') || currentUrl.includes('/projects/')) {
      await browser.url('/projects')
    }
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/projects'),
      { timeout: 10000, timeoutMsg: 'Projects list page did not load' }
    )

    // Wait for the autocomplete search input to be present (dynamically rendered by JS)
    const searchInput = await $('#search')
    await searchInput.waitForExist({ timeout: 15000 })
    await browser.pause(500) // allow autocomplete JS to fully initialise
    await searchInput.waitForDisplayed({ timeout: 10000 })

    // Type the project name character by character to trigger input events
    await searchInput.clearValue()
    await searchInput.click()
    await browser.keys(projectName.split(''))
    await browser.pause(500)

    // Click the search submit button to do a server-side GET search
    const submitBtn = await $('.gem-c-search__submit')
    await submitBtn.click()

    // Wait for the filtered results page to load
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl()
        return url.includes('/projects') && url.includes('search=')
      },
      { timeout: 10000, timeoutMsg: `Search results page did not load for "${projectName}"` }
    )

    // Find the project link in the results table
    const link = await $(`a*=${projectName}`)
    const exists = await link.isExisting()
    if (!exists) {
      const allLinks = await $$('table.govuk-table a')
      const names = []
      for (const l of allLinks) names.push(await l.getText())
      throw new Error(
        `Project "${projectName}" not found in search results.\n` +
        `Results shown: [${names.join(', ')}]\n` +
        `Check ASSESSMENT_PROJECTS in service-standard-assessment.data.js matches your DB.`
      )
    }

    await browser.execute(() => window.scrollTo(0, document.body.scrollHeight))
    await link.click()

    // Wait to land on the project detail page
    await browser.waitUntil(
      async () => /\/projects\/[a-zA-Z0-9]+/.test(await browser.getUrl()),
      { timeout: 10000, timeoutMsg: `Project detail page did not load after clicking "${projectName}"` }
    )
  }

  /**
   * From a project detail page click "Add Service Standard update".
   */
  async clickAddServiceStandardUpdate () {
    await this.addServiceStandardUpdateLink.waitForDisplayed({ timeout: 5000 })
    await this.addServiceStandardUpdateLink.click()
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/assessment'),
      { timeout: 10000, timeoutMsg: 'Assessment page did not load' }
    )
  }

  /**
   * On the project detail page, click the Service Standard compliance tab,
   * then click the link for the standard at the given 1-based row index.
   * @param {number} rowIndex  1-based index of the standard to click
   */
  async clickStandardFromComplianceTab (rowIndex = 1) {
    await this.serviceStandardComplianceTab.waitForDisplayed({ timeout: 5000 })
    await this.serviceStandardComplianceTab.click()

    // Wait for the compliance panel to become visible
    await browser.waitUntil(
      async () => {
        const cls = await $('#compliance').getAttribute('class')
        return !cls.includes('govuk-tabs__panel--hidden')
      },
      { timeout: 5000, timeoutMsg: 'Compliance tab panel did not become visible' }
    )

    const rows = await this.complianceTableRows
    if (rows.length < rowIndex) {
      throw new Error(`Expected at least ${rowIndex} rows in compliance table but found ${rows.length}`)
    }
    const targetRow = rows[rowIndex - 1]
    const link = await targetRow.$('a.govuk-link')
    await link.click()
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/standards/'),
      { timeout: 10000, timeoutMsg: 'Standard detail page did not load' }
    )
  }

  /**
   * From a standard detail page, click "Add service standard update" link.
   */
  async clickAddUpdateFromStandardDetail () {
    // Use link text match – href contains dynamic project ID and standardId query param
    const link = await $('a=Add service standard update')
    await link.waitForDisplayed({ timeout: 5000 })
    await link.click()
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/assessment'),
      { timeout: 10000, timeoutMsg: 'Assessment page did not load from standard detail' }
    )
  }

  /**
   * Get all option texts (excluding the first placeholder) from the profession dropdown.
   * @returns {string[]}
   */
  async getProfessionOptions () {
    const options = await this.professionSelect.$$('option')
    const texts = []
    for (const opt of options) {
      const val = await opt.getValue()
      if (val) texts.push(await opt.getText())
    }
    return texts
  }

  /**
   * Select a profession by its id value and wait for the standards dropdown to update.
   * @param {string} professionId
   */
  async selectProfession (professionId) {
    await this.professionSelect.selectByAttribute('value', professionId)
    // Small pause to allow JS to repopulate the standards dropdown
    await browser.pause(600)
  }

  /**
   * Get all option texts (excluding the first placeholder) from the standard dropdown.
   * @returns {string[]}
   */
  async getStandardOptions () {
    const options = await this.standardSelect.$$('option')
    const texts = []
    for (const opt of options) {
      const val = await opt.getValue()
      if (val) texts.push(await opt.getText())
    }
    return texts
  }

  /**
   * Get all option values (excluding the placeholder) from the standard dropdown.
   * @returns {string[]} option value attributes
   */
  async getStandardOptionValues () {
    const options = await this.standardSelect.$$('option')
    const vals = []
    for (const opt of options) {
      const val = await opt.getValue()
      if (val) vals.push(val)
    }
    return vals
  }

  /**
   * Select a service standard from the dropdown by its value (id).
   * @param {string} standardValue
   */
  async selectStandard (standardValue) {
    await this.standardSelect.selectByAttribute('value', standardValue)
    await browser.pause(400)
  }

  /**
   * Select a status from the dropdown and wait for the commentary field(s)
   * to toggle visibility.
   * @param {string} statusValue  e.g. 'GREEN', 'AMBER', 'RED'
   */
  async selectStatus (statusValue) {
    await this.statusSelect.selectByAttribute('value', statusValue)
    await browser.pause(400)
  }

  /**
   * Fill the commentary for a GREEN status assessment.
   * @param {string} text
   */
  async fillGreenCommentary (text) {
    const field = await this.greenCommentaryTextarea
    await field.waitForDisplayed({ timeout: 3000 })
    await field.clearValue()
    await field.setValue(text)
  }

  /**
   * Fill the commentary for a non-GREEN status assessment.
   * Only populates issue-description (path-to-green is optional).
   * @param {string} issueText
   */
  async fillNonGreenCommentary (issueText) {
    const field = await this.issueDescriptionTextarea
    await field.waitForDisplayed({ timeout: 3000 })
    await field.clearValue()
    await field.setValue(issueText)
  }

  /**
   * Complete a full assessment: select profession, standard, status, comment,
   * then click save and wait for the success URL.
   *
   * @param {object} opts
   * @param {string} opts.professionId
   * @param {string} opts.standardValue – the option value (id) in the standards dropdown
   * @param {string} opts.statusValue   – e.g. 'GREEN', 'AMBER'
   * @param {string} opts.commentary    – commentary text
   */
  async submitAssessment ({ professionId, standardValue, statusValue, commentary }) {
    await this.selectProfession(professionId)
    await this.selectStandard(standardValue)
    await this.selectStatus(statusValue)

    if (statusValue === 'GREEN') {
      await this.fillGreenCommentary(commentary)
    } else {
      await this.fillNonGreenCommentary(commentary)
    }

    // Use JS scroll to avoid WebDriver Actions API "move target out of bounds" errors
    await browser.execute(() => window.scrollTo(0, document.body.scrollHeight))
    await browser.pause(200)
    await this.saveUpdateButton.click()

    // Wait for success redirect
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('notification=Assessment%20saved%20successfully'),
      { timeout: 15000, timeoutMsg: 'Success notification not found in URL after saving assessment' }
    )
  }

  /**
   * From the project detail page, read the compliance table and return
   * an array of { standard: string, status: string } for every row.
   * Must be on the compliance tab already.
   * @returns {Array<{standard: string, status: string}>}
   */
  async getComplianceTableData () {
    const rows = await this.complianceTableRows
    const data = []
    for (const row of rows) {
      const cells = await row.$$('.govuk-table__cell')
      const standardText = cells[0] ? (await cells[0].getText()).trim() : ''
      const statusText = cells[1] ? (await cells[1].getText()).trim() : ''
      data.push({ standard: standardText, status: statusText })
    }
    return data
  }
}

export default new AssessmentPage()
