import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useAuth } from '../contexts/AuthContext'

function Layout() {
  const { username, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Task Manager
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            {isAdmin && (
              <Button color="inherit" component={RouterLink} to="/admin">
                Admin
              </Button>
            )}
            {username && <Typography variant="body2">{username}</Typography>}
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </>
  )
}

export default Layout
