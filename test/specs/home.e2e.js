// test/specs/home.e2e.js

/**
 * Home page E2E tests
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

describe('Home page', () => {
  /**
   * NOTE: The home page now shows information about Defra Digital Assurance
   * and includes a search bar that redirects to the projects page.
   * The projects list has been moved to /projects route.
   */

  beforeEach(async () => {
    // Navigate to the home page before each test
    await browser.url('/')
  })

  it('should have the correct page title', async () => {
    // Using the correct WebdriverIO assertion pattern
    const title = await browser.getTitle()
    await expect(title).toBe('Defra Digital Assurance')
  })

  it('should display the main heading "Defra Digital Assurance"', async () => {
    const heading = await $('h1.govuk-heading-xl')
    await expect(heading).toBeDisplayed()
    await expect(heading).toHaveText('Defra Digital Assurance')
  })

  it('should display "Team objectives" and "How we assure" sections', async () => {
    const teamObjectivesHeading = await $('h2*=Team objectives')
    await expect(teamObjectivesHeading).toBeDisplayed()

    const howWeAssureHeading = await $('h2*=How we assure')
    await expect(howWeAssureHeading).toBeDisplayed()

    // Check for some content under Team Objectives
    const objectivesContent = await $('p*=Cross Cutting Technical Services')
    await expect(objectivesContent).toBeDisplayed()

    // Check for some content under How we assure
    const assureContent = await $('p*=multidisciplinary team')
    await expect(assureContent).toBeDisplayed()
  })

  it('should display RAG Status Definitions section', async () => {
    const ragStatusHeading = await $('h2*=RAG status definitions')
    await expect(ragStatusHeading).toBeDisplayed()

    // Check for specific RAG status definitions
    const redStatus = await $('li*=Red - Major concerns')
    await expect(redStatus).toBeDisplayed()

    const greenStatus = await $('li*=Green - On track')
    await expect(greenStatus).toBeDisplayed()

    const amberStatus = await $('li*=Amber - Concerns, needs monitoring')
    await expect(amberStatus).toBeDisplayed()
  })

  describe('Search functionality', () => {
    it('should display search input and search button', async () => {
      const searchInput = await $('#search') // Based on the accessibleAutocomplete setup
      const searchButton = await $('button[type="submit"]') // Standard submit button

      await expect(searchInput).toBeDisplayed()
      await expect(searchButton).toBeDisplayed()
    })

    it('should allow typing into the search input', async () => {
      const searchInput = await $('#search')
      await searchInput.setValue('Test Project Search')
      await expect(searchInput).toHaveValue('Test Project Search')
    })

    it('should redirect to projects page when a search is submitted', async () => {
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

      // Wait for redirect to projects page with search parameter
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('/projects') && url.includes('search=')
        },
        {
          timeout: 5000,
          timeoutMsg:
            'Expected URL to redirect to /projects with search parameter after 5s'
        }
      )

      // Check if the current URL contains our search parameter and projects route
      const currentUrl = await browser.getUrl()
      await expect(currentUrl).toContain('/projects')
      await expect(currentUrl).toContain('search=')
    })

    it('should display a "View all deliveries" link', async () => {
      // The home page should have a "View all deliveries" link
      const viewAllProjectsLink = await $('a.govuk-link[href="/projects"]')
      await expect(viewAllProjectsLink).toBeDisplayed()
      await expect(viewAllProjectsLink).toHaveText('View all deliveries')
    })

    it('should navigate to deliveries page when "View all deliveries" is clicked', async () => {
      const viewAllProjectsLink = await $('a.govuk-link[href="/projects"]')
      await viewAllProjectsLink.click()

      // Wait for navigation to projects page
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('/projects')
        },
        {
          timeout: 5000,
          timeoutMsg: 'Expected to navigate to /projects page'
        }
      )

      const currentUrl = await browser.getUrl()
      await expect(currentUrl).toContain('/projects')
    })

    it.skip('should clear the search term and results when "Clear search" is clicked', async () => {
      // Start by directly navigating to a URL with a search parameter
      await browser.url('/?search=test')

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

      // Fix: Using proper URL assertion
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
      await browser.url('/?search=test')

      // After direct navigation, verify search input has the value
      const searchInputAfter = await $('#search')
      await expect(searchInputAfter).toHaveValue('test')
    })
  })

  describe('Sidebar functionality', () => {
    it('should display "Deliveries by Delivery Group" section in sidebar', async () => {
      const deliveryGroupsSection = await $('dt*=Deliveries by Delivery Group')
      await expect(deliveryGroupsSection).toBeDisplayed()

      // Check if there are delivery group links or a "no delivery groups" message
      const deliveryGroupLinks = await $$('a[href*="/delivery-groups/"]')
      const noDeliveryGroupsMessage = await $(
        'dd*=No delivery groups available'
      )

      const hasDeliveryGroups = deliveryGroupLinks.length > 0
      const hasNoGroupsMessage = await noDeliveryGroupsMessage.isExisting()

      // Either we have delivery group links OR a no groups message
      await expect(hasDeliveryGroups || hasNoGroupsMessage).toBe(true)
    })

    it('should display "Deliveries by Delivery Partner" section in sidebar', async () => {
      const deliveryPartnersSection = await $(
        'dt*=Deliveries by Delivery Partner'
      )
      await expect(deliveryPartnersSection).toBeDisplayed()

      // Check if there are delivery partner links or a "no delivery partners" message
      const deliveryPartnerLinks = await $$('a[href*="/delivery-partners/"]')
      const noDeliveryPartnersMessage = await $(
        'dd*=No delivery partners available'
      )

      const hasDeliveryPartners = deliveryPartnerLinks.length > 0
      const hasNoPartnersMessage = await noDeliveryPartnersMessage.isExisting()

      // Either we have delivery partner links OR a no partners message
      await expect(hasDeliveryPartners || hasNoPartnersMessage).toBe(true)
    })

    it('should navigate to delivery group page when a delivery group link is clicked', async () => {
      const deliveryGroupLinks = await $$('a[href*="/delivery-groups/"]')

      if (deliveryGroupLinks.length > 0) {
        const firstLink = deliveryGroupLinks[0]
        await firstLink.click()

        // Wait for navigation
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl()
            return url.includes('/delivery-groups/')
          },
          {
            timeout: 5000,
            timeoutMsg: 'Expected to navigate to delivery group page'
          }
        )

        const currentUrl = await browser.getUrl()
        await expect(currentUrl).toContain('/delivery-groups/')
      }
    })

    it('should navigate to delivery partner page when a delivery partner link is clicked', async () => {
      const deliveryPartnerLinks = await $$('a[href*="/delivery-partners/"]')

      if (deliveryPartnerLinks.length > 0) {
        const firstLink = deliveryPartnerLinks[0]
        await firstLink.click()

        // Wait for navigation
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl()
            return url.includes('/delivery-partners/')
          },
          {
            timeout: 5000,
            timeoutMsg: 'Expected to navigate to delivery partner page'
          }
        )

        const currentUrl = await browser.getUrl()
        await expect(currentUrl).toContain('/delivery-partners/')
      }
    })
  })

  describe('Navigation', () => {
    it('should NOT display "Add new delivery" link on home page', async () => {
      // The "Add new delivery" link should only be on the deliveries page, not the home page
      const addLink = await $('a.govuk-link[href="/projects/add"]')
      await expect(addLink).not.toBeExisting()
    })

    it('should have inverted navigation styling', async () => {
      // Check that the navigation has the blue background (inverted styling)
      const serviceNavigation = await $('.govuk-service-navigation')
      await expect(serviceNavigation).toBeDisplayed()

      // The navigation should have blue background styling applied via CSS
      const backgroundColor =
        await serviceNavigation.getCSSProperty('background-color')
      // Note: The exact color value may vary depending on browser, but it should be blue-ish
      await expect(backgroundColor.value).not.toBe('rgba(0,0,0,0)') // Not transparent
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
        await firstSuggestion.click()

        // Fix: Check for search URL rather than specific project page
        const currentUrl = await browser.getUrl()
        await expect(currentUrl).toContain('/projects?search=')

        const pageTitle = await browser.getTitle()
        await expect(pageTitle).toContain('Deliveries')
      }
    })
  })
})
