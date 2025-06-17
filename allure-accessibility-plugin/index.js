/* global allure */
allure.api.addTab('accessibility', {
  title: 'Accessibility Reports',
  icon: 'fa fa-universal-access',
  route: 'accessibility'
})

// Override the accessibility tab click to navigate to reports
document.addEventListener('DOMContentLoaded', function () {
  // Wait for Allure to render the tabs
  setTimeout(function () {
    const accessibilityTab = document.querySelector('a[href="#accessibility"]')
    if (accessibilityTab) {
      accessibilityTab.addEventListener('click', function (event) {
        event.preventDefault()
        event.stopPropagation()
        window.open('reports/index.html', '_blank')
      })
    }
  }, 1000)
})

// Also try to override after page load
window.addEventListener('load', function () {
  setTimeout(function () {
    const accessibilityTab = document.querySelector('a[href="#accessibility"]')
    if (accessibilityTab) {
      accessibilityTab.addEventListener('click', function (event) {
        event.preventDefault()
        event.stopPropagation()
        window.open('reports/index.html', '_blank')
      })
    }
  }, 500)
})
