import { PrivateRoute } from "@/components/auth/private-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { CreatorCard } from "@/components/feed/creator-card"
import SearchBar from "@/components/feed/search-bar"
import { FilteredFeed } from "@/components/feed/filtered-feed"
import { Users, Heart } from "lucide-react"
import CreatorCarousel from "@/components/feed/creator-carousel"
import { createServerClient } from "@/lib/supabase/server"

type PostRow = {
  id: string
  creator_id: string
  content: string | null
  media_urls: string[] | null
  media_type: string | null
  is_locked: boolean
  price: number | null
  profile_subscription_price?: number | null
  like_count: number
  comment_count: number
  created_at: string
  username?: string
  full_name?: string
  avatar_url?: string
  isSubscribed?: boolean
  isOwn?: boolean
}

// NOTE: Removed hardcoded FEED_LIMIT so the server/API decides how many posts to return.

type CreatorPreview = {
  username?: string
  full_name?: string
  avatar_url?: string
  cover_url?: string
  subscriber_count?: number
  is_creator?: boolean
}

async function getFeedData() {
  const supabase = await createServerClient()

  const { data: posts, error } = await supabase
    .from("posts")
    .select(`*, profiles:profiles(id, username, full_name, avatar_url, subscription_price)`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching posts:", error)
    return { posts: [] as PostRow[], creators: [] }
  }

  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData?.user?.id

  let subscribedCreatorIds: string[] = []
  if (currentUserId) {
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("creator_id")
      .eq("subscriber_id", currentUserId)
      .eq("status", "active")
    subscribedCreatorIds = (subs || []).map((s: any) => s.creator_id)
  }

  // OBTENER LA LISTA DE CREADORES QUE EL USUARIO SIGUE (TABLA FOLLOWS)
  let followedCreatorIds: string[] = []
  if (currentUserId) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId)
    followedCreatorIds = (follows || []).map((f: any) => f.following_id)
  }

  const mapped = (posts as any[]).map((p) => ({
    id: p.id,
    creator_id: p.creator_id,
    content: p.content,
    media_urls: p.media_urls,
    media_type: p.media_type,
    is_locked: p.is_locked,
    price: p.price,
    profile_subscription_price: p.profiles?.subscription_price ?? null,
    like_count: p.like_count,
    comment_count: p.comment_count,
    created_at: p.created_at,
    username: p.profiles?.username,
    full_name: p.profiles?.full_name,
    avatar_url: p.profiles?.avatar_url,
    isSubscribed: subscribedCreatorIds.includes(p.creator_id),
    isOwn: currentUserId ? currentUserId === p.creator_id : false,
  }))

  mapped.sort((a: any, b: any) => {
    if (a.isSubscribed === b.isSubscribed) return 0
    return a.isSubscribed ? -1 : 1
  })

  // TRAER TODOS LOS USUARIOS DE LA TABLA PROFILES PARA EL CARRUSEL
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, cover_url, subscriber_count, is_creator")
    // Supabase client order options don't include `nullsLast`; use `nullsFirst: false` to place nulls last
    .order("subscriber_count", { ascending: false, nullsFirst: false })

  // FILTRAR Y ORGANIZAR LOS CREADORES
  let creatorsList: CreatorPreview[] = []
  
  if (allProfiles && allProfiles.length > 0) {
  // PRIMERO MOSTRAR USUARIOS MARCADOS COMO CREADORES
    const markedCreators = allProfiles.filter(profile => profile.is_creator === true)
    
  // LUEGO AGREGAR OTROS USUARIOS QUE NO SON EL USUARIO ACTUAL
    const otherUsers = allProfiles.filter(profile => 
      profile.is_creator !== true && 
      profile.username && 
      profile.username !== userData?.user?.user_metadata?.username
    )
    
  // COMBINAR CREADORES MARCADOS Y OTROS USUARIOS
    creatorsList = [...markedCreators, ...otherUsers]
    
  // EXCLUIR AL USUARIO ACTUAL SI ESTÁ EN LA LISTA
    if (currentUserId && userData?.user?.user_metadata?.username) {
      creatorsList = creatorsList.filter(creator => 
        creator.username !== userData.user.user_metadata.username
      )
    }
  }

  // SI NO HAY PROFILES, CONSTRUIR UN FALLBACK A PARTIR DE LOS POSTS
  if ((!creatorsList || creatorsList.length === 0) && (mapped && mapped.length > 0)) {
    const seen = new Set<string>()
    creatorsList = mapped
      .filter((p: any) => p.username && p.creator_id !== currentUserId)
      .map((p: any) => ({ 
        username: p.username, 
        full_name: p.full_name, 
        avatar_url: p.avatar_url, 
        cover_url: p.avatar_url, 
        subscriber_count: 0,
        is_creator: false
      }))
      .filter((c: any) => {
        if (seen.has(c.username)) return false
        seen.add(c.username)
        return true
      })
  }

  return { posts: mapped as PostRow[], creators: creatorsList || [], subscribedCreatorIds, followedCreatorIds }
}

export default async function FeedPage() {
  const { posts, creators, subscribedCreatorIds, followedCreatorIds } = await getFeedData()

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#0A0A0A] overflow-hidden">
        <DashboardHeader />
  <main className="relative max-w-6xl mx-auto px-3 py-6 flex gap-2 h-[calc(100vh-6rem)]">
          <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide pr-2 h-full">
            <HeaderSearch />
            <FilteredFeed posts={posts} subscribedCreatorIds={subscribedCreatorIds} followedCreatorIds={followedCreatorIds} />
          </div>

          <RightSidebar creators={creators} posts={posts} />
        </main>
      </div>
    </PrivateRoute>
  )
}

// --- COMPONENTES PRESENTACIONALES PEQUEÑOS EXTRAÍDOS PARA LEGIBILIDAD ---

function HeaderSearch() {
  return null
}

function RightSidebar({ creators, posts }: { creators: any[]; posts: PostRow[] }) {
  return (
  <aside className="hidden lg:block lg:w-72 lg:ml-4">
      <div className="sticky top-0 space-y-4">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
            <div className="relative">
            <SearchBar isSidebar={true} />
          </div>
        </div>
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
          <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
            <Users className="h-5 w-5" />
            Creadores Sugeridos
          </h3>
          <div>
            {/* CARROUSEL QUE MUESTRA 3 ITEMS POR VISTA Y HACE SCROLL HORIZONTAL */}
            {/* IMPORTAR EL COMPONENTE CLIENTE DINÁMICAMENTE PARA EVITAR DESAJUSTE SERVER/CLIENT */}
            <CreatorCarousel creators={creators} />
          </div>
        </div>

        
      </div>
    </aside>
  )
}