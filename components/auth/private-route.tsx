"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface PrivateRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function PrivateRoute({ children, redirectTo = "/" }: PrivateRouteProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
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
        <img
          src="/favicon.ico"
          alt="Loading..."
          className="w-44 h-44 animate-float"
        />
        <style jsx>{`
          @keyframes float {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
            100% {
              transform: translateY(0px);
            }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
            filter: drop-shadow(0 0 24px #d4af37) brightness(1.2);
          }
        `}</style>
      </div>
    )
  }

  return <>{children}</>
}
