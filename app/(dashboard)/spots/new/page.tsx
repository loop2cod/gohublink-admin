"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, MapPin } from "lucide-react"
import { toast } from "sonner"

import { DashboardShell } from "@/components/dashboard-shell"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { post } from "@/lib/api"
import { cn } from "@/lib/utils"

function Field({
  label,
  hint,
  required,
  children,
  className,
  span = false,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  span?: boolean
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", span && "sm:col-span-2", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

export default function NewSpotPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const latitude = parseFloat(String(form.get("latitude") ?? ""))
    const longitude = parseFloat(String(form.get("longitude") ?? ""))

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      toast.error("Enter valid latitude and longitude")
      return
    }

    const payload = {
      name: String(form.get("name") ?? "").trim(),
      latitude,
      longitude,
      incharge_name: String(form.get("incharge_name") ?? "").trim(),
      incharge_phone: String(form.get("incharge_phone") ?? "").trim(),
      idcard_type: String(form.get("idcard_type") ?? "").trim(),
      idcard_name: String(form.get("idcard_name") ?? "").trim(),
      idcard_dob: String(form.get("idcard_dob") ?? "").trim(),
      idcard_number: String(form.get("idcard_number") ?? "").trim(),
      id: String(form.get("id") ?? "").trim(),
    }

    setIsSubmitting(true)
    try {
      await post("/spots", payload)
      toast.success("Spot created")
      router.push("/spots")
      router.refresh()
    } catch (err) {
      setIsSubmitting(false)
      const message =
        err instanceof Error ? err.message : "Failed to create spot"
      toast.error(message)
    }
  }

  return (
    <DashboardShell
      title="New spot"
      subtitle="Add a space to the network"
      action={
        <a href="/spots" className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </a>
      }
    >
      <form onSubmit={onSubmit} className="max-w-3xl">
        <Card className="border-border">
          <CardContent className="p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Spot details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Basic identity and location of the spot.
                </p>
              </div>
            </div>

            <TwoCol>
              <Field label="Name" required className="sm:col-span-2">
                <Input
                  name="name"
                  placeholder="e.g. Downtown Mall"
                  autoFocus
                  required
                />
              </Field>

              <Field
                label="Spot ID"
                hint="Optional — 6 letters. Auto-generated if left blank."
              >
                <Input
                  name="id"
                  placeholder="AUTO"
                  maxLength={6}
                  className="font-mono uppercase"
                />
              </Field>

              <Field label="Coordinates" hint="Required — used on maps.">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                      Lat
                    </span>
                    <Input
                      name="latitude"
                      type="number"
                      step="any"
                      placeholder="0.0000"
                      required
                      className="pl-12 font-mono"
                    />
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                      Lng
                    </span>
                    <Input
                      name="longitude"
                      type="number"
                      step="any"
                      placeholder="0.0000"
                      required
                      className="pl-12 font-mono"
                    />
                  </div>
                </div>
              </Field>
            </TwoCol>
          </CardContent>
        </Card>

        <Card className="mt-5 border-border">
          <CardContent className="p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-foreground">
                Spot incharge
              </h2>
              <p className="text-sm text-muted-foreground">
                Who looks after this spot.
              </p>
            </div>

            <TwoCol>
              <Field label="Incharge name">
                <Input
                  name="incharge_name"
                  placeholder="e.g. Rahul Sharma"
                  autoComplete="off"
                />
              </Field>
              <Field label="Incharge phone">
                <Input
                  name="incharge_phone"
                  placeholder="+91 00000 00000"
                  inputMode="tel"
                />
              </Field>
            </TwoCol>
          </CardContent>
        </Card>

        <Card className="mt-5 border-border">
          <CardContent className="p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-foreground">
                Verification
              </h2>
              <p className="text-sm text-muted-foreground">
                Optional identity details.
              </p>
            </div>

            <TwoCol>
              <Field label="ID type">
                <Input
                  name="idcard_type"
                  placeholder="e.g. Aadhaar"
                  autoComplete="off"
                />
              </Field>
              <Field label="ID name">
                <Input
                  name="idcard_name"
                  placeholder="Name on the ID"
                  autoComplete="off"
                />
              </Field>
              <Field label="Date of birth">
                <Input
                  name="idcard_dob"
                  type="date"
                  autoComplete="off"
                />
              </Field>
              <Field label="ID number">
                <Input
                  name="idcard_number"
                  placeholder="ID number"
                  autoComplete="off"
                />
              </Field>
            </TwoCol>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-36">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            {isSubmitting ? "Creating…" : "Create spot"}
          </Button>
        </div>
      </form>
    </DashboardShell>
  )
}