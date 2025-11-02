"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, DollarSign, Lock, MoreHorizontal, Bookmark, MoreVertical, Edit3, Trash2 } from "lucide-react"
import { useTranslation } from 'react-i18next'
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
    highResUrl?: string
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
  depth?: number
}

export function PostCard({ postId, creator, content, isSubscribed = false, autoplay = false, subscriptionPrice }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const [likes, setLikes] = useState(content.likes)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState(content.comments)
  const [commenting, setCommenting] = useState(false)
  const [liking, setLiking] = useState(false)
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
  const { t } = useTranslation()
  // PEQUEÑOS AUXILIARES: FUNCIONES DE UTILIDAD PARA MANTENER EL RENDER COMPACTO
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "")


  // DETERMINAR PROPIEDAD: DEVUELVE TRUE SI EL COMENTARIO PERTENECE AL USUARIO ACTUAL O ES OPTIMISTA
  const isOwner = (c: Comment) => {
    const pid = c.profiles?.id
    if (!pid) return false
    return (currentUserId && pid === currentUserId) || String(pid).startsWith("temp-")
  }


  // PARSEAR CONTENIDO: TRANSFORMA TEXTO EN NODOS REACT, ENLACES Y MENCCIONES
  const parseContentToNodes = (text?: string | null) => {
    if (!text) return null
    const nodes: React.ReactNode[] = []
    const regex = /(@[A-Za-z0-9_]+)|(https?:\/\/[^\s]+)/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    let idx = 0

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index
      if (lastIndex < matchIndex) {
        nodes.push(text.slice(lastIndex, matchIndex))
      }

      if (match[1]) {
    
        const username = match[1].slice(1)
        nodes.push(
          <Link key={`mention-${idx}`} href={`/profile/${username}`} className="text-sky-400 hover:underline">
            {`@${username}`}
          </Link>
        )
      } else if (match[2]) {
        
        const url = match[2]
        nodes.push(
          <a key={`url-${idx}`} href={url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
            {url}
          </a>
        )
      }

      lastIndex = matchIndex + match[0].length
      idx += 1
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex))
    }

    
    return nodes.map((n, i) => (typeof n === "string" ? <span key={`text-${i}`}>{n}</span> : n))
  }

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



  // POST JSON: AUXILIAR PARA PETICIONES JSON (POST/PATCH/DELETE)
  const postJson = async (url: string, body?: any, method = "POST") => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, json }
  }



  // OBTENER PROFILE ID: CONSULTA SUPABASE PARA OBTENER ID POR USERNAME
  const getProfileId = async (username: string) => {
    const supabase = getSupabaseBrowserClient()
    const profileRes = await supabase.from("profiles").select("id").eq("username", username).maybeSingle()
    return (profileRes.data as any)?.id ?? null
  }



  // EFECTO: OBTIENE ESTADO DE 'LIKE' Y CUENTA AL CARGAR EL POST
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



  // EFECTO: CARGA USUARIO ACTUAL Y DATOS DEL CREADOR (AVATAR, SUBSCRIBER COUNT)
  useEffect(() => {
    let mounted = true
    const supabase = getSupabaseBrowserClient()

    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUserId(user.id)

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
          }
        }
      } catch (err) {
      }
    })()

    return () => {
      mounted = false
    }
  }, [creator.username])



  // MANEJAR LIKE: GESTIONA LIKE OPTIMISTA Y SINCRONIZA CON API
  const handleLike = async () => {
    if (liking) return
    setLiking(true)
    const prevLiked = liked
    const prevLikes = likes
    setLiked((s) => !s)
    setLikes((l) => (prevLiked ? Math.max(0, l - 1) : l + 1))
    try {
      const { ok, json } = await postJson("/api/likes", { postId })
      if (!ok) {
        setLiked(prevLiked)
        setLikes(prevLikes)
        return
      }
      if (json.like_count != null) {
        const newCount = Number(json.like_count)
        setLikes(newCount)
        try {
          window.dispatchEvent(new CustomEvent("likes:changed", { detail: { profileId: creatorProfileId, like_count: newCount } }))
        } catch (e) {
        }
      }
      else if (json.action === "already_liked") setLiked(true)
      else if (json.action === "unliked") setLiked(false)
    } catch (e) {
      setLiked(prevLiked)
      setLikes(prevLikes)
    } finally {
      setLiking(false)
    }
  }



  // ENVIAR COMENTARIO: MANEJA EL ENVÍO, AÑADE OPTIMISMO Y SINCRONIZA CON SERVIDOR
  const handleCommentSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!commentText.trim()) return
    setCommenting(true)
    const prevComments = comments
    setComments((c) => c + 1)
    const tempId = `temp-${Date.now()}`
    const tempComment: Comment = {
      id: tempId,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      profiles: { id: tempId, username: "you", full_name: "You", avatar_url: "" },
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
        if (json && typeof json.comment_count === 'number') {
          setComments(Number(json.comment_count))
        }
        if (showComments && json?.comment) {
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



  // CARGAR COMENTARIOS: OBTIENE COMENTARIOS PAGINADOS Y SU INFORMACIÓN DE LIKES
  const loadComments = async (reset = false) => {
    if (!postId) return
    setLoadingComments(true)
    try {
      const offset = reset ? 0 : commentsOffset
      const q = `/api/comments?postId=${encodeURIComponent(postId)}&offset=${offset}`
      const r = await fetch(q)
      const j = await r.json().catch(() => ({}))
      if (r.ok && j?.comments) {
        const items = j.comments as Comment[]
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
    } finally {
      setLoadingComments(false)
    }
  }



  // ORGANIZAR RESPUESTAS: ORGANIZA LISTA DE COMENTARIOS POSICIONANDO RESPUESTAS TRAS SUS PADRES
  const organizeCommentsWithReplies = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    comments.forEach(comment => {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        return
      } else {
        rootComments.push(commentMap.get(comment.id)!)
      }
    })

    const flatList: Comment[] = []

    const addCommentAndReplies = (comment: Comment, depth = 0) => {
      flatList.push({ ...comment, depth })
      const replies = comments.filter(c => c.parent_id === comment.id)
      replies.forEach(reply => {
        addCommentAndReplies(commentMap.get(reply.id)!, depth + 1)
      })
    }

    rootComments.forEach(comment => addCommentAndReplies(comment))

    return flatList
  }



  // LIKE DE COMENTARIO: GESTIONA LIKE OPTIMISTA PARA UN COMENTARIO
  const handleCommentLike = async (commentId: string) => {
    try {
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



  // ELIMINAR COMENTARIO: BORRA COMENTARIO Y ACTUALIZA CONTADOR
  const handleCommentDelete = async (commentId: string) => {
    try {
      const r = await fetch(`/api/comments?id=${encodeURIComponent(commentId)}`, { method: "DELETE" })
      const j = await r.json().catch(() => ({}))
      if (r.ok) {
        setCommentList((l) => l.filter((c) => c.id !== commentId))
        if (j && typeof j.comment_count === 'number') {
          setComments(Number(j.comment_count))
        } else {
          setComments((c) => Math.max(0, c - 1))
        }
      }
    } catch (err) {
    }
  }


// RESPONDER: ESTADO Y FUNCIONES PARA MANEJAR RESPUESTAS A COMENTARIOS
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")



  // ENVIAR RESPUESTA: ENVÍA UNA RESPUESTA Y LA INSERTA TRAS EL PADRE
  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return
    try {
      const { ok, json } = await postJson("/api/comments", { postId, text: replyText.trim(), parentId })
      if (ok && json?.comment) {
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
    }
  }


  
  // MAPA DE COMENTARIOS: MAPA PARA BÚSQUEDA RÁPIDA DE PADRES
  const commentById = useMemo(() => new Map<string, Comment>(commentList.map(c => [c.id, c])), [commentList])
  // RENDERIZAR COMENTARIO: RENDERIZA CADA COMENTARIO INDIVIDUAL CON OPCIONES (EDITAR, ELIMINAR, RESPONDER)
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
  // RENDERIZADO: COMPONENTE POSTCARD - HEADER, CONTENIDO, FOOTER Y SECCIÓN DE COMENTARIOS
  <Card style={{boxShadow: 'inset 0 0 24px rgba(212,175,55,0.015)'}} className="group overflow-hidden bg-gradient-to-br from-black/90 via-black/95 to-black/90 backdrop-blur-sm shadow-md shadow-[#D4AF37]/4 transition-all duration-300 hover:shadow-[#D4AF37]/6 rounded-3xl w-full relative border border-[#D4AF37]/8">
  
  <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/20 to-transparent opacity-40"></div>
  <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/20 to-transparent opacity-40"></div>
      
    {/* HEADER: INFORMACIÓN DEL CREADOR, AVATAR Y MENÚ */}
  <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
        <div className="flex items-center gap-4 flex-1">
          
          <div className="flex items-center gap-3">
            <Image src="/favicon.ico" alt="EliteFans" width={48} height={48} className="rounded-md object-cover" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#D4AF37]">EliteFans</span>
              </div>
              <p className="text-sm text-[#D4AF37]/70">@EliteFans</p>
            </div>
          </div>
          
          {content.type === "locked" && (
            <div className="ml-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 px-2 py-0.5 border border-[#D4AF37]/30">
              <Lock className="h-3 w-3 text-[#D4AF37]" />
              <span className="text-[11px] font-semibold text-[#D4AF37]">Premium</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          
          <div className="flex items-center gap-2">
            {!isSubscribed && creatorProfileId && (
              <FollowButton 
                userId={creatorProfileId}
                className="text-xs px-2 py-1 rounded-full shadow-md shadow-[#D4AF37]/25 transition-all duration-200 hover:scale-105"
              />
            )}

            
            {creatorProfileId && subscriptionPrice != null && content.type === 'locked' && (
              <button
                type="button"
                className="bg-[#D4AF37] text-black px-2 py-1 rounded-full text-xs font-semibold hover:bg-[#C9A961] transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                aria-label={`Precio de suscripción ${subscriptionPrice}`}
              >
                {t('profile_header.subscription_price_label', { price: `$${(Math.round((subscriptionPrice || 0) * 100) / 100).toFixed(2)}` })}
              </button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#D4AF37]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full"
                aria-label={t('ui.open_menu') || 'Open menu'}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const link = postId ? `${window.location.origin}/feed?postId=${encodeURIComponent(postId)}` : window.location.href
                      await navigator.clipboard.writeText(link)
                      toast({ title: t('post_card.copy_post_link'), description: t('ui.copied_to_clipboard') })
                    } catch (e) {
                      toast({ title: t('ui.copy') || 'Copy', description: String(e), variant: 'destructive' })
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded"
                >
                  {t('post_card.copy_post_link')}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      
      {/* CONTENIDO PRINCIPAL: DESCRIPCIÓN Y CONTENIDO MULTIMEDIA (LOCKED / VIDEO / IMAGEN) */}
      <CardContent className="p-0 relative">
        
        {content.description && (
          <div className="w-full px-6 py-6 border-b border-[#D4AF37]/10 mb-4">
            <p className="text-white leading-relaxed text-sm">{parseContentToNodes(content.description)}</p>
          </div>
        )}


        {/* BLOQUE LOCKED / VIDEO / IMAGEN: RENDERIZA SEGÚN EL TIPO DE CONTENIDO */}
        {content.type === "locked" ? (
          <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] bg-gradient-to-br from-[#D4AF37]/10 via-black/50 to-black/80 flex items-center justify-center max-h-[820px] sm:max-h-[720px]">
            <div className="absolute inset-0 bg-[url('/placeholder.jpg')] bg-cover bg-center opacity-20 blur-sm"></div>
            <div className="relative z-10 text-center px-6 py-8 sm:px-8 sm:py-12">
              <div className="mb-6 inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border-2 border-[#D4AF37]/40">
                <Lock className="h-10 w-10 text-[#D4AF37]" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-[#D4AF37]">{t('post_card.premium_title')}</h3>
              <p className="mb-6 text-[#D4AF37]/80 text-lg max-w-sm mx-auto leading-relaxed">
                {t('post_card.subscribe_prompt')}
              </p>
              
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
        ) : content.type === "video" ? (
          <div className="relative w-full flex items-center justify-center bg-black">


            {/* BLOQUE VIDEO: REPRODUCTOR DE VIDEO, POSTER Y FUENTES */}
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
              className={`max-h-[520px] sm:max-h-[600px] w-full h-auto object-contain object-center transition-transform duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0' } video-gold-controls`}
              playsInline
              poster={content.highResUrl}
            >
              {content.videoSources && content.videoSources.length > 0 ? (
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

            {/* BLOQUE IMAGEN: IMAGEN PRINCIPAL CON POSTER Y MANEJO DE CARGA */}
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
                  className={`max-h-[360px] sm:max-h-[480px] w-full h-auto object-contain object-center transition-transform duration-500 ${mediaLoaded ? 'opacity-100' : 'opacity-0' }`}
                  sizes="(max-width: 640px) 100vw, 1200px"
                  priority={false}
                />
            ) : (
              <img
                src={content.url || "/placeholder.svg?height=600&width=600"}
                alt="Post content"
                onLoad={() => setMediaLoaded(true)}
                  className={`max-h-[400px] sm:max-h-[520px] w-full h-auto object-contain object-center transition-transform duration-500 ${mediaLoaded ? 'opacity-100' : 'opacity-0' }`}
                loading="lazy"
              />
                )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
      </CardContent>
      
      
      {/* CREATOR CARD: TARJETA CON INFORMACIÓN DEL CREADOR Y COVER */}
      <div className="w-full px-6 pb-4">
        <div className="-mx-6">
          <CreatorCard
            name={creator.name}
            username={creator.username}
            avatar={creator.avatar}
            coverImage={coverImage || content.highResUrl || content.url || "/placeholder.jpg"}
            coverRounded={true}
            subscribers={subscriberCount ?? 0}
            isSubscribed={!!isSubscribed}
            compact={false}
            onlyFans={true}
            showMenuIcon={true}
          />
        </div>
      </div>

      
        {/* FOOTER: ACCIONES PRINCIPALES (LIKE, COMENTARIOS, TIP, GUARDAR) */}
        <CardFooter className="flex-col items-start gap-4 px-6 py-4 bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
        
        <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={liking}
              aria-disabled={liking}
              className={`gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
                liked
                  ? "text-red-500 bg-red-500/10 hover:bg-red-500/20 scale-110"
                  : "text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] hover:scale-105"
              } ${liking ? 'opacity-50 pointer-events-none' : ''}`}
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
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F4BF37] hover:scale-105 transition-all duration-200"
            >
              <span className="rounded-full bg-[#D4AF37]/10 p-2">
                <DollarSign className="h-4 w-4 text-[#D4AF37]" />
              </span>
              <span className="font-semibold text-sm">{t('ui.send_tip')}</span>
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

        
      </CardFooter>

      
      {/* COMENTARIOS: FORMULARIO Y LISTA DE COMENTARIOS */}
      {showComments && (
        <div className="border-t border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 to-transparent">
          
          {/* FORMULARIO DE COMENTARIO: INPUT DEL USUARIO PARA CREAR UN COMENTARIO */}
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

          
          {/* LISTA DE COMENTARIOS: RENDERIZA COMENTARIOS, INDICADOR DE CARGA O MENSAJE VACÍO */}
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
        
        <div className="absolute left-0 bottom-0 w-px h-3 rounded-full bg-[#D4AF37]/20 opacity-40"></div>
        <div className="absolute right-0 bottom-0 w-px h-3 rounded-full bg-[#D4AF37]/20 opacity-40"></div>
      </div>
    </Card>
  )
}