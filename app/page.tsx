"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { AuthDialog } from "@/components/auth/auth-dialog"
import { PublicRoute } from "@/components/auth/public-route"
import { Crown, Lock, Star, TrendingUp, Users, Zap, Sparkles,  Diamond, Globe } from "lucide-react"
import i18n from '@/lib/i18n'
import { useTranslation } from 'react-i18next'

export default function HomePage() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [mounted, setMounted] = useState(false)
  const { t } = useTranslation()
  const currentLang = (i18n.language || 'es').substring(0,2).toLowerCase()

  useEffect(() => {
    setMounted(true)
  }, [])

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  return (
    <PublicRoute>
      <div className="min-h-screen bg-black overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Floating particles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse opacity-60" />
          <div className="absolute top-40 right-20 w-1 h-1 bg-[#D4AF37] rounded-full animate-ping opacity-40" />
          <div className="absolute top-60 left-1/4 w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce opacity-30" />
          <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse opacity-50" />
          <div className="absolute bottom-20 left-1/2 w-1 h-1 bg-[#D4AF37] rounded-full animate-ping opacity-60" />
          
          {/* Gradient orbs with movement */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-[#D4AF37]/8 to-transparent rounded-full blur-3xl animate-bounce" />
          
          {/* Moving lines */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent animate-pulse" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent animate-pulse" />
        </div>

        {/* Header */}
        <header className="fixed top-0 z-50 w-full border-b border-[#D4AF37]/20 bg-black/80 backdrop-blur-sm transition-all duration-300">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className={`flex items-center gap-0 transition-all duration-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="relative">
                <img 
                  src="/favicon.ico?v=2" 
                  alt="ElitFans" 
                  width={72} 
                  height={72} 
                  className="h-[72px] w-[72px] brightness-110 animate-pulse bg-transparent" 
                  style={{ backgroundColor: 'transparent', mixBlendMode: 'screen' }}
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] rounded-full animate-ping opacity-75" />
              </div>
              <span className="-ml-1 text-2xl font-extrabold tracking-wide hover:scale-105 transition-transform duration-300 brand">
                EliteFans
              </span>
            </div>
            <div className={`flex items-center gap-3 transition-all duration-700 delay-200 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <span className="uppercase text-sm font-semibold">{currentLang}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-[#D4AF37]/20 bg-black text-[#D4AF37]">
                  <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#D4AF37]/20" />
                  <DropdownMenuItem onClick={() => { i18n.changeLanguage('es'); try { localStorage.setItem('i18nextLng','es') } catch(e){} }} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">{t('language.es')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { i18n.changeLanguage('en'); try { localStorage.setItem('i18nextLng','en') } catch(e){} }} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">{t('language.en')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { i18n.changeLanguage('zh'); try { localStorage.setItem('i18nextLng','zh') } catch(e){} }} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">{t('language.chinese') || 'Mandarin'}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { i18n.changeLanguage('ru'); try { localStorage.setItem('i18nextLng','ru') } catch(e){} }} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">{t('language.russian') || 'Russian'}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                onClick={() => openAuth("login")}
                className="text-[#D4AF37] font-semibold tracking-wide uppercase hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] hover:scale-105 transition-all duration-300"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => openAuth("signup")} 
                className="bg-[#D4AF37] text-black font-semibold tracking-wide uppercase hover:bg-[#C9A961] hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[#D4AF37]/25"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16">
          {/* Enhanced Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/8 blur-3xl animate-pulse" />
          
          {/* Animated rings */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[800px] h-[800px] border border-[#D4AF37]/10 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute inset-20 border border-[#D4AF37]/5 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            <div className="absolute inset-40 border border-[#D4AF37]/3 rounded-full animate-spin" style={{ animationDuration: '25s' }} />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className={`mb-8 flex justify-center transition-all duration-1000 ${mounted ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
              <div className="relative group">
                <Image 
                  src="/elitfans-logo.png" 
                  alt="ElitFans Logo" 
                  width={300} 
                  height={300} 
                  className="h-48 w-auto hover:scale-110 transition-transform duration-500 drop-shadow-2xl bg-transparent" 
                  style={{ backgroundColor: 'transparent', mixBlendMode: 'screen' }}
                />
                <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-[#D4AF37] animate-pulse" />
                <Diamond className="absolute -bottom-2 -left-2 w-6 h-6 text-[#D4AF37] animate-bounce" />
              </div>
            </div>
            
            <h1 className={`mb-6 text-balance text-5xl font-bold leading-tight text-[#D4AF37] md:text-7xl transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <span className="inline-block hover:scale-110 transition-transform duration-300">Exclusive</span>{" "}
              <span className="inline-block hover:scale-110 transition-transform duration-300 delay-100">Content</span>
              <br />
              <span className="text-white inline-block hover:scale-110 transition-transform duration-300 delay-200">For</span>{" "}
              <span className="text-white inline-block hover:scale-110 transition-transform duration-300 delay-300 brand">EliteFans</span>{" "}
            </h1>
            
            <p className={`mb-8 text-balance text-xl text-[#D4AF37]/80 md:text-2xl transition-all duration-1000 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              Connect with your favorite creators and access premium content you won&apos;t find anywhere else
            </p>
            
            <div className={`flex flex-col items-center justify-center gap-4 sm:flex-row transition-all duration-1000 delay-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Button
                size="lg"
                onClick={() => openAuth("signup")}
                className="bg-[#D4AF37] px-8 text-lg text-black hover:bg-[#C9A961] hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-[#D4AF37]/50 group"
              >
                <Crown className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                Get Started
                <Sparkles className="ml-2 h-4 w-4 group-hover:animate-spin" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => openAuth("login")}
                className="border-[#D4AF37] px-8 text-lg text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:scale-110 transition-all duration-300 group"
              >
                <Star className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                Explore Creators
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-[#D4AF37]/20 bg-black py-24 relative overflow-hidden">
          {/* Section background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="mb-16 text-center text-4xl font-bold text-[#D4AF37] hover:scale-105 transition-transform duration-300">
              Why ElitFans?
              <div className="w-24 h-1 bg-gradient-to-r from-[#D4AF37] to-transparent mx-auto mt-4 rounded-full" />
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Lock className="h-8 w-8" />}
                title="Exclusive Content"
                description="Access premium and exclusive content from your favorite creators"
                delay="0"
              />
              <FeatureCard
                icon={<Users className="h-8 w-8" />}
                title="Elite Community"
                description="Join a select community of fans and content creators"
                delay="100"
              />
              <FeatureCard
                icon={<Star className="h-8 w-8" />}
                title="Premium Experience"
                description="Enjoy a platform designed to deliver the best experience"
                delay="200"
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8" />}
                title="Monetize Your Content"
                description="Creators: turn your passion into sustainable income"
                delay="300"
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title="Secure Payments"
                description="Secure transactions for your peace of mind"
                delay="400"
              />
              <FeatureCard
                icon={<Crown className="h-8 w-8" />}
                title="VIP Support"
                description="Personalized support for creators and subscribers"
                delay="500"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-[#D4AF37]/20 bg-gradient-to-b from-black to-[#D4AF37]/5 py-24 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#D4AF37]/3 rounded-full blur-3xl animate-bounce" />
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="mb-6 text-4xl font-bold text-[#D4AF37] md:text-5xl hover:scale-105 transition-transform duration-300">
              Ready to join the elite?
              <Sparkles className="inline-block ml-4 w-10 h-10 animate-spin" />
            </h2>
            <p className="mb-8 text-xl text-[#D4AF37]/80 hover:text-[#D4AF37] transition-colors duration-300">
              Create your account today and discover a world of exclusive content
            </p>
            <Button
              size="lg"
              onClick={() => openAuth("signup")}
              className="bg-[#D4AF37] px-12 text-lg text-black hover:bg-[#C9A961] hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-[#D4AF37]/50 group"
            >
              <Crown className="mr-2 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              Sign Up Free
              <Diamond className="ml-2 h-5 w-5 group-hover:animate-bounce" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#D4AF37]/20 bg-black py-8 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/5 to-transparent" />
          <div className="container mx-auto px-4 text-center text-[#D4AF37]/60 relative z-10">
            <p className="hover:text-[#D4AF37] transition-colors duration-300">
              © 2025 ElitFans. All rights reserved.
            </p>
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
  delay = "0"
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay?: string
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), parseInt(delay))
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={`group rounded-lg border border-[#D4AF37]/20 bg-black/50 p-6 transition-all duration-500 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#D4AF37]/20 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="mb-4 inline-flex rounded-lg bg-[#D4AF37]/10 p-3 text-[#D4AF37] transition-all duration-300 group-hover:bg-[#D4AF37]/20 group-hover:scale-110 group-hover:rotate-3">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-[#D4AF37] group-hover:scale-105 transition-transform duration-300">{title}</h3>
      <p className="text-[#D4AF37]/70 group-hover:text-[#D4AF37]/90 transition-colors duration-300">{description}</p>
      
      {/* Hover effect particles */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-2 right-2 w-1 h-1 bg-[#D4AF37] rounded-full animate-ping" />
        <div className="absolute bottom-2 left-2 w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse" />
      </div>
    </div>
  )
}