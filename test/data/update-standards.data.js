/**
 * Test data for Update All Standards Per Profession scenarios.
 *
 * For each profession we have:
 *   - A dedicated test project (must exist in DB with the correct phase)
 *   - The phase that project is in
 *   - The profession id / label
 *   - The service-standard numbers available to that profession in that phase
 *     (mirrors src/server/services/profession-standard-matrix.js)
 *   - A status to assign when saving each standard assessment
 *   - A commentary template
 *
 * The spec iterates over every standard in the list, saves an assessment for
 * each, then verifies the compliance tab shows the correct statuses.
 */

import { SERVICE_STANDARDS } from './delivery.data.js'

// ── Service-standard assessment statuses (from SERVICE_STANDARD_STATUS_OPTIONS) ─
export const ASSESSMENT_STATUSES = [
  { value: 'GREEN',    label: 'Green' },
  { value: 'AMBER',    label: 'Amber' },
  { value: 'RED',      label: 'Red' },
  { value: 'PENDING',  label: 'Pending' },
  { value: 'EXCLUDED', label: 'Excluded' }
]

/**
 * Pick a status value for the Nth standard (cycles through statuses).
 * @param {number} index 0-based index within the profession's standard list
 * @returns {{ value: string, label: string }}
 */
export function statusForIndex (index) {
  return ASSESSMENT_STATUSES[index % ASSESSMENT_STATUSES.length]
}

/**
 * Build a commentary string for a given profession + standard number.
 * GREEN status uses a single field; non-GREEN uses issue-description only
 * (we keep it simple for automated tests).
 */
export function buildCommentary (professionLabel, standardNumber, statusLabel) {
  return `AutoTest: ${professionLabel} – Standard ${standardNumber} set to ${statusLabel}`
}

// ── Per-profession test scenario definitions ─────────────────────────────────
// Phase for every project is Discovery – update if your projects differ.

export const PROFESSION_UPDATE_SCENARIOS = [
  {
    projectName: 'Project_Architecture',
    projectPhase: 'Discovery',
    professionId: 'architecture',
    professionLabel: 'Architecture',
    standards: [6, 7, 11, 12, 13, 14]
  },
  {
    projectName: 'Project_Business_Analysis',
    projectPhase: 'Discovery',
    professionId: 'business-analysis',
    professionLabel: 'Business Analysis',
    standards: [6, 7]
  },
  {
    projectName: 'Project_Delivery_Management',
    projectPhase: 'Discovery',
    professionId: 'delivery-management',
    professionLabel: 'Delivery Management',
    standards: [4, 5, 6, 7, 8]
  },
  {
    projectName: 'Project_Product_Management',
    projectPhase: 'Discovery',
    professionId: 'product-management',
    professionLabel: 'Product Management',
    standards: [2, 6, 7, 10]
  },
  {
    projectName: 'Project_Quality_Assurance',
    projectPhase: 'Discovery',
    professionId: 'quality-assurance',
    professionLabel: 'Quality Assurance',
    standards: [6, 7, 14]
  },
  {
    projectName: 'Project_Release_Management',
    projectPhase: 'Discovery',
    professionId: 'release-management',
    professionLabel: 'Release Management',
    standards: [7]
  },
  {
    projectName: 'Project_Software Development',
    projectPhase: 'Discovery',
    professionId: 'software-development',
    professionLabel: 'Software Development',
    standards: [6, 7, 9, 11, 12, 13, 14]
  },
  {
    projectName: 'Project_User Centred Design',
    projectPhase: 'Discovery',
    professionId: 'user-centred-design',
    professionLabel: 'User Centred Design',
    standards: [1, 2, 3, 4, 5, 6, 7]
  }
]

/**
 * Return the full standard text for a given 1-based standard number.
 * @param {number} stdNum
 * @returns {string} e.g. "6. Have a multidisciplinary team"
 */
export function standardText (stdNum) {
  return SERVICE_STANDARDS[stdNum - 1]
}
