import { PrivateRoute } from "@/components/auth/private-route"
import { createServerClient } from "@/lib/supabase/server"
import { MyGallery } from "@/components/dashboard/my-gallery"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function GalleryPage() {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div className="text-red-500">Error: Debes iniciar sesión para ver la galería.</div>
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return <div className="text-red-500">Error al cargar las publicaciones.</div>;
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <h1 className="mb-6 text-3xl font-bold text-[#D4AF37]">Mi Galería</h1>
          <MyGallery posts={posts || []} />
        </main>
      </div>
    </PrivateRoute>
  )
}