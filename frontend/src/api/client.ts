import axios from 'axios'
import type { ApiErrorResponse } from '../types/api'

const TOKEN_STORAGE_KEY = 'taskmanager_token'

let token: string | null = localStorage.getItem(TOKEN_STORAGE_KEY)

export function getToken(): string | null {
  return token
}

export function setToken(newToken: string | null): void {
  token = newToken
  if (newToken) {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

// baseURL is relative — Vite's dev server proxies /api to the backend
// (vite.config.ts), so the browser never makes a cross-origin request and
// no backend CORS configuration is needed. Dev-only; production deployment
// topology (Phase 20) will need its own answer for this.
export const apiClient = axios.create({
  baseURL: '/api',
})

apiClient.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const isAuthEndpoint = axios.isAxiosError(error) && (error.config?.url ?? '').startsWith('/auth/')
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isAuthEndpoint) {
      setToken(null)
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return fallback
}
