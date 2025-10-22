"use client"

import { useState, useEffect } from "react"
import { PostCard } from "@/components/feed/post-card"
import { FeedFilters, FilterState } from "@/components/feed/feed-filters"
import { SubscriptionsBox } from "@/components/feed/subscriptions-box"
import { MobileSidebar } from "@/components/feed/mobile-sidebar"

type PostRow = {
  id: string
  creator_id: string
  content: string | null
  media_urls: string[] | null
  media_type: string | null
  is_locked: boolean
  price: number | null
  profile_subscription_price?: number | null
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
  subscribedCreatorIds?: string[]
  followedCreatorIds?: string[]
}

const FILTERS_STORAGE_KEY = 'eliteFans_feed_filters'

export function FilteredFeed({ posts, subscribedCreatorIds, followedCreatorIds }: FilteredFeedProps) {
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

      // Mejor detección: comprobar extensiones de las URLs para diferenciar imágenes y videos
      const imageExt = /\.(jpe?g|png|webp|gif|avif|svg)$/i
      const videoExt = /\.(mp4|webm|mov|mkv|ogg)$/i
      const urls: string[] = Array.isArray(post.media_urls) ? post.media_urls.filter(Boolean) as string[] : []
      const hasImageUrls = urls.some(u => imageExt.test(u))
      const hasVideoUrls = urls.some(u => videoExt.test(u))

      // Evaluar match por tipo (imagen/video). Si no hay filtro de tipo activo, se considera match por tipo.
      let passesType = true
      if (filters.onlyImages) {
        passesType = post.media_type === 'image' || hasImageUrls
      } else if (filters.onlyVideos) {
        passesType = post.media_type === 'video' || hasVideoUrls
      }

      // Evaluar match por premium: si el usuario quiere contenido premium -> debe ser is_locked;
      // si no quiere premium, entonces excluir posts bloqueados.
      let passesPremium = true
      if (filters.premiumContent) {
        passesPremium = Boolean(post.is_locked)
      } else {
        passesPremium = !Boolean(post.is_locked)
      }

      return passesType && passesPremium
    })
  }

  const filteredPosts = filterPosts(posts, filters)

  // Estado para la pestaña activa del feed
  const [activeTab, setActiveTab] = useState<'parati' | 'siguiendo' | 'popular'>('parati')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showMobileSubscriptions, setShowMobileSubscriptions] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)

  // Calcular posts según la pestaña seleccionada
  const postsForTab = (() => {
    switch (activeTab) {
      case 'parati':
        // Priorizar posts de creadores suscritos, luego por fecha
        return [...filteredPosts].sort((a, b) => {
          if ((a.isSubscribed === b.isSubscribed)) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          return a.isSubscribed ? -1 : 1
        })
      case 'siguiendo':
        // Priorizar creadores que sigues (follows). Si no hay follows, usar suscripciones como fallback.
        if (followedCreatorIds && followedCreatorIds.length > 0) {
          return filteredPosts.filter(p => followedCreatorIds.includes(p.creator_id))
        }
        if (subscribedCreatorIds && subscribedCreatorIds.length > 0) {
          return filteredPosts.filter(p => subscribedCreatorIds.includes(p.creator_id))
        }
        // Fallback a usar la propiedad isSubscribed si ninguna lista está disponible
        return filteredPosts.filter(p => p.isSubscribed)
      case 'popular':
        // Mostrar solo el/los post(s) con más likes (máximo)
        if (filteredPosts.length === 0) return filteredPosts
        const maxLikes = filteredPosts.reduce((m, p) => Math.max(m, p.like_count || 0), 0)
        return filteredPosts.filter(p => (p.like_count || 0) === maxLikes)
        default:
          return filteredPosts
    }
  })()

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar izquierdo con filtros */}
  <aside className="hidden lg:block lg:w-56">
        <div className="sticky top-0 space-y-4">
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
              <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Secciones
            </h3>
            <ul className="space-y-2">
              <li
                onClick={() => setActiveTab('parati')}
                className={`cursor-pointer rounded-full px-3 py-1.5 transition-all duration-200 font-medium ${activeTab === 'parati' ? 'text-[#F4BF37] bg-[#D4AF37]/10' : 'text-[#D4AF37]/80 hover:bg-[#D4AF37]/10'}`}>
                Para ti
              </li>
              <li
                onClick={() => setActiveTab('siguiendo')}
                className={`cursor-pointer rounded-full px-3 py-1.5 transition-all duration-200 ${activeTab === 'siguiendo' ? 'text-[#F4BF37] bg-[#D4AF37]/10' : 'text-[#D4AF37]/80 hover:bg-[#D4AF37]/10'}`}>
                Siguiendo
              </li>
              <li
                onClick={() => setActiveTab('popular')}
                className={`cursor-pointer rounded-full px-3 py-1.5 transition-all duration-200 ${activeTab === 'popular' ? 'text-[#F4BF37] bg-[#D4AF37]/10' : 'text-[#D4AF37]/80 hover:bg-[#D4AF37]/10'}`}>
                Popular
              </li>
            </ul>
          </div>

          <FeedFilters 
            onFiltersChange={handleFiltersChange} 
            initialFilters={filters}
          />
          {/* Caja combinada: Suscripciones y Chat */}
          <div className="mt-4">
            <SubscriptionsBox />
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <section className="flex-1 space-y-6 overflow-y-auto scrollbar-hide pr-2 h-full">
        {/* Indicador de filtros activos */}
        {(filters.onlyImages || filters.onlyVideos || filters.premiumContent) && (
          <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-3 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-semibold text-[#D4AF37]">Filtros activos:</span>
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
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
              <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
                <span className="text-xs text-[#D4AF37]/70">
                  {postsForTab.length} de {posts.length} posts
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
        {postsForTab.length === 0 ? (
          activeTab === 'siguiendo' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#D4AF37]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">Aún no sigues a creadores</h3>
              <p className="text-[#D4AF37]/70 mb-4">No hay publicaciones de creadores que sigues. Empieza a seguir a creadores para ver su contenido aquí.</p>
              <div>
                <a href="/feed" className="inline-block px-4 py-2 bg-[#D4AF37] text-black rounded-full font-medium">Explorar creadores</a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#D4AF37]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">No hay contenido</h3>
              <p className="text-[#D4AF37]/70">No se encontraron posts que coincidan con los filtros seleccionados.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-6">
            {postsForTab.map((post) => {
            // Para contenido premium, siempre mostrar como locked si is_locked es true
            // independientemente del estado de suscripción cuando el filtro premium está activo
            const isPremiumFiltered = filters.premiumContent && post.is_locked
            const showLocked = isPremiumFiltered || (post.is_locked && !post.isSubscribed && !post.isOwn)
            
                return (
                <div key={post.id} className="mx-auto w-full max-w-3xl">
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
                  autoplay={true}
                  subscriptionPrice={post.profile_subscription_price ?? post.price}
                />
                </div>
              )
            })}
          </div>
        )}
      </section>
      {/* Mobile Filters modal (centrado) */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="relative w-full max-w-md bg-background rounded-2xl p-6 mx-4 z-10 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Filtros</h3>
              <button className="text-sm text-muted-foreground" onClick={() => setShowMobileFilters(false)}>Cerrar</button>
            </div>
            <FeedFilters onFiltersChange={handleFiltersChange} initialFilters={filters} />
          </div>
        </div>
      )}
      {/* Mobile Subscriptions overlay */}
      {showMobileSubscriptions && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileSubscriptions(false)} />
          <div className="relative w-full bg-background rounded-t-xl p-4 max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Suscripciones</h3>
              <button className="text-sm text-muted-foreground" onClick={() => setShowMobileSubscriptions(false)}>Cerrar</button>
            </div>
            <SubscriptionsBox />
          </div>
        </div>
      )}
      {/* Mobile sidebar (visible en lg:hidden) */}
  <MobileSidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenFilters={() => setShowMobileFilters(true)} onOpenSubscriptions={() => setShowMobileSubscriptions(true)} onOpenChat={() => setShowMobileChat(true)} />

      {/* Mobile Chat overlay */}
      {showMobileChat && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileChat(false)} />
          <div className="relative w-full bg-background rounded-t-xl p-4 max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Chat</h3>
              <button className="text-sm text-muted-foreground" onClick={() => setShowMobileChat(false)}>Cerrar</button>
            </div>
            {/* ChatSection */}
            {/* If you want the full chat UI, we can render ChatSection component here */}
          </div>
        </div>
      )}
    </div>
  )
}