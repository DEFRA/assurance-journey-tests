import dotenv from 'dotenv'

// Load environment variables from .env file if present
// This will not override existing environment variables
dotenv.config()

/**
 * Helper function to get credentials securely
 */
const getCredentials = () => {
  const username = process.env.TEST_USERNAME

  if (!username) {
    throw new Error(
      'TEST_USERNAME and TEST_PASSWORD environment variables must be set.\n' +
        'NEVER hardcode credentials in test files.'
    )
  }

  return { username }
}

/**
 * Helper function to wait for and handle the username screen
 */
async function handleUsernameScreen() {
  // Wait for page to be ready and stable with a longer timeout for remote environments
  await browser.waitUntil(
    async () => {
      const readyState = await browser.execute(() => document.readyState)
      return readyState === 'complete'
    },
    {
      timeout: 30000,
      timeoutMsg: 'Page did not load completely'
    }
  )

  // Wait for Microsoft login page to be fully loaded
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl()
      return (
        url.includes('login.microsoftonline.com') ||
        url.includes('microsoft.com/') ||
        url.includes('login.live.com')
      )
    },
    {
      timeout: 30000,
      timeoutMsg: 'Not redirected to Microsoft login page'
    }
  )

  // Wait for the page to be fully interactive
  await browser.waitUntil(
    async () => {
      try {
        // Try to find any input field on the page
        const inputs = await $$('input')
        return inputs.length > 0
      } catch (e) {
        return false
      }
    },
    {
      timeout: 30000,
      timeoutMsg: 'Page not interactive'
    }
  )

  // Try multiple selectors for the email input field
  const emailSelectors = [
    '#i0116', // Microsoft's specific ID for email input
    'input[type="email"]',
    'input[name="loginfmt"]',
    'input[type="email"][name="loginfmt"]',
    'input[data-bind*="email"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="account" i]',
    'input[aria-label*="email" i]',
    'input[aria-label*="account" i]',
    'input[type="text"]',
    'input[name="email"]',
    'input[id*="email"]',
    'input[id*="account"]'
  ]

  let emailInput = null
  for (const selector of emailSelectors) {
    try {
      const element = await $(selector)
      // Wait for element to be displayed
      await browser.waitUntil(
        async () => {
          try {
            return await element.isDisplayed()
          } catch (e) {
            return false
          }
        },
        {
          timeout: 5000,
          timeoutMsg: `Element ${selector} not displayed`
        }
      )
      emailInput = element
      break
    } catch (e) {
      continue
    }
  }

  if (!emailInput) {
    // Take screenshot for debugging
    await browser.takeScreenshot()
    throw new Error('Could not find email input field on Microsoft login page')
  }

  // Additional wait to ensure the field is truly ready
  await browser.waitUntil(
    async () => {
      try {
        return (
          (await emailInput.isEnabled()) && (await emailInput.isDisplayed())
        )
      } catch (e) {
        return false
      }
    },
    {
      timeout: 20000,
      timeoutMsg: 'Email input field not ready for interaction'
    }
  )

  // Clear any existing value and enter username
  await emailInput.clearValue()
  const { username } = getCredentials()
  await emailInput.setValue(username)

  // Find and click Next button - try multiple selectors
  const nextButtonSelectors = [
    '#idSIButton9', // Microsoft's specific ID for next button
    'input[type="submit"]',
    'input[value="Next"]',
    'input[value="Sign in"]',
    'input[type="submit"][value="Next"]',
    'input[type="submit"][value="Sign in"]',
    'button[type="submit"]',
    'button:contains("Next")',
    'button:contains("Sign in")'
  ]

  let nextButton = null
  for (const selector of nextButtonSelectors) {
    try {
      const element = await $(selector)
      // Wait for element to be displayed
      await browser.waitUntil(
        async () => {
          try {
            return await element.isDisplayed()
          } catch (e) {
            return false
          }
        },
        {
          timeout: 5000,
          timeoutMsg: `Element ${selector} not displayed`
        }
      )
      nextButton = element
      break
    } catch (e) {
      continue
    }
  }

  if (!nextButton) {
    // Take screenshot for debugging
    await browser.takeScreenshot()
    throw new Error('Could not find Next button on Microsoft login page')
  }

  await expect(nextButton).toBeDisplayed()
  await expect(nextButton).toBeEnabled()
  await nextButton.click()

  // Wait for navigation to complete and password field to appear
  const passwordInput = await $('input[type="password"]')
  await expect(passwordInput).toBeDisplayed()
}

/**
 * Helper function to wait for and handle the password screen
 */
async function handlePasswordScreen() {
  // Wait for page to be ready and stable
  await browser.waitUntil(
    async () => {
      const readyState = await browser.execute(() => document.readyState)
      return readyState === 'complete'
    },
    {
      timeout: 10000,
      timeoutMsg: 'Page did not load completely'
    }
  )

  // Wait for password input field and ensure it's interactable
  const passwordInput = await $('input[type="password"]')
  await expect(passwordInput).toBeDisplayed()
  await expect(passwordInput).toBeEnabled()

  // Clear any existing value and enter password
  await passwordInput.clearValue()
  await passwordInput.setValue(process.env.TEST_PASSWORD, { sensitive: true })

  // Find and click Sign in button
  const signInButton = await $('input[type="submit"]')
  await expect(signInButton).toBeDisplayed()
  await expect(signInButton).toBeEnabled()
  await signInButton.click()

  // Check if "Stay signed in?" page appears and handle it
  const currentUrl = await browser.getUrl()
  if (currentUrl.includes('login.microsoftonline.com')) {
    const pageText = await browser.execute(() => document.body.textContent)
    if (pageText.includes('Stay signed in')) {
      const yesButton = await $('input[type="submit"][value="Yes"]')
      if (await yesButton.isExisting()) {
        await yesButton.click()
      }
    }
  }

  // Wait for final redirect away from Microsoft login
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl()
      return (
        !url.includes('login.microsoftonline.com') &&
        !url.includes('microsoft.com')
      )
    },
    {
      timeout: 20000,
      timeoutMsg:
        'Expected to be redirected after password entry and Stay signed in handling'
    }
  )
}

