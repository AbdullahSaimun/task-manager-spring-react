import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import Sidebar, { DRAWER_WIDTH } from './AppShell/Sidebar'
import { useAuth } from '../contexts/AuthContext'

// The application shell (UI-modernization plan): a persistent Sidebar
// (temporary/toggleable on narrow viewports) plus a slim AppBar holding
// only the mobile nav toggle and the account menu — navigation itself now
// lives entirely in Sidebar. Replaces the previous AppBar-only layout.
function Layout() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  function handleLogout() {
    setMenuAnchor(null)
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Task Manager
            </Typography>
          </Box>
          <Tooltip title={username ?? 'Account'}>
            <IconButton
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              aria-label="Account menu"
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                {username ? username[0].toUpperCase() : '?'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled>{username}</MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        {isMobile ? (
          <Sidebar variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} />
        ) : (
          <Sidebar variant="permanent" open />
        )}
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Container sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}

export default Layout
