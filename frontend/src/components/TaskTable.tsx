import { Link as RouterLink } from 'react-router-dom'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableFooter from '@mui/material/TableFooter'
import TablePagination from '@mui/material/TablePagination'
import TableSortLabel from '@mui/material/TableSortLabel'
import Paper from '@mui/material/Paper'
import Link from '@mui/material/Link'
import type { Task, TaskSortField } from '../types/task'
import StatusBadge from './StatusBadge'

interface SortableColumn {
  field: TaskSortField
  label: string
}

const COLUMNS: SortableColumn[] = [
  { field: 'title', label: 'Title' },
  { field: 'status', label: 'Status' },
  { field: 'priority', label: 'Priority' },
  { field: 'dueDate', label: 'Due date' },
]

interface TaskTableProps {
  tasks: Task[]
  sortField: TaskSortField
  sortDirection: 'asc' | 'desc'
  onSortChange: (field: TaskSortField) => void
  page: number
  rowsPerPage: number
  totalElements: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (size: number) => void
  onDelete: (id: number) => void
}

function TaskTable({
  tasks,
  sortField,
  sortDirection,
  onSortChange,
  page,
  rowsPerPage,
  totalElements,
  onPageChange,
  onRowsPerPageChange,
  onDelete,
}: TaskTableProps) {
  function handleDeleteClick(task: Task) {
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDelete(task.id)
    }
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableCell key={column.field}>
                <TableSortLabel
                  active={sortField === column.field}
                  direction={sortField === column.field ? sortDirection : 'asc'}
                  onClick={() => onSortChange(column.field)}
                >
                  {column.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length + 1} align="center">
                No tasks match your search.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell>{task.priority}</TableCell>
                <TableCell>{task.dueDate ?? '—'}</TableCell>
                <TableCell align="right">
                  <Link component={RouterLink} to={`/tasks/${task.id}/edit`} sx={{ mr: 2 }}>
                    Edit
                  </Link>
                  <Link component="button" onClick={() => handleDeleteClick(task)}>
                    Delete
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              count={totalElements}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              onPageChange={(_event, newPage) => onPageChange(newPage)}
              onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  )
}

export default TaskTable
