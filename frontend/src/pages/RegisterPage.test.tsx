import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RegisterPage from './RegisterPage'
import * as AuthContext from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthContext>()
  return { ...actual, useAuth: vi.fn() }
})

function renderRegisterPage() {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(AuthContext.useAuth).mockReset()
})

describe('RegisterPage', () => {
  it('rejects a password shorter than 6 characters', async () => {
    const register = vi.fn()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login: vi.fn(),
      register,
      logout: vi.fn(),
      username: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
    })
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText('Username'), 'newuser')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.type(screen.getByLabelText('Confirm password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('rejects a mismatched confirm-password field', async () => {
    const register = vi.fn()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login: vi.fn(),
      register,
      logout: vi.fn(),
      username: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
    })
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText('Username'), 'newuser')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.type(screen.getByLabelText('Confirm password'), 'different123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Passwords must match')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('registers and navigates to / on success', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login: vi.fn(),
      register,
      logout: vi.fn(),
      username: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
    })
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText('Username'), 'newuser')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.type(screen.getByLabelText('Confirm password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(register).toHaveBeenCalledWith('newuser', 'secret123')
    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })

  it('shows the server error message when the username is already taken', async () => {
    const register = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Username 'alice' is already taken" } },
    })
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login: vi.fn(),
      register,
      logout: vi.fn(),
      username: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
    })
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText('Username'), 'alice')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.type(screen.getByLabelText('Confirm password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText("Username 'alice' is already taken")).toBeInTheDocument()
  })
})
