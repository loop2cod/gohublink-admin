import Image from "next/image"
import Link from "next/link"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(1200px 500px at 20% -10%, rgba(37,99,235,0.12), transparent), radial-gradient(1000px 400px at 100% 110%, rgba(37,99,235,0.08), transparent)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(900px 500px at 50% 0%, black, transparent)",
          }}
        />
      </div>

      <header className="relative z-10 flex h-16 items-center px-6">
        <Link href="/" className="flex items-center" aria-label="goHublink — admin">
          <Image
            src="/logo.svg"
            alt="goHublink logo"
            width={132}
            height={38}
            priority
            className="h-7 w-auto"
          />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              Operations Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Sign in to goHublink
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Access your network of spaces. Keep your spots live, visible, and
              connected.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Authorized personnel only. Access is monitored and audited.
          </p>
        </div>
      </main>
    </div>
  )
}