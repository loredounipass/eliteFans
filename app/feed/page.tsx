import { PrivateRoute } from "@/components/auth/private-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { PostCard } from "@/components/feed/post-card"
import { CreatorCard } from "@/components/feed/creator-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
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

// CONSTANTES
const FEED_LIMIT = 20

async function getFeedData() {
  const supabase = await createServerClient()

  // TRAER POSTS PUBLICOS Y RELACIONADOS CON PERFILES (LIMIT)
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`*, profiles:profiles(id, username, full_name, avatar_url)`)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT)

  if (error) {
    console.error("Error fetching posts:", error)
    return { posts: [] as PostRow[], creators: [] }
  }

  // OBTENER USUARIO ACTUAL PARA VERIFICAR SUSCRIPCIONES
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData?.user?.id

  // TRAER SUSCRIPCIONES ACTIVAS DEL USUARIO ACTUAL
  let subscribedCreatorIds: string[] = []
  if (currentUserId) {
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("creator_id")
      .eq("subscriber_id", currentUserId)
      .eq("status", "active")
    subscribedCreatorIds = (subs || []).map((s: any) => s.creator_id)
  }

  // MAPEAR POSTS AL SHAPE ESPERADO POR PostCard
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

  // PRIORITIZAR POSTS DE CREADORES SUSCRITOS: MOVER AL TOPE
  mapped.sort((a: any, b: any) => {
    if (a.isSubscribed === b.isSubscribed) return 0
    return a.isSubscribed ? -1 : 1
  })

  // TRAER CREADORES SUGERIDOS
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
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          {/* Top search and title */}
          <div className="mb-6">
            <h1 className="mb-4 text-3xl font-bold text-[#D4AF37]">Explorar</h1>
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#D4AF37]/50" />
              <Input
                placeholder="Buscar creadores..."
                className="border-[#D4AF37]/30 bg-black/50 pl-10 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* 3-column layout: left nav, main feed, right suggestions */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left - compact nav / filters */}
            <aside className="hidden lg:block lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="rounded border border-[#D4AF37]/20 bg-black/50 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-[#D4AF37]">Navegar</h3>
                  <ul className="space-y-2 text-[#D4AF37]/80 text-sm">
                    <li className="cursor-pointer hover:text-[#D4AF37]">Para ti</li>
                    <li className="cursor-pointer hover:text-[#D4AF37]">Seguidos</li>
                    <li className="cursor-pointer hover:text-[#D4AF37]">Populares</li>
                    <li className="cursor-pointer hover:text-[#D4AF37]">Categorías</li>
                  </ul>
                </div>
                <div className="rounded border border-[#D4AF37]/20 bg-black/50 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-[#D4AF37]">Filtros</h3>
                  <p className="text-xs text-[#D4AF37]/70">Mostrar solo imágenes</p>
                </div>
              </div>
            </aside>

            {/* Main feed */}
            <section className="col-span-1 lg:col-span-7">
              <div className="space-y-3"> {/* menos espacio entre posts */}
                {posts.map((post) => {
                  const showLocked = post.is_locked && !post.isSubscribed && !post.isOwn
                  return (
                    <div key={post.id} className="mx-auto w-full max-w-xl"> {/* Limita el ancho de cada post a max-w-xl */}
                      <PostCard
                        creator={{ name: post.full_name || post.username || "Creator", username: post.username || "", avatar: post.avatar_url || "/placeholder-user.jpg" }}
                        content={{
                          type: showLocked
                            ? "locked"
                            : post.media_type === "video"
                            ? "video"
                            : "image",
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
              </div>
            </section>

            {/* Right - suggestions */}
            <aside className="col-span-1 lg:col-span-3">
              <div className="sticky top-24 space-y-4">
                <div className="rounded border border-[#D4AF37]/10 bg-black/50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#D4AF37]">Sugerencias para ti</h3>
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

                <div className="rounded border border-[#D4AF37]/10 bg-black/50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-[#D4AF37]">Contenido Popular</h3>
                  <div className="space-y-2">
                    {posts.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <img src={p.avatar_url || "/placeholder-user.jpg"} alt={p.username} className="h-10 w-10 rounded object-cover" />
                        <div>
                          <p className="text-sm text-[#D4AF37]">{p.full_name || p.username}</p>
                          <p className="text-xs text-[#D4AF37]/70">{p.like_count} likes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </PrivateRoute>
  )
}
