import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

afterEach(() => {
  vi.restoreAllMocks()
})

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
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const props = renderTable()

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(confirmSpy).toHaveBeenCalledWith('Delete "Write tests"?')
    expect(props.onDelete).not.toHaveBeenCalled()

    confirmSpy.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(props.onDelete).toHaveBeenCalledWith(1)
  })

  it('calls onPageChange when the next-page control is clicked', async () => {
    const user = userEvent.setup()
    const props = renderTable({ totalElements: 20, rowsPerPage: 5 })

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(props.onPageChange).toHaveBeenCalledWith(1)
  })
})
