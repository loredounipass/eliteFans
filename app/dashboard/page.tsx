"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { PrivateRoute } from "@/components/auth/private-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DollarSign, Heart, ImageIcon, TrendingUp, Upload, Users, Video } from "lucide-react"
import { CreatePostDialog } from "@/components/dashboard/create-post-dialog"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/dashboard/metrics")
        if (!res.ok) return
        const json = await res.json()
        setMetrics(json)
      } catch (err) {
        console.error("Failed to fetch dashboard metrics", err)
      }
    }

    fetchMetrics()
  }, [])

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-[#D4AF37]">
              Welcome, {user?.user_metadata?.username || "Creator"}
            </h1>
            <p className="text-[#D4AF37]/70">Manage your content and connect with your fans</p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Subscribers"
              value={metrics ? String(metrics.profile.subscribers) : "-"}
              icon={Users}
              description="Subscribers"
            />
            <StatsCard
              title="Total Revenue"
              value={metrics ? `$${metrics.profile.total_earnings}` : "-"}
              icon={DollarSign}
              description="Total earnings"
            />
            <StatsCard
              title="Likes"
              value={metrics ? String(metrics.metrics.total_likes) : "-"}
              icon={Heart}
              description="Total likes on your posts"
            />
            <StatsCard
              title="Content Published"
              value={metrics ? String(metrics.profile.posts_count) : "-"}
              icon={TrendingUp}
              description="Total posts published"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#D4AF37]">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#D4AF37]">
                    <Upload className="h-5 w-5" />
                    Upload Content
                  </CardTitle>
                  <CardDescription className="text-[#D4AF37]/60">Share new content with your fans</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setCreatePostOpen(true)}
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#C9A961]"
                  >
                    Upload Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#D4AF37]">
                    <ImageIcon className="h-5 w-5" />
                    Gallery
                  </CardTitle>
                  <CardDescription className="text-[#D4AF37]/60">Manage your photos and videos</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
                  >
                    View Gallery
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#D4AF37]">
                    <Users className="h-5 w-5" />
                    Subscribers
                  </CardTitle>
                  <CardDescription className="text-[#D4AF37]/60">Manage your community</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
                  >
                    View Subscribers
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-[#D4AF37]">Recent Activity</h2>
            <Card className="border-[#D4AF37]/20 bg-black/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {metrics && metrics.recent ? (
                    <>
                      {metrics.recent.likes.map((l: any) => (
                        <ActivityItem
                          key={`like-${l.id}`}
                          icon={<Heart className="h-5 w-5" />}
                          title="New Like"
                          description={`@${l.username} liked your post`}
                          time={new Date(l.created_at).toLocaleString()}
                        />
                      ))}

                      {metrics.recent.subscriptions.map((s: any) => (
                        <ActivityItem
                          key={`sub-${s.id}`}
                          icon={<Users className="h-5 w-5" />}
                          title="New Subscription"
                          description={`@${s.username} subscribed`}
                          time={new Date(s.created_at || s.start_date).toLocaleString()}
                        />
                      ))}

                      {metrics.recent.transactions.map((t: any) => (
                        <ActivityItem
                          key={`tx-${t.id}`}
                          icon={<DollarSign className="h-5 w-5" />}
                          title="Payment Received"
                          description={`You received $${t.amount} (${t.type}) from @${t.username}`}
                          time={new Date(t.created_at).toLocaleString()}
                        />
                      ))}

                      {metrics.recent.comments.map((c: any) => (
                        <ActivityItem
                          key={`c-${c.id}`}
                          icon={<ImageIcon className="h-5 w-5" />}
                          title="New Comment"
                          description={`@${c.username}: ${c.content}`}
                          time={new Date(c.created_at).toLocaleString()}
                        />
                      ))}
                    </>
                  ) : (
                    <p className="text-[#D4AF37]/60">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <CreatePostDialog open={createPostOpen} onOpenChange={setCreatePostOpen} />
      </div>
    </PrivateRoute>
  )
}

function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode
  title: string
  description: string
  time: string
}) {
  return (
    <div className="flex items-start gap-4 border-b border-[#D4AF37]/10 pb-4 last:border-0 last:pb-0">
      <div className="rounded-lg bg-[#D4AF37]/10 p-2 text-[#D4AF37]">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-[#D4AF37]">{title}</p>
        <p className="text-sm text-[#D4AF37]/70">{description}</p>
      </div>
      <span className="text-xs text-[#D4AF37]/50">{time}</span>
    </div>
  )
}
