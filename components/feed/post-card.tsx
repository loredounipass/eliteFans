"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Lock, MoreHorizontal, Bookmark, MoreVertical, Edit3, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreatorCard } from "@/components/feed/creator-card"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { FollowButton } from "@/components/profile/follow-button"

interface PostCardProps {
  postId?: string
  creator: {
    name: string
    username: string
    avatar: string
  }
  content: {
    type: "image" | "video" | "locked"
    url?: string
    // optional high-resolution image url (4K) if available
    highResUrl?: string
    // optional video sources with resolution metadata
    videoSources?: Array<{ src: string; type?: string; resolution?: number }>
    description: string
    likes: number
    comments: number
  }
  isSubscribed?: boolean
  autoplay?: boolean
  subscriptionPrice?: number | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  parent_id?: string | null
  profiles: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
  liked?: boolean
  like_count?: number
  liking?: boolean
  replies?: Comment[]
  // depth used for rendering reply indentation; optional
  depth?: number
}

export function PostCard({ postId, creator, content, isSubscribed = false, autoplay = false, subscriptionPrice }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const [likes, setLikes] = useState(content.likes)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState(content.comments)
  const [commenting, setCommenting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentList, setCommentList] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsOffset, setCommentsOffset] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const [creatorProfileId, setCreatorProfileId] = useState<string | null>(null)
  const [subscriberCount, setSubscriberCount] = useState<number>(0)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const { toast } = useToast()
  const COMMENTS_PAGE = 10

  // Small helpers to keep render compact and consistent
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "")
  const isOwner = (c: Comment) => c.profiles?.id === "me" || c.profiles?.id === currentUserId

  const saveEdit = async (id: string, text: string) => {
    if (!text.trim()) return false
    try {
      const res = await fetch('/api/comments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, text: text.trim() }) })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.comment) {
        setCommentList((l) => l.map(item => item.id === id ? { ...json.comment, like_count: item.like_count ?? 0, liked: item.liked ?? false } : item))
        return true
      }
      toast({ title: 'No se pudo editar', description: json?.error || 'Error' })
      return false
    } catch (err) {
      toast({ title: 'No se pudo editar', description: 'Error de red' })
      return false
    }
  }

  // --- Helpers to reduce repetition and keep behavior identical ---
  const postJson = async (url: string, body?: any, method = "POST") => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, json }
  }

  const getProfileId = async (username: string) => {
    const supabase = getSupabaseBrowserClient()
    const profileRes = await supabase.from("profiles").select("id").eq("username", username).maybeSingle()
    return (profileRes.data as any)?.id ?? null
  }

  useEffect(() => {
    if (!postId) return
    let mounted = true
    fetch(`/api/likes?postId=${encodeURIComponent(postId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return
        if (json && typeof json.liked === "boolean") setLiked(Boolean(json.liked))
        if (json && json.like_count != null) setLikes(Number(json.like_count))
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [postId])

  useEffect(() => {
    // Get current user and creator profile ID
    let mounted = true
    const supabase = getSupabaseBrowserClient()

    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUserId(user.id)
        
        // Obtener el avatar_url del usuario actual
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        
        if (currentUserProfile && currentUserProfile.avatar_url) {
          setCurrentUserAvatar(currentUserProfile.avatar_url)
        }
        
        const targetId = await getProfileId(creator.username)
        if (targetId) {
          setCreatorProfileId(targetId)
          try {
            const profRes = await supabase.from('profiles').select('subscriber_count, cover_url').eq('id', targetId).maybeSingle()
            const pdata = (profRes.data as any) ?? null
            if (pdata) {
              setSubscriberCount(pdata.subscriber_count ?? 0)
              setCoverImage(pdata.cover_url || null)
            }
          } catch (e) {
            // ignore profile fetch errors
          }
        }
      } catch (err) {
        // ignore
      }
    })()

    return () => {
      mounted = false
    }
  }, [creator.username])

  const handleLike = async () => {
    // optimistic UI
    const prevLiked = liked
    const prevLikes = likes
    setLiked((s) => !s)
    setLikes((l) => (liked ? Math.max(0, l - 1) : l + 1))
    try {
      const { ok, json } = await postJson("/api/likes", { postId })
      if (!ok) {
        setLiked(prevLiked)
        setLikes(prevLikes)
        return
      }
      if (json.like_count != null) setLikes(Number(json.like_count))
      else if (json.action === "already_liked") setLiked(true)
      else if (json.action === "unliked") setLiked(false)
    } catch (e) {
      setLiked(prevLiked)
      setLikes(prevLikes)
    }
  }

  const handleCommentSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!commentText.trim()) return
    setCommenting(true)
    const prevComments = comments
    setComments((c) => c + 1)
    // optimistic add to list if visible
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      profiles: { id: "me", username: "you", full_name: "You", avatar_url: "" },
      like_count: 0,
      liked: false,
    }
    if (showComments) setCommentList((l) => [tempComment, ...l])

    try {
      const { ok, json } = await postJson("/api/comments", { postId, text: commentText.trim() })
      if (!ok) {
        setComments(prevComments)
        if (showComments) setCommentList((l) => l.filter((c) => c.id !== tempComment.id))
      } else {
        setCommentText("")
        if (showComments && json?.comment) {
          // Load like info for the new comment
          const newComment = { ...json.comment, like_count: 0, liked: false }
          setCommentList((l) => [newComment, ...l.filter((c) => c.id !== tempComment.id)])
        }
      }
    } catch (err) {
      setComments(prevComments)
      if (showComments) setCommentList((l) => l.filter((c) => c.id !== tempComment.id))
    } finally {
      setCommenting(false)
    }
  }

  const loadComments = async (reset = false) => {
    if (!postId) return
    setLoadingComments(true)
    try {
      const offset = reset ? 0 : commentsOffset
      const q = `/api/comments?postId=${encodeURIComponent(postId)}&limit=${COMMENTS_PAGE}&offset=${offset}`
      const r = await fetch(q)
      const j = await r.json().catch(() => ({}))
      if (r.ok && j?.comments) {
        const items = j.comments as Comment[]
        
        // Load like info for each comment
        const commentsWithLikes = await Promise.all(
          items.map(async (comment) => {
            try {
              const likeRes = await fetch(`/api/comment-likes?commentId=${comment.id}`)
              const likeData = await likeRes.json()
              return {
                ...comment,
                like_count: likeData.like_count || 0,
                liked: likeData.liked || false,
              }
            } catch {
              return { ...comment, like_count: 0, liked: false }
            }
          })
        )

        // Organize comments with replies
        const organizedComments = organizeCommentsWithReplies(commentsWithLikes)
        
        if (reset) {
          setCommentList(organizedComments)
          setCommentsOffset(items.length)
        } else {
          setCommentList((l) => [...l, ...organizedComments])
          setCommentsOffset((o) => o + items.length)
        }
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingComments(false)
    }
  }

  // Function to organize comments with replies positioned correctly
  const organizeCommentsWithReplies = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []
    
    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })
    
    // Second pass: organize hierarchy
    comments.forEach(comment => {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply, don't add to root
        return
      } else {
        // This is a root comment
        rootComments.push(commentMap.get(comment.id)!)
      }
    })
    
    // Third pass: create flat list with replies positioned after parents
    const flatList: Comment[] = []
    
    const addCommentAndReplies = (comment: Comment, depth = 0) => {
      flatList.push({ ...comment, depth })
      
      // Find and add replies immediately after parent
      const replies = comments.filter(c => c.parent_id === comment.id)
      replies.forEach(reply => {
        addCommentAndReplies(commentMap.get(reply.id)!, depth + 1)
      })
    }
    
    rootComments.forEach(comment => addCommentAndReplies(comment))
    
    return flatList
  }

  const handleCommentLike = async (commentId: string) => {
    try {
      // optimistic UI: toggle locally
      setCommentList((list) => 
        list.map((c) => 
          c.id === commentId 
            ? { 
                ...c, 
                liking: true,
                liked: !c.liked,
                like_count: c.liked ? Math.max(0, (c.like_count || 0) - 1) : (c.like_count || 0) + 1
              } 
            : c
        )
      )
      
      const { ok, json } = await postJson("/api/comment-likes", { commentId })
      if (ok) {
        setCommentList((list) => 
          list.map((c) => 
            c.id === commentId 
              ? { 
                  ...c, 
                  liked: json.action === "liked", 
                  like_count: json.like_count ?? c.like_count,
                  liking: false
                } 
              : c
          )
        )
      } else {
        // Revert optimistic update
        setCommentList((list) => 
          list.map((c) => 
            c.id === commentId 
              ? { 
                  ...c, 
                  liked: !c.liked,
                  like_count: c.liked ? (c.like_count || 0) + 1 : Math.max(0, (c.like_count || 0) - 1),
                  liking: false
                } 
              : c
          )
        )
      }
    } catch (err) {
      // Revert optimistic update
      setCommentList((list) => 
        list.map((c) => 
          c.id === commentId 
            ? { 
                ...c, 
                liked: !c.liked,
                like_count: c.liked ? (c.like_count || 0) + 1 : Math.max(0, (c.like_count || 0) - 1),
                liking: false
              } 
            : c
        )
      )
    }
  }

  const handleCommentDelete = async (commentId: string) => {
    try {
      const r = await fetch(`/api/comments?id=${encodeURIComponent(commentId)}`, { method: "DELETE" })
      if (r.ok) {
        setCommentList((l) => l.filter((c) => c.id !== commentId))
        setComments((c) => Math.max(0, c - 1))
      }
    } catch (err) {
      // ignore
    }
  }

  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")

  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return
    try {
      const { ok, json } = await postJson("/api/comments", { postId, text: replyText.trim(), parentId })
      if (ok && json?.comment) {
        // Find the parent comment index and insert reply right after it
        setCommentList((l) => {
          const parentIndex = l.findIndex((c) => c.id === parentId)
          if (parentIndex === -1) return [{ ...json.comment, like_count: 0, liked: false }, ...l]
          
          const newList = [...l]
          newList.splice(parentIndex + 1, 0, { ...json.comment, like_count: 0, liked: false })
          return newList
        })
        setReplyText("")
        setReplyingTo(null)
        setComments((c) => c + 1)
      }
    } catch (err) {
      // ignore
    }
  }

  // Map of comments by id for quick parent lookup when rendering replies
  const commentById = useMemo(() => new Map<string, Comment>(commentList.map(c => [c.id, c])), [commentList])

  const renderComment = (c: Comment) => {
    const parent = c.parent_id ? commentById.get(c.parent_id) : undefined
    return (
      <div
        key={c.id}
        className={`flex flex-col gap-2 p-3 transition-all duration-200 ${
          (c as any).depth > 0 ? 'ml-8' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <Link href={`/profile/${c.profiles?.username}`}>
            <Avatar className="h-8 w-8 border border-[#D4AF37]/30 cursor-pointer hover:opacity-80 transition-all duration-200">
              <AvatarImage src={c.profiles?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                {(c.profiles?.full_name || `@${c.profiles?.username}` || "?")[0]}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/profile/${c.profiles?.username}`} className="hover:opacity-80 transition-all duration-200">
                <span className="font-semibold text-[#D4AF37] text-sm">
                  {c.profiles?.full_name || `@${c.profiles?.username}`}
                </span>
              </Link>
              {c.parent_id && parent ? (
                <span className="text-xs text-[#D4AF37]/50 ml-2">respondiendo a <Link href={`/profile/${parent.profiles?.username}`} className="hover:opacity-80 transition-all duration-200"><span className="font-semibold text-[#D4AF37]">{parent.profiles?.full_name || `@${parent.profiles?.username}`}</span></Link> <span className="ml-2">{formatDate(c.created_at)}</span></span>
              ) : (
                <span className="text-xs text-[#D4AF37]/50">{formatDate(c.created_at)}</span>
              )}

              {/* Three-dot popover in header - only visible for the comment owner */}
              {isOwner(c) && (
                <div className="ml-auto">
                  <Popover>
                    <PopoverTrigger>
                      <button aria-label="Mostrar opciones" className="p-1 rounded-full text-[#D4AF37]/60 hover:text-[#D4AF37]">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="flex flex-col">
                        <>
                          <button className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-[#D4AF37]/5 rounded" onClick={() => { setEditingId(c.id); setEditingText(c.content) }}><Edit3 className="h-4 w-4" /> Editar</button>
                          <button
                            className="flex items-center gap-2 px-2 py-1 text-sm text-red-400 hover:bg-red-400/5 rounded mt-1"
                            onClick={() => handleCommentDelete(c.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Eliminar
                          </button>
                        </>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            {/* Comment content or inline edit */}
            {editingId === c.id ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="flex-1 rounded-full bg-black/40 border border-[#D4AF37]/20 px-3 py-1 text-sm text-[#D4AF37] placeholder:text-[#D4AF37]/50 focus:border-[#D4AF37]/50 focus:outline-none"
                />
                <button className="rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-semibold text-black hover:bg-[#C9A961] transition-colors" onClick={async () => { const ok = await saveEdit(c.id, editingText); if (ok) { setEditingId(null); setEditingText('') } }}>Guardar</button>
                <button
                  className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] px-2 py-1 rounded-full hover:bg-[#D4AF37]/10 transition-all duration-200"
                  onClick={() => { setEditingId(null); setEditingText('') }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-[#D4AF37]/90 leading-relaxed">{c.content}</p>
                {/* secondary popover removed; header popover provides the options */}
              </div>
            )}
            <div className="flex items-center gap-4 text-xs">
              <button
                className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 ${
                  c.liked
                    ? "text-red-400 bg-red-400/10"
                    : "text-[#D4AF37]/70 hover:text-red-400 hover:bg-red-400/10"
                } ${c.liking ? 'opacity-50' : ''}`}
                onClick={() => handleCommentLike(c.id)}
                disabled={c.liking}
              >
                <Heart className={`h-3 w-3 ${c.liked ? "fill-current" : ""}`} />
                <span>{c.like_count ?? 0}</span>
              </button>
              <button
                className="text-[#D4AF37]/70 hover:text-[#D4AF37] px-2 py-1 rounded-full hover:bg-[#D4AF37]/10 transition-all duration-200"
                onClick={() => setReplyingTo(c.id)}
              >
                Responder
              </button>
              {isOwner(c) && (
                <button
                  className="text-red-400/70 hover:text-red-400 px-2 py-1 rounded-full hover:bg-red-400/10 transition-all duration-200"
                  onClick={() => handleCommentDelete(c.id)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>

        {replyingTo === c.id && (
          <div className="ml-11 flex items-center gap-2 mt-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escribe una respuesta..."
              className="flex-1 rounded-full bg-black/40 border border-[#D4AF37]/20 px-3 py-1 text-sm text-[#D4AF37] placeholder:text-[#D4AF37]/50 focus:border-[#D4AF37]/50 focus:outline-none"
            />
            <button
              className="rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-semibold text-black hover:bg-[#C9A961] transition-colors"
              onClick={() => handleReplySubmit(c.id)}
            >
              Responder
            </button>
            <button
              className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] px-2 py-1 rounded-full hover:bg-[#D4AF37]/10 transition-all duration-200"
              onClick={() => setReplyingTo(null)}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="group overflow-hidden border-0 bg-gradient-to-br from-black/90 via-black/95 to-black/90 backdrop-blur-sm shadow-2xl shadow-[#D4AF37]/5 transition-all duration-300 hover:shadow-[#D4AF37]/10 hover:scale-[1.02] rounded-3xl w-full relative">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4AF37]/5 via-[#D4AF37]/30 to-[#D4AF37]/5"></div>
      <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4AF37]/5 via-[#D4AF37]/30 to-[#D4AF37]/5"></div>
      {/* Header con perfil del creador */}
  <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <Link href={`/profile/${creator.username}`} className="block">
              <Avatar className="h-10 w-10 border-2 border-[#D4AF37]/40 shadow-md shadow-[#D4AF37]/15">
                <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#D4AF37] font-bold text-base">
                  {creator.name[0]}
                </AvatarFallback>
              </Avatar>
            </Link>
            {isSubscribed && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#D4AF37] border-2 border-black flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-black"></div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${creator.username}`} className="hover:opacity-80 transition-all duration-200">
                <p className="font-bold text-base text-[#D4AF37] hover:text-[#F4BF37] transition-colors">
                  {creator.name}
                </p>
                <p className="text-sm text-[#D4AF37]/70 hover:text-[#D4AF37]/90 transition-colors">@{creator.username}</p>
              </Link>
              {content.type === "locked" && (
                <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 px-3 py-1 border border-[#D4AF37]/30">
                  <Lock className="h-3 w-3 text-[#D4AF37]" />
                  <span className="text-xs font-semibold text-[#D4AF37]">Premium</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Use centralized FollowButton component - only show when not subscribed */}
          <div className="flex items-center gap-2">
            {!isSubscribed && creatorProfileId && (
              <FollowButton 
                userId={creatorProfileId}
                className="font-semibold px-3 py-1.5 rounded-full shadow-md shadow-[#D4AF37]/25 transition-all duration-200 hover:scale-105"
              />
            )}

            {/* Non-functional subscription price button (display only) */}
            {creatorProfileId && subscriptionPrice != null && content.type === 'locked' && (
              <button
                type="button"
                className="bg-[#D4AF37] text-black px-3 py-1.5 rounded-full font-semibold hover:bg-[#C9A961] transition-all duration-200"
                onClick={(e) => {
                  // Intentionally no functionality for now; prevent propagation
                  e.stopPropagation()
                }}
                aria-label={`Precio de suscripción ${subscriptionPrice}`}
              >
                ${subscriptionPrice}/mes
              </button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#D4AF37]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      {/* Contenido principal */}
      <CardContent className="p-0 relative">
        {content.type === "locked" ? (
          <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] bg-gradient-to-br from-[#D4AF37]/10 via-black/50 to-black/80 flex items-center justify-center max-h-[820px] sm:max-h-[720px]">
            <div className="absolute inset-0 bg-[url('/placeholder.jpg')] bg-cover bg-center opacity-20 blur-sm"></div>
            <div className="relative z-10 text-center px-6 py-8 sm:px-8 sm:py-12">
              <div className="mb-6 inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border-2 border-[#D4AF37]/40">
                <Lock className="h-10 w-10 text-[#D4AF37]" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-[#D4AF37]">Contenido Exclusivo</h3>
              <p className="mb-6 text-[#D4AF37]/80 text-lg max-w-sm mx-auto leading-relaxed">
                Suscríbete para desbloquear este contenido premium y acceder a todo el material exclusivo
              </p>
              {/* Botón de desbloqueo removido según solicitud */}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
        ) : content.type === "video" ? (
          <div className="relative w-full flex items-center justify-center bg-black">
            {!mediaLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 to-black/20">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            )}
            <video
              controls
              controlsList="nodownload"
              autoPlay={autoplay}
              loop
              muted
              preload="metadata"
              onLoadedData={() => setMediaLoaded(true)}
              className={`max-h-[520px] sm:max-h-[600px] w-full h-auto object-contain object-center transition-transform duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0' } group-hover:scale-105 video-gold-controls`}
              playsInline
              poster={content.highResUrl}
            >
              {content.videoSources && content.videoSources.length > 0 ? (
                // Priorizar la fuente con mayor resolución (si se proporciona)
                content.videoSources
                  .slice()
                  .sort((a, b) => (b.resolution || 0) - (a.resolution || 0))
                  .map((vs, idx) => (
                    <source key={idx} src={vs.src} type={vs.type || 'video/mp4'} />
                  ))
              ) : (
                content.url ? <source src={content.url} /> : null
              )}
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        ) : (
          <div className="relative w-full flex items-center justify-center bg-black">
            {!mediaLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 to-black/20">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            )}
            {content.highResUrl ? (
                <Image
                  src={content.highResUrl}
                  alt="Post content"
                  width={1920}
                  height={1080}
                  onLoadingComplete={() => setMediaLoaded(true)}
                  className={`max-h-[420px] sm:max-h-[500px] w-full h-auto object-contain object-center transition-transform duration-500 ${mediaLoaded ? 'opacity-100' : 'opacity-0' } group-hover:scale-105`}
                  sizes="(max-width: 640px) 100vw, 1200px"
                  priority={false}
                />
            ) : (
              <img
                src={content.url || "/placeholder.svg?height=600&width=600"}
                alt="Post content"
                onLoad={() => setMediaLoaded(true)}
                className={`max-h-[520px] sm:max-h-[600px] w-full h-auto object-contain object-center transition-transform duration-500 ${mediaLoaded ? 'opacity-100' : 'opacity-0' } group-hover:scale-105`}
                loading="lazy"
              />
                )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
      </CardContent>
      {/* Creator card: mostrar información del creador encima de las acciones (likes/comments) */}
      <div className="w-full px-6 pb-4">
        <div className="-mx-6">
          <CreatorCard
            name={creator.name}
            username={creator.username}
            avatar={creator.avatar}
            coverImage={coverImage || content.highResUrl || content.url || "/placeholder.jpg"}
            subscribers={subscriberCount ?? 0}
            isSubscribed={!!isSubscribed}
            compact={false}
            onlyFans={true}
            showMenuIcon={true}
          />
        </div>
      </div>

      {/* Footer con acciones */}
      <CardFooter className="flex-col items-start gap-4 px-6 py-4 bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
        {/* Botones de acción */}
        <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
                liked
                  ? "text-red-500 bg-red-500/10 hover:bg-red-500/20 scale-110"
                  : "text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] hover:scale-105"
              }`}
            >
              <Heart className={`h-4 w-4 transition-all duration-200 ${liked ? "fill-current animate-pulse" : ""}`} />
              <span className="font-semibold">{likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-3 py-1.5 rounded-full text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] hover:scale-105 transition-all duration-200"
              onClick={async () => {
                const next = !showComments
                setShowComments(next)
                if (next && commentList.length === 0) {
                  await loadComments(true)
                }
              }}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-semibold">{comments}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-3 py-1.5 rounded-full text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] hover:scale-105 transition-all duration-200"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-full transition-all duration-200 ${
              bookmarked
                ? "text-[#D4AF37] bg-[#D4AF37]/10 scale-110"
                : "text-[#D4AF37]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:scale-105"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>

        {/* Descripción del post */}
        {content.description && (
          <div className="w-full">
            <p className="text-[#D4AF37]/90 leading-relaxed text-sm">{content.description}</p>
          </div>
        )}
      </CardFooter>

      {/* Sección de comentarios */}
      {showComments && (
        <div className="border-t border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 to-transparent">
          {/* Formulario para nuevo comentario */}
          <div className="px-6 py-4 border-b border-[#D4AF37]/10">
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border-2 border-[#D4AF37]/30">
                <AvatarImage src={currentUserAvatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs">Tú</AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="w-full rounded-full bg-black/40 border border-[#D4AF37]/20 px-4 py-2 pr-20 text-sm text-[#D4AF37] placeholder:text-[#D4AF37]/50 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={commenting || !commentText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4BF37] px-4 py-1 text-xs font-bold text-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200"
                >
                  {commenting ? "..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de comentarios - UN SOLO CONTENEDOR */}
          <div className="px-6 py-4 max-h-80 overflow-y-auto scrollbar-hide space-y-3">
            {loadingComments && commentList.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            ) : commentList.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-[#D4AF37]/30 mx-auto mb-3" />
                <p className="text-[#D4AF37]/60">Sé el primero en comentar</p>
              </div>
            ) : (
              commentList.map(renderComment)
            )}
          </div>
        </div>
      )}
      <div className="relative w-full h-1">
        <div className="absolute left-0 bottom-0 w-1 h-4 bg-[#D4AF37]/20"></div>
        <div className="absolute right-0 bottom-0 w-1 h-4 bg-[#D4AF37]/20"></div>
      </div>
    </Card>
  )
}