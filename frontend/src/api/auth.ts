import { apiClient } from './client'
import type { AuthResponse } from '../types/auth'

export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', { username, password })
  return response.data
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', { username, password })
  return response.data
}
