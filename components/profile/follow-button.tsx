"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"

interface FollowButtonProps {
  userId: string
  initialIsFollowing?: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({ userId, initialIsFollowing = false, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()

  const postJson = async (url: string, body: any) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, json }
  }

  const delFetch = async (url: string) => {
    const res = await fetch(url, { method: "DELETE" })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, json }
  }

  useEffect(() => {
    ;(async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      if (!user || user.id === userId) return
      const { data } = await supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", userId).maybeSingle()
      setIsFollowing(!!data)
    })()
  }, [userId])

  const handleFollow = async () => {
    if (!currentUser || currentUser.id === userId) return
    setIsLoading(true)
    try {
      if (isFollowing) {
        const { ok, json } = await delFetch(`/api/follows?following_id=${userId}`)
        if (!ok) throw new Error(json.error || "Failed to unfollow")
        setIsFollowing(false)
        onFollowChange?.(false)
        toast({ title: "Unfollowed", description: "You are no longer following this user" })
      } else {
        const { ok, json } = await postJson("/api/follows", { following_id: userId })
        if (!ok) throw new Error(json.error || "Failed to follow")
        setIsFollowing(true)
        onFollowChange?.(true)
        toast({ title: "Following", description: "You are now following this user" })
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button for own profile or if not logged in
  if (!currentUser || currentUser.id === userId) {
    return null
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      className={
        isFollowing
          ? "border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
          : "bg-[#D4AF37] text-black hover:bg-[#C9A961]"
      }
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="mr-2 h-4 w-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  )
}