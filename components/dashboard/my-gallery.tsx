"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { deletePost } from "@/lib/actions/delete-post"
import { Trash2, Play, Image as ImageIcon, Calendar, Eye, Heart, MessageCircle, Sparkles, Diamond, Download } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { Badge } from "@/components/ui/badge"

interface Post {
  id: string
  media_urls: string[] | null
  content: string | null
  created_at: string
  likes_count?: number
  comments_count?: number
}

interface MyGalleryProps {
  posts: Post[]
}

export function MyGallery({ posts }: MyGalleryProps) {
  const [mounted, setMounted] = useState(false)
  const [hoveredPost, setHoveredPost] = useState<string | null>(null)

  const { t } = useTranslation()

  useEffect(() => {
    setMounted(true)
  }, [])

  const downloadMedia = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const getFileExtension = (url: string) => {
    return url.split('.').pop()?.toLowerCase() || ''
  }

  const isVideo = (url: string) => {
    const ext = getFileExtension(url)
    return ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-[#D4AF37]/60" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-[#D4AF37] animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold text-[#D4AF37] mb-4">{t('gallery.empty_title')}</h3>
        <p className="text-[#D4AF37]/70 text-lg max-w-md">{t('gallery.empty_description')}</p>
        <div className="mt-8 flex gap-2">
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#D4AF37]/3 rounded-full blur-3xl animate-bounce" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#D4AF37]/4 rounded-full blur-xl animate-pulse" />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 relative z-10">
        {posts.map((post, index) => (
          <div 
            key={post.id} 
            className={`group transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ transitionDelay: `${index * 100}ms` }}
            onMouseEnter={() => setHoveredPost(post.id)}
            onMouseLeave={() => setHoveredPost(null)}
          >
            <Card className="relative overflow-hidden border-[#D4AF37]/20 bg-black/60 backdrop-blur-sm transition-all duration-500 hover:border-[#D4AF37]/40 hover:bg-black/80 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#D4AF37]/20">
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              {/* Media content */}
              <CardContent className="p-0 aspect-square relative">
                {post.media_urls && post.media_urls.length > 0 ? (
                  post.media_urls.length > 1 ? (
                    <div className="relative h-full w-full">
                      <Carousel className="w-full h-full">
                        <CarouselContent>
                          {post.media_urls.map((url, mediaIndex) => (
                            <CarouselItem key={mediaIndex}>
                              <div className="relative h-full w-full aspect-square">
                                {isVideo(url) ? (
                                  <div className="relative h-full w-full bg-black/90 flex items-center justify-center aspect-square overflow-hidden">
                                    <video 
                                      src={url} 
                                      controls 
                                      preload="metadata"
                                      className="w-full h-full object-cover rounded-t-lg" 
                                      style={{ aspectRatio: '1/1' }}
                                      poster="/placeholder.jpg"
                                      onError={(e) => {
                                        console.error('Video loading error:', e)
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                    <div className="absolute top-4 left-4 pointer-events-none">
                                      <Badge variant="secondary" className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">
                                        <Play className="w-3 h-3 mr-1" />
                                        {t('gallery.video')}
                                      </Badge>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative h-full w-full aspect-square">
                                    <Image 
                                      src={url} 
                                      alt={post.content || t('gallery.publication')} 
                                      fill 
                                      className="object-cover rounded-t-lg transition-transform duration-500 group-hover:scale-110" 
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      onError={(e) => {
                                        console.error('Image loading error:', e)
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2 bg-black/60 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 z-30" />
                        <CarouselNext className="right-2 bg-black/60 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 z-30" />
                      </Carousel>
                      
                      {/* Multi-media indicator */}
                      <div className="absolute top-4 left-4 pointer-events-none z-20">
                        <Badge variant="secondary" className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          {post.media_urls.length}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-full w-full aspect-square">
                      {isVideo(post.media_urls[0]) ? (
                        <div className="relative h-full w-full bg-black/90 flex items-center justify-center aspect-square overflow-hidden">
                          <video 
                            src={post.media_urls[0]} 
                            controls 
                            preload="metadata"
                            className="w-full h-full object-cover rounded-t-lg" 
                            style={{ aspectRatio: '1/1' }}
                            poster="/placeholder.jpg"
                            onError={(e) => {
                              console.error('Video loading error:', e)
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div className="absolute top-4 left-4 pointer-events-none z-20">
                            <Badge variant="secondary" className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">
                              <Play className="w-3 h-3 mr-1" />
                              {t('gallery.video')}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-full w-full aspect-square">
                          <Image 
                            src={post.media_urls[0]} 
                            alt={post.content || t('gallery.publication')} 
                            fill 
                            className="object-cover rounded-t-lg transition-transform duration-500 group-hover:scale-110" 
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(e) => {
                              console.error('Image loading error:', e)
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative overflow-hidden aspect-square">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent" />
                    <div className="text-center z-10">
                      <ImageIcon className="w-12 h-12 text-[#D4AF37]/60 mx-auto mb-2" />
                      <p className="text-[#D4AF37]/60 text-sm">{t('gallery.no_media')}</p>
                    </div>
                    {/* Animated particles */}
                    <div className="absolute top-4 left-4 w-2 h-2 bg-[#D4AF37]/30 rounded-full animate-pulse" />
                    <div className="absolute bottom-6 right-6 w-1 h-1 bg-[#D4AF37]/40 rounded-full animate-ping" />
                  </div>
                )}
              </CardContent>

              {/* Content and metadata */}
              <div className="p-4 space-y-3">
                {post.content && (
                  <p className="text-sm text-[#D4AF37]/80 line-clamp-2 group-hover:text-[#D4AF37] transition-colors duration-300">
                    {post.content}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#D4AF37]/60">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(post.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {post.likes_count !== undefined && (
                      <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37]/70 text-xs">
                        <Heart className="w-3 h-3 mr-1" />
                        {post.likes_count}
                      </Badge>
                    )}
                    {post.comments_count !== undefined && (
                      <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37]/70 text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {post.comments_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="absolute top-3 right-3 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                {/* Download button */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <Button 
                    type="button"
                    variant="secondary" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (post.media_urls && post.media_urls.length > 0) {
                        const url = post.media_urls[0]
                        const filename = `elitfans_${post.id}_${Date.now()}.${getFileExtension(url)}`
                        downloadMedia(url, filename)
                      }
                    }}
                    className="bg-[#D4AF37]/80 hover:bg-[#D4AF37] text-black backdrop-blur-sm border border-[#D4AF37]/30 shadow-lg hover:shadow-[#D4AF37]/25 hover:scale-110"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Delete button */}
                <form action={deletePost} className="inline">
                  <input type="hidden" name="postId" value={post.id} />
                  <Button 
                    type="submit" 
                    variant="destructive" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    className="bg-red-600/80 hover:bg-red-600 backdrop-blur-sm border border-red-500/30 shadow-lg hover:shadow-red-500/25 hover:scale-110"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </form>
              </div>

              {/* Stats overlay - only shows in empty areas */}
              <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                <div className={`flex items-center gap-3 transition-all duration-300 ${hoveredPost === post.id ? 'opacity-100' : 'opacity-0'}`}>
                  {post.likes_count !== undefined && (
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Heart className="w-3 h-3 text-[#D4AF37]" />
                      <span className="text-xs text-[#D4AF37]">{post.likes_count}</span>
                    </div>
                  )}
                  {post.comments_count !== undefined && (
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                      <MessageCircle className="w-3 h-3 text-[#D4AF37]" />
                      <span className="text-xs text-[#D4AF37]">{post.comments_count}</span>
                    </div>
                  )}
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Eye className="w-3 h-3 text-[#D4AF37]" />
                    <span className="text-xs text-[#D4AF37]">{t('ui.view')}</span>
                  </div>
                </div>
              </div>

              {/* Decorative corner elements */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Floating particles on hover */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute top-2 right-12 w-1 h-1 bg-[#D4AF37] rounded-full animate-ping" />
                <div className="absolute bottom-16 left-2 w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse" />
                <div className="absolute top-1/2 right-2 w-1 h-1 bg-[#D4AF37] rounded-full animate-bounce" />
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Pagination or load more could go here */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full">
          <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <span className="text-[#D4AF37]/80 text-sm">{t('feed.posts_in_gallery', { count: posts.length })}</span>
          <Diamond className="w-4 h-4 text-[#D4AF37] animate-bounce" />
        </div>
      </div>
    </div>
  )
}