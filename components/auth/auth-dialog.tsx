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
      toast({ title: "¡Bienvenido a ElitFans!", description: signupMessage, duration: 8000 })
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
      toast({ title: "Error", description: "Email y contraseña son requeridos", variant: "destructive" })
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
        setSignupMessage("Revisa tu correo para confirmar tu cuenta.")
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
      setLoginError("Email y contraseña son requeridos")
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
        setLoginError("Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.")
        return
      }

      if (data?.session) {
        // Cerrar diálogo y navegar al dashboard
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
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </DialogTitle>
          <DialogDescription className="text-[#D4AF37]/70">
            {mode === "login"
              ? "Ingresa tus credenciales para acceder a ElitFans"
              : "Únete a la comunidad exclusiva de ElitFans"}
          </DialogDescription>
        </DialogHeader>
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#D4AF37]">
                Correo electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#D4AF37]">
                Contraseña
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
              {loadingLogin ? "Procesando..." : "Iniciar Sesión"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#D4AF37]">
                Nombre de usuario
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="tu_usuario"
                required
                className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#D4AF37]">
                Correo electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#D4AF37]">
                Contraseña
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
              {loadingSignup ? "Procesando..." : "Crear Cuenta"}
            </Button>
          </form>
        )}
        <div className="text-center text-sm text-[#D4AF37]/70">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
            className="font-semibold text-[#D4AF37] hover:underline"
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
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
