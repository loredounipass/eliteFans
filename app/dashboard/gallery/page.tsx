import { PrivateRoute } from "@/components/auth/private-route"
import { createServerClient } from "@/lib/supabase/server"
import { MyGallery } from "@/components/dashboard/my-gallery"
import { DashboardHeader } from "@/components/dashboard/header"
import { Images, Sparkles } from "lucide-react"
import GalleryHeader from '@/components/dashboard/gallery-header'

export default async function GalleryPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Images className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-500 mb-2">Acceso Denegado</h2>
          <p className="text-red-400">Debes iniciar sesión para ver la galería.</p>
        </div>
      </div>
    )
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return (
      <PrivateRoute>
        <div className="min-h-screen bg-black">
          <DashboardHeader />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Images className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-red-500 mb-2">Error al cargar</h2>
              <p className="text-red-400">No se pudieron cargar las publicaciones.</p>
            </div>
          </main>
        </div>
      </PrivateRoute>
    );
  }

  function normalizeCount(field: any) {
    if (field == null) return 0
    if (typeof field === "number") return field
    if (Array.isArray(field)) {
      if (field.length === 0) return 0
      const first = field[0]
      if (first && typeof first === "object" && "count" in first) return Number(first.count) || field.length
      return field.length
    }
    if (typeof field === "object" && "count" in field) return Number(field.count) || 0
    return 0
  }

  const transformedPosts = (posts || []).map((post: any) => ({
    ...post,
    likes_count: normalizeCount(post.likes_count),
    comments_count: normalizeCount(post.comments_count),
  }))

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse opacity-60" />
          <div className="absolute top-40 right-20 w-1 h-1 bg-[#D4AF37] rounded-full animate-ping opacity-40" />
          <div className="absolute top-60 left-1/4 w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce opacity-30" />
          <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse opacity-50" />
          <div className="absolute bottom-20 left-1/2 w-1 h-1 bg-[#D4AF37] rounded-full animate-ping opacity-60" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-[#D4AF37]/8 to-transparent rounded-full blur-3xl animate-bounce" />
        </div>

        <DashboardHeader />

        <main className="container mx-auto px-4 py-8 relative z-10">
          <GalleryHeader
            postsCount={transformedPosts.length}
            likesTotal={transformedPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0)}
            commentsTotal={transformedPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0)}
          />

          {/* Gallery component */}
          <MyGallery posts={transformedPosts} />
        </main>
      </div>
    </PrivateRoute>
  )
}