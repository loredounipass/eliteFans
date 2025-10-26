"use client"

import React from 'react'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CreatorCarousel from '@/components/feed/creator-carousel'

export default function RightSidebar({ creators, posts }: { creators: any[]; posts: any[] }) {
  const { t } = useTranslation()

  return (
    <aside className="hidden lg:block lg:w-72 lg:ml-4">
      <div className="sticky top-0 space-y-4">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
            <div className="relative">
            {/* SearchBar is already rendered in the main column; keep placeholder space if needed */}
          </div>
        </div>
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
          <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('feed.suggested_creators')}
          </h3>
          <div>
            <CreatorCarousel creators={creators} />
          </div>
        </div>
      </div>
    </aside>
  )
}
