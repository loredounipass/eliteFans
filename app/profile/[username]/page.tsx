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

  // Fetch profile data
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("username", params.username).single()

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
          <ProfileHeader profile={profile} isSubscribed={isSubscribed} isOwnProfile={isOwnProfile} />
          <ProfileTabs profile={profile} posts={posts || []} isSubscribed={isSubscribed} isOwnProfile={isOwnProfile} />
        </main>
      </div>
    </PrivateRoute>
  )
}
