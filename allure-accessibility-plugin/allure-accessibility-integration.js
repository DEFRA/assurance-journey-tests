import fs from 'fs'
import path from 'path'

/**
 * Copies accessibility reports to Allure report directory after Allure generation
 */
export function copyAccessibilityReportsToAllure() {
  const sourceReportsDir = path.join('./reports')
  const destReportsDir = path.join('./allure-report/reports')

  // Only proceed if source reports exist
  if (!fs.existsSync(sourceReportsDir)) {
    return
  }

  // Create destination directory
  if (!fs.existsSync(destReportsDir)) {
    fs.mkdirSync(destReportsDir, { recursive: true })
  }

  // Copy all HTML files
  const files = fs.readdirSync(sourceReportsDir)
  files.forEach((file) => {
    if (file.endsWith('.html')) {
      const sourcePath = path.join(sourceReportsDir, file)
      const destPath = path.join(destReportsDir, file)
      fs.copyFileSync(sourcePath, destPath)
    }
  })
}

/**
 * Integrates accessibility plugin into the generated Allure report
 */
export function integrateAccessibilityPlugin() {
  const allureReportDir = path.join('./allure-report')
  const allureIndexPath = path.join(allureReportDir, 'index.html')
  const allurePluginDir = path.join(allureReportDir, 'plugin', 'accessibility')

  // Check if allure report exists
  if (!fs.existsSync(allureIndexPath)) {
    return
  }

  // Create plugin directory if it doesn't exist
  if (!fs.existsSync(allurePluginDir)) {
    fs.mkdirSync(allurePluginDir, { recursive: true })
  }

  // Copy the plugin file
  const pluginSourcePath = path.join(
    './allure-accessibility-plugin',
    'index.js'
  )
  const pluginDestPath = path.join(allurePluginDir, 'index.js')

  if (!fs.existsSync(pluginSourcePath)) {
    return
  }

  fs.copyFileSync(pluginSourcePath, pluginDestPath)

  // Read the Allure index.html
  let indexContent = fs.readFileSync(allureIndexPath, 'utf8')

  // Add accessibility plugin script tag before the closing body tag
  const accessibilityScript =
    '    <script src="plugin/accessibility/index.js"></script>\n</body>'
  indexContent = indexContent.replace('</body>', accessibilityScript)

  // Write the modified index.html back
  fs.writeFileSync(allureIndexPath, indexContent)
}

/**
 * Main function to handle all accessibility integration after Allure report generation
 */
export function integrateAccessibilityWithAllure() {
  try {
    copyAccessibilityReportsToAllure()
    integrateAccessibilityPlugin()
  } catch (error) {}
}
