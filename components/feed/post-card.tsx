"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Lock } from "lucide-react"
import { useEffect } from "react"

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
  const COMMENTS_PAGE = 10

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

  const handleLike = () => {
    // OPTIMISTIC UI
    const prevLiked = liked
    const prevLikes = likes
    setLiked((s) => !s)
    setLikes((l) => (liked ? Math.max(0, l - 1) : l + 1))

    fetch(`/api/likes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: postId }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          // rollback
          setLiked(prevLiked)
          setLikes(prevLikes)
          return
        }

        // Ajustar basado en respuesta del servidor (like_count o action)
        if (json.like_count != null) {
          setLikes(Number(json.like_count))
        } else if (json.action === "already_liked") {
          setLiked(true)
        } else if (json.action === "unliked") {
          setLiked(false)
        }
      })
      .catch(() => {
        setLiked(prevLiked)
        setLikes(prevLikes)
      })
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
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: postId, text: commentText.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setComments(prevComments)
        if (showComments) setCommentList((l) => l.filter((c) => c.id !== tempComment.id))
      } else {
        setCommentText("")
        if (showComments && json?.comment) {
          setCommentList((l) => [json.comment, ...l.filter((c) => c.id !== tempComment.id)])
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
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}&limit=${COMMENTS_PAGE}&offset=${offset}`)
      const json = await res.json()
      if (res.ok && json?.comments) {
        const items = json.comments as any[]
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
      setCommentList((list) =>
        list.map((c) => (c.id === commentId ? { ...c, liking: true } : c)),
      )
      const res = await fetch("/api/comment-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setCommentList((list) => list.map((c) => (c.id === commentId ? { ...c, liked: json.action === "liked", like_count: json.like_count ?? c.like_count } : c)))
      }
    } catch (err) {
      // ignore
    }
  }

  const handleCommentDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments?id=${encodeURIComponent(commentId)}`, { method: "DELETE" })
      if (res.ok) {
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
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, text: replyText.trim(), parentId }),
      })
      const json = await res.json()
      if (res.ok && json?.comment) {
        // insert reply after parent
        setCommentList((l) => {
          const idx = l.findIndex((c) => c.id === parentId)
          if (idx === -1) return [json.comment, ...l]
          // insert right after parent
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
    <Card className="overflow-hidden border-[#D4AF37]/20 bg-black/50">
  <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-2 py-0.5">
        <Link
          href={`/profile/${creator.username}`}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-6 w-6 border-2 border-[#D4AF37]/30">
            <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
            <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">{creator.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-[#D4AF37]">{creator.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#D4AF37]/60">@{creator.username}</p>
              {content.type === "locked" && (
                <span className="rounded-md bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold text-[#D4AF37]">
                  Exclusivo
                </span>
              )}
            </div>
          </div>
        </Link>
        {!isSubscribed && (
          <Button size="sm" className="bg-[#D4AF37] text-black hover:bg-[#C9A961]">
            Suscribirse
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
  {content.type === "locked" ? (
            <div className="relative">
            <div className="flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/8 to-black/40 py-6">
              <div className="text-center">
                <Lock className="mx-auto mb-2 h-6 w-6 text-[#D4AF37]/60" />
                <p className="mb-1 text-sm font-semibold text-[#D4AF37]">Contenido Exclusivo</p>
                <p className="mb-2 text-xs text-[#D4AF37]/70">Suscríbete para desbloquear</p>
                <Button className="bg-[#D4AF37] text-black hover:bg-[#C9A961] text-sm">Suscribirse</Button>
              </div>
            </div>
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ) : content.type === "video" ? (
          <div className="relative w-full overflow-hidden rounded-sm aspect-[16/9] bg-black">
            <video
              src={content.url}
              controls
              preload="metadata"
              className="w-full h-full object-contain"
              playsInline
              muted
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="relative w-full overflow-hidden rounded-sm aspect-[4/3]">
            <Image
              src={content.url || "/placeholder.svg?height=600&width=600"}
              alt="Post content"
              fill
              className="object-contain object-center"
              sizes="(max-width: 640px) 100vw, 800px"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 p-1">
        <div className="flex w-full items-center gap-3">
            <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-2 ${liked ? "text-red-500" : "text-[#D4AF37]"} hover:bg-[#D4AF37]/10`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            <span>{likes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-[#D4AF37] hover:bg-[#D4AF37]/10"
            onClick={async () => {
              const next = !showComments
              setShowComments(next)
              if (next && commentList.length === 0) {
                await loadComments(true)
              }
            }}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto text-[#D4AF37] hover:bg-[#D4AF37]/10">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-[#D4AF37]/80 line-clamp-2">{content.description}</p>
      </CardFooter>
      {showComments && (
        <div className="w-full border-t border-[#D4AF37]/10 p-2">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCommentSubmit()
            }}
            className="mb-2"
          >
            <div className="relative">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="w-full rounded-md bg-black/30 px-3 py-1 pr-20 text-sm text-white"
              />
              <button
                type="submit"
                disabled={commenting}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-[#D4AF37] px-3 py-0.5 text-xs font-semibold text-black disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-2 max-h-60 overflow-auto">
            {loadingComments && commentList.length === 0 ? (
              <p className="text-xs text-[#D4AF37]/60">Cargando...</p>
            ) : commentList.length === 0 ? (
              <p className="text-xs text-[#D4AF37]/60">Sin comentarios todavía</p>
            ) : (
              commentList.map((c) => (
                <div key={c.id} className="flex flex-col gap-1">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={c.profiles?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{(c.profiles?.full_name || `@${c.profiles?.username}` || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#D4AF37] text-xs">{c.profiles?.full_name || `@${c.profiles?.username}`}</span>
                        <span className="text-xs text-[#D4AF37]/60">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-[#D4AF37]/80">{c.content}</div>
                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <button
                          className={`text-[#D4AF37] ${c.liked ? "font-semibold text-red-400" : ""}`}
                          onClick={() => handleCommentLike(c.id)}
                        >
                          ❤️ {c.like_count ?? 0}
                        </button>
                        <button className="text-[#D4AF37]" onClick={() => setReplyingTo(c.id)}>
                          Responder
                        </button>
                        {c.profiles?.id === "me" ? (
                          <button className="text-red-500" onClick={() => handleCommentDelete(c.id)}>
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {replyingTo === c.id && (
                    <div className="ml-8 mt-1 flex items-start gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribe una respuesta..."
                        className="flex-1 rounded-md bg-black/20 px-2 py-1 text-sm text-white"
                      />
                      <button className="rounded-md bg-[#D4AF37] px-3 py-0.5 text-xs text-black" onClick={() => handleReplySubmit(c.id)}>
                        Responder
                      </button>
                      <button className="text-xs text-[#D4AF37]/60" onClick={() => setReplyingTo(null)}>
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
