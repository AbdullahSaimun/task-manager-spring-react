import type { Role } from './auth'
import type { TaskPriority, TaskStatus } from './task'

export interface AdminTask {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  ownerUsername: string
}

export interface AdminUser {
  id: number
  username: string
  role: Role
}
