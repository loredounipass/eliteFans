"use client"

import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { Star } from "lucide-react"

interface FilterState {
  onlyImages: boolean
  onlyVideos: boolean
  premiumContent: boolean
}

interface FeedFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  initialFilters?: FilterState
}

export function FeedFilters({ onFiltersChange, initialFilters }: FeedFiltersProps) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<FilterState>(initialFilters ?? {
    onlyImages: false,
    onlyVideos: false,
    premiumContent: false
  })

  // Sincronizar estado si initialFilters cambia desde el padre
    useEffect(() => {
    if (initialFilters !== undefined) {
      setFilters(initialFilters)
    }
  }, [initialFilters])

  const handleFilterChange = (filterType: keyof FilterState) => {
    const newFilters = { ...filters }
    
    // Si se selecciona "Solo imágenes", desactivar "Solo videos"
    if (filterType === 'onlyImages' && !filters.onlyImages) {
      newFilters.onlyVideos = false
    }
    
    // Si se selecciona "Solo videos", desactivar "Solo imágenes"
    if (filterType === 'onlyVideos' && !filters.onlyVideos) {
      newFilters.onlyImages = false
    }
    
    newFilters[filterType] = !filters[filterType]
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  return (
    <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
      <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
        <Star className="h-5 w-5" />
        {t('feed.filters.label')}
      </h3>
      <div className="mb-3">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={!filters.onlyImages && !filters.onlyVideos && !filters.premiumContent}
            onChange={() => {
              const cleared = { onlyImages: false, onlyVideos: false, premiumContent: false }
              setFilters(cleared)
              onFiltersChange(cleared)
            }}
            className="rounded border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] focus:ring-[#D4AF37]/20 transition-all duration-200"
          />
          <span className="text-sm text-[#D4AF37]/80 group-hover:text-[#D4AF37] transition-colors duration-200">{t('feed.filters.all')}</span>
        </label>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={filters.onlyImages}
            onChange={() => handleFilterChange('onlyImages')}
            className="rounded border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] focus:ring-[#D4AF37]/20 transition-all duration-200" 
          />
          <span className="text-sm text-[#D4AF37]/80 group-hover:text-[#D4AF37] transition-colors duration-200">
            {t('feed.filters.only_images')}
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={filters.onlyVideos}
            onChange={() => handleFilterChange('onlyVideos')}
            className="rounded border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] focus:ring-[#D4AF37]/20 transition-all duration-200" 
          />
          <span className="text-sm text-[#D4AF37]/80 group-hover:text-[#D4AF37] transition-colors duration-200">
            {t('feed.filters.only_videos')}
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={filters.premiumContent}
            onChange={() => handleFilterChange('premiumContent')}
            className="rounded border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] focus:ring-[#D4AF37]/20 transition-all duration-200" 
          />
          <span className="text-sm text-[#D4AF37]/80 group-hover:text-[#D4AF37] transition-colors duration-200">
            {t('feed.filters.premium_content')}
          </span>
        </label>
      </div>
    </div>
  )
}

export type { FilterState }