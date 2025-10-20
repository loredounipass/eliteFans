"use client"

import { useState, useEffect, useCallback } from "react"
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

  // Centralized API call function
  const makeFollowRequest = useCallback(async (following_id: string, action: 'follow' | 'unfollow') => {
    const response = await fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ following_id, action })
    })
    
    const json = await response.json().catch(() => ({}))
    return { ok: response.ok, json }
  }, [])

  // Check initial follow status
  useEffect(() => {
    let mounted = true
    
    const checkFollowStatus = async () => {
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
        setIsFollowing(!!data)
      } catch (error) {
        console.error('Error checking follow status:', error)
      }
    }

    checkFollowStatus()
    
    return () => {
      mounted = false
    }
  }, [userId])

  // Listen for global follow changes to sync multiple buttons on the page
  useEffect(() => {
    const onFollowChanged = (e: any) => {
      try {
        const detail = e?.detail
        if (!detail) return
        if (detail.userId === userId) {
          setIsFollowing(Boolean(detail.isFollowing))
        }
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('follow:changed', onFollowChanged)
    return () => window.removeEventListener('follow:changed', onFollowChanged)
  }, [userId])

  const toggleFollow = useCallback(async () => {
    if (!currentUser || currentUser.id === userId || isLoading) return
    
    setIsLoading(true)
    const previousState = isFollowing
    
    try {
      // Optimistic update
      setIsFollowing(!isFollowing)
      onFollowChange?.(!isFollowing)
      
      const { ok, json } = await makeFollowRequest(userId, isFollowing ? 'unfollow' : 'follow')
      
      if (!ok) {
        // Revert optimistic update on error
        setIsFollowing(previousState)
        onFollowChange?.(previousState)
        throw new Error(json.error || 'Failed to update follow status')
      }
      
      // Update based on server response
      const newFollowState = json.action === 'followed'
      setIsFollowing(newFollowState)
      onFollowChange?.(newFollowState)

      // Broadcast change so other FollowButton instances update
      try {
        window.dispatchEvent(new CustomEvent('follow:changed', { detail: { userId, isFollowing: newFollowState } }))
      } catch (err) {
        // ignore
      }
      
      toast({
        title: newFollowState ? "Siguiendo" : "Dejaste de seguir",
        description: newFollowState 
          ? "Ahora sigues a este usuario" 
          : "Ya no sigues a este usuario"
      })
      
    } catch (error: any) {
      // Revert optimistic update on error
      setIsFollowing(previousState)
      onFollowChange?.(previousState)
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, userId, isFollowing, isLoading, onFollowChange, makeFollowRequest, toast])

  // Don't show follow functionality for own profile or when not logged in
  const canFollow = currentUser && currentUser.id !== userId

  return {
    isFollowing,
    isLoading,
    canFollow,
    toggleFollow
  }
}

interface FollowButtonProps {
  userId: string
  onFollowChange?: (isFollowing: boolean) => void
  className?: string
}

// Componente reutilizable para mostrar el botón de seguir
export function FollowButton({ userId, onFollowChange, className }: FollowButtonProps) {
  const { isFollowing, isLoading, canFollow, toggleFollow } = useFollow({ userId, onFollowChange })

  if (!canFollow) return null

  return (
    <button
      onClick={toggleFollow}
      disabled={isLoading}
      className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${className || ''}`}
      aria-pressed={isFollowing}
    >
      {isLoading ? '...' : isFollowing ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}