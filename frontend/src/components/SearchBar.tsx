import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
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
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
      <TextField
        label="Search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        sx={{ flexGrow: 1 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        select
        label="Status"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as TaskStatus | '')}
        sx={{ minWidth: { sm: 160 } }}
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
