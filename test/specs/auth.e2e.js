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

  // Wait for email input field and ensure it's interactable
  const emailInput = await $('input[type="email"]')
  await expect(emailInput).toBeDisplayed()
  await expect(emailInput).toBeEnabled()

  // Clear any existing value and enter username
  await emailInput.clearValue()
  const { username } = getCredentials()
  await emailInput.setValue(username)

  // Find and click Next button
  const nextButton = await $('input[type="submit"]')
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
      // Click "Add new project" button
      const addButton = await $(
        'a.govuk-button--secondary[href="/projects/add"]'
      )
      await expect(addButton).toBeDisplayed()
      await addButton.click()

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

      // Click edit button
      const editButton = await $('a.govuk-button--secondary=Edit project')
      await expect(editButton).toBeDisplayed()
      await editButton.click()

      // Wait for edit form to appear
      const statusField = await $('#status')
      await expect(statusField).toBeDisplayed()

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
      await editCommentaryInput.setValue('Updated project commentary')

      // Save changes
      const saveButton = await $('button.govuk-button=Save Delivery Status')
      await expect(saveButton).toBeDisplayed()
      await saveButton.click()

      // Wait for redirect back to project page
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.includes('/projects/') && !url.includes('/edit')
        },
        {
          timeout: 10000,
          timeoutMsg: 'Expected to be redirected back to project page'
        }
      )

      // Click edit button again
      const editButton2 = await $('a.govuk-button--secondary=Edit project')
      await expect(editButton2).toBeDisplayed()
      await editButton2.click()

      // Wait for edit form
      const statusField2 = await $('#status')
      await expect(statusField2).toBeDisplayed()

      // Switch to the Profession Updates tab
      const professionsTab2 = await $('a[role="tab"][id*="professions"]')
      await expect(professionsTab2).toBeDisplayed()
      await professionsTab2.click()

      // Wait for profession field
      const professionField = await $('#profession')
      await expect(professionField).toBeDisplayed()

      // Fill in the profession update form
      const professionSelect2 = await $('#profession')
      await expect(professionSelect2).toBeDisplayed()
      const professionOptions2 = await professionSelect2.$$('option')
      if (professionOptions2.length < 2) {
        throw new Error('No selectable professions available in the dropdown.')
      }
      await professionOptions2[1].click() // Select the first real profession

      const professionStatusSelect2 = await $('#profession-status')
      await expect(professionStatusSelect2).toBeDisplayed()
      const professionStatusOptions2 =
        await professionStatusSelect2.$$('option')
      if (professionStatusOptions2.length < 2) {
        throw new Error(
          'No selectable status options available in the dropdown.'
        )
      }
      await professionStatusOptions2[1].click() // Select the first real status

      const professionCommentaryInput2 = await $('#profession-commentary')
      await expect(professionCommentaryInput2).toBeDisplayed()
      await professionCommentaryInput2.setValue(
        'Initial profession status update'
      )

      // Add profession update
      const addProfessionButton2 = await $(
        'button.govuk-button=Add Profession Update'
      )
      await expect(addProfessionButton2).toBeDisplayed()
      await addProfessionButton2.click()

      // Verify status was updated
      const statusTag = await $('.govuk-tag.govuk-tag--large')
      await expect(statusTag).toBeDisplayed()
      await expect(statusTag).toHaveText('AMBER')
    })
  })
})
