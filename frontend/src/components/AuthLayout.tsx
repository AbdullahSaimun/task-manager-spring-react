import type { FormEvent, ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'

interface AuthLayoutProps {
  title: string
  error?: string | null
  footer?: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}

// Shared wrapper for LoginPage/RegisterPage, which were previously two
// near-identical hand-rolled Stacks (CLAUDE.md section 16 / the
// UI-modernization plan). Each page still owns its own fields, Yup schema,
// and submit handler — only the surrounding layout moved here.
function AuthLayout({ title, error, footer, onSubmit, children }: AuthLayoutProps) {
  return (
    <Stack sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 4, sm: 10 }, px: 2 }} spacing={3}>
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {title}
      </Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            {children}
          </Stack>
        </Stack>
      </Paper>
      {footer && (
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          {footer}
        </Typography>
      )}
    </Stack>
  )
}

export default AuthLayout
