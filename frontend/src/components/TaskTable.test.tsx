import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ComponentProps } from 'react'
import TaskTable from './TaskTable'
import type { Task } from '../types/task'

const tasks: Task[] = [
  {
    id: 1,
    title: 'Write tests',
    description: null,
    status: 'TODO',
    priority: 'HIGH',
    dueDate: null,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  },
]

function renderTable(overrides: Partial<ComponentProps<typeof TaskTable>> = {}) {
  const props = {
    tasks,
    sortField: 'title' as const,
    sortDirection: 'asc' as const,
    onSortChange: vi.fn(),
    page: 0,
    rowsPerPage: 5,
    totalElements: 1,
    onPageChange: vi.fn(),
    onRowsPerPageChange: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(
    <MemoryRouter>
      <TaskTable {...props} />
    </MemoryRouter>,
  )
  return props
}

describe('TaskTable', () => {
  it('renders a row per task with a due-date fallback', () => {
    renderTable()
    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows an empty-state message when there are no tasks', () => {
    renderTable({ tasks: [], totalElements: 0 })
    expect(screen.getByText('No tasks match your search.')).toBeInTheDocument()
  })

  it('calls onSortChange with the clicked column field', async () => {
    const user = userEvent.setup()
    const props = renderTable()

    await user.click(screen.getByRole('button', { name: 'Status' }))

    expect(props.onSortChange).toHaveBeenCalledWith('status')
  })

  it('deletes only after the confirm dialog is accepted', async () => {
    const user = userEvent.setup()
    const props = renderTable()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText('Delete "Write tests"? This cannot be undone.'),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    // MUI's Dialog plays a closing transition, so it lingers in the DOM
    // briefly after Cancel is clicked — wait for it to actually unmount.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(props.onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const reopenedDialog = await screen.findByRole('dialog')
    await user.click(within(reopenedDialog).getByRole('button', { name: 'Delete' }))

    expect(props.onDelete).toHaveBeenCalledWith(1)
  })

  it('calls onPageChange when the next-page control is clicked', async () => {
    const user = userEvent.setup()
    const props = renderTable({ totalElements: 20, rowsPerPage: 5 })

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(props.onPageChange).toHaveBeenCalledWith(1)
  })
})
