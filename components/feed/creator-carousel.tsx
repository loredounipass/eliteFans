"use client"

import React, { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CreatorCard } from "./creator-card"

interface CreatorCarouselProps {
  creators: any[]
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export default function CreatorCarousel({ creators }: CreatorCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const pages = chunkArray(creators || [], 3)

  useEffect(() => {
    // reset to first page when creators change
    setPageIndex(0)
    const el = containerRef.current
    if (el) el.scrollTo({ left: 0 })
  }, [creators])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      setPageIndex(idx)
    }
    el.addEventListener("scroll", onScroll)
    const onResize = () => {
      // keep current page aligned after resize
      el.scrollTo({ left: pageIndex * el.clientWidth })
    }
    window.addEventListener("resize", onResize)
    return () => {
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
    }
  }, [pageIndex])

  const canLeft = pageIndex > 0
  const canRight = pageIndex < pages.length - 1

  const go = (dir: number) => {
    const el = containerRef.current
    if (!el) return
    const next = Math.min(Math.max(0, pageIndex + dir), pages.length - 1)
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" })
    setPageIndex(next)
  }

  if (!creators || creators.length === 0) return null

  return (
    <div className="relative">
      {canLeft && (
        <button
          aria-label="Anterior"
          onClick={() => go(-1)}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-8 w-8 rounded-full bg-black/60 hover:bg-black/70"
        >
          <ChevronLeft className="h-4 w-4 text-[#D4AF37]" />
        </button>
      )}

      <div ref={containerRef} className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        {pages.map((page, pIdx) => (
          <div key={pIdx} className="min-w-full flex-shrink-0 p-1 snap-start">
            <div className="flex flex-col gap-3">
              {page.map((creator: any, index: number) => (
                <CreatorCard
                  key={index}
                  compact
                  name={creator.full_name || creator.username}
                  username={creator.username}
                  avatar={creator.avatar_url || "/placeholder-user.jpg"}
                  coverImage={creator.cover_url || creator.avatar_url || "/placeholder.jpg"}
                  subscribers={creator.subscriber_count || 0}
                  isSubscribed={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {canRight && (
        <button
          aria-label="Siguiente"
          onClick={() => go(1)}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-8 w-8 rounded-full bg-black/60 hover:bg-black/70"
        >
          <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
        </button>
      )}
    </div>
  )
}
