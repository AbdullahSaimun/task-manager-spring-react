import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useTasks } from './useTasks'
import * as tasksApi from '../api/tasks'
import type { PageResponse, Task } from '../types/task'

vi.mock('../api/tasks', () => ({
  listTasks: vi.fn(),
  deleteTask: vi.fn(),
}))

function samplePage(overrides: Partial<PageResponse<Task>> = {}): PageResponse<Task> {
  return {
    content: [],
    page: 0,
    size: 5,
    totalElements: 0,
    totalPages: 0,
    ...overrides,
  }
}

const sampleTask: Task = {
  id: 1,
  title: 'Sample',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: null,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
}

beforeEach(() => {
  vi.mocked(tasksApi.listTasks).mockReset()
  vi.mocked(tasksApi.deleteTask).mockReset()
  vi.mocked(tasksApi.listTasks).mockResolvedValue(samplePage())
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTasks', () => {
  it('fetches on mount with the default search/sort/pagination state', async () => {
    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(tasksApi.listTasks).toHaveBeenCalledWith({
      search: '',
      status: '',
      page: 0,
      size: 5,
      sort: 'title,asc',
    })
  })

  it('exposes the fetched tasks and total count', async () => {
    vi.mocked(tasksApi.listTasks).mockResolvedValue(
      samplePage({ content: [sampleTask], totalElements: 1 }),
    )

    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.tasks).toEqual([sampleTask])
    expect(result.current.totalElements).toBe(1)
  })

  it('sets an error message when the fetch fails', async () => {
    vi.mocked(tasksApi.listTasks).mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Failed to load tasks. Is the backend running?')
  })

  it('debounces search input before it drives a fetch, and resets to page 0', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTasks())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    vi.mocked(tasksApi.listTasks).mockClear()

    act(() => {
      result.current.setPage(2)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    vi.mocked(tasksApi.listTasks).mockClear()

    act(() => {
      result.current.setSearch('report')
    })
    expect(tasksApi.listTasks).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(tasksApi.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'report', page: 0 }),
    )
  })

  it('toggleSort flips direction on the active field and resets to asc on a new field', async () => {
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.sortField).toBe('title')
    expect(result.current.sortDirection).toBe('asc')

    act(() => {
      result.current.toggleSort('title')
    })
    await waitFor(() => expect(result.current.sortDirection).toBe('desc'))
    expect(result.current.sortField).toBe('title')

    act(() => {
      result.current.setPage(3)
    })
    await waitFor(() => expect(result.current.page).toBe(3))

    act(() => {
      result.current.toggleSort('status')
    })
    await waitFor(() => expect(result.current.sortField).toBe('status'))
    expect(result.current.sortDirection).toBe('asc')
    expect(result.current.page).toBe(0)
  })

  it('setStatus resets the page back to 0', async () => {
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setPage(2)
    })
    await waitFor(() => expect(result.current.page).toBe(2))

    act(() => {
      result.current.setStatus('DONE')
    })

    await waitFor(() => expect(result.current.status).toBe('DONE'))
    expect(result.current.page).toBe(0)
  })

  it('ignores a stale response that resolves after a newer request has already started', async () => {
    // Protects the `cancelled` guard documented in CLAUDE.md (section 16): if
    // an older, slower request resolves after a newer one already landed, it
    // must not clobber the newer data.
    let resolveStale!: (value: PageResponse<Task>) => void
    let resolveFresh!: (value: PageResponse<Task>) => void
    const stale = new Promise<PageResponse<Task>>((resolve) => {
      resolveStale = resolve
    })
    const fresh = new Promise<PageResponse<Task>>((resolve) => {
      resolveFresh = resolve
    })
    vi.mocked(tasksApi.listTasks).mockReturnValueOnce(stale).mockReturnValueOnce(fresh)

    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.setStatus('DONE')
    })

    // resolve the newer request first, then let the stale one arrive late
    await act(async () => {
      resolveFresh(samplePage({ content: [sampleTask], totalElements: 1 }))
    })
    await act(async () => {
      resolveStale(samplePage({ content: [], totalElements: 0 }))
    })

    expect(result.current.tasks).toEqual([sampleTask])
    expect(result.current.totalElements).toBe(1)
  })

  it('removeTask deletes the task and triggers a refetch', async () => {
    vi.mocked(tasksApi.deleteTask).mockResolvedValue(undefined)
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const callsBeforeDelete = vi.mocked(tasksApi.listTasks).mock.calls.length

    await act(async () => {
      await result.current.removeTask(1)
    })

    expect(tasksApi.deleteTask).toHaveBeenCalledWith(1)
    await waitFor(() =>
      expect(vi.mocked(tasksApi.listTasks).mock.calls.length).toBeGreaterThan(callsBeforeDelete),
    )
  })

  it('removeTask sets an error message when the delete fails', async () => {
    vi.mocked(tasksApi.deleteTask).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.removeTask(1)
    })

    expect(result.current.error).toBe('Failed to delete task.')
  })
})
