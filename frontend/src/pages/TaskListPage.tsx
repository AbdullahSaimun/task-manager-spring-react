import { Link as RouterLink } from 'react-router-dom'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'
import TaskTable from '../components/TaskTable'
import SearchBar from '../components/SearchBar'
import { useTasks } from '../hooks/useTasks'

function TaskListPage() {
  const {
    tasks,
    totalElements,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    sortField,
    sortDirection,
    toggleSort,
    page,
    setPage,
    size,
    setSize,
    removeTask,
  } = useTasks()

  return (
    <>
      <PageHeader
        title="Task List"
        description="Create, search, and manage your tasks."
        action={
          <Button component={RouterLink} to="/tasks/new" variant="contained" startIcon={<AddIcon />}>
            New Task
          </Button>
        }
      />
      <SearchBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <LoadingState label="Loading tasks…" />
      ) : (
        <TaskTable
          tasks={tasks}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={toggleSort}
          page={page}
          rowsPerPage={size}
          totalElements={totalElements}
          onPageChange={setPage}
          onRowsPerPageChange={setSize}
          onDelete={removeTask}
        />
      )}
    </>
  )
}

export default TaskListPage
