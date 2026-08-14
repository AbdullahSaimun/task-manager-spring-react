import { apiClient } from './client'
import type { PageResponse, Task, TaskPriority, TaskStatus } from '../types/task'

export interface TaskListParams {
  search: string
  status: TaskStatus | ''
  page: number
  size: number
  sort: string
}

export interface TaskRequestBody {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
}

export async function listTasks(params: TaskListParams): Promise<PageResponse<Task>> {
  const response = await apiClient.get<PageResponse<Task>>('/tasks', {
    params: {
      search: params.search || undefined,
      status: params.status || undefined,
      page: params.page,
      size: params.size,
      sort: params.sort,
    },
  })
  return response.data
}

export async function getTask(id: number): Promise<Task> {
  const response = await apiClient.get<Task>(`/tasks/${id}`)
  return response.data
}

export async function createTask(body: TaskRequestBody): Promise<Task> {
  const response = await apiClient.post<Task>('/tasks', body)
  return response.data
}

export async function updateTask(id: number, body: TaskRequestBody): Promise<Task> {
  const response = await apiClient.put<Task>(`/tasks/${id}`, body)
  return response.data
}

export async function deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/tasks/${id}`)
}
