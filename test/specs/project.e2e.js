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
   */

  // We'll need a project ID to test with
  // In a real environment, this could come from an API call or test fixtures
  let projectId

  before(async () => {
    // Go to home page first to get a project ID from the list
    await browser.url('/')

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
    // and to be followed by " | DDTS Assurance" from the layout template
    const title = await browser.getTitle()
    await expect(title).toContain('| DDTS Assurance')
  })

  it('should display the project name as a heading', async () => {
    const heading = await $('h1.govuk-heading-xl')
    await expect(heading).toBeDisplayed()

    // Get the project name to use in later tests
    const projectName = await heading.getText()
    await expect(projectName.length).toBeGreaterThan(0)
  })

  it('should display the current delivery status with RAG tag', async () => {
    const statusHeading = await $('h2.govuk-heading-m.inline-heading')
    await expect(statusHeading).toBeDisplayed()

    const headingText = await statusHeading.getText()
    await expect(headingText).toContain('Current delivery status:')

    const statusTag = await $('.govuk-tag.govuk-tag--large')
    await expect(statusTag).toBeDisplayed()

    // Status should be one of RED, AMBER, GREEN
    const status = await statusTag.getText()
    await expect(['RED', 'AMBER', 'GREEN']).toContain(status)
  })

  it('should display project commentary', async () => {
    const commentary = await $('.govuk-body')
    await expect(commentary).toBeDisplayed()

    const commentaryContent = await commentary.getText()
    await expect(commentaryContent.length).toBeGreaterThan(0)
  })

  it('should display the project timeline tab by default', async () => {
    const tabPanel = await $('#project-engagement')
    await expect(tabPanel).toBeDisplayed()

    const timelineHeading = await $('#project-engagement h2')
    const headingText = await timelineHeading.getText()
    await expect(headingText).toBe('Project update timeline')
  })

  it('should display project timeline events if available', async () => {
    // This test is conditional - we may or may not have timeline events
    const timelineEvents = await $$('.timeline__event')

    if (timelineEvents.length > 0) {
      // If we have events, check that they have the expected structure
      const firstEvent = timelineEvents[0]

      // Each event should have a title (date)
      const eventTitle = await firstEvent.$('.timeline__event-title')
      await expect(eventTitle).toBeDisplayed()

      // And should have some content
      const eventContent = await firstEvent.$('.govuk-body')
      await expect(eventContent).toBeDisplayed()
    } else {
      // If no events, there should be a message saying no history
      const noHistoryMessage = await $('p*=No history found for this project')
      await expect(noHistoryMessage).toBeDisplayed()
    }
  })

  it('should NOT display edit button for unauthenticated users', async () => {
    // Since we're testing as unauthenticated users, edit button should not be present
    const editButton = await $(
      `a.govuk-button--secondary[href="/projects/${projectId}/edit"]`
    )
    await expect(editButton).not.toBeDisplayed()
  })

  it('should NOT display the Profession updates tab for unauthenticated users', async () => {
    // For unauthenticated users, the professions tab should not be available
    const professionsTab = await $('a[href="#professions"]')
    await expect(professionsTab).not.toBeDisplayed()
  })

  // Conditional test for page elements that depend on data
  it('should handle charts appropriately if they exist', async () => {
    // Project history chart may or may not be present depending on the implementation
    const chartContainer = await $('#project-history-chart')

    // If chart exists, we just verify it's visible
    // We can't easily test the chart rendering itself in a headless browser test
    if (await chartContainer.isExisting()) {
      await expect(chartContainer).toBeDisplayed()
    }
  })
})
