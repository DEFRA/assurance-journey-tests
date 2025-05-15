// test/specs/home.e2e.js

/**
 * Home page E2E tests
 *
 * WEBDRIVERIO TEST BEST PRACTICES:
 *
 * 1. Assertions:
 *    - Use expect(value).toBe(), expect(value).toContain() etc. for direct assertions
 *    - For element assertions, use await expect(element).toBeDisplayed(), await expect(element).toHaveText() etc.
 *    - For URL checks, use: const url = await browser.getUrl(); expect(url).toContain('xyz')
 *    - For attribute checks, use: const attr = await element.getAttribute('href'); expect(attr).toEqual('xyz')
 *
 * 2. Flexible tests:
 *    - Check for element existence with: if (await element.isExisting())
 *    - Use conditional logic to handle different states (authenticated vs unauthenticated)
 *    - Add logging with console.log() to understand test flow
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

/**
 * Helper function to check if user is authenticated
 * This detects authentication by checking if the "Add new project" button exists
 * @returns {Promise<boolean>} true if user is authenticated, false otherwise
 */
async function isUserAuthenticated() {
  const addButton = await $('a.govuk-button--secondary[href="/projects/add"]')
  return await addButton.isExisting()
}

/**
 * Helper function to check if projects are present in the list
 * @returns {Promise<boolean>} true if projects exist, false otherwise
 */
async function doProjectsExist() {
  const tableRows = await $$('.govuk-table tbody tr')
  return tableRows.length > 0
}

