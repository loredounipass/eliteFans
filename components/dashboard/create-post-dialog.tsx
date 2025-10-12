"use client"

import type React from "react"

import { useState } from "react"
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
  const { toast } = useToast()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    // Validate file types
    const validFiles = selectedFiles.filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")
      return isImage || isVideo
    })

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Archivos inválidos",
        description: "Solo se permiten imágenes y videos",
        variant: "destructive",
      })
    }

    // Create previews
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file))

    setFiles((prev) => [...prev, ...validFiles])
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

      // Upload files to Blob
      const mediaUrls: string[] = []
      let mediaType: "image" | "video" | "mixed" | null = null

      for (const file of files) {
        console.log(`Uploading file: name=${file.name} type=${file.type} size=${file.size}`)
        // Upload directly from browser to Supabase Storage
        const safeName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("elitebucket")
          .upload(safeName, file, { cacheControl: "3600", upsert: false })

        console.log("Upload response:", { uploadData, uploadError })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          throw uploadError
        }

  const { data: publicData } = supabase.storage.from("elitebucket").getPublicUrl(safeName)
  console.log("Public URL:", publicData)
  mediaUrls.push(publicData.publicUrl)

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
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-[#D4AF37]/20 bg-black text-[#D4AF37]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Publicación</DialogTitle>
          <DialogDescription className="text-[#D4AF37]/70">Comparte contenido con tus fans</DialogDescription>
        </DialogHeader>

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
