import axios from 'axios'
import type { ApiErrorResponse } from '../types/api'

// baseURL is relative — Vite's dev server proxies /api to the backend
// (vite.config.ts), so the browser never makes a cross-origin request and
// no backend CORS configuration is needed. Dev-only; production deployment
// topology (Phase 20) will need its own answer for this.
export const apiClient = axios.create({
  baseURL: '/api',
})

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return fallback
}
