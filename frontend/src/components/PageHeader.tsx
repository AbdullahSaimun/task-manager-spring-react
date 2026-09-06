import type { ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

// The one page-header shape every workspace page uses from here on —
// title (+ optional one-line description) on the left, a primary action
// on the right. See CLAUDE.md section 16 / the UI-modernization plan.
function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}
    >
      <Stack spacing={0.5}>
        <Typography variant="h4">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Stack>
      {action}
    </Stack>
  )
}

export default PageHeader
