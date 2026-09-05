import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['TODO', 'To do'],
    ['IN_PROGRESS', 'In progress'],
    ['DONE', 'Done'],
    ['CANCELLED', 'Cancelled'],
  ] as const)('renders the label for %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
