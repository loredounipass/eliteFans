"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { X, Upload, Image, User, FileText, Crown, Sparkles, Camera, Edit3 } from "lucide-react"

interface EditProfileDialogProps {
  profile: any
  onClose?: () => void
  onSaved?: () => void
}

export default function EditProfileDialog({ profile, onClose, onSaved }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    bio: profile.bio || "",
    subscription_price: profile.subscription_price || 0,
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null)
  const [coverPreview, setCoverPreview] = useState<string | null>(profile.cover_url || null)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
  const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/heic"]

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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

      const updates: any = {
        full_name: formData.full_name,
        bio: formData.bio,
        subscription_price: Number(formData.subscription_price),
      }

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
        if ((result as any).id) updates.avatar_url = `/api/profile/fotos/${(result as any).id}`
        else if ((result as any).url) updates.avatar_url = (result as any).url
      }

      if (coverFile) {
        const result = await uploadToFotros(coverFile, "cover")
        if ((result as any).id) updates.cover_url = `/api/profile/fotos/${(result as any).id}`
        else if ((result as any).url) updates.cover_url = (result as any).url
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id)
      if (error) throw error

      toast({ 
        title: "¡Perfil actualizado!", 
        description: "Tus cambios se han guardado correctamente",
        duration: 3000
      })
      onSaved?.()
      onClose?.()
    } catch (err: any) {
      console.error("Edit profile error:", err)
      toast({ 
        title: "Error al guardar", 
        description: err?.message || "Ha ocurrido un error inesperado", 
        variant: "destructive" 
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose?.() }}>
      <DialogContent className="max-w-4xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/95 to-black/85 backdrop-blur-xl text-[#D4AF37] shadow-2xl shadow-[#D4AF37]/10 max-h-[90vh] overflow-y-auto">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#D4AF37]/3 rounded-full blur-3xl animate-bounce" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-[#D4AF37]/8 to-transparent rounded-full blur-3xl animate-pulse" />
        </div>

        <DialogHeader className="relative z-10">
          <div className={`flex items-center gap-3 transition-all duration-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            <div className="p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <Edit3 className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#F4BF37] to-[#D4AF37] bg-clip-text text-transparent">
                Editar Perfil
              </DialogTitle>
              <DialogDescription className="text-[#D4AF37]/70 mt-1">
                Personaliza tu perfil y hazlo único
              </DialogDescription>
            </div>
            <Crown className="h-6 w-6 text-[#D4AF37] animate-pulse ml-auto" />
          </div>
        </DialogHeader>

        <div className="space-y-8 py-6 relative z-10">
          {/* Cover Image Section */}
          <div className={`transition-all duration-700 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Label className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2 mb-4">
              <Image className="h-5 w-5" />
              Imagen de Portada
            </Label>
            <div className="relative">
              <div className="h-48 w-full overflow-hidden rounded-2xl border-2 border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent shadow-lg hover:shadow-[#D4AF37]/20 transition-all duration-300">
                {coverPreview ? (
                  <img 
                    src={coverPreview} 
                    alt="cover preview" 
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <Image className="h-12 w-12 text-[#D4AF37]/30 mx-auto mb-2" />
                      <p className="text-[#D4AF37]/50 text-sm">Sin imagen de portada</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              <Button
                variant="outline"
                className="absolute bottom-4 right-4 border-[#D4AF37] bg-black/80 backdrop-blur-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:scale-105 transition-all duration-300 shadow-lg"
                onClick={() => coverInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Cambiar Portada
              </Button>
            </div>
          </div>

          {/* Avatar and Basic Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Avatar Section */}
            <div className={`transition-all duration-700 delay-400 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Label className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2 mb-4">
                <User className="h-5 w-5" />
                Foto de Perfil
              </Label>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/20 transition-all duration-300 group-hover:scale-105">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="avatar preview" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10">
                        <User className="h-12 w-12 text-[#D4AF37]/50" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/30 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[#D4AF37]/25 group mb-2"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4 group-hover:animate-bounce" />
                    Cambiar Avatar
                  </Button>
                  <p className="text-sm text-[#D4AF37]/60 mt-2">
                    Formatos: JPG, PNG, WebP<br />
                    Tamaño máximo: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info Form */}
            <div className={`space-y-6 transition-all duration-700 delay-600 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div>
                <Label className="text-base font-semibold text-[#D4AF37] flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4" />
                  Nombre Completo
                </Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Tu nombre completo"
                  className="border-[#D4AF37]/30 bg-black/50 backdrop-blur-sm text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-xl transition-all duration-300 hover:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <Label className="text-base font-semibold text-[#D4AF37] flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4" />
                  Precio de Suscripción (USD/mes)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.subscription_price}
                  onChange={(e) => handleInputChange('subscription_price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="border-[#D4AF37]/30 bg-black/50 backdrop-blur-sm text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-xl transition-all duration-300 hover:border-[#D4AF37]/50"
                />
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className={`transition-all duration-700 delay-800 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Label className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Biografía
            </Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Cuéntanos sobre ti... ¿Qué tipo de contenido creas? ¿Cuáles son tus intereses?"
              rows={4}
              className="border-[#D4AF37]/30 bg-black/50 backdrop-blur-sm text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-xl transition-all duration-300 hover:border-[#D4AF37]/50 resize-none"
            />
            <p className="text-sm text-[#D4AF37]/60 mt-2">
              Máximo 500 caracteres. Describe tu contenido y personalidad.
            </p>
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-[#D4AF37]/20 transition-all duration-700 delay-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Button 
              variant="outline" 
              onClick={() => onClose?.()} 
              disabled={saving}
              className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:scale-105 transition-all duration-300 px-8 py-2 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-[#D4AF37] text-black hover:bg-[#C9A961] hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[#D4AF37]/50 px-8 py-2 rounded-xl font-semibold group"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </div>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 group-hover:animate-spin" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}