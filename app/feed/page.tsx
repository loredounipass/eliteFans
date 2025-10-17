import { PrivateRoute } from "@/components/auth/private-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { PostCard } from "@/components/feed/post-card"
import { CreatorCard } from "@/components/feed/creator-card"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp, Users, Heart, Star } from "lucide-react"
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

  const { data: creators } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, cover_url, subscriber_count")
    .eq("is_creator", true)
    .limit(6)

  return { posts: mapped as PostRow[], creators: creators || [] }
}

export default async function FeedPage() {
  const { posts, creators } = await getFeedData()

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#0A0A0A] overflow-hidden">
        <DashboardHeader />

        <main className="relative container mx-auto px-3 py-6 flex gap-6 h-[calc(100vh-6rem)]">
          {/* Sidebar izquierda */}
          <aside className="hidden lg:block lg:w-72">
            <div className="sticky top-0 space-y-4">
              <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
                <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Explorar
                </h3>
                <ul className="space-y-2">
                  <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] transition-all duration-200 font-medium">
                    Para ti
                  </li>
                  <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
                    Siguiendo
                  </li>
                  <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
                    Popular
                  </li>
                  <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
                    Categorías
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
                <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Filtros
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] focus:ring-[#D4AF37]/20"
                    />
                    <span className="text-sm text-[#D4AF37]/80">Solo imágenes</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] focus:ring-[#D4AF37]/20"
                    />
                    <span className="text-sm text-[#D4AF37]/80">Solo videos</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] focus:ring-[#D4AF37]/20"
                    />
                    <span className="text-sm text-[#D4AF37]/80">Contenido premium</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Feed principal */}
          <section className="flex-1 space-y-6 overflow-y-auto scrollbar-hide pr-2 h-full">
            <div className="mb-6 text-center">
              <h1 className="mb-3 text-3xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#F4BF37] to-[#D4AF37] bg-clip-text text-transparent">
                Descubre Contenido Exclusivo
              </h1>
              <p className="text-[#D4AF37]/70 text-base mb-5">Explora el mejor contenido de tus creadores favoritos</p>

              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#D4AF37]/50" />
                <Input
                  placeholder="Buscar creadores, contenido..."
                  className="border-[#D4AF37]/30 bg-black/50 backdrop-blur-sm pl-12 pr-4 py-2.5 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-full text-center shadow-lg shadow-[#D4AF37]/10"
                />
              </div>
            </div>

            {posts.map((post) => {
              const showLocked = post.is_locked && !post.isSubscribed && !post.isOwn
              return (
                <div key={post.id} className="mx-auto w-full max-w-xl">
                  <PostCard
                    postId={post.id}
                    creator={{
                      name: post.full_name || post.username || "Creator",
                      username: post.username || "",
                      avatar: post.avatar_url || "/placeholder-user.jpg",
                    }}
                    content={{
                      type: showLocked ? "locked" : post.media_type === "video" ? "video" : "image",
                      url: showLocked ? undefined : (post.media_urls && post.media_urls[0]) || undefined,
                      description: post.content || "",
                      likes: post.like_count || 0,
                      comments: post.comment_count || 0,
                    }}
                    isSubscribed={post.isSubscribed}
                  />
                </div>
              )
            })}
          </section>

          {/* Sidebar derecha */}
          <aside className="hidden lg:block lg:w-72">
            <div className="sticky top-0 space-y-4">
              <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
                <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Creadores Sugeridos
                </h3>
                <div className="space-y-3">
                  {creators.map((creator: any, index: number) => (
                    <CreatorCard
                      key={index}
                      name={creator.full_name || creator.username}
                      username={creator.username}
                      avatar={creator.avatar_url || "/placeholder-user.jpg"}
                      coverImage={creator.cover_url || creator.avatar_url || "/placeholder.jpg"}
                      subscribers={creator.subscriber_count || 0}
                      isSubscribed={false}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
                <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Tendencias
                </h3>
                <div className="space-y-3">
                  {posts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 hover:bg-black/50 transition-all duration-200 cursor-pointer group"
                    >
                      <img
                        src={p.avatar_url || "/placeholder-user.jpg"}
                        alt={p.username}
                        className="h-10 w-10 rounded-full object-cover border-2 border-[#D4AF37]/30 group-hover:border-[#D4AF37]/50 transition-all duration-200"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#D4AF37] group-hover:text-[#F4BF37] transition-colors">
                          {p.full_name || p.username}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#D4AF37]/70">
                          <Heart className="h-3 w-3" />
                          <span>{p.like_count} likes</span>
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
