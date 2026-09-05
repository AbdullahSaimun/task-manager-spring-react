import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginRequest, register as registerRequest } from '../api/auth'
import { getToken, setToken as setStoredToken } from '../api/client'
import type { Role } from '../types/auth'

const USERNAME_STORAGE_KEY = 'taskmanager_username'
const ROLE_STORAGE_KEY = 'taskmanager_role'

interface AuthContextValue {
  username: string | null
  role: Role | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem(USERNAME_STORAGE_KEY),
  )
  const [role, setRole] = useState<Role | null>(
    () => localStorage.getItem(ROLE_STORAGE_KEY) as Role | null,
  )

  function applyAuth(newToken: string, newUsername: string, newRole: Role) {
    setStoredToken(newToken)
    localStorage.setItem(USERNAME_STORAGE_KEY, newUsername)
    localStorage.setItem(ROLE_STORAGE_KEY, newRole)
    setTokenState(newToken)
    setUsername(newUsername)
    setRole(newRole)
  }

  async function login(usernameInput: string, password: string) {
    const response = await loginRequest(usernameInput, password)
    applyAuth(response.token, response.username, response.role)
  }

  async function register(usernameInput: string, password: string) {
    const response = await registerRequest(usernameInput, password)
    applyAuth(response.token, response.username, response.role)
  }

  function logout() {
    setStoredToken(null)
    localStorage.removeItem(USERNAME_STORAGE_KEY)
    localStorage.removeItem(ROLE_STORAGE_KEY)
    setTokenState(null)
    setUsername(null)
    setRole(null)
  }

  const value: AuthContextValue = {
    username,
    role,
    isAuthenticated: token !== null,
    isAdmin: role === 'ADMIN',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
