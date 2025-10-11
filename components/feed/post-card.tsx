"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Lock } from "lucide-react"

interface PostCardProps {
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

export function PostCard({ creator, content, isSubscribed = false }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(content.likes)

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1)
    } else {
      setLikes(likes + 1)
    }
    setLiked(!liked)
  }

  return (
    <Card className="overflow-hidden border-[#D4AF37]/20 bg-black/50">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <Link
          href={`/profile/${creator.username}`}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10 border-2 border-[#D4AF37]/30">
            <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
            <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">{creator.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-[#D4AF37]">{creator.name}</p>
            <p className="text-sm text-[#D4AF37]/60">@{creator.username}</p>
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
          <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#D4AF37]/10 to-transparent">
            <div className="text-center">
              <Lock className="mx-auto mb-4 h-16 w-16 text-[#D4AF37]/50" />
              <p className="mb-2 text-lg font-semibold text-[#D4AF37]">Contenido Exclusivo</p>
              <p className="mb-4 text-sm text-[#D4AF37]/70">Suscríbete para desbloquear</p>
              <Button className="bg-[#D4AF37] text-black hover:bg-[#C9A961]">Suscribirse Ahora</Button>
            </div>
          </div>
        ) : (
          <div className="relative aspect-square">
            <Image
              src={content.url || "/placeholder.svg?height=600&width=600"}
              alt="Post content"
              fill
              className="object-cover"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-3 p-4">
        <div className="flex w-full items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-2 ${liked ? "text-red-500" : "text-[#D4AF37]"} hover:bg-[#D4AF37]/10`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            <span>{likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-[#D4AF37] hover:bg-[#D4AF37]/10">
            <MessageCircle className="h-5 w-5" />
            <span>{content.comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto text-[#D4AF37] hover:bg-[#D4AF37]/10">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-sm text-[#D4AF37]/80">{content.description}</p>
      </CardFooter>
    </Card>
  )
}
