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
import { useTranslation } from 'react-i18next'

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
    facebook_url: profile.facebook_url || "",
    instagram_url: profile.instagram_url || "",
    tiktok_url: profile.tiktok_url || "",
    x_url: profile.x_url || "",
    youtube_url: profile.youtube_url || "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null)
  const [coverPreview, setCoverPreview] = useState<string | null>(profile.cover_url || null)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  const { t } = useTranslation()

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
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        tiktok_url: formData.tiktok_url,
        x_url: formData.x_url,
        youtube_url: formData.youtube_url,
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
      <DialogContent className="max-w-7xl w-[95vw] border border-[#D4AF37]/20 bg-gradient-to-br from-black/95 to-black/85 backdrop-blur-xl text-[#D4AF37] shadow-2xl shadow-[#D4AF37]/10 max-h-[95vh] overflow-y-auto scrollbar-hide">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#D4AF37]/3 rounded-full blur-3xl animate-bounce" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-[#D4AF37]/8 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-20 right-1/4 w-24 h-24 bg-[#D4AF37]/4 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-[#D4AF37]/6 rounded-full blur-2xl animate-bounce" />
        </div>

        <DialogHeader className="relative z-10 pb-8">
          <div className={`flex items-center justify-between transition-all duration-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 shadow-lg">
                <Edit3 className="h-7 w-7 text-[#D4AF37]" />
              </div>
              <div>
                <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#F4BF37] to-[#D4AF37] bg-clip-text text-transparent">
                  {t('edit_profile.title')}
                </DialogTitle>
                <DialogDescription className="text-[#D4AF37]/70 mt-2 text-lg">
                  {t('edit_profile.description')}
                </DialogDescription>
              </div>
            </div>
            <Crown className="h-10 w-10 text-[#D4AF37] animate-pulse" />
          </div>
        </DialogHeader>

        <div className="space-y-12 py-4 relative z-10 px-2">
          {/* Cover Image Section */}
          <div className={`transition-all duration-700 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="mb-8">
              <Label className="text-2xl font-bold text-[#D4AF37] flex items-center gap-3 mb-3">
                <Image className="h-7 w-7" />
                {t('edit_profile.change_cover')}
              </Label>
              <p className="text-[#D4AF37]/60 text-base">{t('edit_profile.description')}</p>
            </div>
            <div className="relative">
              <div className="h-64 w-full overflow-hidden rounded-3xl border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-transparent shadow-2xl hover:shadow-[#D4AF37]/20 transition-all duration-300">
                {coverPreview ? (
                  <img 
                    src={coverPreview} 
                    alt="Vista previa de imagen de portada" 
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <Image className="h-20 w-20 text-[#D4AF37]/30 mx-auto mb-4" />
                      <p className="text-[#D4AF37]/50 text-xl font-medium">Sin imagen de portada</p>
                      <p className="text-[#D4AF37]/40 text-base mt-2">Haz clic en "Cambiar Portada" para agregar una imagen impactante</p>
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
                size="lg"
                className="absolute bottom-6 right-6 border-[#D4AF37] bg-black/90 backdrop-blur-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:scale-105 transition-all duration-300 shadow-xl font-semibold px-6 py-3"
                onClick={() => coverInputRef.current?.click()}
              >
                <Camera className="mr-2 h-5 w-5" />
                {t('edit_profile.change_cover')}
              </Button>
            </div>
          </div>

          {/* Profile Section - Avatar and Basic Info */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
            {/* Avatar Section */}
            <div className={`xl:col-span-2 transition-all duration-700 delay-400 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="mb-8">
                <Label className="text-2xl font-bold text-[#D4AF37] flex items-center gap-3 mb-3">
                  <User className="h-7 w-7" />
                  {t('edit_profile.change_avatar')}
                </Label>
                <p className="text-[#D4AF37]/60 text-base">{t('edit_profile.description')}</p>
              </div>
              
              <div className="flex flex-col items-center space-y-8">
                <div className="relative group">
                  <div className="h-48 w-48 overflow-hidden rounded-full border-4 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30 transition-all duration-300 group-hover:scale-105">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Vista previa del avatar" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10">
                        <User className="h-20 w-20 text-[#D4AF37]/50" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/40 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <div className="text-center space-y-6 w-full">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[#D4AF37]/25 group font-semibold px-10 py-4 w-full"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Upload className="mr-3 h-5 w-5 group-hover:animate-bounce" />
                    {t('edit_profile.change_avatar')}
                  </Button>
                  <div className="text-sm text-[#D4AF37]/60 space-y-2 bg-[#D4AF37]/5 p-4 rounded-xl border border-[#D4AF37]/20">
                    <p>{t('edit_profile.allowed_formats')}</p>
                    <p>{t('edit_profile.max_size')}</p>
                    <p><strong>Recomendación:</strong> Imagen cuadrada de alta calidad</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info Form */}
            <div className={`xl:col-span-3 space-y-10 transition-all duration-700 delay-600 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="space-y-8">
                <div>
                  <Label className="text-2xl font-bold text-[#D4AF37] flex items-center gap-3 mb-6">
                    <Sparkles className="h-7 w-7" />
                    Información Personal
                  </Label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Nombre Completo
                    </Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Tu nombre completo"
                      className="h-14 border-[#D4AF37]/30 bg-black/50 backdrop-blur-sm text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-xl transition-all duration-300 hover:border-[#D4AF37]/50 text-lg px-4"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Precio de Suscripción (USD/mes)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.subscription_price}
                      onChange={(e) => handleInputChange('subscription_price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-14 border-[#D4AF37]/30 bg-black/50 backdrop-blur-sm text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-xl transition-all duration-300 hover:border-[#D4AF37]/50 text-lg px-4"
                    />
                  </div>
                </div>

                {/* Bio Section */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Biografía
                  </Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Cuéntanos sobre ti... ¿Qué tipo de contenido creas? ¿Cuáles son tus intereses? ¿Qué hace único tu contenido?"
                    rows={6}
                    className="border-[#D4AF37]/30 bg-black/50 backdrop-blur-sm text-[#D4AF37] placeholder:text-[#D4AF37]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-xl transition-all duration-300 hover:border-[#D4AF37]/50 resize-none text-lg p-4 scrollbar-hide"
                  />
                  <div className="bg-[#D4AF37]/5 p-4 rounded-xl border border-[#D4AF37]/20">
                    <p className="text-sm text-[#D4AF37]/60">
                      <strong>Máximo 500 caracteres.</strong> Describe tu contenido y personalidad para atraer suscriptores. 
                      Sé auténtico y específico sobre lo que ofreces.
                    </p>
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-[#D4AF37] flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Redes Sociales
                  </Label>
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      value={formData.facebook_url}
                      onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                      placeholder="Enlace a Facebook (https://...)"
                      className="h-12 border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 rounded-xl px-4"
                    />
                    <Input
                      value={formData.instagram_url}
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      placeholder="Enlace a Instagram (https://...)"
                      className="h-12 border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 rounded-xl px-4"
                    />
                    <Input
                      value={formData.tiktok_url}
                      onChange={(e) => handleInputChange('tiktok_url', e.target.value)}
                      placeholder="Enlace a TikTok (https://...)"
                      className="h-12 border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 rounded-xl px-4"
                    />
                    <Input
                      value={formData.x_url}
                      onChange={(e) => handleInputChange('x_url', e.target.value)}
                      placeholder="Enlace a X / Twitter (https://...)"
                      className="h-12 border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 rounded-xl px-4"
                    />
                    <Input
                      value={formData.youtube_url}
                      onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                      placeholder="Enlace a YouTube (https://...)"
                      className="h-12 border-[#D4AF37]/30 bg-black/50 text-[#D4AF37] placeholder:text-[#D4AF37]/40 rounded-xl px-4"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row justify-end gap-6 pt-10 border-t border-[#D4AF37]/20 transition-all duration-700 delay-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => onClose?.()} 
              disabled={saving}
              className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:scale-105 transition-all duration-300 px-12 py-4 rounded-xl font-semibold text-lg"
            >
              Cancelar
            </Button>
            <Button 
              size="lg"
              onClick={handleSave} 
              disabled={saving}
              className="bg-[#D4AF37] text-black hover:bg-[#C9A961] hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-[#D4AF37]/50 px-12 py-4 rounded-xl font-bold group text-lg"
            >
              {saving ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </div>
              ) : (
                <>
                  <Sparkles className="mr-3 h-6 w-6 group-hover:animate-spin" />
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