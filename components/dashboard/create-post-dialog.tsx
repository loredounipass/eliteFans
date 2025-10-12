"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loader2, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [price, setPrice] = useState("0")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const progressIntervalRef = useRef<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    // Validate file types — allow common video/image extensions even when MIME is missing
    const allowedImageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"]
    const allowedVideoExts = ["mp4", "mov", "mkv", "webm", "mpg", "mpeg", "avi", "m4v", "ogv", "ogg"]

    const validFiles = selectedFiles.filter((file) => {
      const type = file.type || ""
      const name = file.name || ""
      const ext = (name.split(".").pop() || "").toLowerCase()

      const isImage = type.startsWith("image/") || allowedImageExts.includes(ext)
      const isVideo = type.startsWith("video/") || allowedVideoExts.includes(ext)
      return isImage || isVideo
    })

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Archivos inválidos",
        description: "Solo se permiten imágenes y videos",
        variant: "destructive",
      })
    }

  // Client-side max size (bytes). Adjust as needed. For ~5 minute videos a good default
  // is around 250MB (depends on codec/bitrate). Change this value if your Supabase
  // plan or bucket has a different maximum.
  const MAX_UPLOAD_SIZE = 250 * 1024 * 1024 // 250 MB

    const oversized = validFiles.filter((f) => f.size > MAX_UPLOAD_SIZE)
    if (oversized.length > 0) {
      const names = oversized.map((f) => f.name).join(", ")
      toast({
        title: "Archivo demasiado grande",
        description: `Los siguientes archivos exceden el límite de ${Math.round(
            MAX_UPLOAD_SIZE / (1024 * 1024),
          )} MB: ${names}. Si necesitas subir ficheros más grandes considera hacer uploads en el servidor o usar chunked/resumable uploads.`,
        variant: "destructive",
      })
    }

    const acceptedFiles = validFiles.filter((f) => f.size <= MAX_UPLOAD_SIZE)

    // Create previews
    const newPreviews = acceptedFiles.map((file) => URL.createObjectURL(file))

    setFiles((prev) => [...prev, ...acceptedFiles])
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && files.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar contenido o archivos",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("CreatePost: current user:", user)

      if (!user) {
        throw new Error("No autenticado")
      }

      // start simulated progress
      setUploadProgress(2)
      progressIntervalRef.current = window.setInterval(() => {
        setUploadProgress((p) => {
          // increase by a random small amount until 85%
          const max = 85
          if (p >= max) return p
          const inc = Math.floor(Math.random() * 6) + 1
          return Math.min(p + inc, max)
        })
      }, 800)

      // Upload files to Blob
      const mediaUrls: string[] = []
      let mediaType: "image" | "video" | "mixed" | null = null

      // helper to add a timeout to uploads
      const uploadWithTimeout = <T,>(p: Promise<T>, ms: number) => {
        let timer: ReturnType<typeof setTimeout>
        return Promise.race([
          p,
          new Promise<T>((_, rej) => {
            timer = setTimeout(() => rej(new Error(`Upload timed out after ${ms / 1000}s`)), ms)
          }),
        ]).finally(() => clearTimeout(timer))
      }

      for (const file of files) {
        console.log(`Uploading file: name=${file.name} type=${file.type} size=${file.size}`)
        // Upload directly from browser to Supabase Storage
        const safeName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`

        // If file is large, upload via server endpoint which may avoid browser/platform limits.
        const SERVER_UPLOAD_THRESHOLD = 50 * 1024 * 1024 // 50 MB

        let uploadResult
        try {
          if (file.size > SERVER_UPLOAD_THRESHOLD) {
            console.log("Using server chunked upload for large file")
            // upload by chunks
            const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
            const uploadId = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

            const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

            let lastChunkJson: any = null
            for (let i = 0; i < totalChunks; i++) {
              const start = i * CHUNK_SIZE
              const end = Math.min(start + CHUNK_SIZE, file.size)
              const chunk = file.slice(start, end)

              const form = new FormData()
              form.append("file", chunk)
              form.append("uploadId", uploadId)
              form.append("chunkIndex", String(i))
              form.append("totalChunks", String(totalChunks))
              form.append("isLast", String(i === totalChunks - 1))
              // Provide original filename and contentType so server can validate chunks
              form.append("filename", file.name)
              form.append("contentType", file.type)

              const res = await uploadWithTimeout(fetch("/api/upload", { method: "POST", body: form }), 5 * 60 * 1000)
              const json = await (res as Response).json()
              if (!res || (res as Response).status >= 400) {
                const msg = json?.error || json?.message || `Server upload chunk failed with status ${(res as Response).status}`
                throw new Error(msg)
              }

              // remember last chunk response
              lastChunkJson = json

              // update progress based on chunks
              const percent = Math.round(((i + 1) / totalChunks) * 100)
              setUploadProgress((p) => Math.max(p, Math.min(percent, 95)))
            }

            // Use the response from the last chunk which should include the public URL
            const publicUrl = lastChunkJson?.url
            if (!publicUrl) throw new Error("No URL returned from server after chunked upload")

            uploadResult = { data: { path: safeName }, error: null, publicUrl }
          } else {
            uploadResult = await uploadWithTimeout(
              supabase.storage.from("elitebucket").upload(safeName, file, { cacheControl: "3600", upsert: false }),
              2 * 60 * 1000 // 2 minutes timeout
            )
          }
        } catch (err: any) {
          console.error("Upload failed or timed out:", err)
          // Detect Supabase storage size error (message may vary). Provide a clearer toast.
          const message = err?.message || String(err)
          if (message.includes("exceeded the maximum allowed size") || message.includes("maximum allowed size")) {
            toast({
              title: "Archivo demasiado grande",
              description:
                "El archivo excede el tamaño máximo permitido por el servidor. Intenta con un archivo más pequeño o usa la versión para escritorio del sitio que admita archivos grandes.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error de subida",
              description: message || "La subida falló o tardó demasiado",
              variant: "destructive",
            })
          }
          throw err
        }

        // uploadResult may come from server path (custom shape) or Supabase client
        // @ts-ignore
        const { data: uploadData, error: uploadError, publicUrl } = uploadResult
        console.log("Upload response:", { uploadData, uploadError, publicUrl })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          throw uploadError
        }

        // if server returned publicUrl use it, otherwise request from supabase client
        if (publicUrl) {
          mediaUrls.push(publicUrl)
        } else {
          // ensure path exists
          const uploadedPath = uploadData?.path || uploadData?.Key || uploadData?.KeyName || null
          if (!uploadedPath) {
            console.error("Upload succeeded but no path returned:", uploadData)
            toast({
              title: "Error",
              description: "No se pudo obtener la ruta del archivo subido",
              variant: "destructive",
            })
            throw new Error("Missing upload path")
          }

          const { data: publicData } = supabase.storage.from("elitebucket").getPublicUrl(safeName)
          console.log("Public URL:", publicData)
          mediaUrls.push(publicData.publicUrl)
        }

        // Determine media type
        const isVideo = file.type.startsWith("video/")
        const isImage = file.type.startsWith("image/")

        if (!mediaType) {
          mediaType = isVideo ? "video" : isImage ? "image" : null
        } else if ((mediaType === "video" && isImage) || (mediaType === "image" && isVideo)) {
          mediaType = "mixed"
        }
      }

      // Create post in database
      const { error } = await supabase.from("posts").insert({
        creator_id: user.id,
        content: content.trim() || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaType,
        is_locked: isLocked,
        price: isLocked ? Number.parseFloat(price) : 0,
      })

      if (error) throw error

      toast({
        title: "¡Publicado!",
        description: "Tu contenido ha sido publicado exitosamente",
      })

  // Reset form
      setContent("")
      setFiles([])
      setPreviews([])
      setIsLocked(false)
      setPrice("0")
      onOpenChange(false)

      // Refresh the page to show new post
      router.refresh()
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "No se pudo publicar el contenido",
        variant: "destructive",
      })
    } finally {
      // finish simulated progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      setUploadProgress(100)

      // small delay so user sees 100%
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 600)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-[#D4AF37]/20 bg-black text-[#D4AF37]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Publicación</DialogTitle>
          <DialogDescription className="text-[#D4AF37]/70">Comparte contenido con tus fans</DialogDescription>
        </DialogHeader>

        {uploading && (
          <div className="px-4">
            <div className="mb-2 text-sm text-[#D4AF37]/70">Subiendo archivos...</div>
            <div className="w-full rounded bg-white/5">
              <div
                className="h-2 rounded bg-[#D4AF37] transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              placeholder="¿Qué quieres compartir?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] border-[#D4AF37]/20 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Archivos</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-[#D4AF37]/20 bg-black/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Subir Archivos
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-sm text-[#D4AF37]/60">{files.length} archivo(s) seleccionado(s)</span>
            </div>

            {/* File Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-[#D4AF37]/20"
                  >
                    {files[index].type.startsWith("video/") ? (
                      <video src={preview} className="h-full w-full object-cover" />
                    ) : (
                      <img
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute right-1 top-1 rounded-full bg-black/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-4 w-4 text-[#D4AF37]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lock Content */}
          <div className="flex items-center justify-between rounded-lg border border-[#D4AF37]/20 bg-black/50 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="locked">Contenido Exclusivo</Label>
              <p className="text-sm text-[#D4AF37]/60">Solo para suscriptores o pago por ver</p>
            </div>
            <Switch id="locked" checked={isLocked} onCheckedChange={setIsLocked} />
          </div>

          {/* Price (if locked) */}
          {isLocked && (
            <div className="space-y-2">
              <Label htmlFor="price">Precio (USD)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="border-[#D4AF37]/20 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40"
              />
              <p className="text-xs text-[#D4AF37]/60">Deja en 0 para contenido solo para suscriptores</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading} className="bg-[#D4AF37] text-black hover:bg-[#C9A961]">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
