"use client"

import { useState, useEffect } from "react"
import { PostCard } from "@/components/feed/post-card"
import { FeedFilters, FilterState } from "@/components/feed/feed-filters"

type PostRow = {
  id: string
  creator_id: string
  content: string | null
  media_urls: string[] | null
  media_type: string | null
  is_locked: boolean
  price: number | null
  like_count: number
  comment_count: number
  created_at: string
  username?: string
  full_name?: string
  avatar_url?: string
  isSubscribed?: boolean
  isOwn?: boolean
}

interface FilteredFeedProps {
  posts: PostRow[]
}

const FILTERS_STORAGE_KEY = 'eliteFans_feed_filters'

export function FilteredFeed({ posts }: FilteredFeedProps) {
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(FILTERS_STORAGE_KEY) : null
      if (saved) return JSON.parse(saved) as FilterState
    } catch (e) {
      // ignore and fallback
    }
    return {
      onlyImages: false,
      onlyVideos: false,
      premiumContent: false
    }
  })

  // Guardar filtros en localStorage cuando cambien
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(newFilters))
    } catch (error) {
      console.error('Error saving filters to localStorage:', error)
    }
  }

  const filterPosts = (posts: PostRow[], filters: FilterState) => {
    return posts.filter(post => {
      // Si no hay filtros activos, mostrar todos los posts
      if (!filters.onlyImages && !filters.onlyVideos && !filters.premiumContent) {
        return true
      }

      // Construir condiciones individuales
      const conditions: boolean[] = []

      if (filters.onlyImages) {
        const hasMediaUrls = (post.media_urls?.length ?? 0) > 0
        conditions.push(post.media_type === 'image' || hasMediaUrls)
      }

      if (filters.onlyVideos) {
        conditions.push(post.media_type === 'video')
      }

      if (filters.premiumContent) {
        conditions.push(Boolean(post.is_locked))
      }

      // Si hay varias condiciones activas, mostrar si cumple AL MENOS UNA (OR)
      return conditions.some(Boolean)
    })
  }

  const filteredPosts = filterPosts(posts, filters)

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar izquierdo con filtros */}
      <aside className="hidden lg:block lg:w-72">
        <div className="sticky top-0 space-y-4">
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
            <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Explorar
            </h3>
            <ul className="space-y-2">
              <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] transition-all duration-200 font-medium">
                Para ti
              </li>
              <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
                Siguiendo
              </li>
              <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
                Popular
              </li>
              <li className="cursor-pointer rounded-full px-3 py-1.5 text-[#D4AF37]/80 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all duration-200">
                Categorías
              </li>
            </ul>
          </div>

          <FeedFilters 
            onFiltersChange={handleFiltersChange} 
            initialFilters={filters}
          />
        </div>
      </aside>

      {/* Contenido principal */}
      <section className="flex-1 space-y-6 overflow-y-auto scrollbar-hide pr-2 h-full">
        {/* Indicador de filtros activos */}
        {(filters.onlyImages || filters.onlyVideos || filters.premiumContent) && (
          <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#D4AF37]">Filtros activos:</span>
                <div className="flex gap-2">
                  {filters.onlyImages && (
                    <span className="px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-xs rounded-full border border-[#D4AF37]/30">
                      Solo imágenes
                    </span>
                  )}
                  {filters.onlyVideos && (
                    <span className="px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-xs rounded-full border border-[#D4AF37]/30">
                      Solo videos
                    </span>
                  )}
                  {filters.premiumContent && (
                    <span className="px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-xs rounded-full border border-[#D4AF37]/30">
                      Contenido premium
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#D4AF37]/70">
                  {filteredPosts.length} de {posts.length} posts
                </span>
                <button
                  onClick={() => handleFiltersChange({
                    onlyImages: false,
                    onlyVideos: false,
                    premiumContent: false
                  })}
                  className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] px-2 py-1 rounded-full hover:bg-[#D4AF37]/10 transition-all duration-200"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de posts filtrados */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#D4AF37]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">No hay contenido</h3>
            <p className="text-[#D4AF37]/70">No se encontraron posts que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            // Para contenido premium, siempre mostrar como locked si is_locked es true
            // independientemente del estado de suscripción cuando el filtro premium está activo
            const isPremiumFiltered = filters.premiumContent && post.is_locked
            const showLocked = isPremiumFiltered || (post.is_locked && !post.isSubscribed && !post.isOwn)
            
            return (
              <div key={post.id} className="mx-auto w-full max-w-xl">
                <PostCard
                  postId={post.id}
                  creator={{
                    name: post.full_name || post.username || "Creator",
                    username: post.username || "",
                    avatar: post.avatar_url || "/placeholder-user.jpg",
                  }}
                  content={{
                    type: showLocked ? "locked" : post.media_type === "video" ? "video" : "image",
                    url: showLocked ? undefined : (post.media_urls && post.media_urls[0]) || undefined,
                    description: post.content || "",
                    likes: post.like_count || 0,
                    comments: post.comment_count || 0,
                  }}
                  isSubscribed={post.isSubscribed}
                />
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}