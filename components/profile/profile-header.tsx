"use client"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Crown, Calendar, Sparkles, Diamond, Star, Facebook, Instagram, Twitter, Youtube } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { FollowButton } from "./follow-button"

const EditProfileDialog = dynamic(() => import("./edit-profile-dialog"))

interface ProfileHeaderProps {
  profile: {
    id: string
    username: string
    full_name: string | null
    bio: string | null
    avatar_url: string | null
    cover_url: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  tiktok_url?: string | null
  x_url?: string | null
  youtube_url?: string | null
    subscriber_count: number | null
    post_count: number | null
    likes?: number | null
    followers_count?: number | null
    following_count?: number | null
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
  const [followersCount, setFollowersCount] = useState(profile.followers_count || 0)
  const [followingCount, setFollowingCount] = useState(profile.following_count || 0)
  const [likesCount, setLikesCount] = useState(profile.likes || 0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return void router.push("/")
      if (isSubscribed) {
        const { error } = await supabase.from("subscriptions").update({ status: "cancelled" }).eq("subscriber_id", user.id).eq("creator_id", profile.id)
        if (!error) setIsSubscribed(false)
      } else {
        const { error } = await supabase.from("subscriptions").insert({ subscriber_id: user.id, creator_id: profile.id, amount: profile.subscription_price || 0, status: "active", start_date: new Date().toISOString() })
        if (!error) setIsSubscribed(true)
      }
      router.refresh()
    } catch (err) {
      console.error("Subscription error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollowChange = (isFollowing: boolean) => setFollowersCount((p) => Math.max(0, p + (isFollowing ? 1 : -1)))

  const createdDate = new Date(profile.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  // Mostrar el "precio justo" (formateado) para mostrar a la derecha del botón de suscripción
  const rawPrice = profile.subscription_price ?? 0
  const fairPriceDisplay = `$${(Math.round(rawPrice * 100) / 100).toFixed(2)}`

  return (
    <div className="mb-8 relative">
      {/* Cover Image con efectos mejorados */}
    <div className="relative h-40 md:h-56 overflow-hidden rounded-2xl border border-[#D4AF37]/20 shadow-2xl shadow-[#D4AF37]/10">
        {profile.cover_url ? (
          <Image
            src={profile.cover_url || "/placeholder.svg"}
            alt="Cover"
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent relative">
            <div className="absolute inset-0">
              <div className="absolute top-10 left-10 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#D4AF37]/3 rounded-full blur-3xl animate-bounce" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-[#D4AF37]/8 to-transparent rounded-full blur-3xl animate-pulse" />
            </div>
            <div className="absolute top-8 right-8 w-2 h-2 bg-[#D4AF37] rounded-full animate-ping opacity-60" />
            <div className="absolute bottom-8 left-8 w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse opacity-80" />
            <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce opacity-40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-4 right-4">
          <Sparkles className="w-6 h-6 text-[#D4AF37] animate-pulse" />
        </div>
        <div className="absolute bottom-4 left-4">
          <Diamond className="w-5 h-5 text-[#D4AF37] animate-bounce" />
        </div>
      </div>

      {/* Profile Info: estilo centrado tipo OnlyFans */}
  <div className="relative -mt-12">
        <div className="relative z-20 mt-4 max-w-5xl mx-auto w-full rounded-2xl border border-[#D4AF37]/15 bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-sm p-4 shadow-2xl shadow-[#D4AF37]/10 overflow-visible">
          <div className={`flex flex-col items-center text-center gap-3 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} transition-all duration-700`}>
            <div className="relative">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/20 transition-transform duration-300">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name || "User"} />
                <AvatarFallback className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 text-2xl text-[#D4AF37] font-bold">
                  {(profile.full_name || profile.username)?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#D4AF37] rounded-full border-2 border-black flex items-center justify-center">
                <div className="w-1 h-1 bg-black rounded-full animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#F4BF37] to-[#D4AF37] bg-clip-text text-transparent">
                  {profile.full_name || profile.username}
                </h1>
                {profile.is_creator && <Crown className="h-5 w-5 text-[#D4AF37]" />}
                <Star className="h-5 w-5 text-[#D4AF37] animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <p className="text-[#D4AF37]/80 mt-1">@{profile.username}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm mt-1">
              <div className="text-center">
                <div className="font-bold text-[#D4AF37] text-base">{followersCount}</div>
                <div className="text-[#D4AF37]/70 text-xs">seguidores</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-[#D4AF37] text-base">{followingCount}</div>
                <div className="text-[#D4AF37]/70 text-xs">siguiendo</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-[#D4AF37] text-base">{profile.subscriber_count ?? 0}</div>
                <div className="text-[#D4AF37]/70 text-xs">suscriptores</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-[#D4AF37] text-base">{profile.post_count ?? 0}</div>
                <div className="text-[#D4AF37]/70 text-xs">publicaciones</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-[#D4AF37] text-base">{likesCount}</div>
                <div className="text-[#D4AF37]/70 text-xs">likes</div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              {!isOwnProfile ? (
                <>
                  <FollowButton
                    userId={profile.id}
                    onFollowChange={handleFollowChange}
                    className="px-4 py-2 text-sm rounded-full bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all"
                  />
                  {/* Si no es el propio perfil y hay un precio, mostrar Precio justo junto al FollowButton */}
                  {profile.subscription_price != null && (
                      <Button
                        className="px-3 py-2 text-sm rounded-full font-semibold transition-all duration-200 shadow-lg bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                      >
                        {fairPriceDisplay}
                      </Button>
                  )}
                  {profile.is_creator && (
                    <Button
                      onClick={handleSubscribe}
                      disabled={isLoading}
                      className={`px-4 py-2 text-sm rounded-full font-semibold transition-all duration-200 shadow-lg ${isSubscribed ? 'bg-transparent border border-[#D4AF37] text-[#D4AF37]' : 'bg-[#D4AF37] text-black hover:bg-[#C9A961]'}`}
                      variant={isSubscribed ? 'outline' : 'default'}
                    >
                      {isLoading ? 'Procesando...' : isSubscribed ? 'Suscrito' : `Suscribirse $${profile.subscription_price ?? 0}`}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="px-4 py-2 text-sm rounded-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                    onClick={() => setShowEdit(true)}
                  >
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
            <div className={`mt-4 p-3 rounded-xl bg-black/30 border border-[#D4AF37]/10 transition-all duration-700 delay-800 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-[#D4AF37]/90 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Social links */}
          {(profile.facebook_url || profile.instagram_url || profile.tiktok_url || profile.x_url || profile.youtube_url) && (
            <div className={`mt-3 flex items-center gap-3 transition-all duration-700 delay-900 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {profile.facebook_url && (
                <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37]/90 hover:text-[#F4BF37]">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {profile.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37]/90 hover:text-[#F4BF37]">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {profile.tiktok_url && (
                <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37]/90 hover:text-[#F4BF37]">
                  <img src="https://cdn.simpleicons.org/tiktok/FFD400" alt="TikTok" className="h-5 w-5" />
                </a>
              )}
              {profile.x_url && (
                <a href={profile.x_url} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37]/90 hover:text-[#F4BF37]">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {profile.youtube_url && (
                <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37]/90 hover:text-[#F4BF37]">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          )}

          {/* Fecha de unión eliminada por solicitud */}
        </div>
      </div>
    </div>
  )
}