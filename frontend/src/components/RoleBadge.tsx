import Chip from '@mui/material/Chip'
import type { ChipProps } from '@mui/material/Chip'
import type { Role } from '../types/auth'

// Same Record<Role, color> pattern StatusBadge already establishes for
// TaskStatus, applied to Role — replaces AdminPage's ad hoc inline mapping.
const ROLE_COLOR: Record<Role, ChipProps['color']> = {
  USER: 'default',
  ADMIN: 'primary',
}

interface RoleBadgeProps {
  role: Role
}

function RoleBadge({ role }: RoleBadgeProps) {
  return <Chip label={role} color={ROLE_COLOR[role]} size="small" />
}

export default RoleBadge
