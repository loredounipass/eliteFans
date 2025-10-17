import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { deletePost } from "@/lib/actions/delete-post"

interface Post {
  id: string
  media_urls: string[] | null
  content: string | null
  created_at: string
}

interface MyGalleryProps {
  posts: Post[]
}

export function MyGallery({ posts }: MyGalleryProps) {
  if (posts.length === 0) {
    return <p className="text-center text-muted-foreground">No hay publicaciones aún.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {posts.map((post) => (
        <div key={post.id} className="relative">
          <Card className="overflow-hidden border-[#D4AF37]/20 bg-black/50">
            <CardContent className="p-0 aspect-square relative">
              {post.media_urls && post.media_urls.length > 0 ? (
                post.media_urls.length > 1 ? (
                  <Carousel className="w-full h-full">
                    <CarouselContent>
                      {post.media_urls.map((url, index) => (
                        <CarouselItem key={index}>
                          <div className="relative h-full w-full">
                            {url.endsWith('.mp4') || url.endsWith('.mov') ? (
                              <video src={url} controls className="h-full w-full object-cover" />
                            ) : (
                              <Image src={url} alt={post.content || 'Publicación'} fill className="object-cover" />
                            )}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                ) : (
                  <div className="relative h-full w-full">
                    {post.media_urls[0].endsWith('.mp4') || post.media_urls[0].endsWith('.mov') ? (
                      <video src={post.media_urls[0]} controls className="h-full w-full object-cover" />
                    ) : (
                      <Image src={post.media_urls[0]} alt={post.content || 'Publicación'} fill className="object-cover" />
                    )}
                  </div>
                )
              ) : (
                <div className="h-full w-full bg-gray-800 flex items-center justify-center">
                  <p className="text-white">No media</p>
                </div>
              )}
            </CardContent>
          </Card>
          {post.content && (
            <p className="mt-2 text-sm text-[#D4AF37]/80">{post.content}</p>
          )}
          <form action={deletePost} className="absolute top-2 right-2">
            <input type="hidden" name="postId" value={post.id} />
            <Button type="submit" variant="destructive" size="sm">
              Eliminar
            </Button>
          </form>
        </div>
      ))}
    </div>
  )
}