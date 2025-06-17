import { browserStackCapabilities } from './wdio.browserstack.capabilities.js'

const oneMinute = 60 * 1000

export const config = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_KEY,
  hostname: 'hub-cloud.browserstack.com',
  baseUrl: 'http://localhost:3000',
  runner: 'local',
  specs: ['./test/specs/**/*.e2e.js'],
  exclude: [],
  maxInstances: 5,
  capabilities: browserStackCapabilities.map((cap) => ({
    ...cap,
    'bstack:options': {
      ...cap['bstack:options'],
      buildName: 'assurance-journey-tests-local',
      projectName: 'assurance-journey-tests'
    }
  })),
  services: [
    [
      'browserstack',
      {
        testObservability: true,
        testObservabilityOptions: {
          user: process.env.BROWSERSTACK_USERNAME,
          key: process.env.BROWSERSTACK_KEY,
          projectName: 'assurance-journey-tests',
          buildName: 'assurance-journey-tests-local'
        },
        acceptInsecureCerts: true,
        forceLocal: true,
        browserstackLocal: true
      }
    ]
  ],
  execArgv: ['--loader', 'esm-module-alias/loader'],
  logLevel: 'info',
  bail: 1,
  waitforTimeout: 10000,
  waitforInterval: 200,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'allure-results'
      }
    ]
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: oneMinute
  },
  afterTest: async function (
    test,
    context,
    { error, result, duration, passed, retries }
  ) {
    await browser.takeScreenshot()

    if (error) {
      browser.executeScript(
        'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "At least 1 assertion failed"}}'
      )
    }
  }
  // Note: Report generation happens via npm run report script for consistency
}
