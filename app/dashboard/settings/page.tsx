"use client"

import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import i18n from "@/lib/i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Heart, CreditCard, Users, MessageCircle, Globe } from "lucide-react"

export default function SettingsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRecent, setShowRecent] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatches caused by i18n language differences and
  // locale-dependent Date formatting. Only render the translated content
  // after the component has mounted on the client.
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentLang = (i18n.language || "es").substring(0, 2).toLowerCase()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/dashboard/metrics')
        if (!res.ok) throw new Error('Failed to load')
        const json = await res.json()
        if (mounted) setData(json)
      } catch (err: any) {
        if (mounted) setError(err?.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng)
    try { localStorage.setItem('i18nextLng', lng) } catch (e) { /* ignore */ }
  }

  if (!mounted) {
    // Render a lightweight placeholder during SSR to avoid mismatches.
    return <main className="container mx-auto px-4 py-8"><div className="h-8" /></main>
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[#D4AF37]">{t('account.settings')}</h1>

      <section className="mb-8 rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#D4AF37]">{t('language.label')}</h2>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <span className="text-sm font-semibold">{currentLang}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="border-[#D4AF37]/20 bg-black text-[#D4AF37]">
              <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#D4AF37]/20" />
              <DropdownMenuItem onClick={() => changeLang('es')} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">{t('language.es')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLang('en')} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">{t('language.en')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLang('zh')} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">{t('language.chinese') || 'Mandarin'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLang('ru')} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">{t('language.russian') || 'Russian'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <section className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#D4AF37]">{t('dashboard.recent_activity.title') || t('profile.sidebar.recent_activity')}</h2>
          <label className="flex items-center gap-2 text-sm text-[#D4AF37]/80">
            <input type="checkbox" checked={showRecent} onChange={(e) => setShowRecent(e.target.checked)} />
            <span>{t('settings.show_recent') || 'Show Recent Activity'}</span>
          </label>
        </div>

        {loading && <p className="text-[#D4AF37]/60">{t('ui.loading') || 'Loading...'}</p>}
        {error && <p className="text-red-400">{error}</p>}

        {showRecent && !loading && data && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {/* Transactions */}
            {(data.recent?.transactions || []).map((it: any) => (
              <div key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 hover:bg-black/50">
                <CreditCard className="h-6 w-6 text-[#D4AF37]" />
                <div className="flex-1 text-sm text-[#D4AF37]/80">
                  <div className="font-semibold text-[#D4AF37]">{it.username || it.user_id}</div>
                  <div className="text-xs">{it.type} • {new Date(it.created_at).toLocaleString()}</div>
                </div>
                <div className="text-sm text-[#D4AF37]">{it.amount ?? ''}</div>
              </div>
            ))}

            {/* Subscriptions */}
            {(data.recent?.subscriptions || []).map((it: any) => (
              <div key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 hover:bg-black/50">
                <Users className="h-6 w-6 text-[#D4AF37]" />
                <div className="flex-1 text-sm text-[#D4AF37]/80">
                  <div className="font-semibold text-[#D4AF37]">{it.username || it.subscriber_id}</div>
                  <div className="text-xs">{it.status} • {new Date(it.created_at).toLocaleString()}</div>
                </div>
                <div className="text-sm text-[#D4AF37]">{it.amount ?? ''}</div>
              </div>
            ))}

            {/* Comments */}
            {(data.recent?.comments || []).map((it: any) => (
              <div key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 hover:bg-black/50">
                <MessageCircle className="h-6 w-6 text-[#D4AF37]" />
                <div className="flex-1 text-sm text-[#D4AF37]/80">
                  <div className="font-semibold text-[#D4AF37]">{it.username || it.user_id}</div>
                  <div className="text-xs line-clamp-2">{it.content}</div>
                </div>
                <div className="text-xs text-[#D4AF37]/70">{new Date(it.created_at).toLocaleString()}</div>
              </div>
            ))}

            {/* Likes */}
            {(data.recent?.likes || []).map((it: any) => (
              <div key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 hover:bg-black/50">
                <Heart className="h-6 w-6 text-[#D4AF37]" />
                <div className="flex-1 text-sm text-[#D4AF37]/80">
                  <div className="font-semibold text-[#D4AF37]">{it.username || it.user_id}</div>
                  <div className="text-xs">{t('activity_ui.liked_your_post') || 'liked your post'}</div>
                </div>
                <div className="text-xs text-[#D4AF37]/70">{new Date(it.created_at).toLocaleString()}</div>
              </div>
            ))}

            {/* Fallback if nothing */}
            {((data.recent?.transactions || []).length === 0 && (data.recent?.subscriptions || []).length === 0 && (data.recent?.comments || []).length === 0 && (data.recent?.likes || []).length === 0) && (
              <p className="text-[#D4AF37]/60">{t('dashboard.recent_activity.empty') || 'No recent activity'}</p>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
