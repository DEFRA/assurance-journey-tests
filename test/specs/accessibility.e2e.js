import {
  initialiseAccessibilityChecking,
  analyseAccessibility,
  generateAccessibilityReports,
  generateAccessibilityReportIndex
} from '../accessibility-checking.js'

/**
 * Helper function to handle the username screen during Azure AD login
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

  // Wait for username input field and ensure it's interactable
  const usernameInput = await $('input[type="email"]')
  await expect(usernameInput).toBeDisplayed()
  await expect(usernameInput).toBeEnabled()

  // Clear any existing value and enter username
  await usernameInput.clearValue()
  await usernameInput.setValue(process.env.TEST_USERNAME, { sensitive: true })

  // Find and click Next button
  const nextButton = await $('input[type="submit"]')
  await expect(nextButton).toBeDisplayed()
  await expect(nextButton).toBeEnabled()
  await nextButton.click()

  // Wait for navigation to password screen (password field appears)
  await browser.waitUntil(
    async () => {
      const passwordInput = await $('input[type="password"]')
      return await passwordInput.isExisting()
    },
    {
      timeout: 15000,
      timeoutMsg: 'Expected to navigate to password screen'
    }
  )
}

/**
 * Helper function to handle the password screen during Azure AD login
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
 * Helper function to perform Azure AD login
 */
async function performLogin() {
  // Navigate to login page
  await browser.url('/auth/login')

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
  await handlePasswordScreen()

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
}

describe('Accessibility Testing', () => {
  before(async () => {
    // Initialize accessibility checking
    await initialiseAccessibilityChecking()

    // Perform login to access authenticated pages
    await performLogin()
  })

  it('should test authenticated home page accessibility', async () => {
    await browser.url('/')

    // Wait for page to load
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Home page did not load completely'
      }
    )

    await analyseAccessibility('authenticated-home-page')
  })

  it('should test add new project page accessibility', async () => {
    await browser.url('/projects/add')

    // Wait for page to load
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Add project page did not load completely'
      }
    )

    await analyseAccessibility('add-new-project-page')
  })

  it('should test project detail page accessibility', async () => {
    await browser.url('/')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Home page did not load completely'
      }
    )

    // Try to find and click a project link if available
    const projectLinks = await $$(
      'a[href*="/projects/"]:not([href="/projects/add"])'
    )
    if (projectLinks.length > 0) {
      await projectLinks[0].click()

      // Wait for project page to load
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Project page did not load completely'
        }
      )

      await analyseAccessibility('project-detail-page')
    }
  })

  it('should test project management page accessibility', async () => {
    await browser.url('/')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Home page did not load completely'
      }
    )

    // Try to find and click a project link, then navigate to management
    const projectLinks = await $$(
      'a[href*="/projects/"]:not([href="/projects/add"])'
    )
    if (projectLinks.length > 0) {
      await projectLinks[0].click()

      // Wait for project page to load
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Project page did not load completely'
        }
      )

      // Look for "Manage project" link
      const manageLink = await $('a[href*="/manage"]')
      if (await manageLink.isExisting()) {
        await manageLink.click()

        // Wait for manage page to load
        await browser.waitUntil(
          async () => {
            const readyState = await browser.execute(() => document.readyState)
            return readyState === 'complete'
          },
          {
            timeout: 10000,
            timeoutMsg: 'Project management page did not load completely'
          }
        )

        await analyseAccessibility('project-management-page')
      }
    }
  })

  it('should test service standards assessment page accessibility', async () => {
    await browser.url('/')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Home page did not load completely'
      }
    )

    // Try to find a project and navigate to add assessment
    const projectLinks = await $$(
      'a[href*="/projects/"]:not([href="/projects/add"])'
    )
    if (projectLinks.length > 0) {
      const projectHref = await projectLinks[0].getAttribute('href')
      const projectId = projectHref.split('/').pop()

      // Navigate directly to add assessment page
      await browser.url(`/projects/${projectId}/assessments/add`)

      // Wait for assessment page to load
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg:
            'Service standards assessment page did not load completely'
        }
      )

      await analyseAccessibility('service-standards-assessment-page')
    }
  })

  after(async () => {
    // Generate individual reports for our accessibility tests
    generateAccessibilityReports('accessibility-tests')

    // Generate master index of all reports
    generateAccessibilityReportIndex()
  })
})
