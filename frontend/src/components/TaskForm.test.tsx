import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskForm from './TaskForm'

describe('TaskForm', () => {
  it('shows a validation error and does not submit when the title is blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TaskForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the typed title together with the default status/priority', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TaskForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Title'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    // react-hook-form's handleSubmit invokes onSubmit as (data, event) — the
    // component's own type only declares the first parameter, but the mock
    // still receives both, so the assertion has to match both positions.
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Buy milk',
          status: 'TODO',
          priority: 'MEDIUM',
        }),
        expect.anything(),
      ),
    )
  })

  it('prefills fields from defaultValues in edit mode', () => {
    render(
      <TaskForm
        defaultValues={{
          title: 'Existing task',
          description: 'Existing description',
          status: 'DONE',
          priority: 'HIGH',
          dueDate: '2026-09-01',
        }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Title')).toHaveValue('Existing task')
    expect(screen.getByLabelText('Description')).toHaveValue('Existing description')
  })
})
