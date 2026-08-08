import Image from "next/image"
import Link from "next/link"

import { LoginForm } from "@/components/login-form"


export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col bg-background text-foreground">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1100px 480px at 12% -12%, var(--fx-8), transparent 60%), radial-gradient(900px 420px at 105% 115%, var(--fx-9), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(720px 480px at 50% 0%, black, transparent)",
          }}
        />
        <Image
          src="/iconGroup.svg"
          alt=""
          aria-hidden
          fill
          priority
          className="object-contain object-right-center opacity-50"
          style={{
            maskImage:
              "radial-gradient(60% 70% at 70% 50%, black 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(60% 70% at 70% 50%, black 0%, transparent 78%)",
          }}
        />
      </div>

      <div className="relative z-10 grid min-h-svh lg:grid-cols-2">
        {/* Brand panel — large screens */}
        <aside className="hidden flex-col justify-between overflow-hidden p-12 lg:flex xl:p-20">
          <Link
            href="/"
            className="flex w-fit items-center"
            aria-label="goHublink — admin"
          >
            <Image
              src="/logo.svg"
              alt="goHublink logo"
              width={132}
              height={38}
              priority
              className="h-7 w-auto"
            />
          </Link>

          <div className="max-w-md">
            <p className="text-sm font-medium tracking-widest text-primary uppercase">
              Operations Dashboard
            </p>
            <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight text-balance xl:text-5xl">
              Bring every space in your network online.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
              One dashboard to keep every spot live, visible, and connected —
              without the busywork.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Authorized personnel only · Access is monitored and audited.
          </p>
        </aside>

        {/* Form panel */}
        <section className="flex min-h-svh flex-col px-5 py-6 sm:px-10 sm:py-8 lg:min-h-0 lg:px-14">
          <header className="flex items-center justify-between lg:hidden">
            <Link
              href="/"
              className="flex items-center"
              aria-label="goHublink — admin"
            >
              <Image
                src="/logo.svg"
                alt="goHublink logo"
                width={132}
                height={38}
                priority
                className="h-7 w-auto"
              />
            </Link>
            <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              Admin
            </span>
          </header>

          <div className="flex flex-1 items-center justify-center py-12 lg:py-0">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-sm font-medium tracking-widest text-primary uppercase">
                  Sign in
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Sign in to keep your spaces live, visible, and connected.
                </p>
              </div>

              <LoginForm />

              <p className="mt-8 text-center text-xs text-muted-foreground">
                Authorized personnel only. Access is monitored and audited.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}