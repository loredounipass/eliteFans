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
import { useTranslation } from 'react-i18next'
import Link from "next/link"

export default function DashboardPage() {
  const { t } = useTranslation()
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
              {t('dashboard.welcome', { name: user?.user_metadata?.username || 'Creator' })}
            </h1>
            <p className="text-[#D4AF37]/70">{t('dashboard.subtitle')}</p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title={t('dashboard.stats.subscribers.title')}
              value={metrics ? String(metrics.profile.subscribers) : "-"}
              icon={Users}
              description={t('dashboard.stats.subscribers.description')}
            />
            <StatsCard
              title={t('dashboard.stats.revenue.title')}
              value={metrics ? `$${metrics.profile.total_earnings}` : "-"}
              icon={DollarSign}
              description={t('dashboard.stats.revenue.description')}
            />
            <StatsCard
              title={t('dashboard.stats.likes.title')}
              value={metrics ? String(metrics.metrics.total_likes) : "-"}
              icon={Heart}
              description={t('dashboard.stats.likes.description')}
            />
            <StatsCard
              title={t('dashboard.stats.content_published.title')}
              value={metrics ? String(metrics.profile.posts_count) : "-"}
              icon={TrendingUp}
              description={t('dashboard.stats.content_published.description')}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#D4AF37]">{t('dashboard.quick_actions.title')}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#D4AF37]">
                    <Upload className="h-5 w-5" />
                    {t('dashboard.quick_actions.upload.title')}
                  </CardTitle>
                  <CardDescription className="text-[#D4AF37]/60">{t('dashboard.quick_actions.upload.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setCreatePostOpen(true)}
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#C9A961]"
                  >
                    {t('dashboard.quick_actions.upload.button')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#D4AF37]">
                    <ImageIcon className="h-5 w-5" />
                    {t('dashboard.quick_actions.gallery.title')}
                  </CardTitle>
                  <CardDescription className="text-[#D4AF37]/60">{t('dashboard.quick_actions.gallery.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/gallery">
                    <Button
                      variant="outline"
                      className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
                    >
                      {t('dashboard.quick_actions.gallery.button')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#D4AF37]">
                    <Users className="h-5 w-5" />
                    {t('dashboard.quick_actions.subscribers.title')}
                  </CardTitle>
                  <CardDescription className="text-[#D4AF37]/60">{t('dashboard.quick_actions.subscribers.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
                  >
                    {t('dashboard.quick_actions.subscribers.button')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-[#D4AF37]">{t('dashboard.recent_activity.title')}</h2>
            <Card className="border-[#D4AF37]/20 bg-black/50">
              <CardContent className="p-6 overflow-y-auto max-h-[50vh] sm:max-h-[60vh] hide-scrollbar">
                <div className="space-y-4">
                  {metrics && metrics.recent ? (
                    <>
                      {metrics.recent.likes.map((l: any) => (
                        <ActivityItem
                          key={`like-${l.id}`}
                          icon={<Heart className="h-5 w-5" />}
                          title={t('activity.new_like')}
                          description={t('activity.like_description', { username: l.username })}
                          time={new Date(l.created_at).toLocaleString()}
                        />
                      ))}

                      {metrics.recent.subscriptions.map((s: any) => (
                        <ActivityItem
                          key={`sub-${s.id}`}
                          icon={<Users className="h-5 w-5" />}
                          title={t('activity.new_subscription')}
                          description={t('activity.subscription_description', { username: s.username })}
                          time={new Date(s.created_at || s.start_date).toLocaleString()}
                        />
                      ))}

                      {metrics.recent.transactions.map((tx: any) => (
                        <ActivityItem
                          key={`tx-${tx.id}`}
                          icon={<DollarSign className="h-5 w-5" />}
                          title={t('activity.payment_received')}
                          description={t('activity.payment_description', { amount: tx.amount, type: tx.type, username: tx.username })}
                          time={new Date(tx.created_at).toLocaleString()}
                        />
                      ))}

                      {metrics.recent.comments.map((c: any) => (
                        <ActivityItem
                          key={`c-${c.id}`}
                          icon={<ImageIcon className="h-5 w-5" />}
                          title={t('activity.new_comment')}
                          description={t('activity.comment_description', { username: c.username, content: c.content })}
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
