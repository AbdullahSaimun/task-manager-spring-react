import type { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import { useAuth } from '../../contexts/AuthContext'

export const DRAWER_WIDTH = 240

interface NavItem {
  label: string
  to: string
  icon: ReactNode
}

interface SidebarProps {
  variant: 'permanent' | 'temporary'
  open: boolean
  onClose?: () => void
}

// The app's persistent navigation shell (UI-modernization plan, replacing
// the previous AppBar-only layout). Permanent on desktop, a toggleable
// temporary Drawer on narrow viewports — driven by Layout, which decides
// which `variant` to render based on a breakpoint check.
function Sidebar({ variant, open, onClose }: SidebarProps) {
  const { isAdmin } = useAuth()
  const location = useLocation()

  const items: NavItem[] = [
    { label: 'Task List', to: '/', icon: <AssignmentOutlinedIcon /> },
    ...(isAdmin
      ? [{ label: 'Admin', to: '/admin', icon: <AdminPanelSettingsOutlinedIcon /> }]
      : []),
  ]

  function isActive(to: string) {
    return to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  }

  const content = (
    <Box sx={{ width: DRAWER_WIDTH }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Task Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List component="nav" sx={{ px: 1, py: 1 }}>
        {items.map((item) => (
          <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={RouterLink}
              to={item.to}
              selected={isActive(item.to)}
              onClick={variant === 'temporary' ? onClose : undefined}
              sx={{ borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Drawer
      variant={variant}
      open={variant === 'permanent' ? true : open}
      onClose={onClose}
      slotProps={variant === 'temporary' ? { root: { keepMounted: true } } : undefined}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      {content}
    </Drawer>
  )
}

export default Sidebar
