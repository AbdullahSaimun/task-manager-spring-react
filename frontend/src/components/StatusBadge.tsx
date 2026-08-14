import Chip from '@mui/material/Chip'
import type { ChipProps } from '@mui/material/Chip'
import type { TaskStatus } from '../types/task'

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
}

const STATUS_COLOR: Record<TaskStatus, ChipProps['color']> = {
  TODO: 'default',
  IN_PROGRESS: 'info',
  DONE: 'success',
  CANCELLED: 'error',
}

interface StatusBadgeProps {
  status: TaskStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  return <Chip label={STATUS_LABEL[status]} color={STATUS_COLOR[status]} size="small" />
}

export default StatusBadge
