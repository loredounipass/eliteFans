'use server'

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export async function login(formData: any) {
  const supabase = await createServerClient()
  // `formData` can be a real FormData (server form submit) or a plain object
  // (when dispatched from the client via useActionState). Detect and
  // normalize both shapes.
  const email = typeof formData?.get === "function" ? (formData.get("email") as string) : formData?.email
  const password = typeof formData?.get === "function" ? (formData.get("password") as string) : formData?.password

  if (!email || !password) {
    // Debug info: avoid sending actual values (no passwords), but include
    // the shape of the incoming payload so we can diagnose why fields are missing.
  let receivedKeys: string[] = []
  let payloadType: string = typeof formData

    try {
      if (typeof formData?.get === "function") {
        // FormData: gather keys
        receivedKeys = Array.from((formData as FormData).keys())
        payloadType = "FormData"
      } else if (formData && typeof formData === "object") {
        receivedKeys = Object.keys(formData)
        payloadType = "object"
      }
    } catch {
      // ignore any iteration errors
    }

    return {
      error: "Email y contraseña son requeridos",
      debug: { payloadType, receivedKeys },
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mapear errores comunes a mensajes en español
    const msg = (error?.message || "").toLowerCase()
    if (msg.includes("invalid login credentials") || msg.includes("invalid password") || msg.includes("invalid email")) {
      return { error: "Credenciales incorrectas" }
    }

    return { error: error.message }
  }

  // Si Supabase devuelve un usuario pero no una sesión, normalmente significa
  // que el usuario necesita confirmar su correo electrónico o completar
  // un paso adicional (dependiendo de la configuración de Supabase).
  if (data?.user && !data?.session) {
    return { error: "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada." }
  }

  // Si hay una sesión válida, redirigimos al dashboard. Si no hay error ni
  // usuario/sesión, devolvemos un mensaje genérico.
  if (data?.session) {
    redirect("/dashboard")
  }

  return { error: "No se pudo iniciar sesión. Revisa tus credenciales e intenta nuevamente." }
}

export async function signup(formData: any) {
  const originHeader = await headers()
  const origin = originHeader.get("origin")
  const supabase = await createServerClient()

  // Normalize incoming payload: could be FormData or a plain object from the client
  const email = typeof formData?.get === "function" ? (formData.get("email") as string) : formData?.email
  const password = typeof formData?.get === "function" ? (formData.get("password") as string) : formData?.password
  const username = typeof formData?.get === "function" ? (formData.get("username") as string) : formData?.username

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user && !data.session) {
    return {
      message:
        "¡Cuenta creada exitosamente! Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.",
    }
  } else if (data.session) {
    redirect("/dashboard")
  }

  return { error: null }
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect("/")
}