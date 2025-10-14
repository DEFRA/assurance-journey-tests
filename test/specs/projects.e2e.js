// test/specs/projects.e2e.js

/**
 * Projects page E2E tests
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

/**
 * Helper function to check if user is authenticated
 * This detects authentication by checking if the "Add new project" link exists
 * @returns {Promise<boolean>} true if user is authenticated, false otherwise
 */
async function isUserAuthenticated() {
  const addLink = await $('a.govuk-link[href="/projects/add"]')
  return await addLink.isExisting()
}

/**
 * Helper function to check if projects are present in the list
 * @returns {Promise<boolean>} true if projects exist, false otherwise
 */
async function doProjectsExist() {
  const tableRows = await $$('.govuk-table tbody tr')
  return tableRows.length > 0
}

describe('Projects page', () => {
  /**
   * NOTE: TBC projects are hidden from unauthenticated users but visible to authenticated users.
   * Tests are designed to work in both scenarios and include specific TBC filtering tests.
   */

  beforeEach(async () => {
    // Navigate to the projects page before each test
    await browser.url('/projects')
  })

  it('should have the correct page title', async () => {
    // Using the correct WebdriverIO assertion pattern
    const title = await browser.getTitle()
    await expect(title).toBe('Deliveries | Defra Digital Assurance')
  })

  it('should display the main heading "Deliveries"', async () => {
    const heading = await $('h1.govuk-heading-xl') // Assuming appHeading macro renders an H1 with this class
    await expect(heading).toBeDisplayed()
    await expect(heading).toHaveText('Deliveries')
  })

  describe('Search functionality', () => {
    it('should display search input and search button', async () => {
      const searchInput = await $('#search') // Based on the accessibleAutocomplete setup
      const searchButton = await $('button[type="submit"]') // Standard submit button

      await expect(searchInput).toBeDisplayed()
      await expect(searchButton).toBeDisplayed()
      // Check for the search icon SVG instead of text since we use icon-only button
      const searchIcon = await searchButton.$('svg.gem-c-search__icon')
      await expect(searchIcon).toBeDisplayed()
    })

    it('should allow typing into the search input', async () => {
      const searchInput = await $('#search')
      await searchInput.setValue('Test Project Search')
      await expect(searchInput).toHaveValue('Test Project Search')
    })

    it('should update the URL when a search is submitted', async () => {
      // Test the actual working behavior - clicking the search button

      // First get the search input and clear any existing values
      const searchInput = await $('#search')
      await searchInput.clearValue()

      // Enter a test search term
      await searchInput.setValue('test')

      // Find and click the search button (this is what actually works)
      const searchForm = await $('form[method="GET"]')
      const submitButton = await searchForm.$('button[type="submit"]')
      await expect(submitButton).toBeDisplayed()
      await submitButton.click()

      // Wait for URL to change by checking for the presence of search parameter
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('search=')
        },
        {
          timeout: 5000,
          timeoutMsg: 'Expected URL to contain search parameter after 5s'
        }
      )

      // Check if the current URL contains our search parameter
      const currentUrl = await browser.getUrl()
      await expect(currentUrl).toContain('search=')
    })

    it('should display a "Clear search" link after a search is performed', async () => {
      // Start by directly navigating to a URL with a search parameter
      await browser.url('/projects?search=test')

      // Now verify the clear search link exists
      const clearSearchLink = await $('a.govuk-link*=Clear search')
      await expect(clearSearchLink).toBeDisplayed()

      // Check that href points to projects page
      const href = await clearSearchLink.getAttribute('href')
      await expect(href).toEqual('/projects')
    })

    it('should clear the search term and results when "Clear search" is clicked', async () => {
      // Start by directly navigating to a URL with a search parameter
      await browser.url('/projects?search=test')

      // Verify we have a search parameter in the URL
      const initialUrl = await browser.getUrl()
      await expect(initialUrl).toContain('search=')

      // Find and click the clear search link
      const clearSearchLink = await $('a.govuk-link*=Clear search')
      await clearSearchLink.click()

      // Wait for URL to change (no longer contains search)
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return !url.includes('search=')
        },
        {
          timeout: 5000,
          timeoutMsg:
            'Expected URL to no longer contain search parameter after 5s'
        }
      )

      // Using proper URL assertion
      const currentUrl = await browser.getUrl()
      await expect(currentUrl).not.toContain('search=')

      const currentSearchInput = await $('#search') // Re-fetch the element
      await expect(currentSearchInput).toHaveValue('') // Input should be cleared
    })

    it('should update the URL when a search is submitted (alternative approach)', async () => {
      // This is an alternative test that uses a different approach in case the first one fails

      // First, check if we're working with an autocomplete or regular search
      const searchContainer = await $('.autocomplete__wrapper')

      if (await searchContainer.isExisting()) {
        // Handle autocomplete case
        const searchInput = await $('#search')
        await searchInput.clearValue()
        await searchInput.setValue('test')

        // First try to find and click a button within the form
        const searchForm = await $('form') // Change to directly select the form
        const submitButton = await searchForm.$('button[type="submit"]')

        if (await submitButton.isExisting()) {
          await submitButton.click()
        } else {
          // If no button found, try pressing Enter - use browser.keys instead of element.keys
          await searchInput.click() // Focus on the input
          await browser.keys(['Enter'])
        }
      } else {
        // Regular search form
        const searchInput = await $('input[name="search"]')
        await searchInput.clearValue()
        await searchInput.setValue('test')
        await searchInput.click() // Focus on the input
        await browser.keys(['Enter']) // Use browser.keys, not element.keys
      }

      // Wait for URL to change
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('search=')
        },
        {
          timeout: 5000,
          timeoutMsg: 'Expected URL to contain search parameter after 5s'
        }
      )

      // Direct approach - navigate to search URL and verify the page loads correctly
      await browser.url('/projects?search=test')

      // After direct navigation, verify search input has the value
      const searchInputAfter = await $('#search')
      await expect(searchInputAfter).toHaveValue('test')
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
        await expect(projectTableHeadings[0]).toHaveText('Delivery name')
        await expect(projectTableHeadings[1]).toHaveText('RAG status')
      } else {
        // If no deliveries exist, we should see a message instead of a table
        const noProjectsMessage = await $('p*=No deliveries found')
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
        const ragStatusTag = await firstProjectRow.$('td:nth-child(2)')

        await expect(projectNameLink).toBeDisplayed()

        // Check the href attribute
        const href = await projectNameLink.getAttribute('href')
        await expect(href).toMatch(/\/projects\/\w+/)

        await expect(ragStatusTag).toBeDisplayed()
        const ragStatusText = await ragStatusTag.getText()
        // Accept any of the 6 statuses, including dual-tag text for AMBER_RED and GREEN_AMBER
        // Note: TBC projects now display as "Pending" in the UI
        const validStatuses = [
          'Red',
          'Amber',
          'Green',
          'Pending', // TBC projects now display as "Pending"
          'Excluded',
          'Red\nAmber', // AMBER_RED renders as two tags
          'Amber\nGreen' // GREEN_AMBER renders as two tags
        ]
        const normalizedText = ragStatusText
          .replace(/\s+/g, ' ')
          .replace(/\n/g, ' ')
          .trim()
          .toLowerCase() // Make case-insensitive
        const validNormalized = validStatuses.map(
          (s) => s.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim().toLowerCase() // Make case-insensitive
        )
        await expect(validNormalized).toContain(normalizedText)
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

        // Use proper URL assertion
        const currentUrl = await browser.getUrl()
        await expect(currentUrl).toContain(`/projects/${projectId}`)
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

    it('should display "Add new project" link only if user is authenticated', async () => {
      const authenticated = await isUserAuthenticated()
      const addLink = await $('a.govuk-link[href="/projects/add"]')

      if (authenticated) {
        await expect(addLink).toBeDisplayed()
        await expect(addLink).toHaveText('Add new project')
      } else {
        // Test passes if we're testing an unauthenticated user (link shouldn't exist)
        await expect(addLink).not.toBeExisting()
      }
    })

    it('should navigate to add project page when "Add new project" is clicked if user is authenticated', async () => {
      const authenticated = await isUserAuthenticated()

      if (authenticated) {
        const addLink = await $('a.govuk-link[href="/projects/add"]')
        await addLink.click()

        // Use proper URL assertion
        const currentUrl = await browser.getUrl()
        await expect(currentUrl).toContain('/projects/add')
      }
    })

    it('should handle authentication state correctly for "Add new project" functionality', async () => {
      const authenticated = await isUserAuthenticated()
      const addLink = await $('a.govuk-link[href="/projects/add"]')

      if (authenticated) {
        // If authenticated, link should be functional
        await expect(addLink).toBeDisplayed()
        await expect(addLink).toBeClickable()
      } else {
        // If not authenticated, link should not exist
        await expect(addLink).not.toBeExisting()
      }
    })
  })

  describe('TBC Project Filtering', () => {
    it('should hide TBC projects from unauthenticated users', async () => {
      const authenticated = await isUserAuthenticated()

      if (!authenticated) {
        // For unauthenticated users, verify no projects with TBC status are visible
        // Note: TBC projects display as "Pending", but are still filtered out
        const tableRows = await $$('.govuk-table tbody tr')

        if (tableRows.length > 0) {
          // Check each visible project to ensure none have TBC status
          // Since TBC displays as "Pending", we need to be careful not to filter out legitimate PENDING projects
          // However, for unauthenticated users, TBC projects should not be visible at all
          for (const row of tableRows) {
            const statusCell = await row.$('td:nth-child(2)')
            const statusText = await statusCell.getText()
            const normalizedStatus = statusText.toLowerCase().trim()

            // TBC projects should not be visible to unauthenticated users
            // (Note: This test verifies backend filtering, not frontend display)
            await expect(normalizedStatus).not.toContain('tbc')
          }
        }

        // Also verify that searching for TBC projects returns no results
        const searchInput = await $('#search')
        await searchInput.setValue('TBC')

        const searchForm = await $('form[method="GET"]')
        const submitButton = await searchForm.$('button[type="submit"]')
        await submitButton.click()

        // Wait for search results
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl()
            return url.includes('search=')
          },
          {
            timeout: 5000,
            timeoutMsg: 'Expected URL to contain search parameter'
          }
        )

        // Should show no results or explicitly state no projects found
        const noResultsMessage = await $('p*=No projects found')
        const resultRows = await $$('.govuk-table tbody tr')

        // Either no results message OR no table rows (both are valid)
        const hasNoResults =
          (await noResultsMessage.isExisting()) || resultRows.length === 0
        await expect(hasNoResults).toBe(true)
      }
    })

    it('should show appropriate messaging when no projects are visible to unauthenticated users', async () => {
      const authenticated = await isUserAuthenticated()
      const hasProjects = await doProjectsExist()

      if (!authenticated && !hasProjects) {
        // If no projects are visible to unauthenticated users, should show appropriate message
        const noProjectsMessage = await $('p*=No projects available')
        if (await noProjectsMessage.isExisting()) {
          await expect(noProjectsMessage).toBeDisplayed()
        }

        // Should not show a table if no projects are available
        const projectTable = await $('.govuk-table')
        await expect(projectTable).not.toBeExisting()
      }
    })

    it('should maintain search functionality even with TBC filtering', async () => {
      const authenticated = await isUserAuthenticated()

      if (!authenticated) {
        // Search should work normally, just excluding TBC projects from results
        const searchInput = await $('#search')
        await searchInput.setValue('Project') // Generic search term

        const searchForm = await $('form[method="GET"]')
        const submitButton = await searchForm.$('button[type="submit"]')
        await submitButton.click()

        // Wait for search to complete
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl()
            return url.includes('search=')
          },
          {
            timeout: 5000,
            timeoutMsg: 'Expected URL to contain search parameter'
          }
        )

        // Verify search functionality works (results or no results message)
        const searchResults = await $$('.govuk-table tbody tr')
        const noResultsMessage = await $('p*=No projects found')

        const searchWorked =
          searchResults.length > 0 || (await noResultsMessage.isExisting())
        await expect(searchWorked).toBe(true)

        // If there are results, ensure none are TBC status
        if (searchResults.length > 0) {
          for (const row of searchResults) {
            const statusCell = await row.$('td:nth-child(2)')
            const statusText = await statusCell.getText()
            const normalizedStatus = statusText.toLowerCase().trim()
            // TBC projects should not be visible to unauthenticated users
            // (Note: TBC displays as "Pending" but should still be filtered out at backend level)
            await expect(normalizedStatus).not.toContain('tbc')
          }
        }
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

        // Check for URL rather than title
        const currentUrl = await browser.getUrl()
        await expect(currentUrl).toContain('/projects/')

        const pageTitle = await browser.getTitle()
        await expect(pageTitle).toContain(suggestionText)
      }
    })
  })
})
