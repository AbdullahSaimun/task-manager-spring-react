import { Link as RouterLink } from 'react-router-dom'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
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
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Task List</Typography>
        <Button component={RouterLink} to="/tasks/new" variant="contained">
          New Task
        </Button>
      </Stack>
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
        <CircularProgress />
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
