import { useEffect, useState } from 'react'
import type { Task, TaskSortField, TaskStatus } from '../types/task'
import { deleteTask, listTasks } from '../api/tasks'
import { getErrorMessage } from '../api/client'

type SortDirection = 'asc' | 'desc'

const SEARCH_DEBOUNCE_MS = 300

// Owns all task-list state (section 9) and fetches from the real backend.
// The search box is debounced so typing doesn't fire a request per keystroke.
export function useTasks() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatusState] = useState<TaskStatus | ''>('')
  const [sortField, setSortField] = useState<TaskSortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [page, setPage] = useState(0)
  const [size, setSizeState] = useState(5)
  const [refreshKey, setRefreshKey] = useState(0)

  const [tasks, setTasks] = useState<Task[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listTasks({ search, status, page, size, sort: `${sortField},${sortDirection}` })
      .then((response) => {
        if (cancelled) return
        setTasks(response.content)
        setTotalElements(response.totalElements)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(getErrorMessage(err, 'Failed to load tasks. Is the backend running?'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [search, status, sortField, sortDirection, page, size, refreshKey])

  function updateStatus(value: TaskStatus | '') {
    setStatusState(value)
    setPage(0)
  }

  function toggleSort(field: TaskSortField) {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(0)
  }

  function updateSize(value: number) {
    setSizeState(value)
    setPage(0)
  }

  async function removeTask(id: number) {
    try {
      await deleteTask(id)
      setRefreshKey((key) => key + 1)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete task.'))
    }
  }

  return {
    tasks,
    totalElements,
    loading,
    error,
    search: searchInput,
    setSearch: setSearchInput,
    status,
    setStatus: updateStatus,
    sortField,
    sortDirection,
    toggleSort,
    page,
    setPage,
    size,
    setSize: updateSize,
    removeTask,
  }
}
