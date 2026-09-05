import { useEffect, useState } from 'react'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableFooter from '@mui/material/TableFooter'
import TablePagination from '@mui/material/TablePagination'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import StatusBadge from '../components/StatusBadge'
import { listAllTasks, listAllUsers } from '../api/admin'
import { getErrorMessage } from '../api/client'
import type { AdminTask, AdminUser } from '../types/admin'

function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)
  const [usersLoading, setUsersLoading] = useState(true)

  const [tasks, setTasks] = useState<AdminTask[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [tasksLoading, setTasksLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setUsersLoading(true)
    listAllUsers()
      .then((data) => {
        if (!cancelled) setUsers(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setUsersError(getErrorMessage(err, 'Failed to load users.'))
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setTasksLoading(true)
    listAllTasks(page, size)
      .then((data) => {
        if (!cancelled) {
          setTasks(data.content)
          setTotalElements(data.totalElements)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setTasksError(getErrorMessage(err, 'Failed to load tasks.'))
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, size])

  return (
    <Stack spacing={4}>
      <Typography variant="h4">Admin</Typography>

      <Stack spacing={1}>
        <Typography variant="h6">Users</Typography>
        {usersError && <Alert severity="error">{usersError}</Alert>}
        {usersLoading ? (
          <CircularProgress size={24} />
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === 'ADMIN' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Stack spacing={1}>
        <Typography variant="h6">All tasks</Typography>
        {tasksError && <Alert severity="error">{tasksError}</Alert>}
        {tasksLoading ? (
          <CircularProgress size={24} />
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Due date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No tasks exist yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{task.ownerUsername}</TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>{task.priority}</TableCell>
                      <TableCell>{task.dueDate ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    count={totalElements}
                    page={page}
                    rowsPerPage={size}
                    rowsPerPageOptions={[10, 20, 50]}
                    onPageChange={(_event, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setSize(Number(event.target.value))
                      setPage(0)
                    }}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </Stack>
  )
}

export default AdminPage
