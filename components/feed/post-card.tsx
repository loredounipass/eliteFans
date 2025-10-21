"use client"

import type React from "react"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Lock, MoreHorizontal, Bookmark } from "lucide-react"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
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
    description: string
    likes: number
    comments: number
  }
  isSubscribed?: boolean
}

export function PostCard({ postId, creator, content, isSubscribed = false }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(content.likes)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState(content.comments)
  const [commenting, setCommenting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentList, setCommentList] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsOffset, setCommentsOffset] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [creatorProfileId, setCreatorProfileId] = useState<string | null>(null)
  const { toast } = useToast()
  const COMMENTS_PAGE = 10

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
        const targetId = await getProfileId(creator.username)
        if (targetId) setCreatorProfileId(targetId)
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
    const tempComment = {
      id: `temp-${Date.now()}`,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      profiles: { id: "me", name: "You", username: "you", avatar_url: "" },
    }
    if (showComments) setCommentList((l) => [tempComment, ...l])

    try {
      const { ok, json } = await postJson("/api/comments", { postId, text: commentText.trim() })
      if (!ok) {
        setComments(prevComments)
        if (showComments) setCommentList((l) => l.filter((c) => c.id !== tempComment.id))
      } else {
        setCommentText("")
        if (showComments && json?.comment) setCommentList((l) => [json.comment, ...l.filter((c) => c.id !== tempComment.id)])
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
        const items = j.comments as any[]
        if (reset) {
          setCommentList(items)
          setCommentsOffset(items.length)
        } else {
          setCommentList((l) => [...l, ...items])
          setCommentsOffset((o) => o + items.length)
        }
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingComments(false)
    }
  }

  const handleCommentLike = async (commentId: string) => {
    try {
      // optimistic UI: toggle locally
      setCommentList((list) => list.map((c) => (c.id === commentId ? { ...c, liking: true } : c)))
      const { ok, json } = await postJson("/api/comment-likes", { commentId })
      if (ok) setCommentList((list) => list.map((c) => (c.id === commentId ? { ...c, liked: json.action === "liked", like_count: json.like_count ?? c.like_count } : c)))
    } catch (err) {
      // ignore
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

  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return
    try {
      const { ok, json } = await postJson("/api/comments", { postId, text: replyText.trim(), parentId })
      if (ok && json?.comment) {
        setCommentList((l) => {
          const idx = l.findIndex((c) => c.id === parentId)
          if (idx === -1) return [json.comment, ...l]
          const copy = [...l]
          copy.splice(idx + 1, 0, json.comment)
          return copy
        })
        setReplyText("")
        setReplyingTo(null)
        setComments((c) => c + 1)
      }
    } catch (err) {
      // ignore
    }
  }

  return (
    <Card className="group overflow-hidden border-0 bg-gradient-to-br from-black/90 via-black/95 to-black/90 backdrop-blur-sm shadow-2xl shadow-[#D4AF37]/5 transition-all duration-300 hover:shadow-[#D4AF37]/10 hover:scale-[1.02] rounded-3xl">
      {/* Header con perfil del creador */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4 bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <Link href={`/profile/${creator.username}`} className="block">
              <Avatar className="h-12 w-12 border-3 border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/20">
                <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#D4AF37] font-bold text-lg">
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
          {!isSubscribed && creatorProfileId && (
            <FollowButton 
              userId={creatorProfileId}
              className="font-semibold px-6 py-2 rounded-full shadow-lg shadow-[#D4AF37]/30 transition-all duration-200 hover:scale-105"
            />
          )}
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
          <div className="relative min-h-[400px] bg-gradient-to-br from-[#D4AF37]/10 via-black/50 to-black/80 flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('/placeholder.jpg')] bg-cover bg-center opacity-20 blur-sm"></div>
            <div className="relative z-10 text-center px-8 py-12">
              <div className="mb-6 inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border-2 border-[#D4AF37]/40">
                <Lock className="h-10 w-10 text-[#D4AF37]" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-[#D4AF37]">Contenido Exclusivo</h3>
              <p className="mb-6 text-[#D4AF37]/80 text-lg max-w-sm mx-auto leading-relaxed">
                Suscríbete para desbloquear este contenido premium y acceder a todo el material exclusivo
              </p>
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#F4BF37] text-black hover:from-[#C9A961] hover:to-[#D4AF37] font-bold px-8 py-3 rounded-full shadow-xl shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-110">
                Desbloquear Ahora
              </Button>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
        ) : content.type === "video" ? (
          <div className="relative w-full overflow-hidden bg-black group">
            <video
              src={content.url}
              controls
              controlsList="nodownload"
              autoPlay
              loop
              muted
              preload="metadata"
              className="w-full h-auto max-h-[600px] object-contain transition-transform duration-300 group-hover:scale-105 video-gold-controls"
              playsInline
            >
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        ) : (
          <div className="relative w-full overflow-hidden bg-black group">
            <Image
              src={content.url || "/placeholder.svg?height=600&width=600"}
              alt="Post content"
              width={600}
              height={600}
              className="w-full h-auto max-h-[600px] object-contain transition-transform duration-500 group-hover:scale-105"
              style={{ width: "100%", height: "auto" }}
              sizes="(max-width: 640px) 100vw, 600px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
      </CardContent>

      {/* Footer con acciones */}
      <CardFooter className="flex-col items-start gap-4 px-6 py-4 bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
        {/* Botones de acción */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                liked
                  ? "text-red-500 bg-red-500/10 hover:bg-red-500/20 scale-110"
                  : "text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] hover:scale-105"
              }`}
            >
              <Heart className={`h-5 w-5 transition-all duration-200 ${liked ? "fill-current animate-pulse" : ""}`} />
              <span className="font-semibold">{likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-4 py-2 rounded-full text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] hover:scale-105 transition-all duration-200"
              onClick={async () => {
                const next = !showComments
                setShowComments(next)
                if (next && commentList.length === 0) {
                  await loadComments(true)
                }
              }}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">{comments}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-4 py-2 rounded-full text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] hover:scale-105 transition-all duration-200"
            >
              <Share2 className="h-5 w-5" />
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
            <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
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
                <AvatarImage src="/placeholder.svg" />
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

          {/* Lista de comentarios */}
          <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-4">
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
              commentList.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 p-3 rounded-2xl bg-black/30 border border-[#D4AF37]/10 hover:bg-black/40 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border border-[#D4AF37]/30">
                      <AvatarImage src={c.profiles?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                        {(c.profiles?.full_name || `@${c.profiles?.username}` || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#D4AF37] text-sm">
                          {c.profiles?.full_name || `@${c.profiles?.username}`}
                        </span>
                        <span className="text-xs text-[#D4AF37]/50">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-[#D4AF37]/90 leading-relaxed mb-2">{c.content}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <button
                          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 ${
                            c.liked
                              ? "text-red-400 bg-red-400/10"
                              : "text-[#D4AF37]/70 hover:text-red-400 hover:bg-red-400/10"
                          }`}
                          onClick={() => handleCommentLike(c.id)}
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
                        {c.profiles?.id === "me" && (
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
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  )
}