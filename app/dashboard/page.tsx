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
            <StatsCard title="Subscribers" value="1,234" icon={Users} description="+12% this month" />
            <StatsCard title="Total Revenue" value="$12,345" icon={DollarSign} description="+8% this month" />
            <StatsCard title="Likes" value="5,678" icon={Heart} description="+23% this month" />
            <StatsCard title="Content Published" value="89" icon={TrendingUp} description="This month: 12" />
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
                  <ActivityItem
                    icon={<Heart className="h-5 w-5" />}
                    title="New Like"
                    description="@usuario123 liked your post"
                    time="5 minutes ago"
                  />
                  <ActivityItem
                    icon={<Users className="h-5 w-5" />}
                    title="New Subscription"
                    description="@fan_elite subscribed to your content"
                    time="1 hour ago"
                  />
                  <ActivityItem
                    icon={<DollarSign className="h-5 w-5" />}
                    title="Payment Received"
                    description="You received $29.99 from subscriptions"
                    time="3 hours ago"
                  />
                  <ActivityItem
                    icon={<Video className="h-5 w-5" />}
                    title="Content Published"
                    description="Your video was published successfully"
                    time="5 hours ago"
                  />
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
