import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import * as AuthContext from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthContext>()
  return { ...actual, useAuth: vi.fn() }
})

function renderWithAuth(isAuthenticated: boolean) {
  vi.mocked(AuthContext.useAuth).mockReturnValue({
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    username: isAuthenticated ? 'alice' : null,
    role: isAuthenticated ? 'USER' : null,
    isAuthenticated,
    isAdmin: false,
  })

  render(
    <MemoryRouter initialEntries={['/tasks']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/tasks" element={<div>Protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(AuthContext.useAuth).mockReset()
})

describe('ProtectedRoute', () => {
  it('renders the protected content when authenticated', () => {
    renderWithAuth(true)
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    renderWithAuth(false)
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})
