import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// @testing-library/react's auto-cleanup only self-registers when it can see a
// global `afterEach` (i.e. with vitest's `test.globals: true`); this project
// keeps globals off and imports test APIs explicitly everywhere else, so
// cleanup is wired up here instead, once, for every test file.
afterEach(() => {
  cleanup()
})
