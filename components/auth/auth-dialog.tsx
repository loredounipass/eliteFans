"use client"

import React, { useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "login" | "signup"
  onModeChange: (mode: "login" | "signup") => void
}

export function AuthDialog({ open, onOpenChange, mode, onModeChange }: AuthDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loadingSignup, setLoadingSignup] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [signupMessage, setSignupMessage] = useState<string | null>(null)

  useEffect(() => {
    if (loginError) {
      toast({ title: "Error", description: loginError, variant: "destructive" })
    }
  }, [loginError, toast])

  useEffect(() => {
    if (signupError) {
      toast({ title: "Error", description: signupError, variant: "destructive" })
    } else if (signupMessage) {
      toast({ title: "Welcome to ElitFans!", description: signupMessage, duration: 8000 })
      onOpenChange(false)
    }
  }, [signupError, signupMessage, toast, onOpenChange])

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoadingSignup(true)

    const form = new FormData(e.currentTarget)
    const username = form.get("username") as string
    const email = form.get("email") as string
    const password = form.get("password") as string

    if (!email || !password) {
      toast({ title: "Error", description: "Email and password are required", variant: "destructive" })
      setLoadingSignup(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const origin = window.location.origin
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      })

      if (error) {
        setSignupError(error.message)
      } else if (data?.user && !data?.session) {
  setSignupMessage("Check your email to confirm your account.")
      } else if (data?.session) {
        // Logged in directly
        onOpenChange(false)
      }
    } catch (err: any) {
      setSignupError(err?.message ?? String(err))
    } finally {
      setLoadingSignup(false)
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoadingLogin(true)
    setLoginError(null)

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    if (!email || !password) {
      setLoginError("Email and password are required")
      setLoadingLogin(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        const msg = (error.message || "").toLowerCase()
        if (msg.includes("invalid login credentials") || msg.includes("invalid password") || msg.includes("invalid email")) {
          setLoginError("Credenciales incorrectas")
        } else {
          setLoginError(error.message)
        }
        return
      }

      if (data?.user && !data?.session) {
        setLoginError("You must confirm your email before signing in. Check your inbox.")
        return
      }

      if (data?.session) {
        // Close dialog and navigate to dashboard
        onOpenChange(false)
        router.push("/dashboard")
      }
    } catch (err: any) {
      setLoginError(err?.message ?? String(err))
    } finally {
      setLoadingLogin(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#D4AF37] bg-black text-[#D4AF37] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#D4AF37]">
            {mode === "login" ? "Sign In" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-[#D4AF37]/70">
            {mode === "login"
              ? "Enter your credentials to access ElitFans"
              : "Join the exclusive ElitFans community"}
          </DialogDescription>
        </DialogHeader>
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#D4AF37]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@email.com"
                required
                className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#D4AF37]">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
            <Button type="submit" disabled={loadingLogin} className="w-full bg-[#D4AF37] text-black hover:bg-[#C9A961]">
              {loadingLogin ? "Processing..." : "Sign In"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#D4AF37]">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="your_username"
                required
                className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#D4AF37]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@email.com"
                required
                className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#D4AF37]">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
            <Button type="submit" disabled={loadingSignup} className="w-full bg-[#D4AF37] text-black hover:bg-[#C9A961]">
              {loadingSignup ? "Processing..." : "Create Account"}
            </Button>
          </form>
        )}
        <div className="text-center text-sm text-[#D4AF37]/70">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"} {" "}
          <button
            type="button"
            onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
            className="font-semibold text-[#D4AF37] hover:underline"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SubmitButton({ text, loadingText }: { text: string; loadingText: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full bg-[#D4AF37] text-black hover:bg-[#C9A961]">
      {pending ? loadingText : text}
    </Button>
  )
}
