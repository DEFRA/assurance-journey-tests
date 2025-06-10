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

  // Wait for navigation to complete
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl()
      return (
        !url.includes('login.microsoftonline.com') ||
        url.includes('sso_reload=true')
      )
    },
    {
      timeout: 20000,
      timeoutMsg: 'Expected to be redirected after password entry'
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
async function handleStaySignedInScreen() {
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

  // Wait for and click the Yes button
  const yesButton = await $('input[type="submit"]')
  await expect(yesButton).toBeDisplayed()
  await expect(yesButton).toBeEnabled()
  await yesButton.click()

  // Wait for navigation to complete, including the appverify page
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl()
      // Allow the appverify page during verification
      if (url.includes('appverify')) {
        return true
      }
      // Wait for final redirect to application
      return !url.includes('login.microsoftonline.com')
    },
    {
      timeout: 30000, // Increased timeout to 30 seconds for verification
      timeoutMsg: 'Expected to be redirected after stay signed in choice'
    }
  )
}

describe('Authentication', () => {
  describe('Login Flow', () => {
    beforeEach(async () => {
      // Start each test at the login page
      await browser.url('/auth/login')

      // Clear cookies before each test to ensure a clean state
      await browser.deleteAllCookies()
    })

    it('should complete the Azure AD login flow and verify authentication', async () => {
      // Wait for redirect to Microsoft login page
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
          timeout: 20000,
          timeoutMsg: 'Expected to be redirected to Microsoft login page'
        }
      )

      await handleUsernameScreen()
      await handlePasswordScreen()

      try {
        await handleAuthorizationScreen()
      } catch (e) {
        // Authorization screen not present, continuing...
      }

      try {
        await handleStaySignedInScreen()
      } catch (e) {
        // Stay signed in screen not present, continuing...
      }

      // Wait for redirect back to application and page to load
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('localhost') && !url.includes('login')
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
})
