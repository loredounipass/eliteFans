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
              <img src="/favicon.ico?v=2" alt="ElitFans" width={56} height={56} className="h-14 w-14 brightness-110" />
              <span className="text-2xl font-extrabold tracking-wide text-[#D4AF37]">ElitFans</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => openAuth("login")}
                className="text-[#D4AF37] font-semibold tracking-wide uppercase hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
              >
                Sign In
              </Button>
              <Button onClick={() => openAuth("signup")} className="bg-[#D4AF37] text-black font-semibold tracking-wide uppercase hover:bg-[#C9A961]">
                Sign Up
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
              Exclusive Content
              <br />
              <span className="text-white">For Elite Fans</span>
            </h1>
            <p className="mb-8 text-balance text-xl text-[#D4AF37]/80 md:text-2xl">
              Connect with your favorite creators and access premium content you won't find anywhere else
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => openAuth("signup")}
                className="bg-[#D4AF37] px-8 text-lg text-black hover:bg-[#C9A961]"
              >
                <Crown className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => openAuth("login")}
                className="border-[#D4AF37] px-8 text-lg text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                Explore Creators
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-[#D4AF37]/20 bg-black py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-16 text-center text-4xl font-bold text-[#D4AF37]">Why ElitFans?</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Lock className="h-8 w-8" />}
                title="Exclusive Content"
                description="Access premium and exclusive content from your favorite creators"
              />
              <FeatureCard
                icon={<Users className="h-8 w-8" />}
                title="Elite Community"
                description="Join a select community of fans and content creators"
              />
              <FeatureCard
                icon={<Star className="h-8 w-8" />}
                title="Premium Experience"
                description="Enjoy a platform designed to deliver the best experience"
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8" />}
                title="Monetize Your Content"
                description="Creators: turn your passion into sustainable income"
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title="Secure Payments"
                description="Secure transactions for your peace of mind"
              />
              <FeatureCard
                icon={<Crown className="h-8 w-8" />}
                title="VIP Support"
                description="Personalized support for creators and subscribers"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-[#D4AF37]/20 bg-gradient-to-b from-black to-[#D4AF37]/5 py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-4xl font-bold text-[#D4AF37] md:text-5xl">Ready to join the elite?</h2>
            <p className="mb-8 text-xl text-[#D4AF37]/80">
              Create your account today and discover a world of exclusive content
            </p>
            <Button
              size="lg"
              onClick={() => openAuth("signup")}
              className="bg-[#D4AF37] px-12 text-lg text-black hover:bg-[#C9A961]"
            >
              Sign Up Free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#D4AF37]/20 bg-black py-8">
            <div className="container mx-auto px-4 text-center text-[#D4AF37]/60">
            <p>© 2025 ElitFans. All rights reserved.</p>
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
