import * as wcagChecker from '../dist/wcagchecker.js'
import fs from 'fs'
import path from 'path'

const reportDirectory = path.join('./reports')

export async function initialiseAccessibilityChecking() {
  if (!fs.existsSync(reportDirectory)) {
    fs.mkdirSync(reportDirectory)
  }

  await wcagChecker.init(browser)
}

export async function analyseAccessibility(suffix) {
  await wcagChecker.analyse(browser, suffix)
}

export function generateAccessibilityReports(filePrefix) {
  const categoryReport = wcagChecker.getHtmlReportByCategory()
  const guidelineReport = wcagChecker.getHtmlReportByGuideLine()

  if (categoryReport && categoryReport.length > 0) {
    fs.writeFileSync(
      path.join(reportDirectory, `${filePrefix}-accessibility-category.html`),
      categoryReport,
      (err) => {
        if (err) throw err
      }
    )
  }

  if (guidelineReport && guidelineReport.length > 0) {
    fs.writeFileSync(
      path.join(reportDirectory, `${filePrefix}-accessibility-guideline.html`),
      guidelineReport,
      (err) => {
        if (err) throw err
      }
    )
  }
}

export function generateAccessibilityReportIndex() {
  if (!fs.existsSync(reportDirectory)) {
    fs.mkdirSync(reportDirectory, { recursive: true })
    return
  }

  const filenames = fs
    .readdirSync(reportDirectory)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')

  const html = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Accessibility Testing Reports</title>
                <style>
                    body {
                        font-family: 'GDS Transport', arial, sans-serif;
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f8f8f8;
                    }
                    .header {
                        background: #1d70b8;
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 2rem;
                    }
                    .header p {
                        margin: 10px 0 0 0;
                        opacity: 0.9;
                    }
                    .reports-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .report-card {
                        background: white;
                        border: 1px solid #dee2e6;
                        border-radius: 8px;
                        padding: 20px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        transition: transform 0.2s;
                    }
                    .report-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                    }
                    .report-title {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #1d70b8;
                        margin-bottom: 10px;
                        text-decoration: none;
                    }
                    .report-title:hover {
                        text-decoration: underline;
                    }
                    .report-type {
                        background: #f0f9ff;
                        color: #1d70b8;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 0.8rem;
                        font-weight: bold;
                        display: inline-block;
                        margin-bottom: 10px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding: 20px;
                        color: #666;
                        border-top: 1px solid #dee2e6;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>♿ Accessibility Testing Reports</h1>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                    <p>Total Reports: ${filenames.length}</p>
                </div>
                
                ${
                  filenames.length === 0
                    ? '<div class="report-card"><p>No accessibility reports found. Run tests with the accessibility config to generate reports.</p></div>'
                    : `<div class="reports-grid">
                        ${filenames
                          .map((filename) => {
                            const isCategory = filename.includes('-category')
                            const isGuideline = filename.includes('-guideline')
                            const reportType = isCategory
                              ? 'By Category'
                              : isGuideline
                                ? 'By Guideline'
                                : 'General'
                            const displayName = filename
                              .replace('-accessibility-category.html', '')
                              .replace('-accessibility-guideline.html', '')
                              .replace('.html', '')
                              .replace(/-/g, ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())

                            return `
                                <div class="report-card">
                                    <div class="report-type">${reportType}</div>
                                    <a href="${filename}" class="report-title">${displayName}</a>
                                    <p>Click to view detailed accessibility analysis</p>
                                </div>
                            `
                          })
                          .join('')}
                    </div>`
                }
                
                <div class="footer">
                    <p>Generated by WebDriverIO Accessibility Testing Suite</p>
                    <p>Reports are organized by test suite and analysis type</p>
                </div>
            </body>
        </html>
        `
  fs.writeFileSync(path.join(reportDirectory, 'index.html'), html, (err) => {
    if (err) throw err
  })

  // Reports will be copied to Allure directory after Allure report generation
}
