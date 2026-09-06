import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
}

// One consistent "nothing here" presentation — replaces 3 different
// inconsistent (or entirely missing) empty-state strings across the app.
function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 6 }}>
      <Box sx={{ color: 'text.disabled' }}>{icon ?? <InboxOutlinedIcon sx={{ fontSize: 40 }} />}</Box>
      <Typography variant="body1">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
  )
}

export default EmptyState
