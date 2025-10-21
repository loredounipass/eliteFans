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
  compact?: boolean
}

export function CreatorCard({
  name,
  username,
  avatar,
  coverImage,
  subscribers,
  isSubscribed = false,
  compact = false,
}: CreatorCardProps) {
  // Compact style for sidebar suggestions
  if (compact) {
    return (
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40 p-1">
        <Link href={`/profile/${username}`}>
          <div className="relative h-24 w-full rounded-lg overflow-hidden">
            <Image src={coverImage || "/placeholder.jpg"} alt={`${name} cover`} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
            <div className="absolute left-3 bottom-4 flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-black shadow-md">
                <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
                <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">{name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-[#D4AF37] leading-5">{name}</p>
                <p className="text-sm text-[#D4AF37]/60">@{username}</p>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-[#D4AF37]/20 bg-black/50 transition-all hover:border-[#D4AF37]/40">
      <Link href={`/profile/${username}`}>
        <div className="relative h-28 md:h-32 w-full">
          <Image src={coverImage || "/placeholder.jpg"} alt={`${name} cover`} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        </div>
      </Link>
      <CardContent className="relative -mt-12 px-4 pb-4 pt-2">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${username}`} className="block -mt-6">
            <Avatar className="h-12 w-12 border-2 border-black shadow-lg">
              <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
              <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">{name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <Link href={`/profile/${username}`} className="hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-[#D4AF37]">{name}</p>
                <Crown className="h-3 w-3 text-[#D4AF37]" />
              </div>
              <p className="text-xs text-[#D4AF37]/60">@{username}</p>
            </Link>
            <p className="mt-1 text-xs text-[#D4AF37]/50">{subscribers.toLocaleString()} suscriptores</p>
          </div>
        </div>
        <div className="mt-3">
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
        </div>
      </CardContent>
    </Card>
  )
}
