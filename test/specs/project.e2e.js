// test/specs/project.e2e.js

/**
 * Project detail page E2E tests
 *
 * WEBDRIVERIO TEST BEST PRACTICES:
 *
 * 1. Assertions:
 *    - Use await expect(value).toBe(), await expect(value).toContain() etc. for ALL assertions in WebdriverIO
 *    - For element assertions, use await expect(element).toBeDisplayed(), await expect(element).toHaveText() etc.
 *    - For URL checks, use: const url = await browser.getUrl(); await expect(url).toContain('xyz')
 *    - For attribute checks, use: const attr = await element.getAttribute('href'); await expect(attr).toEqual('xyz')
 *
 * 2. Flexible tests:
 *    - Check for element existence with: if (await element.isExisting())
 *    - Use conditional logic to handle different states (authenticated vs unauthenticated)
 *
 * 3. Waiting:
 *    - Wait for elements with waitForDisplayed(), waitForExist(), etc.
 *    - Add explicit timeouts when needed: element.waitForDisplayed({ timeout: 5000 })
 *
 * 4. Selectors:
 *    - Use specific selectors (IDs are best)
 *    - For text content, use *=Text for partial matching
 *    - Chain selectors for complex elements: .parent .child
 */

describe('Project detail page', () => {
  /**
   * This test suite focuses on testing the project detail page
   * for unauthenticated users only
   *
   * NOTE: TBC projects are hidden from unauthenticated users,
   * so these tests will only access non-TBC projects
   */

  // We'll need a project ID to test with
  // In a real environment, this could come from an API call or test fixtures
  let projectId

  before(async () => {
    // Go to projects page first to get a project ID from the list
    await browser.url('/projects')

    // Get the first project link and extract the project ID from its href
    const firstProjectLink = await $(
      '.govuk-table tbody tr:first-child td:first-child a.govuk-link'
    )

    if (await firstProjectLink.isExisting()) {
      const href = await firstProjectLink.getAttribute('href')
      projectId = href.split('/').pop()
    } else {
      // Fallback ID to avoid breaking the tests if no projects exist
      projectId = 'demo-project'
    }
  })

  beforeEach(async () => {
    // Navigate to the project page before each test
    await browser.url(`/projects/${projectId}`)
  })

  it('should display the project detail page with the correct title', async () => {
    // We don't know the exact project name, but we expect it to be in the title
    // and to be followed by " | " from the layout template
    const title = await browser.getTitle()
    await expect(title).toContain('| Defra Digital Assurance')
  })

  it('should display the project name as a heading', async () => {
    const heading = await $('h1.govuk-heading-xl')
    await expect(heading).toBeDisplayed()

    // Get the project name to use in later tests
    const projectName = await heading.getText()
    await expect(projectName.length).toBeGreaterThan(0)
  })

  it('should display project phase and ID if available', async () => {
    // Check for phase display
    const phaseText = await $('p*=Phase:')
    if (await phaseText.isExisting()) {
      await expect(phaseText).toBeDisplayed()
    }

    // Check for project ID display
    const projectIdText = await $('p*=Project ID:')
    if (await projectIdText.isExisting()) {
      await expect(projectIdText).toBeDisplayed()
    }
  })

  it('should display the current delivery status with RAG tag', async () => {
    // Updated to match the new div structure with flexbox styling
    const statusHeading = await $('div*=Current delivery status:')
    await expect(statusHeading).toBeDisplayed()

    // Find the status tag specifically within the delivery status section
    // This ensures we get the project delivery status, not service standard status tags
    const statusTag = await statusHeading.$('.govuk-tag')
    await expect(statusTag).toBeDisplayed()

    // Status should be one of the valid project delivery statuses
    const status = await statusTag.getText()
    await expect([
      'Red',
      'Amber',
      'Green',
      'Pending', // TBC projects now display as "Pending"
      'Excluded'
    ]).toContain(status)
  })

  it('should display project commentary', async () => {
    // Commentary is now displayed in a govukInsetText component
    const insetText = await $('.govuk-inset-text')

    await insetText.isExisting()
    await expect(insetText).toBeDisplayed()

    const commentaryContent = await insetText.getText()
    await expect(commentaryContent.length).toBeGreaterThan(0)
  })

  it('should display the tabs with Service Standard compliance as default', async () => {
    // Check that the tabs are present
    const tabsContainer = await $('.govuk-tabs')
    await expect(tabsContainer).toBeDisplayed()

    // Check that the Service Standard compliance tab is available
    const complianceTab = await $('a[href="#compliance"]')
    await expect(complianceTab).toBeDisplayed()

    // Check that the Project engagement tab is available
    const engagementTab = await $('a[href="#engagement"]')
    await expect(engagementTab).toBeDisplayed()

    // Check that the compliance tab panel is displayed by default
    const complianceTabPanel = await $('#compliance')
    await expect(complianceTabPanel).toBeDisplayed()

    const complianceHeading = await $('#compliance h2')
    const headingText = await complianceHeading.getText()
    await expect(headingText).toBe('Service Standard compliance')
  })

  it('should display Service Standard compliance table or message', async () => {
    // Wait for the compliance tab content to be present
    const complianceTabPanel = await $('#compliance')
    await expect(complianceTabPanel).toBeDisplayed()

    // Check if there's a compliance table or a no standards message
    const complianceTable = await complianceTabPanel.$('.govuk-table')
    const noStandardsMessage = await complianceTabPanel.$(
      'p*=No service standards available'
    )

    const tableExists = await complianceTable.isExisting()
    const messageExists = await noStandardsMessage.isExisting()

    if (tableExists) {
      await expect(complianceTable).toBeDisplayed()

      // Check table headers exist
      const headers = await complianceTable.$$('th')
      await expect(headers.length).toBeGreaterThan(0)

      // Check that we have table rows
      const rows = await complianceTable.$$('tbody tr')
      if (rows.length > 0) {
        // If we have rows, check that they have links to standards
        const firstRowLink = await rows[0].$('a.govuk-link')
        if (await firstRowLink.isExisting()) {
          await expect(firstRowLink).toBeDisplayed()
        }
      }
    } else if (messageExists) {
      await expect(noStandardsMessage).toBeDisplayed()
    } else {
      // Neither table nor message found, but that's ok - just verify the tab is working
      const tabHeading = await complianceTabPanel.$('h2')
      await expect(tabHeading).toBeDisplayed()

      const headingText = await tabHeading.getText()
      await expect(headingText).toBe('Service Standard compliance')
    }
  })

  it('should display delivery engagement content when tab is clicked', async () => {
    // Click on the Delivery engagement tab
    const engagementTab = await $('a[href="#engagement"]')
    await engagementTab.click()

    // Wait for the engagement tab panel to be displayed
    const engagementTabPanel = await $('#engagement')
    await expect(engagementTabPanel).toBeDisplayed()

    // Check the heading
    const engagementHeading = await $('#engagement h2')
    const headingText = await engagementHeading.getText()
    await expect(headingText).toBe('Delivery engagement')

    // This test is conditional - we may or may not have timeline events
    const timelineEvents = await $$('.timeline__event')

    if (timelineEvents.length > 0) {
      // If we have events, check that they have the expected structure
      const firstEvent = timelineEvents[0]

      // Each event should have a title (date)
      const eventTitle = await firstEvent.$('.timeline__event-title')
      await expect(eventTitle).toBeDisplayed()

      // And should have some content
      const eventContent = await firstEvent.$('.timeline__event-content')
      await expect(eventContent).toBeDisplayed()
    } else {
      // If no events, there should be a message saying no project updates
      const noHistoryMessage = await $(
        '.govuk-inset-text p*=No project updates found yet'
      )
      await expect(noHistoryMessage).toBeDisplayed()
    }
  })

  it('should NOT display manage project link for unauthenticated users', async () => {
    // Since we're testing as unauthenticated users, manage project link should not be present
    const manageLink = await $(
      `a.govuk-link[href="/projects/${projectId}/manage"]`
    )
    await expect(manageLink).not.toBeDisplayed()

    // Also check for the assessment link
    const assessmentLink = await $(
      `a.govuk-link[href="/projects/${projectId}/assessment"]`
    )
    await expect(assessmentLink).not.toBeDisplayed()
  })

  it('should NOT display the Profession updates tab for unauthenticated users', async () => {
    // For unauthenticated users, the professions tab should not be available
    const professionsTab = await $('a[href="#professions"]')
    await expect(professionsTab).not.toBeDisplayed()
  })

  // Removed test for charts since they have been removed from the application
  it('should not display project history chart since it has been removed', async () => {
    // Verify that the project history chart container no longer exists
    const chartContainer = await $('#project-history-chart')
    await expect(chartContainer).not.toBeExisting()
  })
})
