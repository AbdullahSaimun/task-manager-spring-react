import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

interface LoadingStateProps {
  label?: string
}

// Replaces the app's several bare, inconsistently-sized <CircularProgress />
// call sites with one centered, consistent presentation.
function LoadingState({ label }: LoadingStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 6 }}>
      <CircularProgress size={32} />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  )
}

export default LoadingState