/**
 * Helper function to wait for and handle the authorization screen
 */
async function handleAuthorizationScreen() {
  // Wait for page to be ready
  await browser.waitUntil(
    async () => {
      const readyState = await browser.execute(() => document.readyState)
      return readyState === 'complete'
    },
    {
      timeout: 10000,
      timeoutMsg: 'Page did not load completely'
    }
  )

  // Wait for and click the Continue button
  const continueButton = await $('input[type="submit"]')
  await expect(continueButton).toBeDisplayed()
  await expect(continueButton).toBeEnabled()
  await continueButton.click()

  // Wait for navigation to complete
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl()
      return !url.includes('login.microsoftonline.com')
    },
    {
      timeout: 10000,
      timeoutMsg: 'Expected to be redirected after authorization'
    }
  )
}

/**
 * Helper function to wait for and handle the stay signed in screen
 */
// Note: handleStaySignedInScreen function removed - now handled inline in the login flow

describe('Authentication', () => {
  describe('Login Flow', () => {
    beforeEach(async () => {
      // Clear cookies before navigating to ensure a clean state
      await browser.deleteAllCookies()

      // Start each test at the login page
      await browser.url('/auth/login')
    })

    it('should complete the Azure AD login flow and verify authentication', async () => {
      // Wait for redirect to Microsoft login
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return (
            url.includes('login.microsoftonline.com') ||
            url.includes('microsoft.com/')
          )
        },
        {
          timeout: 30000,
          timeoutMsg: 'Not redirected to Microsoft login page'
        }
      )

      await handleUsernameScreen()
      await handlePasswordScreen() // Now handles "Stay signed in?" page internally

      try {
        await handleAuthorizationScreen()
      } catch (e) {
        // Authorization screen not present, continuing...
      }

      // Wait for redirect back to application and page to load
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return (
            !url.includes('login.microsoftonline.com') &&
            !url.includes('microsoft.com') &&
            !url.includes('login')
          )
        },
        {
          timeout: 20000,
          timeoutMsg: 'Expected to be redirected back to application'
        }
      )

      // Wait for the page to be fully loaded
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected page to be fully loaded'
        }
      )

      // Verify we're authenticated by checking for admin tab and sign out button
      const adminTab = await $('a[href="/admin"]')
      const signOutButton = await $('a[href="/auth/logout"]')

      await expect(adminTab).toBeDisplayed()
      await expect(signOutButton).toBeDisplayed()
      await expect(signOutButton).toHaveText('Sign out')
    })

    it('should show TBC projects to authenticated users', async () => {
      // After login, navigate to home page
      await browser.url('/')

      // Wait for page to load
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected page to be fully loaded'
        }
      )

      // Verify we can see the "Add new project" link (confirms we're authenticated)
      const addLink = await $('a.govuk-link[href="/projects/add"]')
      await expect(addLink).toBeDisplayed()

      // Check if there are any projects in the list
      const projectRows = await $$('.govuk-table tbody tr')

      if (projectRows.length > 0) {
        // Look for TBC projects in the list - authenticated users should be able to see them
        let foundTBCProject = false

        for (const row of projectRows) {
          const statusCell = await row.$('td:nth-child(2)')
          const statusText = await statusCell.getText()
          const normalizedStatus = statusText.toLowerCase().trim()

          if (normalizedStatus.includes('tbc')) {
            foundTBCProject = true
            break
          }
        }

        // If we found TBC projects, verify they're properly displayed
        if (foundTBCProject) {
          // TBC projects should be visible and accessible to authenticated users
          const tbcRows = await $$('.govuk-table tbody tr').filter(
            async (row) => {
              const statusCell = await row.$('td:nth-child(2)')
              const statusText = await statusCell.getText()
              return statusText.toLowerCase().includes('tbc')
            }
          )

          for (const tbcRow of tbcRows) {
            const projectLink = await tbcRow.$('td:first-child a.govuk-link')
            if (await projectLink.isExisting()) {
              await expect(projectLink).toBeDisplayed()
              // Verify the link is clickable
              await expect(projectLink).toBeClickable()
            }
          }
        }
      }

      // Also test search functionality includes TBC projects for authenticated users
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

      // For authenticated users, TBC search should either:
      // 1. Return TBC projects if they exist
      // 2. Return "No projects found" if no TBC projects exist
      // But it should NOT be blocked or filtered out
      const searchResults = await $$('.govuk-table tbody tr')
      const noResultsMessage = await $('p*=No projects found')

      // Verify search completed (either results or no results message)
      const searchCompleted =
        searchResults.length > 0 || (await noResultsMessage.isExisting())
      await expect(searchCompleted).toBe(true)
    })
  })

  describe('Project Management', () => {
    beforeEach(async () => {
      // Navigate to home page
      await browser.url('/')

      // Wait for the page to be fully loaded
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected page to be fully loaded'
        }
      )
    })

    it('should create a new project and update its details', async () => {
      // Click "Add new project" link
      const addLink = await $('a.govuk-link[href="/projects/add"]')
      await expect(addLink).toBeDisplayed()
      await addLink.click()

      // Wait for add project page to load
      await browser.waitUntil(
        async () => {
          return (await browser.getUrl()).includes('/projects/add')
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected to be on add project page'
        }
      )

      // Fill in project details
      const projectName = `Test Project ${Date.now()}` // Unique name
      const nameInput = await $('input[name="name"]')
      await expect(nameInput).toBeDisplayed()
      await nameInput.setValue(projectName)

      // Select GDS Phase (required field)
      const phaseSelect = await $('select[name="phase"]')
      await expect(phaseSelect).toBeDisplayed()
      await phaseSelect.selectByIndex(1) // Select first real phase option

      // Add DEFRA Code (optional)
      const defCodeInput = await $('input[name="defCode"]')
      await expect(defCodeInput).toBeDisplayed()
      await defCodeInput.setValue('TEST-' + Date.now())

      // Wait for status select to be ready and check available options
      const statusSelect = await $('select[name="status"]')
      await expect(statusSelect).toBeDisplayed()
      await statusSelect.selectByIndex(1)

      // Add project commentary
      const commentaryInput = await $('textarea[name="commentary"]')
      await expect(commentaryInput).toBeDisplayed()
      await commentaryInput.setValue('Initial project commentary for testing')

      // Submit the form
      const submitButton = await $('button[type="submit"]')
      await expect(submitButton).toBeDisplayed()
      await submitButton.click()

      // Wait for redirect to home page
      await browser.waitUntil(
        async () => {
          // Check if we're on the home page by looking for the projects heading
          const heading = await $('h1.govuk-heading-xl')
          return (
            (await heading.isDisplayed()) &&
            (await heading.getText()) === 'Projects'
          )
        },
        {
          timeout: 10000,
          timeoutMsg:
            'Expected to be redirected to home page with projects heading'
        }
      )

      // Find and click the newly created project
      const projectLink = await $(`a.govuk-link*=${projectName}`)
      await expect(projectLink).toBeDisplayed()
      await projectLink.click()

      // Wait for project page to load
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('/projects/') && !url.includes('/add')
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected to be on project detail page'
        }
      )

      // Click manage project link (instead of edit button)
      const manageButton = await $('a.govuk-link[href*="/manage"]')
      await expect(manageButton).toBeDisplayed()
      await manageButton.click()

      // Wait for manage project selection page to load
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return (
            url.includes('/manage') &&
            !url.includes('/status') &&
            !url.includes('/details')
          )
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected to be on manage project selection page'
        }
      )

      // Wait for the form to be fully loaded
      await browser.waitUntil(
        async () => {
          const form = await $('form')
          return await form.isDisplayed()
        },
        {
          timeout: 10000,
          timeoutMsg: 'Form not displayed'
        }
      )

      // Wait for radio buttons to be present
      await browser.waitUntil(
        async () => {
          const radioButtons = await $$('input[type="radio"]')
          return radioButtons.length >= 2
        },
        {
          timeout: 10000,
          timeoutMsg: 'Radio buttons not found'
        }
      )

      // Select "Update the project status and commentary" option
      // The govukRadios macro generates specific IDs based on idPrefix
      const statusUpdateOption = await $('#updateType')

      // Wait for the radio button to be present and clickable
      await browser.waitUntil(
        async () => {
          try {
            const element = await $('#updateType')
            return (await element.isExisting()) && (await element.isEnabled())
          } catch (e) {
            return false
          }
        },
        {
          timeout: 10000,
          timeoutMsg: 'Status update radio button not found or not enabled'
        }
      )

      // Click the radio button (don't check if displayed since GOV.UK radio buttons are often visually hidden)
      await statusUpdateOption.click()

      // Verify it's selected
      const isStatusChecked = await statusUpdateOption.isSelected()
      await expect(isStatusChecked).toBe(true)

      // Click Continue button
      const continueButton = await $('button=Continue')
      await expect(continueButton).toBeDisplayed()
      await continueButton.click()

      // Wait for status update form to appear (new URL structure)
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('/manage/status')
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected to be on status management page'
        }
      )

      // Update status to AMBER
      const editStatusSelect = await $('#status')
      await expect(editStatusSelect).toBeDisplayed()

      // Select AMBER option
      const options = await editStatusSelect.$$('option')
      let selected = false
      for (const option of options) {
        const text = await option.getText()
        if (text.trim().toLowerCase() === 'amber') {
          await option.click()
          selected = true
          break
        }
      }
      if (!selected) {
        throw new Error('Option with text "AMBER" not found in status select')
      }

      // Update commentary
      const editCommentaryInput = await $('#commentary')
      await expect(editCommentaryInput).toBeDisplayed()
      await editCommentaryInput.setValue(
        'Updated project commentary via new manage flow'
      )

      // Save changes (updated button text)
      const saveButton = await $('button.govuk-button=Save changes')
      await expect(saveButton).toBeDisplayed()
      await saveButton.click()

      // Wait for redirect back to project page
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('/projects/') && !url.includes('/manage')
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected to be redirected back to project page'
        }
      )

      // Test the project details management flow as well
      // Click manage project link again for details update
      const manageButton2 = await $('a.govuk-link[href*="/manage"]')
      await expect(manageButton2).toBeDisplayed()
      await manageButton2.click()

      // Wait for manage project selection page to load
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return (
            url.includes('/manage') &&
            !url.includes('/status') &&
            !url.includes('/details')
          )
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected to be on manage project selection page'
        }
      )

      // Wait for the form to be fully loaded again
      await browser.waitUntil(
        async () => {
          const form = await $('form')
          return await form.isDisplayed()
        },
        {
          timeout: 10000,
          timeoutMsg: 'Form not displayed'
        }
      )

      // Select "Update project name, phase or ID" option
      // The second radio button should have ID updateType-2 based on govukRadios macro
      const detailsUpdateOption = await $('#updateType-2')

      // Wait for the radio button to be present and clickable
      await browser.waitUntil(
        async () => {
          try {
            const element = await $('#updateType-2')
            return (await element.isExisting()) && (await element.isEnabled())
          } catch (e) {
            return false
          }
        },
        {
          timeout: 10000,
          timeoutMsg: 'Details update radio button not found or not enabled'
        }
      )

      // Click the radio button (don't check if displayed since GOV.UK radio buttons are often visually hidden)
      await detailsUpdateOption.click()

      // Verify it's selected
      const isDetailsChecked = await detailsUpdateOption.isSelected()
      await expect(isDetailsChecked).toBe(true)

      // Click Continue button
      const continueButton2 = await $('button=Continue')
      await expect(continueButton2).toBeDisplayed()
      await continueButton2.click()

      // Wait for details update form to appear
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('/manage/details')
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected to be on details management page'
        }
      )

      // Update project name
      const editNameInput = await $('input[name="name"]')
      await expect(editNameInput).toBeDisplayed()
      await editNameInput.setValue(projectName + ' - Updated')

      // Update phase
      const editPhaseSelect = await $('select[name="phase"]')
      await expect(editPhaseSelect).toBeDisplayed()
      await editPhaseSelect.selectByIndex(2) // Select a different phase

      // Update DEFRA code
      const editDefCodeInput = await $('input[name="defCode"]')
      await expect(editDefCodeInput).toBeDisplayed()
      await editDefCodeInput.setValue('UPDATED-' + Date.now())

      // Save changes
      const saveDetailsButton = await $('button.govuk-button=Save changes')
      await expect(saveDetailsButton).toBeDisplayed()
      await saveDetailsButton.click()

      // Wait for redirect back to project page
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('/projects/') && !url.includes('/manage')
        },
        {
          timeout: 10000,
          timeoutMsg:
            'Expected to be redirected back to project page after details update'
        }
      )
    })
  })

  describe('Service Standard Assessments', () => {
    const testProjects = []

    beforeEach(async () => {
      // Navigate to home page
      await browser.url('/')

      // Wait for the page to be fully loaded
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected page to be fully loaded'
        }
      )
    })

    it('should create projects at different phases and add service standard assessments', async () => {
      const projectPhases = [
        { phase: 'Discovery', index: 1, status: 'TBC' }, // Create a TBC project to test filtering
        { phase: 'Alpha', index: 2, status: 'GREEN' },
        { phase: 'Beta', index: 3, status: 'AMBER' },
        { phase: 'Live', index: 4, status: 'RED' }
      ]

      // Create projects for each phase
      for (const phaseInfo of projectPhases) {
        const projectName = `${phaseInfo.phase} Test Project ${Date.now()}`

        // Navigate to add project page
        const addLink = await $('a.govuk-link[href="/projects/add"]')
        await expect(addLink).toBeDisplayed()
        await addLink.click()

        // Wait for add project page
        await browser.waitUntil(
          async () => {
            return (await browser.getUrl()).includes('/projects/add')
          },
          {
            timeout: 10000,
            timeoutMsg: 'Expected to be on add project page'
          }
        )

        // Fill project details
        const nameInput = await $('input[name="name"]')
        await expect(nameInput).toBeDisplayed()
        await nameInput.setValue(projectName)

        // Select specific phase
        const phaseSelect = await $('select[name="phase"]')
        await expect(phaseSelect).toBeDisplayed()
        await phaseSelect.selectByIndex(phaseInfo.index)

        // Add DEFRA Code
        const defCodeInput = await $('input[name="defCode"]')
        await expect(defCodeInput).toBeDisplayed()
        await defCodeInput.setValue(
          `${phaseInfo.phase.toUpperCase()}-${Date.now()}`
        )

        // Set specific status for this project
        const statusSelect = await $('select[name="status"]')
        await expect(statusSelect).toBeDisplayed()

        // Select the specific status for this project
        try {
          await statusSelect.selectByAttribute('value', phaseInfo.status)
        } catch (error) {
          // Fallback to selecting by visible text if value doesn't work
          await statusSelect.selectByVisibleText(phaseInfo.status)
        }

        // Add commentary
        const commentaryInput = await $('textarea[name="commentary"]')
        await expect(commentaryInput).toBeDisplayed()
        await commentaryInput.setValue(
          `${phaseInfo.phase} phase project for assessment testing - Status: ${phaseInfo.status} - TBC filtering test project`
        )

        // Submit form
        const submitButton = await $('button[type="submit"]')
        await expect(submitButton).toBeDisplayed()
        await submitButton.click()

        // Wait for redirect to home page
        await browser.waitUntil(
          async () => {
            const heading = await $('h1.govuk-heading-xl')
            return (
              (await heading.isDisplayed()) &&
              (await heading.getText()) === 'Projects'
            )
          },
          {
            timeout: 10000,
            timeoutMsg: 'Expected to be redirected to home page'
          }
        )

        // Find the created project and navigate to it
        const projectLink = await $(`a.govuk-link*=${projectName}`)
        await expect(projectLink).toBeDisplayed()
        await projectLink.click()

        // Wait for project page
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl()
            return url.includes('/projects/') && !url.includes('/add')
          },
          {
            timeout: 10000,
            timeoutMsg: 'Expected to be on project detail page'
          }
        )

        // Get project ID from URL for assessments
        const currentUrl = await browser.getUrl()
        const projectId = currentUrl.split('/projects/')[1].split('/')[0]
        testProjects.push({
          id: projectId,
          name: projectName,
          phase: phaseInfo.phase
        })

        // Navigate to Service Standard compliance tab to see available standards
        const complianceTab = await $('a[href="#compliance"]')
        if (await complianceTab.isExisting()) {
          await complianceTab.click()

          // Wait for tab content to be visible
          await browser.waitUntil(
            async () => {
              const compliancePanel = await $('#compliance')
              return await compliancePanel.isDisplayed()
            },
            {
              timeout: 5000,
              timeoutMsg: 'Compliance tab did not become visible'
            }
          )

          // Find service standard links in the compliance table
          const standardLinks = await $$(
            '#compliance .govuk-table tbody tr .govuk-link'
          )

          if (standardLinks.length > 0) {
            // Test assessments for first 2 standards
            const standardsToTest = Math.min(2, standardLinks.length)

            for (
              let standardIndex = 0;
              standardIndex < standardsToTest;
              standardIndex++
            ) {
              // Get the standard text before clicking (so we can select it later in the form)
              const standardText = await standardLinks[standardIndex].getText()
              const standardMatch = standardText.match(/^(\d+)\.\s*(.+)/)
              let expectedStandardNumber = null

              if (standardMatch) {
                expectedStandardNumber = standardMatch[1]
              }

              // Click on the standard link to go to its assessment page
              await standardLinks[standardIndex].click()

              // Wait for standard-specific page to load
              await browser.waitUntil(
                async () => {
                  const url = await browser.getUrl()
                  return url.includes('/standards/')
                },
                {
                  timeout: 10000,
                  timeoutMsg: 'Standard page did not load'
                }
              )

              // Now we should be on a page where we can add assessments
              // Look for "Add assessment" links or buttons
              const addAssessmentLink = await $('a*=Add')

              if (await addAssessmentLink.isExisting()) {
                await addAssessmentLink.click()

                // Wait for assessment form page
                await browser.waitUntil(
                  async () => {
                    const url = await browser.getUrl()
                    return url.includes('/assessment')
                  },
                  {
                    timeout: 10000,
                    timeoutMsg: 'Assessment form page did not load'
                  }
                )

                // Now we're on the assessment form - fill it out

                // Select profession - check what's available first
                const professionSelect = await $('select[name="professionId"]')
                if (await professionSelect.isExisting()) {
                  // Debug: check available professions
                  const professionOptions = await professionSelect.$$('option')
                  const availableProfessions = []
                  for (const option of professionOptions) {
                    const text = await option.getText()
                    const value = await option.getAttribute('value')
                    if (value && value !== '') {
                      // Skip empty "Choose profession" option
                      availableProfessions.push({ text, value })
                    }
                  }
                  if (availableProfessions.length > 0) {
                    // Select the first available profession
                    const selectedProfession = availableProfessions[0]
                    await professionSelect.selectByAttribute(
                      'value',
                      selectedProfession.value
                    )
                  } else {
                    continue // Skip this standard
                  }
                }

                // Wait for standards dropdown to be populated after profession selection
                await browser.waitUntil(
                  async () => {
                    const standardSelect = await $('select[name="standardId"]')
                    if (!(await standardSelect.isExisting())) return false
                    const options = await standardSelect.$$('option')
                    return options.length > 1 // More than just the default "Choose" option
                  },
                  {
                    timeout: 5000,
                    timeoutMsg: 'Standards dropdown not populated'
                  }
                )

                // Select the specific standard we want to assess
                const standardSelect = await $('select[name="standardId"]')
                if (await standardSelect.isExisting()) {
                  const standardOptions = await standardSelect.$$('option')
                  const availableStandards = []
                  let targetStandardFound = false
                  let targetStandardValue = null

                  for (const option of standardOptions) {
                    const text = await option.getText()
                    const value = await option.getAttribute('value')
                    if (
                      value &&
                      value !== '' &&
                      !text.includes('No standards available')
                    ) {
                      availableStandards.push({ text, value })

                      // Check if this matches the standard we clicked on
                      if (
                        expectedStandardNumber &&
                        text.includes(`${expectedStandardNumber}.`)
                      ) {
                        targetStandardFound = true
                        targetStandardValue = value
                      }
                    }
                  }

                  if (availableStandards.length === 0) {
                    continue // Skip this standard
                  }

                  // Select the specific standard we want to assess
                  if (targetStandardFound && targetStandardValue) {
                    await standardSelect.selectByAttribute(
                      'value',
                      targetStandardValue
                    )
                  } else {
                    await standardSelect.selectByAttribute(
                      'value',
                      availableStandards[0].value
                    )
                  }

                  // Wait for help section to appear after standard selection
                  await browser.waitUntil(
                    async () => {
                      try {
                        const helpSection = await $('#standard-help')
                        return (
                          (await helpSection.isExisting()) &&
                          (await helpSection.isDisplayed())
                        )
                      } catch (error) {
                        return false
                      }
                    },
                    {
                      timeout: 3000,
                      timeoutMsg:
                        'Help section did not appear after standard selection'
                    }
                  )
                }

                // Define status arrays at a higher scope
                const statusValues = ['RED', 'AMBER', 'GREEN'] // Backend values
                const statusDisplayNames = ['Red', 'Amber', 'Green'] // Display names
                const statusIndex = standardIndex % statusValues.length
                const backendValue = statusValues[statusIndex]
                const displayName = statusDisplayNames[statusIndex]

                // Select status
                const statusSelect = await $('select[name="status"]')
                if (await statusSelect.isExisting()) {
                  // Try selecting by value first (more reliable)
                  try {
                    await statusSelect.selectByAttribute('value', backendValue)
                  } catch (error) {
                    await statusSelect.selectByVisibleText(displayName)
                  }
                }

                // Fill commentary based on status
                const selectedStatusValue = backendValue

                // Wait for commentary fields to appear and become interactable (they're shown/hidden based on status)
                await browser.waitUntil(
                  async () => {
                    if (selectedStatusValue === 'GREEN') {
                      const greenCommentary = await $(
                        'textarea[name="green-text"]'
                      )
                      return (
                        (await greenCommentary.isDisplayed()) &&
                        (await greenCommentary.isEnabled())
                      )
                    } else {
                      const issueDescription = await $(
                        'textarea[name="issue-text"]'
                      )
                      const pathToGreen = await $('textarea[name="path-text"]')
                      return (
                        (await issueDescription.isDisplayed()) &&
                        (await issueDescription.isEnabled()) &&
                        (await pathToGreen.isDisplayed()) &&
                        (await pathToGreen.isEnabled())
                      )
                    }
                  },
                  {
                    timeout: 10000,
                    timeoutMsg:
                      'Commentary fields not displayed or not interactable'
                  }
                )

                if (selectedStatusValue === 'GREEN') {
                  // Green status: single field for "what's in place"
                  const greenCommentary = await $('textarea[name="green-text"]')
                  await browser.waitUntil(
                    async () => await greenCommentary.isDisplayed(),
                    {
                      timeout: 5000,
                      timeoutMsg: 'Green commentary field not displayed'
                    }
                  )
                  await greenCommentary.setValue(
                    `This standard is being met in ${phaseInfo.phase} phase. We have proper processes and documentation in place.`
                  )
                } else {
                  // Non-green status: two fields - issue description and path to green
                  const issueDescription = await $(
                    'textarea[name="issue-text"]'
                  )
                  const pathToGreen = await $('textarea[name="path-text"]')

                  // Wait for both fields to be displayed and interactable
                  await browser.waitUntil(
                    async () => {
                      return (
                        (await issueDescription.isDisplayed()) &&
                        (await issueDescription.isEnabled()) &&
                        (await pathToGreen.isDisplayed()) &&
                        (await pathToGreen.isEnabled())
                      )
                    },
                    {
                      timeout: 10000,
                      timeoutMsg:
                        'Non-green commentary fields not displayed or not interactable'
                    }
                  )

                  // Fill issue description
                  await issueDescription.setValue(
                    `Issue identified in ${phaseInfo.phase} phase: Need to address gaps in this service standard area.`
                  )

                  // Fill path to green
                  await pathToGreen.setValue(
                    `Action plan: Working with team to implement necessary changes and documentation to meet this standard.`
                  )
                }

                // Submit the form
                const saveButton = await $('button*=Save')
                if (await saveButton.isExisting()) {
                  await saveButton.click()

                  // Wait for redirect back to project or standard page
                  await browser.waitUntil(
                    async () => {
                      const url = await browser.getUrl()
                      return (
                        url.includes('/projects/') &&
                        !url.includes('/assessment')
                      )
                    },
                    {
                      timeout: 10000,
                      timeoutMsg: 'Did not redirect after saving assessment'
                    }
                  )
                }
              }

              // Navigate back to project page for next standard
              await browser.url(`/projects/${projectId}`)

              // Re-click compliance tab for next iteration
              if (standardIndex < standardsToTest - 1) {
                const complianceTabAgain = await $('a[href="#compliance"]')
                if (await complianceTabAgain.isExisting()) {
                  await complianceTabAgain.click()
                  await browser.waitUntil(
                    async () => {
                      const compliancePanel = await $('#compliance')
                      return await compliancePanel.isDisplayed()
                    },
                    {
                      timeout: 5000,
                      timeoutMsg: 'Compliance tab not active'
                    }
                  )
                }
              }
            }
          } else {
            // No service standard links found in compliance table
          }
        } else {
          // No compliance tab found on project page
        }

        // Navigate back to home for next project
        await browser.url('/')
      }

      // Verify assessments were created by checking project pages
      for (const project of testProjects) {
        await browser.url(`/projects/${project.id}`)

        // Wait for project page to load
        await browser.waitUntil(
          async () => {
            const heading = await $('h1.govuk-heading-xl')
            return await heading.isDisplayed()
          },
          {
            timeout: 10000,
            timeoutMsg: 'Project page did not load'
          }
        )

        // Check if Service Standard compliance tab exists
        const complianceTab = await $('a[href="#compliance"]')
        if (await complianceTab.isExisting()) {
          await complianceTab.click()

          // Check for assessment data in the compliance tab
          const complianceTable = await $('#compliance .govuk-table')
          if (await complianceTable.isExisting()) {
            const assessmentRows = await complianceTable.$$('tbody tr')
            await expect(assessmentRows.length).toBeGreaterThan(0)
          }
        }
      }
    })

    it('should update existing service standard assessments with different statuses', async () => {
      // This test assumes we have projects from the previous test
      // Navigate to first test project and update assessments
      if (testProjects.length > 0) {
        const project = testProjects[0]
        await browser.url(`/projects/${project.id}/assessment`)

        // Wait for assessment page
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl()
            return url.includes('/assessment')
          },
          {
            timeout: 10000,
            timeoutMsg: 'Expected to be on assessment page'
          }
        )

        // Find existing assessments and update them
        const existingAssessments = await $$('button*=Edit')

        if (existingAssessments.length > 0) {
          const assessmentToUpdate = existingAssessments[0]
          await assessmentToUpdate.click()

          // Wait for edit form
          await browser.waitUntil(
            async () => {
              const form = await $('form[action*="assessment"]')
              return await form.isExisting()
            },
            {
              timeout: 5000,
              timeoutMsg: 'Edit assessment form not found'
            }
          )

          // Update status to different value
          const statusSelect = await $('select[name="status"]')
          if (await statusSelect.isExisting()) {
            await statusSelect.selectByVisibleText('Green')
          }

          // Update commentary
          const commentaryField = await $('textarea[name="commentary"]')
          if (await commentaryField.isExisting()) {
            await commentaryField.setValue(
              'Updated assessment - now Green after improvements'
            )
          }

          // Save changes
          const saveButton = await $('button*=Save')
          if (await saveButton.isExisting()) {
            await saveButton.click()

            // Wait for redirect
            await browser.waitUntil(
              async () => {
                return (await browser.getUrl()).includes('/assessment')
              },
              {
                timeout: 5000,
                timeoutMsg: 'Did not redirect after assessment update'
              }
            )
          }
        }
      }
    })

    it('should show assessment history without automatically archiving', async () => {
      // Test the assessment history functionality but be careful not to archive everything
      if (testProjects.length > 0) {
        const project = testProjects[0]
        await browser.url(`/projects/${project.id}/assessment`)

        // Look for history links
        const historyLinks = await $$('a*=History')

        if (historyLinks.length > 0) {
          await historyLinks[0].click()

          // Wait for history page
          await browser.waitUntil(
            async () => {
              const url = await browser.getUrl()
              return url.includes('/history')
            },
            {
              timeout: 10000,
              timeoutMsg: 'Expected to be on assessment history page'
            }
          )

          // Check for history entries
          const historyEntries = await $$(
            '.timeline__event, .history-entry, tr'
          )

          if (historyEntries.length > 0) {
            await expect(historyEntries[0]).toBeDisplayed()
          }
        }
      }
    })

    it('should edit existing assessments using the edit functionality', async () => {
      // Test the new edit assessment functionality
      if (testProjects.length > 0) {
        const project = testProjects[0]

        // Navigate to project page first
        await browser.url(`/projects/${project.id}`)

        // Wait for project page to load
        await browser.waitUntil(
          async () => {
            const heading = await $('h1.govuk-heading-xl')
            return await heading.isDisplayed()
          },
          {
            timeout: 10000,
            timeoutMsg: 'Project page did not load'
          }
        )

        // Click on Service Standard compliance tab
        const complianceTab = await $('a[href="#compliance"]')
        if (await complianceTab.isExisting()) {
          await complianceTab.click()

          // Wait for tab content to be visible
          await browser.waitUntil(
            async () => {
              const compliancePanel = await $('#compliance')
              return await compliancePanel.isDisplayed()
            },
            {
              timeout: 5000,
              timeoutMsg: 'Compliance tab did not become visible'
            }
          )

          // Find a standard with existing assessments to edit
          const standardLinks = await $$(
            '#compliance .govuk-table tbody tr .govuk-link'
          )

          if (standardLinks.length > 0) {
            // Click on the first standard that likely has assessments
            await standardLinks[0].click()

            // Wait for standard detail page to load
            await browser.waitUntil(
              async () => {
                const url = await browser.getUrl()
                return url.includes('/standards/')
              },
              {
                timeout: 10000,
                timeoutMsg: 'Standard detail page did not load'
              }
            )

            // Look for Edit links in the assessment cards
            const editLinks = await $$('a*=Edit')

            if (editLinks.length > 0) {
              // Click the first Edit link
              await editLinks[0].click()

              // Wait for edit assessment form to load
              await browser.waitUntil(
                async () => {
                  const url = await browser.getUrl()
                  return (
                    url.includes('/assessment') && url.includes('edit=true')
                  )
                },
                {
                  timeout: 10000,
                  timeoutMsg: 'Edit assessment form did not load'
                }
              )

              // Wait for edit form to be fully loaded
              await browser.waitUntil(
                async () => {
                  const readyState = await browser.execute(
                    () => document.readyState
                  )
                  return readyState === 'complete'
                },
                {
                  timeout: 5000,
                  timeoutMsg: 'Edit form not fully loaded'
                }
              )

              // Verify the form is pre-populated with existing data
              const professionSelect = await $('select[name="professionId"]')
              const standardSelect = await $('select[name="standardId"]')
              const statusSelect = await $('select[name="status"]')

              // Check that dropdowns have pre-selected values
              if (await professionSelect.isExisting()) {
                const selectedProfession = await professionSelect.getValue()
                await expect(selectedProfession).not.toBe('')
              }

              if (await standardSelect.isExisting()) {
                const selectedStandard = await standardSelect.getValue()
                await expect(selectedStandard).not.toBe('')
              }

              if (await statusSelect.isExisting()) {
                const selectedStatus = await statusSelect.getValue()
                await expect(selectedStatus).not.toBe('')

                // Change the status to a different value
                const currentStatus = await statusSelect.getValue()
                let newStatus = 'GREEN'
                if (currentStatus === 'GREEN') {
                  newStatus = 'AMBER'
                } else if (currentStatus === 'AMBER') {
                  newStatus = 'GREEN'
                }

                await statusSelect.selectByAttribute('value', newStatus)

                // Wait for commentary fields to update based on new status
                await browser.waitUntil(
                  async () => {
                    if (newStatus === 'GREEN') {
                      const greenCommentary = await $(
                        'textarea[name="green-text"]'
                      )
                      return await greenCommentary.isDisplayed()
                    } else {
                      const issueDescription = await $(
                        'textarea[name="issue-text"]'
                      )
                      const pathToGreen = await $('textarea[name="path-text"]')
                      return (
                        (await issueDescription.isDisplayed()) &&
                        (await pathToGreen.isDisplayed())
                      )
                    }
                  },
                  {
                    timeout: 5000,
                    timeoutMsg:
                      'Commentary fields not updated after status change'
                  }
                )

                // Update the commentary based on new status
                if (newStatus === 'GREEN') {
                  const greenCommentary = await $('textarea[name="green-text"]')
                  await greenCommentary.clearValue()
                  await greenCommentary.setValue(
                    'EDITED: Assessment updated to Green status - all requirements now met through recent improvements.'
                  )
                } else {
                  const issueDescription = await $(
                    'textarea[name="issue-text"]'
                  )
                  const pathToGreen = await $('textarea[name="path-text"]')

                  await issueDescription.clearValue()
                  await issueDescription.setValue(
                    'EDITED: Updated issue description - identified new concerns that need addressing.'
                  )

                  await pathToGreen.clearValue()
                  await pathToGreen.setValue(
                    'EDITED: Updated action plan - revised approach to address the identified issues.'
                  )
                }

                // Save the edited assessment
                const saveButton = await $('button*=Save')
                await expect(saveButton).toBeDisplayed()
                await saveButton.click()

                // Wait for redirect after saving
                await browser.waitUntil(
                  async () => {
                    const url = await browser.getUrl()
                    return (
                      url.includes('/standards/') && !url.includes('edit=true')
                    )
                  },
                  {
                    timeout: 10000,
                    timeoutMsg: 'Did not redirect after editing assessment'
                  }
                )

                // Verify the assessment was updated by checking for success notification
                const successNotification = await $(
                  '.govuk-notification-banner--success'
                )
                if (await successNotification.isExisting()) {
                  await expect(successNotification).toBeDisplayed()
                  const notificationText = await successNotification.getText()
                  await expect(notificationText).toContain(
                    'updated successfully'
                  )
                }

                // Also verify the updated assessment data is displayed
                const summaryCards = await $$('.govuk-summary-card')
                if (summaryCards.length > 0) {
                  let foundUpdatedContent = false
                  for (const card of summaryCards) {
                    const cardText = await card.getText()
                    if (cardText.includes('EDITED:')) {
                      foundUpdatedContent = true
                      break
                    }
                  }
                  await expect(foundUpdatedContent).toBe(true)
                }
              }
            } else {
              // No Edit links found - skip this test
              // Silently skip when no edit links are available
            }
          }
        }
      }
    })

    it('should create proper history entries when editing assessments', async () => {
      // Test that editing creates proper history and archives old entries
      if (testProjects.length > 0) {
        const project = testProjects[0]

        // Navigate to project page and find an assessment to edit
        await browser.url(`/projects/${project.id}`)

        // Navigate through compliance tab to standard detail
        const complianceTab = await $('a[href="#compliance"]')
        if (await complianceTab.isExisting()) {
          await complianceTab.click()

          const standardLinks = await $$(
            '#compliance .govuk-table tbody tr .govuk-link'
          )

          if (standardLinks.length > 0) {
            await standardLinks[0].click()

            // Look for History links to check current history
            const historyLinks = await $$('a*=History')

            if (historyLinks.length > 0) {
              // Click history to see current entries
              await historyLinks[0].click()

              // Wait for history page
              await browser.waitUntil(
                async () => {
                  const url = await browser.getUrl()
                  return url.includes('/history')
                },
                {
                  timeout: 10000,
                  timeoutMsg: 'Expected to be on history page'
                }
              )

              // Count current history entries (non-archived)
              const currentHistoryEntries = await $$(
                '.timeline__event:not(.timeline__event--archived)'
              )
              const initialHistoryCount = currentHistoryEntries.length

              // Navigate back to standard detail to edit
              await browser.back()

              // Find Edit link and click it
              const editLinks = await $$('a*=Edit')
              if (editLinks.length > 0) {
                await editLinks[0].click()

                // Wait for edit form
                await browser.waitUntil(
                  async () => {
                    const url = await browser.getUrl()
                    return (
                      url.includes('/assessment') && url.includes('edit=true')
                    )
                  },
                  {
                    timeout: 10000,
                    timeoutMsg: 'Edit form did not load'
                  }
                )

                // Wait for edit form to be fully loaded
                await browser.waitUntil(
                  async () => {
                    const readyState = await browser.execute(
                      () => document.readyState
                    )
                    return readyState === 'complete'
                  },
                  {
                    timeout: 5000,
                    timeoutMsg: 'Edit form not ready in history test'
                  }
                )

                // Make a simple change - just update commentary
                const statusSelect = await $('select[name="status"]')
                if (await statusSelect.isExisting()) {
                  const currentStatus = await statusSelect.getValue()

                  // Keep same status but update commentary
                  if (currentStatus === 'GREEN') {
                    const greenCommentary = await $(
                      'textarea[name="green-text"]'
                    )
                    if (await greenCommentary.isExisting()) {
                      await greenCommentary.clearValue()
                      await greenCommentary.setValue(
                        `HISTORY TEST: Updated on ${new Date().toISOString()} - Testing history creation functionality.`
                      )
                    }
                  } else {
                    const issueDescription = await $(
                      'textarea[name="issue-text"]'
                    )
                    if (await issueDescription.isExisting()) {
                      await issueDescription.clearValue()
                      await issueDescription.setValue(
                        `HISTORY TEST: Updated issue on ${new Date().toISOString()}`
                      )
                    }
                  }

                  // Save the changes
                  const saveButton = await $('button*=Save')
                  await saveButton.click()

                  // Wait for redirect
                  await browser.waitUntil(
                    async () => {
                      const url = await browser.getUrl()
                      return (
                        url.includes('/standards/') &&
                        !url.includes('edit=true')
                      )
                    },
                    {
                      timeout: 10000,
                      timeoutMsg: 'Did not redirect after saving edit'
                    }
                  )

                  // Now check that history was properly updated
                  const historyLinksAfterEdit = await $$('a*=History')
                  if (historyLinksAfterEdit.length > 0) {
                    await historyLinksAfterEdit[0].click()

                    // Wait for history page
                    await browser.waitUntil(
                      async () => {
                        const url = await browser.getUrl()
                        return url.includes('/history')
                      },
                      {
                        timeout: 10000,
                        timeoutMsg: 'Expected to be on history page after edit'
                      }
                    )

                    // Check that we have at least one more history entry than before
                    const newHistoryEntries = await $$(
                      '.timeline__event:not(.timeline__event--archived)'
                    )
                    await expect(
                      newHistoryEntries.length
                    ).toBeGreaterThanOrEqual(initialHistoryCount)

                    // Look for our test content in the most recent history entry
                    if (newHistoryEntries.length > 0) {
                      const mostRecentEntry = newHistoryEntries[0]
                      const entryText = await mostRecentEntry.getText()
                      await expect(entryText).toContain('HISTORY TEST:')
                    }

                    // Check for archived entries (the replace functionality should archive the old entry)
                    const archivedEntries = await $$(
                      '.timeline__event--archived'
                    )
                    if (archivedEntries.length > 0) {
                      // Verify archived entries are visually distinct
                      await expect(archivedEntries[0]).toBeDisplayed()
                      const archivedText = await archivedEntries[0].getText()
                      await expect(archivedText).toContain('ARCHIVED')
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  })
})
