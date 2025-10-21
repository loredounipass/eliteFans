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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  
  // Organizar creadores en filas de 3
  const rows = chunkArray(creators || [], 3)
  // Reducimos el ancho para que las tarjetas en la sidebar no se vean demasiado anchas
  const itemWidth = 280 // Ancho aproximado de cada fila (ligeramente mayor)
  const gap = 16 // Gap entre elementos

  useEffect(() => {
    setCurrentIndex(0)
    updateScrollButtons()
  }, [creators])

  const updateScrollButtons = () => {
    const container = containerRef.current
    if (!container) return

    const scrollLeft = container.scrollLeft
    const maxScroll = container.scrollWidth - container.clientWidth

    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < maxScroll - 10) // -10 para tolerancia
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      updateScrollButtons()
      // Calcular el índice actual basado en la posición de scroll
      const scrollLeft = container.scrollLeft
      const newIndex = Math.round(scrollLeft / (itemWidth + gap))
      setCurrentIndex(newIndex)
    }

    container.addEventListener('scroll', handleScroll)
    const resizeObserver = new ResizeObserver(updateScrollButtons)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [itemWidth, gap])

  const scrollToIndex = (index: number) => {
    const container = containerRef.current
    if (!container) return

    const scrollLeft = index * (itemWidth + gap)
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })
  }

  const scrollLeft = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1)
    }
  }

  const scrollRight = () => {
    if (currentIndex < rows.length - 1) {
      scrollToIndex(currentIndex + 1)
    }
  }

  if (!creators || creators.length === 0) return null

  return (
    <div className="relative group">
      {/* Botón izquierdo */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-black/80 hover:bg-black/90 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5 text-[#D4AF37]" />
        </button>
      )}

      {/* Contenedor del carrusel */}
      <div 
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {rows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex-shrink-0 flex flex-col gap-3"
              style={{ 
                width: `${itemWidth}px`,
                maxWidth: '100%',
                scrollSnapAlign: 'start'
              }}
          >
            {row.map((creator: any, creatorIndex: number) => (
              <div key={`${rowIndex}-${creatorIndex}`} className="w-full">
                <CreatorCard
                  compact
                  name={creator.full_name || creator.username}
                  username={creator.username}
                  avatar={creator.avatar_url || "/placeholder-user.jpg"}
                  coverImage={creator.cover_url || creator.avatar_url || "/placeholder.jpg"}
                  subscribers={creator.subscriber_count || 0}
                  isSubscribed={false}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Botón derecho */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-black/80 hover:bg-black/90 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5 text-[#D4AF37]" />
        </button>
      )}

      {/* Indicadores de página (opcional) */}
      {rows.length > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {rows.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-[#D4AF37] w-6' 
                  : 'bg-[#D4AF37]/30 hover:bg-[#D4AF37]/50'
              }`}
              aria-label={`Ir a la página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}