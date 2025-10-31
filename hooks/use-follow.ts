"use client"

import { useCallback, useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface UseFollowProps {
  userId: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function useFollow({ userId, onFollowChange }: UseFollowProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()

  const makeFollowRequest = useCallback(async (following_id: string, action: 'follow' | 'unfollow' | undefined) => {
    const res = await fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ following_id, action })
    })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, json }
  }, [])

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return
        setCurrentUser(user)
        if (!user || user.id === userId) return

        const { ok, json } = await fetch(`/api/follows?user_id=${encodeURIComponent(userId)}&type=followers`).then(r => r.json()).then(j => ({ ok: true, json: j })).catch(() => ({ ok: false, json: null }))
        // The API returns a list; check if current user is among followers
        if (ok && json?.data) {
          const found = (json.data as any[]).some((f) => f.profiles?.user_id === user.id || f.follower_id === user.id)
          setIsFollowing(!!found)
        }
      } catch (err) {
        // ignore
      }
    }
    check()
    return () => { mounted = false }
  }, [userId])

  const toggleFollow = useCallback(async () => {
    if (!currentUser || currentUser.id === userId || isLoading) return
    setIsLoading(true)
    const previous = isFollowing
    try {
      setIsFollowing(!previous)
      onFollowChange?.(!previous)
      const { ok, json } = await makeFollowRequest(userId, previous ? 'unfollow' : 'follow')
      if (!ok) {
        setIsFollowing(previous)
        onFollowChange?.(previous)
        throw new Error(json?.error || 'Failed')
      }
  const newState = json.action === 'followed'
  setIsFollowing(newState)
  // Avoid calling onFollowChange again after success since we already
  // called it optimistically above. This prevents duplicate increments
  // of follower counts in the UI.
      toast({ title: newState ? 'Siguiendo' : 'Dejaste de seguir' })
    } catch (err: any) {
  setIsFollowing(previous)
  // Revert optimistic change in parent
  onFollowChange?.(previous)
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, userId, isFollowing, isLoading, makeFollowRequest, onFollowChange, toast])

  const canFollow = !!currentUser && currentUser.id !== userId

  return { isFollowing, isLoading, canFollow, toggleFollow }
}