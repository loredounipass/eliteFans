"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/feed/post-card"
import { User, FileText, Sparkles, Crown } from "lucide-react"
import { useState, useEffect } from "react"

interface ProfileTabsProps {
  profile: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    subscription_price: number | null
    subscriber_count: number | null
    created_at: string
  }
  posts: any[]
  isSubscribed: boolean
  isOwnProfile: boolean
}

export function ProfileTabs({ profile, posts, isSubscribed, isOwnProfile }: ProfileTabsProps) {
  const canViewContent = isSubscribed || isOwnProfile
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="border border-[#D4AF37]/20 bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-sm p-1 rounded-2xl shadow-lg shadow-[#D4AF37]/10">
          <TabsTrigger
            value="posts"
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black data-[state=active]:shadow-lg text-[#D4AF37] rounded-xl transition-all duration-300 hover:bg-[#D4AF37]/10 flex items-center gap-2 font-semibold"
          >
            <FileText className="h-4 w-4" />
            Publicaciones
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black data-[state=active]:shadow-lg text-[#D4AF37] rounded-xl transition-all duration-300 hover:bg-[#D4AF37]/10 flex items-center gap-2 font-semibold"
          >
            <User className="h-4 w-4" />
            Acerca de
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          {posts.length === 0 ? (
            <div className={`rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-12 text-center shadow-lg shadow-[#D4AF37]/5 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="mb-4">
                <FileText className="h-16 w-16 text-[#D4AF37]/30 mx-auto animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-[#D4AF37] mb-2">No hay publicaciones aún</h3>
              <p className="text-[#D4AF37]/60">
                {isOwnProfile 
                  ? "¡Comienza a compartir contenido increíble con tus seguidores!" 
                  : "Este creador aún no ha publicado contenido."
                }
              </p>
              {isOwnProfile && (
                <div className="mt-6">
                  <button className="bg-[#D4AF37] text-black px-6 py-2 rounded-full font-semibold hover:bg-[#C9A961] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#D4AF37]/50">
                    <Sparkles className="inline h-4 w-4 mr-2" />
                    Crear primera publicación
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post, index) => {
                const showLocked = post.is_locked && !canViewContent

                return (
                  <div 
                    key={post.id} 
                    className={`mx-auto w-full max-w-2xl transition-all duration-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <PostCard
                      creator={{
                        name: profile.full_name || profile.username,
                        username: profile.username,
                        avatar: profile.avatar_url || "/placeholder.svg",
                      }}
                      postId={post.id}
                      content={{
                        type: showLocked ? "locked" : post.media_type === "image" ? "image" : "video",
                        url: showLocked ? undefined : post.media_urls?.[0],
                        description: post.content || "",
                        likes: post.like_count || 0,
                        comments: post.comment_count || 0,
                      }}
                      isSubscribed={isSubscribed}
                      autoplay={true}
                      subscriptionPrice={profile.subscription_price}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <div className={`rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-8 shadow-lg shadow-[#D4AF37]/5 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                <User className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-[#D4AF37]">Información del Perfil</h3>
              <Crown className="h-6 w-6 text-[#D4AF37] animate-pulse" />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/30 border border-[#D4AF37]/10 hover:border-[#D4AF37]/20 transition-all duration-300 group">
                  <p className="font-semibold text-[#D4AF37] mb-1 group-hover:text-[#F4BF37] transition-colors">
                    Nombre de usuario
                  </p>
                  <p className="text-[#D4AF37]/80 text-lg">@{profile.username}</p>
                </div>
                
                {profile.full_name && (
                  <div className="p-4 rounded-xl bg-black/30 border border-[#D4AF37]/10 hover:border-[#D4AF37]/20 transition-all duration-300 group">
                    <p className="font-semibold text-[#D4AF37] mb-1 group-hover:text-[#F4BF37] transition-colors">
                      Nombre completo
                    </p>
                    <p className="text-[#D4AF37]/80 text-lg">{profile.full_name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/30 border border-[#D4AF37]/10 hover:border-[#D4AF37]/20 transition-all duration-300 group">
                  <p className="font-semibold text-[#D4AF37] mb-1 group-hover:text-[#F4BF37] transition-colors">
                    Precio de suscripción
                  </p>
                  <p className="text-[#D4AF37]/80 text-lg font-bold">
                    ${profile.subscription_price || 0}/mes
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-[#D4AF37]/10 hover:border-[#D4AF37]/20 transition-all duration-300 group">
                  <p className="font-semibold text-[#D4AF37] mb-1 group-hover:text-[#F4BF37] transition-colors">
                    Miembro desde
                  </p>
                  <p className="text-[#D4AF37]/80 text-lg">
                    {new Date(profile.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-[#D4AF37]/5 to-transparent border border-[#D4AF37]/20 hover:border-[#D4AF37]/30 transition-all duration-300">
                <p className="font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Biografía
                </p>
                <p className="text-[#D4AF37]/90 leading-relaxed text-lg">{profile.bio}</p>
              </div>
            )}

            {/* Estadísticas adicionales */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 hover:scale-105 transition-all duration-300 cursor-pointer group">
                <div className="text-2xl font-bold text-[#D4AF37] group-hover:text-[#F4BF37] transition-colors">
                  {profile.subscriber_count || 0}
                </div>
                <div className="text-sm text-[#D4AF37]/70 group-hover:text-[#D4AF37] transition-colors">
                  Suscriptores
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 hover:scale-105 transition-all duration-300 cursor-pointer group">
                <div className="text-2xl font-bold text-[#D4AF37] group-hover:text-[#F4BF37] transition-colors">
                  {posts.length}
                </div>
                <div className="text-sm text-[#D4AF37]/70 group-hover:text-[#D4AF37] transition-colors">
                  Publicaciones
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 hover:scale-105 transition-all duration-300 cursor-pointer group">
                <div className="text-2xl font-bold text-[#D4AF37] group-hover:text-[#F4BF37] transition-colors">
                  {posts.reduce((acc, post) => acc + (post.like_count || 0), 0)}
                </div>
                <div className="text-sm text-[#D4AF37]/70 group-hover:text-[#D4AF37] transition-colors">
                  Total Likes
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}