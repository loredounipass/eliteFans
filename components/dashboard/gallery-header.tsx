"use client"

import { Images, Sparkles } from "lucide-react"
import { useTranslation } from 'react-i18next'

interface GalleryHeaderProps {
  postsCount: number
  likesTotal: number
  commentsTotal: number
}

export default function GalleryHeader({ postsCount, likesTotal, commentsTotal }: GalleryHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-12 text-center">
      <div className="inline-flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-full flex items-center justify-center">
            <Images className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#D4AF37] animate-pulse" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4 hover:scale-105 transition-transform duration-300">
        {t('gallery.my_title')}
      </h1>

      <p className="text-[#D4AF37]/70 text-lg max-w-2xl mx-auto mb-6">
        {t('gallery.my_description')}
      </p>

      <div className="flex items-center justify-center gap-8 mb-8">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#D4AF37]">{postsCount}</div>
          <div className="text-sm text-[#D4AF37]/60">{t('gallery.stats.posts')}</div>
        </div>
        <div className="w-px h-8 bg-[#D4AF37]/20" />
        <div className="text-center">
          <div className="text-2xl font-bold text-[#D4AF37]">{likesTotal}</div>
          <div className="text-sm text-[#D4AF37]/60">{t('gallery.stats.total_likes')}</div>
        </div>
        <div className="w-px h-8 bg-[#D4AF37]/20" />
        <div className="text-center">
          <div className="text-2xl font-bold text-[#D4AF37]">{commentsTotal}</div>
          <div className="text-sm text-[#D4AF37]/60">{t('gallery.stats.comments')}</div>
        </div>
      </div>

      <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto rounded-full" />
    </div>
  )
}
