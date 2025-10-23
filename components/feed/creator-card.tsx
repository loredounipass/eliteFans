"use client"

import React, { useState, useRef, useEffect } from "react"
import { useToast } from '@/hooks/use-toast'
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown } from "lucide-react"
import { MoreHorizontal } from "lucide-react"
import { createPortal } from 'react-dom'

interface CreatorCardProps {
  name: string
  username: string
  avatar: string
  coverImage: string
  subscribers: number
  isSubscribed?: boolean
  compact?: boolean
  onlyFans?: boolean
  showMenuIcon?: boolean
}

export function CreatorCard({
  name,
  username,
  avatar,
  coverImage,
  subscribers,
  isSubscribed = false,
  compact = false,
  onlyFans = false,
  showMenuIcon = false,
}: CreatorCardProps) {
  // Compact style for sidebar suggestions
  if (compact) {
    return (
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40 p-1">
        <Link href={`/profile/${username}`}>
          <div className="relative h-24 w-full rounded-lg overflow-hidden">
            <Image src={coverImage || "/placeholder.jpg"} alt={`${name} cover`} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
            {/* three-dots menu */}
            <MenuOverlay username={username} />
            <div className="absolute left-3 bottom-4 flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-black shadow-md">
                <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
                <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">{name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-[#D4AF37] leading-5">{name}</p>
                <p className="text-sm text-[#D4AF37]/60">@{username}</p>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  // OnlyFans-like horizontal thin layout
  if (onlyFans) {
    return (
      <Card className="overflow-hidden rounded-lg transition-all" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        {/* Banner con imagen de cover */}
        <div className="relative w-full h-28 md:h-36">
          <Image src={coverImage || "/placeholder.jpg"} alt={`${name} cover`} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />

          {/* Contenido sobre el banner: avatar solapado, nombre y botón */}
          <div className="absolute inset-0 flex items-end justify-between px-4 pb-3">
            <Link href={`/profile/${username}`} className="flex items-center gap-3">
              <div className="relative -mb-6">
                <Avatar className="h-16 w-16 border-2 shadow-lg" style={{ borderColor: 'var(--primary-foreground)' }}>
                  <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
                  <AvatarFallback className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">{name[0]}</AvatarFallback>
                </Avatar>
                {/* Badge pequeño (ej. Free) sobre el avatar */}
                <div className="absolute -top-2 -left-1 text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Free</div>
              </div>
              <div className="text-left -mb-4">
                <p className="font-semibold text-sm drop-shadow-md" style={{ color: 'var(--color-card-foreground)' }}>{name}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  @{username}
                  {subscribers ? (
                    <>{' '} · <span className="font-semibold" style={{ color: 'var(--color-card-foreground)' }}>{subscribers.toLocaleString()}</span></>
                  ) : null}
                </p>
              </div>
            </Link>

            <div className="ml-3 -mb-4">
              {showMenuIcon ? (
                <MenuOverlay username={username} />
              ) : (
                <Button
                  className={`px-4 py-1 ${isSubscribed ? 'border-[var(--primary)] bg-transparent text-[var(--primary-foreground)] hover:bg-[rgba(212,175,55,0.08)]' : 'bg-[var(--primary)] text-[var(--primary-foreground)]'}`}
                  variant={isSubscribed ? "outline" : "default"}
                  style={isSubscribed ? { borderColor: 'var(--primary)' } : undefined}
                >
                  {isSubscribed ? "Suscrito" : "Suscribirse"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40">
      <Link href={`/profile/${username}`}>
        <div className="relative h-28 md:h-32 w-full">
          <Image src={coverImage || "/placeholder.jpg"} alt={`${name} cover`} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
          <MenuOverlay username={username} />
        </div>
      </Link>
      <CardContent className="relative -mt-12 px-4 pb-4 pt-2">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${username}`} className="block -mt-6">
            <Avatar className="h-12 w-12 border-2 border-black shadow-lg">
              <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
              <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">{name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <Link href={`/profile/${username}`} className="hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-[#D4AF37]">{name}</p>
                <Crown className="h-3 w-3 text-[#D4AF37]" />
              </div>
              <p className="text-xs text-[#D4AF37]/60">@{username}</p>
            </Link>
            {subscribers ? (
              <p className="mt-1 text-xs text-[#D4AF37]/50">{subscribers.toLocaleString()} suscriptores</p>
            ) : null}
          </div>
        </div>
        <div className="mt-3">
          <Button
            className={
              isSubscribed
                ? "w-full border-[#D4AF37] bg-transparent text-[#D4AF37] hover:bg-[#D4AF37]/10"
                : "w-full bg-[#D4AF37] text-black hover:bg-[#C9A961]"
            }
            variant={isSubscribed ? "outline" : "default"}
          >
            {isSubscribed ? "Suscrito" : "Suscribirse"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MenuOverlay({ username }: { username: string }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current && !btnRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [open])

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      const menuWidth = 200
      const left = Math.max(8, rect.right - menuWidth)
      const top = rect.top + window.scrollY + rect.height + 8
      setCoords({ top, left })
    }
    setOpen(true)
  }

  const closeAnd = (fn?: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fn) fn()
    setOpen(false)
  }

  const { toast } = useToast()

  const copyLink = async () => {
    try {
      const url = (typeof window !== 'undefined' ? window.location.origin : '') + `/profile/${username}`
      await navigator.clipboard.writeText(url)
      toast({ title: 'Copiado', description: 'Link copiado al portapapeles' })
    } catch (err) { console.error(err); toast({ title: 'Error', description: 'No se pudo copiar el link', variant: 'destructive' }) }
  }

  const blockUser = () => toast({ title: 'Bloqueado', description: `@${username} bloqueado (placeholder)` })
  const removeUser = () => toast({ title: 'Eliminado', description: `@${username} eliminado (placeholder)` })
  const reportUser = () => toast({ title: 'Reportado', description: `@${username} reportado (placeholder)` })

  return (
    <>
      <button ref={btnRef} onClick={openMenu} className="absolute top-2 right-2 z-40 p-1 rounded-full bg-black/40 hover:bg-black/60">
        <MoreHorizontal className="h-5 w-5 text-[#D4AF37]" />
      </button>
      {open && coords && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'absolute', top: coords.top + 'px', left: coords.left + 'px', zIndex: 9999 }}>
          <div className="w-48 bg-background border border-[#D4AF37]/20 rounded-md shadow-xl py-1">
            <div className="px-3 py-2 text-xs text-[#D4AF37]/80 font-semibold">@{username}</div>
            <div className="border-t border-[#D4AF37]/10" />
            <button onClick={closeAnd(copyLink)} className="w-full text-left px-3 py-2 text-sm hover:bg-[#D4AF37]/5">Copy link to profile</button>
            <button onClick={closeAnd(blockUser)} className="w-full text-left px-3 py-2 text-sm hover:bg-[#D4AF37]/5">Block</button>
            <button onClick={closeAnd(removeUser)} className="w-full text-left px-3 py-2 text-sm hover:bg-[#D4AF37]/5">Remove</button>
            <button onClick={closeAnd(reportUser)} className="w-full text-left px-3 py-2 text-sm hover:bg-[#D4AF37]/5">Report</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
