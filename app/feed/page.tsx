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
}

async function getFeedData() {
  const supabase = await createServerClient()

  // Traer posts públicos y relacionados con perfiles (limit 20)
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`*, profiles:profiles(id, username, full_name, avatar_url)`)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("Error fetching posts:", error)
    return { posts: [] as PostRow[], creators: [] }
  }

  // Obtener usuario actual para verificar suscripciones
  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData?.user?.id

  // Traer suscripciones activas del usuario actual
  let subscribedCreatorIds: string[] = []
  if (currentUserId) {
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("creator_id")
      .eq("subscriber_id", currentUserId)
      .eq("status", "active")
    subscribedCreatorIds = (subs || []).map((s: any) => s.creator_id)
  }

  // Mapear posts al shape esperado por PostCard
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
  }))

  // Priorizar posts de creadores suscritos: mover al tope
  mapped.sort((a: any, b: any) => {
    if (a.isSubscribed === b.isSubscribed) return 0
    return a.isSubscribed ? -1 : 1
  })

  // Traer creadores sugeridos
  const { data: creators } = await supabase.from("profiles").select("username, full_name, avatar_url, cover_url, subscriber_count").eq("is_creator", true).limit(6)

  return { posts: mapped as PostRow[], creators: creators || [] }
}

export default async function FeedPage() {
  const { posts, creators } = await getFeedData()

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="mb-4 text-3xl font-bold text-[#D4AF37]">Explorar</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#D4AF37]/50" />
              <Input
                placeholder="Buscar creadores..."
                className="border-[#D4AF37]/30 bg-black/50 pl-10 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <Tabs defaultValue="feed" className="space-y-4">
            <TabsList className="border-[#D4AF37]/20 bg-black/50">
              <TabsTrigger
                value="feed"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[#D4AF37]"
              >
                Feed
              </TabsTrigger>
              <TabsTrigger
                value="discover"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[#D4AF37]"
              >
                Descubrir
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    creator={{ name: post.full_name || post.username || "Creator", username: post.username || "", avatar: post.avatar_url || "/placeholder-user.jpg" }}
                    content={{
                      type: post.is_locked ? "locked" : post.media_type === "image" ? "image" : "image",
                      url: (post.media_urls && post.media_urls[0]) || undefined,
                      description: post.content || "",
                      likes: post.like_count || 0,
                      comments: post.comment_count || 0,
                    }}
                    isSubscribed={false}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="discover" className="space-y-6">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-[#D4AF37]">Creadores Sugeridos</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

              <div>
                <h2 className="mb-4 text-xl font-semibold text-[#D4AF37]">Contenido Popular</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {posts.slice(0, 2).map((post) => (
                    <PostCard
                      key={post.id}
                      creator={{ name: post.full_name || post.username || "Creator", username: post.username || "", avatar: post.avatar_url || "/placeholder-user.jpg" }}
                      content={{
                        type: post.is_locked ? "locked" : post.media_type === "image" ? "image" : "image",
                        url: (post.media_urls && post.media_urls[0]) || undefined,
                        description: post.content || "",
                        likes: post.like_count || 0,
                        comments: post.comment_count || 0,
                      }}
                      isSubscribed={false}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PrivateRoute>
  )
}
