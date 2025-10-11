"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function PublicRoute({ children, redirectTo = "/dashboard" }: PublicRouteProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push(redirectTo)
      } else {
        setIsChecking(false)
      }
    }

    checkUser()
  }, [router, redirectTo, supabase])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4AF37] border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
