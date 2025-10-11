"use client"

import type React from "react"

import { useState } from "react"
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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              username,
            },
          },
        })

        if (error) throw error

        // Check if email confirmation is required
        if (data?.user && !data.session) {
          toast({
            title: "¡Cuenta creada exitosamente!",
            description:
              "Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.",
            duration: 8000,
          })
        } else if (data?.session) {
          // Email confirmation is disabled, user is logged in immediately
          toast({
            title: "¡Bienvenido a ElitFans!",
            description: "Tu cuenta ha sido creada exitosamente.",
          })
          setTimeout(() => {
            window.location.href = "/dashboard"
          }, 1000)
        }

        onOpenChange(false)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.includes("Email not confirmed")) {
            throw new Error(
              "Tu correo electrónico aún no ha sido confirmado. Por favor revisa tu bandeja de entrada y haz clic en el enlace de confirmación.",
            )
          }
          throw error
        }

        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Has iniciado sesión exitosamente.",
        })
        onOpenChange(false)
        window.location.href = "/dashboard"
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#D4AF37]">
                Nombre de usuario
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#D4AF37]">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#D4AF37] text-black hover:bg-[#C9A961]">
            {loading ? "Procesando..." : mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </Button>
        </form>
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
