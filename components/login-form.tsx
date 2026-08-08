"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Lock } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) {
      toast.error("Please enter both username and password")
      return
    }
    setIsSubmitting(true)
    try {
      await login(username, password)
      toast.success("Signed in successfully")
      router.replace("/")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Try again."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-card/70 p-2.5 backdrop-blur-sm"
    >
      <div className="flex flex-col border rounded-lg">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-2.5">
            <Lock className="size-4 text-foreground" />
            <h2 className="text-base font-medium text-foreground">
              Administrator credentials
            </h2>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <span className="text-xs text-muted-foreground">
                Keep it secret
              </span>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2.5 h-11 w-full text-base"
      >
        {isSubmitting && <LoaderCircle className="animate-spin" />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}