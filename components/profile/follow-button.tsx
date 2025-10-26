"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslation } from 'react-i18next'
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

type FollowAction = "follow" | "unfollow"

interface UseFollowProps {
  userId: string
  onFollowChange?: (isFollowing: boolean) => void
}

interface UseFollowReturn {
  following: boolean
  loading: boolean
  canFollow: boolean
  ready: boolean
  toggleFollow: () => Promise<void>
}

// small helper to call the follow API
async function postFollowAction(followingId: string, action: FollowAction) {
  const res = await fetch("/api/follows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ following_id: followingId, action }),
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, json }
}

export function useFollow({ userId, onFollowChange }: UseFollowProps): UseFollowReturn {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [ready, setReady] = useState(false)
  const { toast } = useToast()

  // Load initial follow state and current user
  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return
        setCurrentUser(user)

        if (!user || user.id === userId) return

        const { data } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .maybeSingle()

        if (!mounted) return
        setFollowing(Boolean(data))
      } catch (err) {
        console.error("useFollow: failed to load state", err)
      } finally {
        if (mounted) setReady(true)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [userId])

  // Keep multiple buttons in sync across the page
  useEffect(() => {
    function onFollowChanged(e: any) {
      const d = e?.detail
      if (!d || d.userId !== userId) return
      setFollowing(Boolean(d.isFollowing))
    }

    window.addEventListener("follow:changed", onFollowChanged)
    return () => window.removeEventListener("follow:changed", onFollowChanged)
  }, [userId])

  const dispatchFollowChanged = useCallback((isFollowing: boolean) => {
    try {
      window.dispatchEvent(new CustomEvent("follow:changed", { detail: { userId, isFollowing } }))
    } catch (err) {
      // ignore
    }
  }, [userId])

  const toggleFollow = useCallback(async () => {
    if (!currentUser || currentUser.id === userId || loading) return

    setLoading(true)
    const prev = following

    try {
      // optimistic
      setFollowing(!prev)
      onFollowChange?.(!prev)

      const action: FollowAction = prev ? "unfollow" : "follow"
      const { ok, json } = await postFollowAction(userId, action)

      if (!ok) {
        setFollowing(prev)
        onFollowChange?.(prev)
        throw new Error(json?.error || "Failed to update follow status")
      }

      const newState = json.action === "followed"
      setFollowing(newState)
      onFollowChange?.(newState)
      dispatchFollowChanged(newState)

      toast({
        title: newState ? "Siguiendo" : "Dejaste de seguir",
        description: newState ? "Ahora sigues a este usuario" : "Ya no sigues a este usuario",
      })
    } catch (err: any) {
      setFollowing(prev)
      onFollowChange?.(prev)
      toast({ title: "Error", description: err?.message ?? "Error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [currentUser, userId, following, loading, onFollowChange, dispatchFollowChanged, toast])

  const canFollow = Boolean(currentUser && currentUser.id !== userId)

  return { following, loading, canFollow, ready, toggleFollow }
}

interface FollowButtonProps {
  userId: string
  onFollowChange?: (isFollowing: boolean) => void
  className?: string
}

export function FollowButton({ userId, onFollowChange, className }: FollowButtonProps) {
  const { following, loading, canFollow, ready, toggleFollow } = useFollow({ userId, onFollowChange })
  const { t } = useTranslation()

  // When ready and not allowed to follow, hide the button
  if (ready && !canFollow) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!ready || !canFollow || loading) return
    void toggleFollow()
  }

  return (
    <button
      onClick={handleClick}
      disabled={!ready || loading || !canFollow}
      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${className || ""}`}
      aria-pressed={following}
    >
      {loading ? "..." : following ? t('ui.following') : t('ui.follow')}
    </button>
  )
}