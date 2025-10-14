"use client"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Crown, Calendar } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
    <div className="mb-8">
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden rounded-t-lg md:h-64">
        {profile.cover_url ? (
          <Image src={profile.cover_url || "/placeholder.svg"} alt="Cover" fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent" />
        )}
      </div>

      {/* Profile Info */}
      <div className="rounded-b-lg border border-t-0 border-[#D4AF37]/20 bg-black/50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <Avatar className="h-24 w-24 border-4 border-black md:h-32 md:w-32">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name || "User"} />
              <AvatarFallback className="bg-[#D4AF37]/20 text-2xl text-[#D4AF37]">
                {(profile.full_name || profile.username)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#D4AF37] md:text-3xl">
                  {profile.full_name || profile.username}
                </h1>
                {profile.is_creator && <Crown className="h-6 w-6 text-[#D4AF37]" />}
              </div>
              <p className="text-[#D4AF37]/60">@{profile.username}</p>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#D4AF37]/70">
                <div>
                  <span className="font-semibold text-[#D4AF37]">{profile.subscriber_count || 0}</span> suscriptores
                </div>
                <div>
                  <span className="font-semibold text-[#D4AF37]">{profile.post_count ?? 0}</span> publicaciones
                </div>
                <div>
                  <span className="font-semibold text-[#D4AF37]">{profile.likes ?? 0}</span> likes
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isOwnProfile && (
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className={
                  isSubscribed
                    ? "border-[#D4AF37] bg-transparent text-[#D4AF37] hover:bg-[#D4AF37]/10"
                    : "bg-[#D4AF37] text-black hover:bg-[#C9A961]"
                }
                variant={isSubscribed ? "outline" : "default"}
              >
                {isLoading
                  ? "..."
                  : isSubscribed
                    ? "Suscrito"
                    : `Suscribirse - $${profile.subscription_price || 0}/mes`}
              </Button>
            )}
            {isOwnProfile && (
              <>
                <Button
                  variant="outline"
                  className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
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

        {profile.bio && <p className="mt-4 text-[#D4AF37]/80">{profile.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#D4AF37]/60">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Se unió en {createdDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
