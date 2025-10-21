"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CreatorCard } from "./creator-card"

interface Creator {
  id?: string | number
  username: string
  full_name?: string
  avatar_url?: string
  cover_url?: string
  subscriber_count?: number
}

interface CreatorCarouselProps {
  creators: Creator[]
  // Opcionales para tunear comportamiento si en el futuro se quiere
  pageSize?: number
  gap?: number
}

// DIVIDE UN ARRAY EN CHUNKS (PAGINAS) DE TAMAÑO 'size'.
// RECIBE UN ARRAY GENÉRICO Y DEVUELVE UN ARRAY DE ARRAYS.
// USADO PARA AGRUPAR CREADORES EN FILAS/"PAGINAS".
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

// COMPONENTE PRINCIPAL: CREATORCAROUSEL
// PROPS:
// - creators: LISTA DE OBJETOS CREATOR
// - pageSize: CANTIDAD DE ELEMENTOS POR PÁGINA (DEFAULT 3)
// - gap: ESPACIO ENTRE SLIDES (DEFAULT 16)
// EL COMPONENTE MIDE EL ANCHO DE CADA SLIDE, ESCUCHA SCROLL/RESIZE Y
// PROPORCIONA NAVEGACION (BOTONES Y TECLAS) MANTENIENDO ACCESSIBILIDAD.
export default function CreatorCarousel({ creators, pageSize = 3, gap = 16 }: CreatorCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  // ESTADO QUE INDICA SI EL USUARIO YA HA DESLIZADO AL MENOS UNA VEZ
  const [hasUserScrolled, setHasUserScrolled] = useState(false)
  const [slideWidth, setSlideWidth] = useState<number | null>(null)

  // Dividir creadores en filas (páginas) — memoizado para evitar recomputes innecesarios
  const rows = useMemo(() => chunkArray<Creator>(creators || [], pageSize), [creators, pageSize])

  // MIDE EL ANCHO REAL DEL PRIMER SLIDE PARA CALCULAR EL STEP DE SCROLL.
  // INTENTA LEER EL ANCHO DEL ELEMENTO CON data-carousel-slide Y GUARDA
  // slideWidth PARA USAR EN CÁLCULO DE ÍNDICE Y SCROLL SUAVE.
  const measureSlide = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const firstSlide = container.querySelector<HTMLDivElement>('[data-carousel-slide]')
    if (firstSlide) {
      const computed = firstSlide.getBoundingClientRect().width
      setSlideWidth(Math.round(computed) + gap)
    } else {
      // Fallback razonable
      setSlideWidth(280 + gap)
    }
  }, [gap])

  // ACTUALIZA EL ESTADO DE LOS BOTONES (SI SE PUEDE MOVER A LA IZQ/DER)
  // BASADO EN container.scrollLeft Y EL MÁXIMO SCROLL DISPONIBLE.
  const updateScrollButtons = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const scrollLeft = container.scrollLeft
    const maxScroll = container.scrollWidth - container.clientWidth

    setCanScrollLeft(scrollLeft > 0)
    // tolerancia para evitar jitter cuando está al final
    setCanScrollRight(scrollLeft < Math.max(0, maxScroll - 8))
  }, [])

  useEffect(() => {
    // CUANDO LA LISTA DE CREADORES CAMBIA: REINICIAR ÍNDICE Y MEDIR LA VISTA
    setCurrentIndex(0)
    measureSlide()
    updateScrollButtons()
  }, [creators, measureSlide, updateScrollButtons])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // HANDLER DE SCROLL: ACTUALIZA LOS BOTONES Y CALCULA EL ÍNDICE ACTUAL
    // EN BASE A LA POSICIÓN DE SCROLL Y LA MEDIDA slideWidth.
    // HANDLER DE SCROLL: ACTUALIZA LOS BOTONES Y CALCULA EL ÍNDICE ACTUAL
    // EN BASE A LA POSICIÓN DE SCROLL Y LA MEDIDA slideWidth.
    const handleScroll = () => {
      updateScrollButtons()
      const scrollLeft = container.scrollLeft
      // ACTUALIZA SI EL USUARIO HA DESLIZADO (MOSTRAR/OCULTAR FLECHA IZQUIERDA)
      setHasUserScrolled(scrollLeft > 0)
      if (!slideWidth) return
      const newIndex = Math.round(scrollLeft / slideWidth)
      setCurrentIndex(newIndex)
    }

    container.addEventListener('scroll', handleScroll)
    const resizeObserver = new ResizeObserver(() => {
      measureSlide()
      updateScrollButtons()
    })
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [slideWidth, measureSlide, updateScrollButtons])

  // SCROLLEA SUAVEMENTE HASTA LA PÁGINA/ÍNDICE INDICADO.
  // USA slideWidth COMO STEP, Y CAE EN UN FALLBACK SI NO ESTÁ MEDIDO.
  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current
    if (!container || index < 0) return

    // Si no tenemos medida, usamos clientWidth como fallback
    const step = slideWidth ?? container.clientWidth
    const scrollLeft = index * step
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }, [slideWidth])

  // HANDLER PARA EL BOTÓN PREVIO: VA A LA PÁGINA ANTERIOR SI EXISTE.
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) scrollToIndex(currentIndex - 1)
  }, [currentIndex, scrollToIndex])

  // HANDLER PARA EL BOTÓN SIGUIENTE: AVANZA UNA PÁGINA SI NO ESTÁ EN EL FINAL.
  const handleNext = useCallback(() => {
    if (currentIndex < rows.length - 1) {
      // MARCAR QUE EL USUARIO HA INTERACTUADO PARA MOSTRAR LA FLECHA IZQUIERDA
      setHasUserScrolled(true)
      scrollToIndex(currentIndex + 1)
    }
  }, [currentIndex, rows.length, scrollToIndex])

  // Navegación por teclado (izq/der) para accesibilidad
  // HANDLER DE TECLADO: SOPOORTA FLECHAS IZQ/DERECHA PARA NAVEGACION.
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrev()
    } else if (e.key === 'ArrowRight') {
      handleNext()
    }
  }, [handlePrev, handleNext])

  if (!creators || creators.length === 0) return null

  return (
    <div className="relative group">
      {/* Botón izquierdo: SOLO RENDERIZAR SI EL USUARIO YA HA DESLIZADO Y HAY ESPACIO A LA IZQUIERDA */}
      {hasUserScrolled && canScrollLeft && (
        <button
          onClick={handlePrev}
          aria-label="Anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-black/80 hover:bg-black/90 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5 text-[#D4AF37]" />
        </button>
      )}

      {/* Contenedor del carrusel */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            data-carousel-slide
            className="flex-shrink-0 flex flex-col gap-3"
            style={{
              width: `${280}px`, // Ancho base; la medición ajustará el scroll dinámicamente
              maxWidth: '100%',
              scrollSnapAlign: 'start'
            }}
          >
            {row.map((creator: Creator, creatorIndex: number) => (
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
      <button
        onClick={handleNext}
        disabled={!canScrollRight}
        aria-label="Siguiente"
        aria-disabled={!canScrollRight}
        className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-black/80 hover:bg-black/90 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all duration-200 opacity-0 group-hover:opacity-100 ${!canScrollRight ? 'pointer-events-none opacity-40' : ''}`}
      >
        <ChevronRight className="h-5 w-5 text-[#D4AF37]" />
      </button>

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