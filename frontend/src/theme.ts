import { createTheme } from '@mui/material/styles'

// The app's one design-system file (UI modernization pass). Palette/typography
// hierarchy/shape/component defaults are all defined here so pages consume
// `theme.palette.*`/`theme.typography.*` rather than hardcoding values —
// see CLAUDE.md section 16 for the reasoning behind each choice below.
const theme = createTheme({
  palette: {
    primary: {
      main: '#1565c0',
    },
    secondary: {
      main: '#546e7a',
    },
    // Matches StatusBadge's existing TaskStatus -> color mapping (DONE ->
    // success, CANCELLED -> error, IN_PROGRESS -> info) — formalizing what
    // was already an implicit convention, not changing it.
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#c62828',
    },
    info: {
      main: '#0277bd',
    },
    background: {
      default: '#f5f6f8',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    // Convention used consistently across every page from this point on:
    // page title = h4, section title = h6, table/body text = body2,
    // helper/caption text = caption. All reuse MUI's existing variant
    // names — nothing custom invented.
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    // No global MuiPaper override: Paper is also the root of MUI's floating
    // overlays (Menu, Select's popup, Dialog, Popover) which genuinely need
    // a shadow for depth against the page behind them — forcing elevation:0
    // / variant:'outlined' globally would strip that everywhere at once.
    // Static, on-page surfaces (TableContainer, the new PageHeader/EmptyState)
    // instead pass `variant="outlined"` explicitly where flat-with-a-border
    // is actually wanted.
    MuiCard: {
      defaultProps: {
        elevation: 0,
        variant: 'outlined',
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: 'rgba(0, 0, 0, 0.6)',
        },
      },
    },
  },
})

export default theme
