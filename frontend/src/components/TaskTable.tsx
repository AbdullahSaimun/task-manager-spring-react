import { useState } from 'react'
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
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Stack from '@mui/material/Stack'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import type { Task, TaskSortField } from '../types/task'
import StatusBadge from './StatusBadge'
import EmptyState from './EmptyState'
import ConfirmDialog from './ConfirmDialog'

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
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)

  function handleConfirmDelete() {
    if (pendingDelete) {
      onDelete(pendingDelete.id)
    }
    setPendingDelete(null)
  }

  return (
    <Paper variant="outlined">
      <TableContainer>
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
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1}>
                  <EmptyState
                    title="No tasks match your search."
                    description="Try adjusting your search text or status filter."
                  />
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} />
                  </TableCell>
                  <TableCell>{task.priority}</TableCell>
                  <TableCell>{task.dueDate ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          component={RouterLink}
                          to={`/tasks/${task.id}/edit`}
                          size="small"
                          aria-label="Edit"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          aria-label="Delete"
                          onClick={() => setPendingDelete(task)}
                        >
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
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
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete task"
        message={pendingDelete ? `Delete "${pendingDelete.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Paper>
  )
}

export default TaskTable
