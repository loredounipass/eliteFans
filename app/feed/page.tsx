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
  like_count: number
  comment_count: number
  created_at: string
  username?: string
  full_name?: string
  avatar_url?: string
  isSubscribed?: boolean
  isOwn?: boolean
}

const FEED_LIMIT = 20

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
    .select(`*, profiles:profiles(id, username, full_name, avatar_url)`)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT)

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

  // Obtener la lista de creadores que el usuario sigue (tabla follows)
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

  // Traer TODOS los usuarios de la tabla profiles para el carrusel
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, cover_url, subscriber_count, is_creator")
    // Supabase client order options don't include `nullsLast`; use `nullsFirst: false` to place nulls last
    .order("subscriber_count", { ascending: false, nullsFirst: false })

  // Filtrar y organizar los creadores
  let creatorsList: CreatorPreview[] = []
  
  if (allProfiles && allProfiles.length > 0) {
    // Primero mostrar usuarios marcados como creadores
    const markedCreators = allProfiles.filter(profile => profile.is_creator === true)
    
    // Luego agregar otros usuarios que no son el usuario actual
    const otherUsers = allProfiles.filter(profile => 
      profile.is_creator !== true && 
      profile.username && 
      profile.username !== userData?.user?.user_metadata?.username
    )
    
    // Combinar creadores marcados y otros usuarios
    creatorsList = [...markedCreators, ...otherUsers]
    
    // Excluir al usuario actual si está en la lista
    if (currentUserId && userData?.user?.user_metadata?.username) {
      creatorsList = creatorsList.filter(creator => 
        creator.username !== userData.user.user_metadata.username
      )
    }
  }

  // Si no hay profiles, construir un fallback a partir de los posts
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
        <main className="relative container mx-auto px-3 py-6 flex gap-6 h-[calc(100vh-6rem)]">
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

// --- Small presentational components extracted for readability ---

function HeaderSearch() {
  return null
}

function RightSidebar({ creators, posts }: { creators: any[]; posts: PostRow[] }) {
  return (
    <aside className="hidden lg:block lg:w-72">
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
            {/* Carousel that shows 3 items per view and scrolls horizontally */}
            {/* Import client component dynamically to avoid server/client mismatch */}
            <CreatorCarousel creators={creators} />
          </div>
        </div>

        
      </div>
    </aside>
  )
}