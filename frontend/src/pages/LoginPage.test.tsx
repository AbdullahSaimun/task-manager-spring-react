import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'
import * as AuthContext from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthContext>()
  return { ...actual, useAuth: vi.fn() }
})

function renderLoginPage() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(AuthContext.useAuth).mockReset()
})

describe('LoginPage', () => {
  it('shows required-field errors and does not call login when submitted blank', async () => {
    const login = vi.fn()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login,
      register: vi.fn(),
      logout: vi.fn(),
      username: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
    })
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: 'Log In' }))

    expect(await screen.findByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('logs in and navigates to / on success', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login,
      register: vi.fn(),
      logout: vi.fn(),
      username: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
    })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('Username'), 'alice')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Log In' }))

    expect(login).toHaveBeenCalledWith('alice', 'password123')
    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })

  it('shows the server error message and stays on the page when login fails', async () => {
    const login = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Invalid username or password' } },
    })
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login,
      register: vi.fn(),
      logout: vi.fn(),
      username: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
    })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('Username'), 'alice')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Log In' }))

    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Home page')).not.toBeInTheDocument())
  })
})
