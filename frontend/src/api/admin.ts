import { apiClient } from './client'
import type { AdminTask, AdminUser } from '../types/admin'
import type { PageResponse } from '../types/task'

export async function listAllTasks(page: number, size: number): Promise<PageResponse<AdminTask>> {
  const response = await apiClient.get<PageResponse<AdminTask>>('/admin/tasks', {
    params: { page, size },
  })
  return response.data
}

export async function listAllUsers(): Promise<AdminUser[]> {
  const response = await apiClient.get<AdminUser[]>('/admin/users')
  return response.data
}
