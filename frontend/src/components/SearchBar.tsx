import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import type { TaskStatus } from '../types/task'

const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']

interface SearchBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: TaskStatus | ''
  onStatusChange: (value: TaskStatus | '') => void
}

function SearchBar({ search, onSearchChange, status, onStatusChange }: SearchBarProps) {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
      <TextField
        label="Search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        sx={{ flexGrow: 1 }}
      />
      <TextField
        select
        label="Status"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as TaskStatus | '')}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">All</MenuItem>
        {STATUS_OPTIONS.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )
}

export default SearchBar
