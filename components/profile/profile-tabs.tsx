"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/feed/post-card"

interface ProfileTabsProps {
  profile: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  posts: any[]
  isSubscribed: boolean
  isOwnProfile: boolean
}

export function ProfileTabs({ profile, posts, isSubscribed, isOwnProfile }: ProfileTabsProps) {
  const canViewContent = isSubscribed || isOwnProfile

  return (
    <Tabs defaultValue="posts" className="space-y-6">
      <TabsList className="border-[#D4AF37]/20 bg-black/50">
        <TabsTrigger
          value="posts"
          className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[#D4AF37]"
        >
          Publicaciones
        </TabsTrigger>
        <TabsTrigger
          value="about"
          className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[#D4AF37]"
        >
          Acerca de
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="space-y-6">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-[#D4AF37]/20 bg-black/50 p-12 text-center">
            <p className="text-[#D4AF37]/60">No hay publicaciones aún</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {posts.map((post) => {
              const showLocked = post.is_locked && !canViewContent

              return (
                <PostCard
                  key={post.id}
                  creator={{
                    name: profile.full_name || profile.username,
                    username: profile.username,
                    avatar: profile.avatar_url || "/placeholder.svg",
                  }}
                  content={{
                    type: showLocked ? "locked" : post.media_type === "image" ? "image" : "video",
                    url: showLocked ? undefined : post.media_urls?.[0],
                    description: post.content || "",
                    likes: post.like_count || 0,
                    comments: post.comment_count || 0,
                  }}
                  isSubscribed={isSubscribed}
                />
              )
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="about" className="space-y-6">
        <div className="rounded-lg border border-[#D4AF37]/20 bg-black/50 p-6">
          <h3 className="mb-4 text-xl font-semibold text-[#D4AF37]">Acerca de</h3>
          <div className="space-y-4 text-[#D4AF37]/80">
            <div>
              <p className="font-semibold text-[#D4AF37]">Nombre de usuario</p>
              <p>@{profile.username}</p>
            </div>
            {profile.full_name && (
              <div>
                <p className="font-semibold text-[#D4AF37]">Nombre completo</p>
                <p>{profile.full_name}</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
