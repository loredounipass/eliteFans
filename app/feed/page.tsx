"use client"

import { PrivateRoute } from "@/components/auth/private-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { PostCard } from "@/components/feed/post-card"
import { CreatorCard } from "@/components/feed/creator-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function FeedPage() {
  // Mock data - in production this would come from Supabase
  const posts = [
    {
      creator: {
        name: "Sofia Martinez",
        username: "sofia_elite",
        avatar: "/diverse-woman-portrait.png",
      },
      content: {
        type: "image" as const,
        url: "/diverse-fashion-collection.png",
        description: "Nueva sesión de fotos exclusiva para mis suscriptores ✨",
        likes: 1234,
        comments: 89,
      },
      isSubscribed: true,
    },
    {
      creator: {
        name: "Carlos Fitness",
        username: "carlos_fit",
        avatar: "/man.jpg",
      },
      content: {
        type: "locked" as const,
        description: "Rutina completa de entrenamiento - Solo para suscriptores",
        likes: 567,
        comments: 34,
      },
      isSubscribed: false,
    },
    {
      creator: {
        name: "Luna Art",
        username: "luna_creates",
        avatar: "/diverse-artists-studio.png",
      },
      content: {
        type: "image" as const,
        url: "/abstract-fluid-art.png",
        description: "Proceso creativo de mi última obra 🎨",
        likes: 892,
        comments: 56,
      },
      isSubscribed: true,
    },
  ]

  const suggestedCreators = [
    {
      name: "Ana Lifestyle",
      username: "ana_life",
      avatar: "/diverse-group-relaxing.png",
      coverImage: "/diverse-group-relaxing.png",
      subscribers: 45600,
      isSubscribed: false,
    },
    {
      name: "Miguel Chef",
      username: "miguel_cocina",
      avatar: "/diverse-chef-preparing-food.png",
      coverImage: "/diverse-food-spread.png",
      subscribers: 32100,
      isSubscribed: false,
    },
    {
      name: "Elena Yoga",
      username: "elena_zen",
      avatar: "/woman-in-nature-yoga.png",
      coverImage: "/woman-in-nature-yoga.png",
      subscribers: 28900,
      isSubscribed: false,
    },
  ]

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="mb-4 text-3xl font-bold text-[#D4AF37]">Explorar</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#D4AF37]/50" />
              <Input
                placeholder="Buscar creadores..."
                className="border-[#D4AF37]/30 bg-black/50 pl-10 text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList className="border-[#D4AF37]/20 bg-black/50">
              <TabsTrigger
                value="feed"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[#D4AF37]"
              >
                Feed
              </TabsTrigger>
              <TabsTrigger
                value="discover"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-[#D4AF37]"
              >
                Descubrir
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {posts.map((post, index) => (
                  <PostCard key={index} {...post} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="discover" className="space-y-6">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-[#D4AF37]">Creadores Sugeridos</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedCreators.map((creator, index) => (
                    <CreatorCard key={index} {...creator} />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-semibold text-[#D4AF37]">Contenido Popular</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  {posts.slice(0, 2).map((post, index) => (
                    <PostCard key={index} {...post} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PrivateRoute>
  )
}
