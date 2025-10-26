import { PrivateRoute } from "@/components/auth/private-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Users, Star, TrendingUp, Heart } from "lucide-react"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = await createServerClient()

  // ASEGURAR QUE params ESTE RESUELTO ANTES DE USAR SUS PROPIEDADES (REQUERIMIENTO DE NEXT.JS)
  const { username: rawUsername } = (await params) as ProfilePageProps["params"]

  // Normalizar y decodificar el parametro de ruta. Quitamos un posible '@' y espacios.
  const usernameParam = decodeURIComponent(rawUsername || "").trim()
  const lookupName = usernameParam.startsWith("@") ? usernameParam.slice(1) : usernameParam

  // OBTENER DATOS DEL PERFIL (case-insensitive) para evitar problemas con mayúsculas/minúsculas
  const { data: profile, error } = await supabase.from("profiles").select("*").ilike("username", lookupName).single()

  if (error || !profile) {
    notFound()
  }

  // OBTENER PUBLICACIONES DEL CREADOR
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("creator_id", profile.id)
    .order("created_at", { ascending: false })

  // CALCULAR LIKES TOTALES SOBRE LAS PUBLICACIONES
  const totalLikes = (posts || []).reduce((acc: number, p: any) => acc + (p.like_count ?? 0), 0)

  // Usar el contador real de publicaciones
  const actualPostCount = posts?.length || profile.post_count || 0
  // OBTENER USUARIO ACTUAL PARA VERIFICAR SUSCRIPCION
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isSubscribed = false
  let isOwnProfile = false

  if (user) {
    isOwnProfile = user.id === profile.id

    // VERIFICAR SI EL USUARIO ACTUAL ESTA SUSCRITO A ESTE CREADOR
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("subscriber_id", user.id)
      .eq("creator_id", profile.id)
      .eq("status", "active")
      .single()

    isSubscribed = !!subscription
  }

  // OBTENER CREADORES SUGERIDOS (EXCLUYENDO EL ACTUAL)
  // Request suggested creators without a hardcoded client-side limit; server will decide defaults
  const { data: suggestedCreators } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, cover_url, subscriber_count")
    .eq("is_creator", true)
    .neq("id", profile.id)

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#0A0A0A] overflow-hidden">
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
        </div>

        <DashboardHeader />

        <main className="relative container mx-auto px-3 py-6 flex gap-6 h-[calc(100vh-6rem)]">
          {/* Sidebar izquierda */}
          <aside className="hidden lg:block lg:w-72">
            <div className="sticky top-0 space-y-4">
              <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
                <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Navegación
                </h3>
                <ul className="space-y-2">
                  <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] transition-all duration-200 font-medium">
                    Publicaciones
                  </li>
                  <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
                    Acerca de
                  </li>
                  <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
                    Mensajes
                  </li>
                  <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
                    Estadísticas
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
                <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Estadísticas
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#D4AF37]/80">Suscriptores</span>
                    <span className="text-sm font-semibold text-[#D4AF37]">{profile.subscriber_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#D4AF37]/80">Publicaciones</span>
                    <span className="text-sm font-semibold text-[#D4AF37]">{actualPostCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#D4AF37]/80">Total Likes</span>
                    <span className="text-sm font-semibold text-[#D4AF37]">{totalLikes}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <section className="flex-1 space-y-6 overflow-y-auto scrollbar-hide pr-2 h-full">
            <ProfileHeader
              profile={{ ...profile, post_count: actualPostCount, likes: totalLikes }}
              isSubscribed={isSubscribed}
              isOwnProfile={isOwnProfile}
            />
            <ProfileTabs 
              profile={{ ...profile, post_count: actualPostCount, likes: totalLikes }} 
              posts={posts || []} 
              isSubscribed={isSubscribed} 
              isOwnProfile={isOwnProfile} 
            />
          </section>

          {/* Sidebar derecha */}
          <aside className="hidden lg:block lg:w-72">
            <div className="sticky top-0 space-y-4">
              <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
                <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Creadores Similares
                </h3>
                <div className="space-y-3">
                  {(suggestedCreators || []).map((creator: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 hover:bg-black/50 transition-all duration-200 cursor-pointer group"
                    >
                      <img
                        src={creator.avatar_url || "/placeholder-user.jpg"}
                        alt={creator.username}
                        className="h-10 w-10 rounded-full object-cover border-2 border-[#D4AF37]/30 group-hover:border-[#D4AF37]/50 transition-all duration-200"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#D4AF37] group-hover:text-[#F4BF37] transition-colors">
                          {creator.full_name || creator.username}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#D4AF37]/70">
                          <Users className="h-3 w-3" />
                          <span>{creator.subscriber_count || 0} suscriptores</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
                <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Actividad Reciente
                </h3>
                {/* Make Recent Activity scrollable so it doesn't push to page bottom */}
                <div className="space-y-3 max-h-[52vh] overflow-y-auto scrollbar-hide pr-2">
                  {(posts || []).map((post: any) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 hover:bg-black/50 transition-all duration-200 cursor-pointer group"
                    >
                      <img
                        src={profile.avatar_url || "/placeholder-user.jpg"}
                        alt={profile.username}
                        className="h-8 w-8 rounded-full object-cover border border-[#D4AF37]/30 group-hover:border-[#D4AF37]/50 transition-all duration-200"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-[#D4AF37]/80 line-clamp-2">
                          {post.content || "Nueva publicación"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#D4AF37]/70 mt-1">
                          <Heart className="h-3 w-3" />
                          <span>{post.like_count || 0} likes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </PrivateRoute>
  )
}