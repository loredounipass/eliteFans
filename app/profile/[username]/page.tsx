import { PrivateRoute } from "@/components/auth/private-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Users, Star, TrendingUp, Heart } from "lucide-react"
import LeftSidebar from '@/components/profile/left-sidebar'
import RightSidebar from '@/components/profile/right-sidebar'

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

  // CALCULAR LIKES TOTALES SOBRE LAS PUBLICACIONES (visible posts fallback)
  const visibleLikes = (posts || []).reduce((acc: number, p: any) => acc + (p.like_count ?? 0), 0)

  // Usar el contador total de publicaciones almacenado en profile cuando exista (evita que RLS reduzca el contador visible)
  const actualPostCount = profile.post_count ?? posts?.length ?? 0
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
          <LeftSidebar profile={{ ...profile, post_count: actualPostCount, likes: profile.total_likes ?? visibleLikes }} actualPostCount={actualPostCount} />

          {/* Contenido principal */}
          <section className="flex-1 space-y-6 overflow-y-auto scrollbar-hide pr-2 h-full">
            <ProfileHeader
              profile={{ ...profile, post_count: actualPostCount, likes: profile.total_likes ?? visibleLikes }}
              isSubscribed={isSubscribed}
              isOwnProfile={isOwnProfile}
            />
            <ProfileTabs 
              profile={{ ...profile, post_count: actualPostCount, likes: profile.total_likes ?? visibleLikes }} 
              posts={posts || []} 
              isSubscribed={isSubscribed} 
              isOwnProfile={isOwnProfile} 
            />
          </section>

          <RightSidebar suggestedCreators={suggestedCreators || []} posts={posts || []} profile={profile} />
        </main>
      </div>
    </PrivateRoute>
  )
}