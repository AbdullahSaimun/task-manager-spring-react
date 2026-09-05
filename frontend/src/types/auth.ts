export type Role = 'USER' | 'ADMIN'

export interface AuthResponse {
  token: string
  username: string
  role: Role
}
