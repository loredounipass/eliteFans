import { PrivateRoute } from "@/components/auth/private-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = await createServerClient()

  // Ensure params is resolved before using its properties (Next.js requirement)
  const { username } = await params as ProfilePageProps["params"]

  // Fetch profile data
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("username", username).single()

  if (error || !profile) {
    notFound()
  }

  // Fetch posts by this creator
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("creator_id", profile.id)
    .order("created_at", { ascending: false })

  // Get current user to check if subscribed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isSubscribed = false
  let isOwnProfile = false

  if (user) {
    isOwnProfile = user.id === profile.id

    // Check if current user is subscribed to this creator
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("subscriber_id", user.id)
      .eq("creator_id", profile.id)
      .eq("status", "active")
      .single()

    isSubscribed = !!subscription
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left nav */}
            <aside className="hidden lg:block lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="rounded border border-[#D4AF37]/20 bg-black/50 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-[#D4AF37]">Perfil</h3>
                  <ul className="space-y-2 text-[#D4AF37]/80 text-sm">
                    <li className="cursor-pointer hover:text-[#D4AF37]">Publicaciones</li>
                    <li className="cursor-pointer hover:text-[#D4AF37]">Sobre</li>
                    <li className="cursor-pointer hover:text-[#D4AF37]">Mensajes</li>
                  </ul>
                </div>
              </div>
            </aside>

            {/* Main */}
            <section className="col-span-1 lg:col-span-7">
              <ProfileHeader profile={profile} isSubscribed={isSubscribed} isOwnProfile={isOwnProfile} />
              <ProfileTabs profile={profile} posts={posts || []} isSubscribed={isSubscribed} isOwnProfile={isOwnProfile} />
            </section>

            {/* Right suggestions */}
            <aside className="col-span-1 lg:col-span-3">
              <div className="sticky top-24 space-y-4">
                <div className="rounded border border-[#D4AF37]/10 bg-black/50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#D4AF37]">Sugerencias</h3>
                  <p className="text-xs text-[#D4AF37]/70">Descubre creadores similares</p>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </PrivateRoute>
  )
}
