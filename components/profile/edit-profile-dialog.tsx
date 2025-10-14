"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { X, Upload, Image } from "lucide-react"

interface EditProfileDialogProps {
  profile: any
  onClose?: () => void
  onSaved?: () => void
}

export default function EditProfileDialog({ profile, onClose, onSaved }: EditProfileDialogProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null)
  const [coverPreview, setCoverPreview] = useState<string | null>(profile.cover_url || null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
  const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/heic"]

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    if (f) {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        toast({ title: "Tipo inválido", description: "Solo se permiten imágenes (png, jpg, webp, gif)", variant: "destructive" })
        return
      }
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: "Archivo demasiado grande", description: `El archivo excede ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`, variant: "destructive" })
        return
      }
    }
    setAvatarFile(f)
    setAvatarPreview(f ? URL.createObjectURL(f) : profile.avatar_url || null)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    if (f) {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        toast({ title: "Tipo inválido", description: "Solo se permiten imágenes (png, jpg, webp, gif)", variant: "destructive" })
        return
      }
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: "Archivo demasiado grande", description: `El archivo excede ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`, variant: "destructive" })
        return
      }
    }
    setCoverFile(f)
    setCoverPreview(f ? URL.createObjectURL(f) : profile.cover_url || null)
  }

  // Refs to trigger file inputs programmatically
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null)
  const coverInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createBrowserClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const uploads: { avatar_url?: string; cover_url?: string } = {}

      // Helper to convert file to base64
      const fileToBase64 = (file: File) =>
        new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res((reader.result as string).split(",")[1] || "")
          reader.onerror = rej
          reader.readAsDataURL(file)
        })

      // Upload via our POST /api/profile/fotos which inserts into 'fotros'
      const uploadToFotros = async (file: File, kind: string) => {
        // Final safety checks before upload
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Invalid file type")
        if (file.size > MAX_FILE_SIZE) throw new Error("File too large")
        const base64 = await fileToBase64(file)
        const body = {
          fileName: file.name,
          contentType: file.type,
          base64,
          kind,
        }

        const res = await fetch("/api/profile/fotos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Upload failed")
        // API can return either { id } (fotros) or { url } (storage fallback)
        return json.id ? { id: json.id } : { url: json.url }
      }

      if (avatarFile) {
        const result = await uploadToFotros(avatarFile, "avatar")
        if ((result as any).id) uploads.avatar_url = `/api/profile/fotos/${(result as any).id}`
        else if ((result as any).url) uploads.avatar_url = (result as any).url
      }

      if (coverFile) {
        const result = await uploadToFotros(coverFile, "cover")
        if ((result as any).id) uploads.cover_url = `/api/profile/fotos/${(result as any).id}`
        else if ((result as any).url) uploads.cover_url = (result as any).url
      }

      if (Object.keys(uploads).length > 0) {
        const { error } = await supabase.from("profiles").update(uploads).eq("id", profile.id)
        if (error) throw error
      }

      toast({ title: "Guardado", description: "Perfil actualizado correctamente" })
      onSaved?.()
      onClose?.()
    } catch (err: any) {
      console.error("Edit profile error:", err)
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose?.() }}>
      <DialogContent className="max-w-2xl border-[#D4AF37]/20 bg-black text-[#D4AF37]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>Sube una foto de perfil y una portada</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Avatar</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-white/5">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#D4AF37]/50"> 
                    <Image />
                  </div>
                )}
              </div>
              <div>
                <input
                  id="avatar-upload"
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="border-[#D4AF37]"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" /> Cambiar avatar
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Portada</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="h-24 w-48 overflow-hidden rounded bg-white/5">
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="cover preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#D4AF37]/50">
                    <Image />
                  </div>
                )}
              </div>
              <div>
                <input
                  id="cover-upload"
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="border-[#D4AF37]"
                  onClick={() => coverInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" /> Cambiar portada
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onClose?.()} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
