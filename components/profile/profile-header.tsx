"use client"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Crown, Calendar, Sparkles, Diamond, Star } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

const EditProfileDialog = dynamic(() => import("./edit-profile-dialog"))

interface ProfileHeaderProps {
  profile: {
    id: string
    username: string
    full_name: string | null
    bio: string | null
    avatar_url: string | null
    cover_url: string | null
    subscriber_count: number | null
    post_count: number | null
    likes?: number | null
    subscription_price: number | null
    is_creator: boolean | null
    created_at: string
  }
  isSubscribed: boolean
  isOwnProfile: boolean
}

export function ProfileHeader({ profile, isSubscribed: initialIsSubscribed, isOwnProfile }: ProfileHeaderProps) {
  const router = useRouter()
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed)
  const [isLoading, setIsLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubscribe = async () => {
    setIsLoading(true)
    const supabase = createBrowserClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      if (isSubscribed) {
        // Unsubscribe
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("subscriber_id", user.id)
          .eq("creator_id", profile.id)

        if (!error) {
          setIsSubscribed(false)
        }
      } else {
        // Subscribe
        const { error } = await supabase.from("subscriptions").insert({
          subscriber_id: user.id,
          creator_id: profile.id,
          amount: profile.subscription_price || 0,
          status: "active",
          start_date: new Date().toISOString(),
        })

        if (!error) {
          setIsSubscribed(true)
        }
      }

      router.refresh()
    } catch (error) {
      console.error("Subscription error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createdDate = new Date(profile.created_at).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="mb-8 relative">
      {/* Cover Image con efectos mejorados */}
      <div className="relative h-48 md:h-64 overflow-hidden rounded-2xl border border-[#D4AF37]/20 shadow-2xl shadow-[#D4AF37]/10">
        {profile.cover_url ? (
          <Image 
            src={profile.cover_url || "/placeholder.svg"} 
            alt="Cover" 
            fill 
            className="object-cover transition-transform duration-500 hover:scale-105" 
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent relative">
            {/* Animated background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-10 left-10 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#D4AF37]/3 rounded-full blur-3xl animate-bounce" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-[#D4AF37]/8 to-transparent rounded-full blur-3xl animate-pulse" />
            </div>
            {/* Floating particles */}
            <div className="absolute top-8 right-8 w-2 h-2 bg-[#D4AF37] rounded-full animate-ping opacity-60" />
            <div className="absolute bottom-8 left-8 w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse opacity-80" />
            <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce opacity-40" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4">
          <Sparkles className="w-6 h-6 text-[#D4AF37] animate-pulse" />
        </div>
        <div className="absolute bottom-4 left-4">
          <Diamond className="w-5 h-5 text-[#D4AF37] animate-bounce" />
        </div>
      </div>

      {/* Profile Info con diseño mejorado */}
      <div className="relative -mt-16 mx-4">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-sm p-6 shadow-2xl shadow-[#D4AF37]/10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-6">
              {/* Avatar mejorado */}
              <div className="relative group">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/20 transition-all duration-300 group-hover:scale-105">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 text-2xl text-[#D4AF37] font-bold">
                    {(profile.full_name || profile.username)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Ring animation */}
                <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/30 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D4AF37] rounded-full border-2 border-black flex items-center justify-center">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                </div>
              </div>

              <div className="flex-1">
                <div className={`flex items-center gap-3 mb-2 transition-all duration-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#F4BF37] to-[#D4AF37] bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
                    {profile.full_name || profile.username}
                  </h1>
                  {profile.is_creator && (
                    <div className="relative">
                      <Crown className="h-6 w-6 text-[#D4AF37] animate-pulse" />
                      <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-lg animate-pulse" />
                    </div>
                  )}
                  <Star className="h-5 w-5 text-[#D4AF37] animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                
                <p className={`text-[#D4AF37]/80 mb-4 transition-all duration-700 delay-200 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
                  @{profile.username}
                </p>

                {/* Stats con animaciones */}
                <div className={`flex flex-wrap gap-6 text-sm transition-all duration-700 delay-400 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  <div className="group cursor-pointer">
                    <span className="font-bold text-[#D4AF37] text-lg group-hover:text-[#F4BF37] transition-colors duration-300">
                      {profile.subscriber_count || 0}
                    </span>
                    <span className="text-[#D4AF37]/70 ml-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                      suscriptores
                    </span>
                  </div>
                  <div className="group cursor-pointer">
                    <span className="font-bold text-[#D4AF37] text-lg group-hover:text-[#F4BF37] transition-colors duration-300">
                      {profile.post_count ?? 0}
                    </span>
                    <span className="text-[#D4AF37]/70 ml-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                      publicaciones
                    </span>
                  </div>
                  <div className="group cursor-pointer">
                    <span className="font-bold text-[#D4AF37] text-lg group-hover:text-[#F4BF37] transition-colors duration-300">
                      {profile.likes ?? 0}
                    </span>
                    <span className="text-[#D4AF37]/70 ml-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                      likes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones mejorados */}
            <div className={`flex gap-3 transition-all duration-700 delay-600 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              {!isOwnProfile && (
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className={`group transition-all duration-300 hover:scale-110 shadow-lg ${
                    isSubscribed
                      ? "border-[#D4AF37] bg-transparent text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:shadow-[#D4AF37]/25"
                      : "bg-[#D4AF37] text-black hover:bg-[#C9A961] hover:shadow-[#D4AF37]/50"
                  }`}
                  variant={isSubscribed ? "outline" : "default"}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </div>
                  ) : isSubscribed ? (
                    <>
                      <Crown className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                      Suscrito
                      <Sparkles className="ml-2 h-4 w-4 group-hover:animate-spin" />
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                      Suscribirse - ${profile.subscription_price || 0}/mes
                      <Diamond className="ml-2 h-4 w-4 group-hover:animate-bounce" />
                    </>
                  )}
                </Button>
              )}
              {isOwnProfile && (
                <>
                  <Button
                    variant="outline"
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-[#D4AF37]/25 group"
                    onClick={() => setShowEdit(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4 group-hover:animate-spin" />
                    Editar Perfil
                  </Button>
                  {showEdit && (
                    // @ts-ignore - dynamic import
                    <EditProfileDialog
                      profile={profile}
                      onClose={() => setShowEdit(false)}
                      onSaved={() => {
                        setShowEdit(false)
                        router.refresh()
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bio con efectos */}
          {profile.bio && (
            <div className={`mt-6 p-4 rounded-xl bg-black/30 border border-[#D4AF37]/10 transition-all duration-700 delay-800 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-[#D4AF37]/90 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Fecha de unión */}
          <div className={`mt-4 flex items-center gap-2 text-sm text-[#D4AF37]/60 transition-all duration-700 delay-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Calendar className="h-4 w-4" />
            <span>Se unió en {createdDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}