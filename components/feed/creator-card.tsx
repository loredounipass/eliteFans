import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown } from "lucide-react"

interface CreatorCardProps {
  name: string
  username: string
  avatar: string
  coverImage: string
  subscribers: number
  isSubscribed?: boolean
}

export function CreatorCard({
  name,
  username,
  avatar,
  coverImage,
  subscribers,
  isSubscribed = false,
}: CreatorCardProps) {
  return (
    <Card className="overflow-hidden border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40">
      <Link href={`/profile/${username}`}>
        <div className="relative h-10">
          <Image src={coverImage || "/placeholder.svg"} alt={`${name} cover`} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        </div>
      </Link>
      <CardContent className="relative -mt-4 space-y-1 p-2">
        <Link href={`/profile/${username}`} className="block hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8 border-2 border-black">
            <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
            <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">{name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link href={`/profile/${username}`} className="hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm text-[#D4AF37]">{name}</p>
              <Crown className="h-3 w-3 text-[#D4AF37]" />
            </div>
            <p className="text-xs text-[#D4AF37]/60">@{username}</p>
          </Link>
          <p className="mt-1 text-xs text-[#D4AF37]/50">{subscribers.toLocaleString()} suscriptores</p>
        </div>
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
      </CardContent>
    </Card>
  )
}