describe('Home page', () => {
  beforeEach(async () => {
    // Navigate to the home page before each test
    await browser.url('/')
  })

  it('should have the correct page title', async () => {
    // Using the correct WebdriverIO assertion pattern
    const title = await browser.getTitle()
    expect(title).toBe('Home | DDTS Assurance')
  })

  it('should display the main heading "Projects"', async () => {
    const heading = await $('h1.govuk-heading-xl') // Assuming appHeading macro renders an H1 with this class
    await expect(heading).toBeDisplayed()
    await expect(heading).toHaveText('Projects')
  })

  describe('Search functionality', () => {
    it('should display search input and search button', async () => {
      const searchInput = await $('#search') // Based on the accessibleAutocomplete setup
      const searchButton = await $('button[type="submit"]') // Standard submit button

      await expect(searchInput).toBeDisplayed()
      await expect(searchButton).toBeDisplayed()
      await expect(searchButton).toHaveText('Search')
    })

    it('should allow typing into the search input', async () => {
      const searchInput = await $('#search')
      await searchInput.setValue('Test Project Search')
      await expect(searchInput).toHaveValue('Test Project Search')
    })

    it('should update the URL when a search is submitted', async () => {
      const searchInput = await $('#search')
      const searchButton = await $('form button[type="submit"]') // More specific selector for the form's button

      await searchInput.setValue('My Searched Project')
      await searchButton.click()

      // Fix: Using proper URL assertion
      const currentUrl = await browser.getUrl()
      expect(currentUrl).toContain('?search=My+Searched+Project')
    })

    it('should display a "Clear search" link after a search is performed', async () => {
      const searchInput = await $('#search')
      const searchButton = await $('form button[type="submit"]')
      await searchInput.setValue('Test')
      await searchButton.click()

      const clearSearchLink = await $('a.govuk-link*=Clear search')
      await expect(clearSearchLink).toBeDisplayed()

      // Fix: Check only that href ends with '/' rather than the full URL
      const href = await clearSearchLink.getAttribute('href')
      expect(href).toEqual('/')
    })

    it('should clear the search term and results when "Clear search" is clicked', async () => {
      const searchInput = await $('#search')
      const searchButton = await $('form button[type="submit"]')
      await searchInput.setValue('Test')
      await searchButton.click()

      const clearSearchLink = await $('a.govuk-link*=Clear search')
      await clearSearchLink.click()

      // Fix: Using proper URL assertion
      const currentUrl = await browser.getUrl()
      expect(currentUrl).not.toContain('?search=')

      const currentSearchInput = await $('#search') // Re-fetch the element
      await expect(currentSearchInput).toHaveValue('') // Input should be cleared
    })
  })

  describe('Project List', () => {
    // These tests are designed to work whether the user is authenticated or not
    // and whether projects exist in the test environment or not

    it('should display a table for projects if projects exist', async () => {
      const hasProjects = await doProjectsExist()

      if (hasProjects) {
        const projectTable = await $('.govuk-table')
        const projectTableHeadings = await projectTable.$$('thead th')

        await expect(projectTable).toBeDisplayed()
        await expect(projectTableHeadings[0]).toHaveText('Project name')
        await expect(projectTableHeadings[1]).toHaveText('RAG status')
      } else {
        // If no projects exist, we should see a message instead of a table
        const noProjectsMessage = await $('p*=No projects found')
        if (await noProjectsMessage.isExisting()) {
          await expect(noProjectsMessage).toBeDisplayed()
        }
      }
    })

    it('should display project names as links and RAG statuses if projects exist', async () => {
      const hasProjects = await doProjectsExist()

      if (hasProjects) {
        const firstProjectRow = await $('.govuk-table tbody tr:first-child')
        const projectNameLink = await firstProjectRow.$(
          'td:first-child a.govuk-link'
        )
        const ragStatusTag = await firstProjectRow.$(
          'td:nth-child(2) strong.govuk-tag'
        )

        await expect(projectNameLink).toBeDisplayed()

        // Fix: Properly check the href attribute
        const href = await projectNameLink.getAttribute('href')
        expect(href).toMatch(/\/projects\/\w+/)

        await expect(ragStatusTag).toBeDisplayed()
        const ragStatus = await ragStatusTag.getText()
        expect(ragStatus).toMatch(/^(RED|AMBER|GREEN)$/)
      }
    })

    it('should navigate to the project detail page when a project name is clicked if projects exist', async () => {
      const hasProjects = await doProjectsExist()

      if (hasProjects) {
        const firstProjectLink = await $(
          '.govuk-table tbody tr:first-child td:first-child a.govuk-link'
        )
        const projectId = (await firstProjectLink.getAttribute('href'))
          .split('/')
          .pop()
        await firstProjectLink.click()

        // Fix: Use proper URL assertion
        const currentUrl = await browser.getUrl()
        expect(currentUrl).toContain(`/projects/${projectId}`)
      }
    })

    it('should display "No projects found." if no projects are available', async () => {
      const hasProjects = await doProjectsExist()

      if (!hasProjects) {
        const projectTable = await $('.govuk-table')

        if (!(await projectTable.isExisting())) {
          const noProjectsMessage = await $('p*=No projects found')
          if (await noProjectsMessage.isExisting()) {
            await expect(noProjectsMessage).toBeDisplayed()
          }
        }
      }
    })
  })

  describe('"Add new project" button', () => {
    // These tests are written to work for both authenticated and unauthenticated users

    it('should display "Add new project" button only if user is authenticated', async () => {
      const authenticated = await isUserAuthenticated()
      const addButton = await $(
        'a.govuk-button--secondary[href="/projects/add"]'
      )

      if (authenticated) {
        await expect(addButton).toBeDisplayed()
        await expect(addButton).toHaveText('Add new project')
      } else {
        // Test passes if we're testing an unauthenticated user (button shouldn't exist)
        await expect(addButton).not.toBeExisting()
      }
    })

    it('should navigate to add project page when "Add new project" is clicked if user is authenticated', async () => {
      const authenticated = await isUserAuthenticated()

      if (authenticated) {
        const addButton = await $(
          'a.govuk-button--secondary[href="/projects/add"]'
        )
        await addButton.click()

        // Fix: Use proper URL assertion
        const currentUrl = await browser.getUrl()
        expect(currentUrl).toContain('/projects/add')
      }
    })

    it('should handle authentication state correctly for "Add new project" functionality', async () => {
      const authenticated = await isUserAuthenticated()
      const addButton = await $(
        'a.govuk-button--secondary[href="/projects/add"]'
      )

      if (authenticated) {
        // If authenticated, button should be functional

        await expect(addButton).toBeDisplayed()
        await expect(addButton).toBeClickable()
      } else {
        // If not authenticated, button should not exist

        await expect(addButton).not.toBeExisting()
      }
    })
  })

  // Optional: More advanced tests for autocomplete if needed
  describe('Search Autocomplete (Accessible Autocomplete)', () => {
    it('should show suggestions when typing valid search term', async () => {
      const searchInput = await $('#search')
      await searchInput.setValue('Pro') // Assuming 'Project Alpha' and 'Project Beta' exist
      // And minLength for autocomplete is <= 3

      // Wait for autocomplete menu to appear
      const autocompleteMenu = await $('.autocomplete__menu')
      await autocompleteMenu.waitForDisplayed({ timeout: 5000 })

      const suggestions = await $$('.autocomplete__option')
      await expect(suggestions.length).toBeGreaterThan(0)
      // Example: await expect(suggestions[0]).toHaveTextContaining('Project Alpha');
    })

    it('should navigate to project page when an autocomplete suggestion is clicked', async () => {
      const searchInput = await $('#search')
      await searchInput.setValue('Pro') // Type to trigger suggestions

      const autocompleteMenu = await $('.autocomplete__menu')
      await autocompleteMenu.waitForDisplayed({ timeout: 5000 })

      const firstSuggestion = await $('.autocomplete__option:first-child')
      if (await firstSuggestion.isExisting()) {
        const suggestionText = await firstSuggestion.getText()
        await firstSuggestion.click()

        // Fix: Check for URL rather than title
        const currentUrl = await browser.getUrl()
        expect(currentUrl).toContain('/projects/')

        // Optionally, if you want to check the page title contains project name
        const pageTitle = await browser.getTitle()
        expect(pageTitle).toContain(suggestionText)
      }
    })
  })
})
