/**
 * Test data for Add New Delivery scenarios.
 * Each scenario covers a different combination of Project Phase and Current Status.
 */

/**
 * The 14 Service Standards as defined in src/server/data/service-standards.js.
 * Note: the app may display fewer if some standards have been soft-deleted in the DB.
 * The helper verifyServiceStandardComplianceTable() will produce a clear error
 * message if the on-screen count does not match this list.
 */
export const SERVICE_STANDARDS = [
  '1. Understand users and their needs',
  '2. Solve a whole problem for users',
  '3. Provide a joined up experience across all channels',
  '4. Make the service simple to use',
  '5. Make sure everyone can use the service',
  '6. Have a multidisciplinary team',
  '7. Use agile ways of working',
  '8. Iterate and improve frequently',
  '9. Create a secure service which protects users privacy',
  '10. Define what success looks like and publish performance data',
  '11. Choose the right tools and technology',
  '12. Make new source code open',
  '13. Use and contribute to open standards, common components and patterns',
  '14. Operate a reliable service'
]

/** Unique run identifier – generated once when the module is loaded */
export const DELIVERY_RUN_ID = Date.now()

export const deliveryScenarios = [
  {
    scenarioName: 'Add New Delivery - Discovery phase with Green status',
    deliveryName: `AutoTest_${DELIVERY_RUN_ID}_Discovery`,
    projectPhase: 'Discovery',
    phaseIndex: 1,
    defraCode: `DISC-001`,
    currentStatus: 'GREEN',
    currentStatusLabel: 'Green',
    deliveryCommentary: 'Discovery phase delivery with Green status for testing purposes.'
  },
  {
    scenarioName: 'Add New Delivery - Alpha phase with Green Amber status',
    deliveryName: `AutoTest_${DELIVERY_RUN_ID}_Alpha`,
    projectPhase: 'Alpha',
    phaseIndex: 2,
    defraCode: `ALPH-002`,
    currentStatus: 'GREEN_AMBER',
    currentStatusLabel: 'Green/Amber',
    deliveryCommentary: 'Alpha phase delivery with Green/Amber status for testing purposes.'
  },
  {
    scenarioName: 'Add New Delivery - Beta phase with Amber status',
    deliveryName: `AutoTest_${DELIVERY_RUN_ID}_Beta`,
    projectPhase: 'Beta',
    phaseIndex: 3,
    defraCode: `BETA-003`,
    currentStatus: 'AMBER',
    currentStatusLabel: 'Amber',
    deliveryCommentary: 'Beta phase delivery with Amber status for testing purposes.'
  },
  {
    scenarioName: 'Add New Delivery - Live phase with Amber Red status',
    deliveryName: `AutoTest_${DELIVERY_RUN_ID}_Live`,
    projectPhase: 'Live',
    phaseIndex: 4,
    defraCode: `LIVE-004`,
    currentStatus: 'AMBER_RED',
    currentStatusLabel: 'Amber/Red',
    deliveryCommentary: 'Live phase delivery with Amber/Red status for testing purposes.'
  },
  {
    scenarioName: 'Add New Delivery - Beta phase with Pending status',
    deliveryName: `AutoTest_${DELIVERY_RUN_ID}_Pending`,
    projectPhase: 'Beta',
    phaseIndex: 3,
    defraCode: `PEND-005`,
    currentStatus: 'PENDING',
    currentStatusLabel: 'Pending',
    deliveryCommentary: 'Beta phase delivery with Pending status for testing purposes.'
  }
]

/**
 * All available delivery statuses for update scenarios.
 * Used to generate parameterised tests for each status transition.
 */
export const DELIVERY_STATUSES = [
  { value: 'GREEN', label: 'Green' },
  { value: 'GREEN_AMBER', label: 'Green/Amber' },
  { value: 'AMBER', label: 'Amber' },
  { value: 'AMBER_RED', label: 'Amber/Red' },
  { value: 'RED', label: 'Red' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXCLUDED', label: 'Excluded' }
]

/**
 * Test project name for Manage Delivery Update Status scenarios.
 * This project must already exist in the test database.
 */
export const MANAGE_DELIVERY_TEST_PROJECT1 = 'Auto_Test_Proj_1'
export const MANAGE_DELIVERY_TEST_PROJECT2 = 'Auto_Test_Proj_2'

export const MANAGE_DELIVERY_TEST_PROJECT_DETAILS1 = {
  deliveryId: 'CPTP01DEFC0031',          // Expected Delivery ID (defCode)
  phase: 'Discovery',                 // Expected Phase
  deliveryGroup: 'Animal Health' // Expected Delivery group name
}
export const MANAGE_DELIVERY_TEST_PROJECT_DETAILS2 = {
  deliveryId: 'CPTP01DEFC0031',          // Expected Delivery ID (defCode)
  phase: 'Alpha',                 // Expected Phase
  deliveryGroup: 'Some good group' // Expected Delivery group name
}

/**
 * Format a timestamp into a human-readable string for commentary.
 * @param {Date} [date=new Date()] - date to format
 * @returns {string} formatted date string like "12 May 2026 22:46:10"
 */
export function formatTimestamp(date = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`
}

/**
 * Generate status update scenarios for each target status.
 * Each scenario updates to a different status value.
 * @param {string} excludeStatus - current status to exclude from target statuses
 * @returns {Array} array of scenario objects
 */
/**
 * GDS Phase options as defined in the application.
 * Used for parameterised details update tests.
 */
export const GDS_PHASES = [
  { value: 'Discovery', label: 'Discovery' },
  { value: 'Alpha', label: 'Alpha' },
  { value: 'Private Beta', label: 'Private Beta' },
  { value: 'Public Beta', label: 'Public Beta' },
  { value: 'Live', label: 'Live' }
]

/**
 * Generate details update scenarios — one per GDS phase.
 * Each scenario updates the project name, phase, ID and delivery group,
 * then the after() hook restores original values.
 */
export function generateDetailsUpdateScenarios() {
  const timestamp = Date.now()
  return GDS_PHASES.map((phase, index) => ({
    scenarioName: `Update delivery details to ${phase.label} phase`,
    newName: `Details Test ${phase.label} ${timestamp}`,
    newPhase: phase.value,
    newDefCode: `DET-${String(index + 1).padStart(3, '0')}`,
    expectedNotification: 'Delivery details updated successfully'
  }))
}

export function generateStatusUpdateScenarios(excludeStatus = '') {
  const timestamp = Date.now()
  return DELIVERY_STATUSES
    .filter(status => status.value !== excludeStatus)
    .map((status, index) => ({
      scenarioName: `Update delivery status to ${status.label}`,
      targetStatus: status.value,
      targetStatusLabel: status.label,
      newCommentary: `Status updated to ${status.label} - Test commentary ${timestamp}-${index}`,
      expectedNotification: 'Delivery status and commentary updated successfully'
    }))
}
