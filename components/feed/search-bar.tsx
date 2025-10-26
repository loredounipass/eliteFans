"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { useRouter } from "next/navigation"

type UserSuggestion = {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"'`]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c] || c))
}

function highlightMatch(text: string, query: string) {
  if (!query) return escapeHtml(text)
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return escapeHtml(text)
  const before = escapeHtml(text.slice(0, idx))
  const match = escapeHtml(text.slice(idx, idx + query.length))
  const after = escapeHtml(text.slice(idx + query.length))
  return `${before}<strong class=\"text-[#F4BF37]\">${match}</strong>${after}`
}

export function SearchBar({ isSidebar = false }: { isSidebar?: boolean }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const router = useRouter()
  const ref = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!query) {
      setResults([])
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    setLoading(true)
    const id = setTimeout(async () => {
      try {
  const res = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setResults(json?.users || [])
        setOpen(true)
        setActiveIndex(-1)
      } catch (e) {
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => clearTimeout(id)
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      // if click is inside the main container or inside the dropdown (portal), don't close
      if (ref.current && ref.current.contains(target)) return
      if (dropdownRef.current && dropdownRef.current.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Calcular posición del dropdown cuando esté en sidebar
  const updateDropdownPosition = useCallback(() => {
    if (!isSidebar || !inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({ position: "fixed", left: rect.left, top: rect.bottom + 8, width: rect.width, zIndex: 9999 })
  }, [isSidebar])

  useEffect(() => {
    if (!isSidebar) return
    updateDropdownPosition()
    window.addEventListener("resize", updateDropdownPosition)
    window.addEventListener("scroll", updateDropdownPosition, true)
    return () => {
      window.removeEventListener("resize", updateDropdownPosition)
      window.removeEventListener("scroll", updateDropdownPosition, true)
    }
  }, [isSidebar, updateDropdownPosition])

  const goToProfile = useCallback(
    (username: string) => {
      setOpen(false)
      setQuery("")
      router.push(`/profile/${username}`)
    },
    [router]
  )

  // Keyboard navigation
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0 && results[activeIndex]) {
        goToProfile(results[activeIndex].username)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className={isSidebar ? "relative w-full" : "relative max-w-xl mx-auto"}>
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#D4AF37]/50" />

      <Input
        value={query}
        onChange={(e: any) => setQuery(e.target.value)}
        ref={inputRef as any}
        onKeyDown={onKeyDown}
        aria-autocomplete="list"
        aria-expanded={open}
  placeholder={t('feed.search_placeholder')}
        className="border-[#D4AF37]/30 bg-black/50 backdrop-blur-sm pl-12 pr-12 py-2.5 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-full shadow-lg shadow-[#D4AF37]/10"
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" /> : null}
      </div>

      {open && (
        (() => {
          const dropdown = (
            <div
              ref={dropdownRef}
              style={isSidebar ? dropdownStyle || undefined : undefined}
              className={`${isSidebar ? "rounded-xl bg-black/95 border border-[#D4AF37]/20 backdrop-blur-sm shadow-lg" : "absolute left-0 right-0 mt-2 z-50 rounded-xl bg-black/95 border border-[#D4AF37]/20 backdrop-blur-sm shadow-lg"}`}
            >
              {/* scrollable inner area to prevent dropdown from extending to bottom */}
              <div className="max-h-[60vh] overflow-auto">
                {results.length === 0 && !loading ? (
                  <div className="p-3 text-sm text-[#D4AF37]/70">{t('search.no_creators_found')}</div>
                ) : (
                  <ul role="listbox" className="divide-y divide-[#D4AF37]/10">
                    {results.map((u, idx) => (
                      <li
                        key={u.id}
                        role="option"
                        aria-selected={activeIndex === idx}
                        onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                        onClick={() => goToProfile(u.username)}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-150 ${
                          activeIndex === idx ? "bg-[#D4AF37]/12" : "hover:bg-[#D4AF37]/10"
                        }`}
                      >
                        <img src={u.avatar_url || "/placeholder-user.jpg"} className="h-10 w-10 rounded-full object-cover border border-[#D4AF37]/20" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#D4AF37] leading-5 truncate" dangerouslySetInnerHTML={{ __html: highlightMatch(u.full_name || u.username, query) }} />
                          <div className="text-xs text-[#D4AF37]/70 truncate">@{u.username}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )

          if (isSidebar && typeof document !== "undefined") {
            return createPortal(dropdown, document.body)
          }

          return dropdown
        })()
      )}
    </div>
  )
}

export default SearchBar
