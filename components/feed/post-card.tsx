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

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId: postId, text: commentText.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setComments(prevComments)
      } else {
        setCommentText("")
        // Optionally use returned comment (json.comment)
      }
    } catch (err) {
      setComments(prevComments)
    } finally {
      setCommenting(false)
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
          <Button variant="ghost" size="sm" className="gap-2 text-[#D4AF37] hover:bg-[#D4AF37]/10">
            <MessageCircle className="h-4 w-4" />
            <span>{comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto text-[#D4AF37] hover:bg-[#D4AF37]/10">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-[#D4AF37]/80 line-clamp-2">{content.description}</p>
      </CardFooter>
    </Card>
  )
}
