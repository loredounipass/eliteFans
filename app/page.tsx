"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { PublicRoute } from "@/components/auth/public-route"
import { Crown, Lock, Star, TrendingUp, Users, Zap } from "lucide-react"

export default function HomePage() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  return (
    <PublicRoute>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="fixed top-0 z-50 w-full border-b border-[#D4AF37]/20 bg-black/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Image
                src="/icon.svg"
                alt="ElitFans"
                width={48}
                height={48}
                className="h-12 w-12 brightness-110"
                priority
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => openAuth("login")}
                className="text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
              >
                Iniciar Sesión
              </Button>
              <Button onClick={() => openAuth("signup")} className="bg-[#D4AF37] text-black hover:bg-[#C9A961]">
                Registrarse
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent" />
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/5 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="mb-8 flex justify-center">
              <Image src="/elitfans-logo.png" alt="ElitFans Logo" width={300} height={300} className="h-48 w-auto" />
            </div>
            <h1 className="mb-6 text-balance text-5xl font-bold leading-tight text-[#D4AF37] md:text-7xl">
              Contenido Exclusivo
              <br />
              <span className="text-white">Para Fans de Élite</span>
            </h1>
            <p className="mb-8 text-balance text-xl text-[#D4AF37]/80 md:text-2xl">
              Conecta con tus creadores favoritos y accede a contenido premium que no encontrarás en ningún otro lugar
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => openAuth("signup")}
                className="bg-[#D4AF37] px-8 text-lg text-black hover:bg-[#C9A961]"
              >
                <Crown className="mr-2 h-5 w-5" />
                Comenzar Ahora
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => openAuth("login")}
                className="border-[#D4AF37] px-8 text-lg text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                Explorar Creadores
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-[#D4AF37]/20 bg-black py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-16 text-center text-4xl font-bold text-[#D4AF37]">¿Por qué ElitFans?</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Lock className="h-8 w-8" />}
                title="Contenido Exclusivo"
                description="Accede a contenido premium y exclusivo de tus creadores favoritos"
              />
              <FeatureCard
                icon={<Users className="h-8 w-8" />}
                title="Comunidad Élite"
                description="Únete a una comunidad selecta de fans y creadores de contenido"
              />
              <FeatureCard
                icon={<Star className="h-8 w-8" />}
                title="Experiencia Premium"
                description="Disfruta de una plataforma diseñada para ofrecer la mejor experiencia"
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8" />}
                title="Monetiza tu Contenido"
                description="Creadores: convierte tu pasión en ingresos sostenibles"
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title="Pagos Seguros"
                description="Transacciones seguras y protegidas para tu tranquilidad"
              />
              <FeatureCard
                icon={<Crown className="h-8 w-8" />}
                title="Soporte VIP"
                description="Atención personalizada para creadores y suscriptores"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-[#D4AF37]/20 bg-gradient-to-b from-black to-[#D4AF37]/5 py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-4xl font-bold text-[#D4AF37] md:text-5xl">¿Listo para unirte a la élite?</h2>
            <p className="mb-8 text-xl text-[#D4AF37]/80">
              Crea tu cuenta hoy y descubre un mundo de contenido exclusivo
            </p>
            <Button
              size="lg"
              onClick={() => openAuth("signup")}
              className="bg-[#D4AF37] px-12 text-lg text-black hover:bg-[#C9A961]"
            >
              Registrarse Gratis
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#D4AF37]/20 bg-black py-8">
          <div className="container mx-auto px-4 text-center text-[#D4AF37]/60">
            <p>&copy; 2025 ElitFans. Todos los derechos reservados.</p>
          </div>
        </footer>

        {/* Auth Dialog */}
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
      </div>
    </PublicRoute>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group rounded-lg border border-[#D4AF37]/20 bg-black/50 p-6 transition-all hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5">
      <div className="mb-4 inline-flex rounded-lg bg-[#D4AF37]/10 p-3 text-[#D4AF37] transition-colors group-hover:bg-[#D4AF37]/20">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-[#D4AF37]">{title}</h3>
      <p className="text-[#D4AF37]/70">{description}</p>
    </div>
  )
}
