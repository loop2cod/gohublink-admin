"use client"

import * as React from "react"

import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  subscribeTokenChanged,
  post,
} from "@/lib/api"

interface AuthState {
  token: string | null
  username: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthState | null>(null)

function readUsername(token: string): string | null {
  try {
    const payload = token.split(".")[1]
    const decoded = JSON.parse(atob(payload))
    return decoded.username ?? null
  } catch {
    return null
  }
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = React.useSyncExternalStore(
    subscribeTokenChanged,
    () => getAccessToken(),
    () => null
  )
  const username = React.useMemo(
    () => (token ? readUsername(token) : null),
    [token]
  )

  const login = React.useCallback(async (username: string, password: string) => {
    const res = await post<{
      token?: string
      access_token?: string
      refresh_token?: string
    }>("/auth/login", { username, password })

    const access = res.access_token ?? res.token
    if (!access) {
      throw new Error("Login response did not include a token")
    }
    setAuthTokens(access, res.refresh_token ?? null)
  }, [])

  const logout = React.useCallback(() => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      // best-effort revoke on the server; never block local sign-out
      post("/auth/logout", { refresh_token: refreshToken }).catch(() => {})
    }
    clearAuthTokens()
  }, [])

  const value = React.useMemo<AuthState>(
    () => ({
      token,
      username,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, username, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}

export { AuthProvider, useAuth }