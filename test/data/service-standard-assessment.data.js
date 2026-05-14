/**
 * Test data for Verify Service Standard Assessment scenarios.
 *
 * - ASSESSMENT_PROFESSIONS      : professions shown in the dropdown
 * - PHASE_PROFESSION_MAP        : which professions are available per phase
 * - PHASE_PROFESSION_STANDARD_MAP : which service-standard NUMBERS each
 *                                   profession sees per phase
 *   (mirrors src/server/services/profession-standard-matrix.js)
 * - ASSESSMENT_PROJECTS         : one pre-existing test project per phase
 */

// ── Professions ──────────────────────────────────────────────────────────────
// id must match the keys used in PROFESSION_STANDARD_MATRIX (src)
export const ASSESSMENT_PROFESSIONS = [
  { id: 'architecture',          label: 'Architecture' },
  { id: 'business-analysis',     label: 'Business Analysis' },
  { id: 'delivery-management',   label: 'Delivery Management' },
  { id: 'product-management',    label: 'Product Management' },
  { id: 'quality-assurance',     label: 'Quality Assurance' },
  { id: 'release-management',    label: 'Release Management' },
  { id: 'software-development',  label: 'Software Development' },
  { id: 'user-centred-design',   label: 'User Centred Design' }
]

// ── Phase → Professions mapping ───────────────────────────────────────────────
// Currently all professions are available in every phase.
// Update per-phase arrays when requirements change.
export const PHASE_PROFESSION_MAP = {
  'Discovery':    ASSESSMENT_PROFESSIONS.map(p => p.id),
  'Alpha':        ASSESSMENT_PROFESSIONS.map(p => p.id),
  'Private Beta': ASSESSMENT_PROFESSIONS.map(p => p.id),
  'Public Beta':  ASSESSMENT_PROFESSIONS.map(p => p.id),
  'Live':         ASSESSMENT_PROFESSIONS.map(p => p.id)
}

// ── Phase → Profession → Service Standard numbers ────────────────────────────
// Mirrors src/server/services/profession-standard-matrix.js exactly.

// ── Service Standard number → display text mapping ───────────────────────────
export const SERVICE_STANDARD_TEXT = {
  1:  'Understand users and their needs',
  2:  'Solve a whole problem for users',
  3:  'Provide a joined up experience across all channels',
  4:  'Make the service simple to use',
  5:  'Make sure everyone can use the service',
  6:  'Have a multidisciplinary team',
  7:  'Use agile ways of working',
  8:  'Iterate and improve frequently',
  9:  'Create a secure service which protects users privacy',
  10: 'Define what success looks like and publish performance data',
  11: 'Choose the right tools and technology',
  12: 'Make new source code open',
  13: 'Use and contribute to open standards, common components and patterns',
  14: 'Operate a reliable service'
}

export const PHASE_PROFESSION_STANDARD_MAP = {
  Discovery: {
    'architecture':           [6, 7, 11, 12, 13, 14],
    'business-analysis':    [6, 7],
    'delivery-management':  [4, 5, 6, 7, 8],
    'product-management':   [2, 6, 7, 10],
    'quality-assurance':    [6, 7, 14],
    'release-management':   [7],
    'software-development': [6, 7, 9, 11, 12, 13, 14],
    'user-centred-design':  [1, 2, 3, 4, 5, 6, 7]
  },
  Alpha: {
    'architecture':           [6, 7, 8, 9, 11, 12, 13, 14],
    'business-analysis':    [7, 11],
    'delivery-management':  [4, 5, 6, 7, 8],
    'product-management':   [2, 3, 6, 7, 10],
    'quality-assurance':    [3, 4, 5, 7, 8, 9, 11, 14],
    'release-management':   [7, 14],
    'software-development': [6, 7, 8, 9, 11, 12, 13, 14],
    'user-centred-design':  [1, 2, 3, 4, 5, 7]
  },
  'Private Beta': {
    'architecture':           [7, 8, 9, 11, 12, 13, 14],
    'business-analysis':    [7, 11],
    'delivery-management':  [4, 5, 6, 7, 8],
    'product-management':   [2, 3, 6, 7, 10, 14],
    'quality-assurance':    [3, 4, 5, 7, 8, 9, 11, 14],
    'release-management':   [7, 14],
    'software-development': [7, 8, 9, 11, 12, 13, 14],
    'user-centred-design':  [1, 2, 3, 4, 5, 7]
  },
  'Public Beta': {
    'architecture':           [7, 8, 9, 11, 12, 13, 14],
    'business-analysis':    [7],
    'delivery-management':  [4, 5, 6, 7, 8],
    'product-management':   [2, 3, 6, 7, 10, 14],
    'quality-assurance':    [3, 4, 5, 7, 8, 9, 11, 14],
    'release-management':   [7, 14],
    'software-development': [7, 8, 9, 11, 12, 13, 14],
    'user-centred-design':  [1, 2, 3, 4, 5, 7]
  },
  'Live': {
    'architecture':           [7, 8, 9, 11, 12, 13, 14],
    'business-analysis':    [7],
    'delivery-management':  [7, 8, 10, 14],
    'product-management':   [3, 6, 7, 8, 10, 14],
    'quality-assurance':    [3, 7, 8, 9, 11, 14],
    'release-management':   [7, 14],
    'software-development': [7, 8, 9, 11, 12, 13, 14],
    'user-centred-design':  [1, 2, 3, 4, 5, 7]
  }
}

// ── Test projects (must exist in DB) ─────────────────────────────────────────
// One project per phase; update names to match your actual test DB records.
export const ASSESSMENT_PROJECTS = [
  { name: 'Project_Discovery',   phase: 'Discovery' },
  { name: 'Project_Alpha',       phase: 'Alpha' },
  { name: 'Project_Private_Beta', phase: 'Private Beta' },
  { name: 'Project_Public_Beta', phase: 'Public Beta' },
  { name: 'Project_Live',        phase: 'Live' }
]

/**
 * Build the expected inset-text string for the assessment page.
 * Matches the Nunjucks template:
 *   "Standards available … and the project's current phase ({{ phase }})."
 */
export function buildInsetText(phase) {
  return `Standards available in the dropdown will be filtered based on your selected profession and the project's current phase (${phase}).`
}
