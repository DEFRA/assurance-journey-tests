import {
  initialiseAccessibilityChecking,
  analyseAccessibility,
  generateAccessibilityReports,
  generateAccessibilityReportIndex
} from '../accessibility-checking.js'

describe('Accessibility Testing', () => {
  before(async () => {
    // Initialize accessibility checking
    await initialiseAccessibilityChecking()
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

  it('should test authenticated projects page accessibility', async () => {
    await browser.url('/projects')

    // Wait for page to load
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Projects page did not load completely'
      }
    )

    await analyseAccessibility('authenticated-projects-page')
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
    await browser.url('/projects')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Projects page did not load completely'
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
    await browser.url('/projects')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Projects page did not load completely'
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
    await browser.url('/projects')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Projects page did not load completely'
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
      await browser.url(`/projects/${projectId}/assessment`)

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

  it('should test service standards detail page accessibility', async () => {
    await browser.url('/projects')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Projects page did not load completely'
      }
    )

    // Try to find a project and navigate to standards detail
    const projectLinks = await $$(
      'a[href*="/projects/"]:not([href="/projects/add"])'
    )
    if (projectLinks.length > 0) {
      const projectHref = await projectLinks[0].getAttribute('href')
      const projectId = projectHref.split('/').pop()

      // Navigate directly to standards detail page (using standard-11 as example)
      await browser.url(`/projects/${projectId}/standards/standard-11`)

      // Wait for standards detail page to load
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Standards detail page did not load completely'
        }
      )

      await analyseAccessibility('standards-detail-page')
    }
  })

  it('should test professions list page accessibility', async () => {
    await browser.url('/professions')

    // Wait for page to load
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Professions page did not load completely'
      }
    )

    await analyseAccessibility('professions-list-page')
  })

  it('should test specific profession page accessibility', async () => {
    await browser.url('/professions/architecture')

    // Wait for page to load
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Architecture profession page did not load completely'
      }
    )

    await analyseAccessibility('architecture-profession-page')
  })

  it('should test insights prioritisation page accessibility', async () => {
    await browser.url('/insights/prioritisation')

    // Wait for page to load
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Insights prioritisation page did not load completely'
      }
    )

    await analyseAccessibility('insights-prioritisation-page')
  })

  it('should test project update archival page accessibility', async () => {
    await browser.url('/projects')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Projects page did not load completely'
      }
    )

    // Try to find a project and create a project update first
    const projectLinks = await $$(
      'a[href*="/projects/"]:not([href="/projects/add"])'
    )
    if (projectLinks.length > 0) {
      const projectHref = await projectLinks[0].getAttribute('href')
      const projectId = projectHref.split('/').pop()

      // First create a project update by going to manage project
      await browser.url(`/projects/${projectId}/manage`)

      // Wait for manage page to load
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Project manage page did not load completely'
        }
      )

      // Select "status" option and continue
      const statusRadio = await $('input[value="status"]')
      if (await statusRadio.isExisting()) {
        await statusRadio.click()

        const continueButton = await $('button[type="submit"]')
        await continueButton.click()

        // Wait for status update page to load
        await browser.waitUntil(
          async () => {
            const readyState = await browser.execute(() => document.readyState)
            return readyState === 'complete'
          },
          {
            timeout: 10000,
            timeoutMsg: 'Status update page did not load completely'
          }
        )

        // Fill in the status update form
        const statusSelect = await $('select[name="status"]')
        if (await statusSelect.isExisting()) {
          await statusSelect.selectByAttribute('value', 'AMBER')
        }

        const commentaryTextarea = await $('textarea[name="commentary"]')
        if (await commentaryTextarea.isExisting()) {
          await commentaryTextarea.setValue(
            'Test project update for accessibility testing - creating history entry for archival testing'
          )
        }

        // Submit the form
        const saveButton = await $('button[type="submit"]')
        await saveButton.click()

        // Wait for redirect back to project page
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl()
            return (
              url.includes(`/projects/${projectId}`) && !url.includes('/manage')
            )
          },
          {
            timeout: 15000,
            timeoutMsg:
              'Expected to be redirected back to project page after status update'
          }
        )

        // Wait for page to load completely
        await browser.waitUntil(
          async () => {
            const readyState = await browser.execute(() => document.readyState)
            return readyState === 'complete'
          },
          {
            timeout: 10000,
            timeoutMsg: 'Project page did not load completely after update'
          }
        )

        // Click on the "Project engagement" tab to reveal the history section
        const engagementTab = await $('a[href="#engagement"]')
        if (await engagementTab.isExisting()) {
          await engagementTab.click()

          // Wait for tab content to be revealed
          await browser.waitUntil(
            async () => {
              const engagementPanel = await $('#engagement')
              const classes = await engagementPanel.getAttribute('class')
              return !classes.includes('govuk-tabs__panel--hidden')
            },
            {
              timeout: 5000,
              timeoutMsg: 'Project engagement tab did not become visible'
            }
          )

          // Now look for project history section with archivable entries
          const historyLinks = await $$(
            'a[href*="/history/"][href*="/archive"]'
          )
          if (historyLinks.length > 0) {
            await historyLinks[0].click()

            // Wait for archival page to load
            await browser.waitUntil(
              async () => {
                const readyState = await browser.execute(
                  () => document.readyState
                )
                return readyState === 'complete'
              },
              {
                timeout: 10000,
                timeoutMsg:
                  'Project update archival page did not load completely'
              }
            )

            await analyseAccessibility('project-update-archival-page')
          }
        }
      }
    }
  })

  it('should test standard assessment history page accessibility', async () => {
    await browser.url('/projects')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Projects page did not load completely'
      }
    )

    // Try to find a project and navigate to standard assessment history
    const projectLinks = await $$(
      'a[href*="/projects/"]:not([href="/projects/add"])'
    )
    if (projectLinks.length > 0) {
      const projectHref = await projectLinks[0].getAttribute('href')
      const projectId = projectHref.split('/').pop()

      // Navigate to a standard detail page first
      await browser.url(`/projects/${projectId}/standards/standard-11`)

      // Wait for standards detail page to load
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Standards detail page did not load completely'
        }
      )

      // Look for profession assessment history links
      const professionHistoryLinks = await $$(
        'a[href*="/professions/"][href*="/history"]:not([href*="/archive"])'
      )
      if (professionHistoryLinks.length > 0) {
        await professionHistoryLinks[0].click()

        // Wait for assessment history page to load
        await browser.waitUntil(
          async () => {
            const readyState = await browser.execute(() => document.readyState)
            return readyState === 'complete'
          },
          {
            timeout: 10000,
            timeoutMsg:
              'Standard assessment history page did not load completely'
          }
        )

        await analyseAccessibility('standard-assessment-history-page')
      } else {
        // Fallback: try direct navigation to architecture profession history
        await browser.url(
          `/projects/${projectId}/standards/standard-11/professions/architecture/history`
        )

        // Wait for page to load
        await browser.waitUntil(
          async () => {
            const readyState = await browser.execute(() => document.readyState)
            return readyState === 'complete'
          },
          {
            timeout: 10000,
            timeoutMsg:
              'Standard assessment history page did not load completely'
          }
        )

        await analyseAccessibility('standard-assessment-history-page')
      }
    }
  })

  it('should test standard assessment history archival page accessibility', async () => {
    await browser.url('/projects')

    // Wait for page to load and find a project link
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState)
        return readyState === 'complete'
      },
      {
        timeout: 10000,
        timeoutMsg: 'Projects page did not load completely'
      }
    )

    // Try to find a project and navigate to standard assessment history archival
    const projectLinks = await $$(
      'a[href*="/projects/"]:not([href="/projects/add"])'
    )
    if (projectLinks.length > 0) {
      const projectHref = await projectLinks[0].getAttribute('href')
      const projectId = projectHref.split('/').pop()

      // Navigate to assessment history page first
      await browser.url(
        `/projects/${projectId}/standards/standard-11/professions/architecture/history`
      )

      // Wait for history page to load
      await browser.waitUntil(
        async () => {
          const readyState = await browser.execute(() => document.readyState)
          return readyState === 'complete'
        },
        {
          timeout: 10000,
          timeoutMsg: 'Assessment history page did not load completely'
        }
      )

      // Look for archival links in the history
      const archiveLinks = await $$('a[href*="/history/"][href*="/archive"]')
      if (archiveLinks.length > 0) {
        await archiveLinks[0].click()

        // Wait for archival page to load
        await browser.waitUntil(
          async () => {
            const readyState = await browser.execute(() => document.readyState)
            return readyState === 'complete'
          },
          {
            timeout: 10000,
            timeoutMsg:
              'Standard assessment archival page did not load completely'
          }
        )

        await analyseAccessibility('standard-assessment-archival-page')
      }
    }
  })

  after(async () => {
    // Generate individual reports for our accessibility tests
    generateAccessibilityReports('accessibility-tests')

    // Generate master index of all reports
    generateAccessibilityReportIndex()
  })
})
