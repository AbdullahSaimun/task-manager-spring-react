import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminRoute from './AdminRoute'
import * as AuthContext from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthContext>()
  return { ...actual, useAuth: vi.fn() }
})

function renderWithRole(isAdmin: boolean) {
  vi.mocked(AuthContext.useAuth).mockReturnValue({
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    username: 'someone',
    role: isAdmin ? 'ADMIN' : 'USER',
    isAuthenticated: true,
    isAdmin,
  })

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/" element={<div>Task list</div>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>Admin content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(AuthContext.useAuth).mockReset()
})

describe('AdminRoute', () => {
  it('renders the admin content for an admin', () => {
    renderWithRole(true)
    expect(screen.getByText('Admin content')).toBeInTheDocument()
  })

  it('redirects a non-admin back to / instead of /login', () => {
    renderWithRole(false)
    expect(screen.getByText('Task list')).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })
})
