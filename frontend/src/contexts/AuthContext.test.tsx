import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { setToken } from '../api/client'
import * as authApi from '../api/auth'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  // client.ts's token lives in a module-level variable, not just localStorage —
  // clearing storage alone would leave a stale token from a previous test.
  setToken(null)
  localStorage.clear()
  vi.mocked(authApi.login).mockReset()
  vi.mocked(authApi.register).mockReset()
})

describe('AuthContext', () => {
  it('starts logged out when nothing is stored', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.username).toBeNull()
    expect(result.current.role).toBeNull()
  })

  it('throws when used outside an AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    )
  })

  it('login stores the token/username/role and derives isAdmin for an admin account', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'jwt-alice',
      username: 'alice',
      role: 'ADMIN',
    })
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('alice', 'password123')
    })

    expect(authApi.login).toHaveBeenCalledWith('alice', 'password123')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.username).toBe('alice')
    expect(result.current.role).toBe('ADMIN')
    expect(result.current.isAdmin).toBe(true)
    expect(localStorage.getItem('taskmanager_token')).toBe('jwt-alice')
    expect(localStorage.getItem('taskmanager_username')).toBe('alice')
    expect(localStorage.getItem('taskmanager_role')).toBe('ADMIN')
  })

  it('login for a regular user does not grant isAdmin', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'jwt-bob',
      username: 'bob',
      role: 'USER',
    })
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('bob', 'password123')
    })

    expect(result.current.isAdmin).toBe(false)
  })

  it('register applies the same auth state as login', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      token: 'jwt-newuser',
      username: 'newuser',
      role: 'USER',
    })
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register('newuser', 'secret123')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.username).toBe('newuser')
  })

  it('logout clears state and storage', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'jwt-alice',
      username: 'alice',
      role: 'ADMIN',
    })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.login('alice', 'password123')
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.username).toBeNull()
    expect(result.current.role).toBeNull()
    expect(localStorage.getItem('taskmanager_token')).toBeNull()
    expect(localStorage.getItem('taskmanager_username')).toBeNull()
    expect(localStorage.getItem('taskmanager_role')).toBeNull()
  })

  it('a fresh mount picks up an already-stored session (simulates a page refresh)', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'jwt-alice',
      username: 'alice',
      role: 'ADMIN',
    })
    const first = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await first.result.current.login('alice', 'password123')
    })

    const second = renderHook(() => useAuth(), { wrapper })

    expect(second.result.current.isAuthenticated).toBe(true)
    expect(second.result.current.username).toBe('alice')
    expect(second.result.current.isAdmin).toBe(true)
  })
})
