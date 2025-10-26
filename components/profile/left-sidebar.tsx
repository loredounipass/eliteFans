"use client"

import { TrendingUp, Star } from "lucide-react"
import { useTranslation } from "react-i18next"

interface LeftSidebarProps {
  profile: any
  actualPostCount: number
}

export default function LeftSidebar({ profile, actualPostCount }: LeftSidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className="hidden lg:block lg:w-72">
      <div className="sticky top-0 space-y-4">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
          <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('profile.sidebar.navigation')}
          </h3>
          <ul className="space-y-2">
            <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] transition-all duration-200 font-medium">
              {t('profile.sidebar.posts')}
            </li>
            <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
              {t('profile.sidebar.about')}
            </li>
            <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
              {t('profile.sidebar.messages')}
            </li>
            <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
              {t('profile.sidebar.statistics')}
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
          <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t('profile.sidebar.statistics')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#D4AF37]/80">{t('profile.stats.subscribers')}</span>
              <span className="text-sm font-semibold text-[#D4AF37]">{profile.subscriber_count || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#D4AF37]/80">{t('profile.stats.posts')}</span>
              <span className="text-sm font-semibold text-[#D4AF37]">{actualPostCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#D4AF37]/80">{t('profile.stats.total_likes')}</span>
              <span className="text-sm font-semibold text-[#D4AF37]">{profile.likes || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
