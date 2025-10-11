import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "../../../lib/supabase/server"

/**
 * API de subida de medios.
 * Espera un FormData con:
 * - file: File
 * - mediaType: 'photo' | 'video' (o 'image')
 * - title (opcional)
 * - description (opcional)
 *
 * Flujo:
 * 1. Crea cliente Supabase ligado a la sesión (cookies)
 * 2. Verifica usuario autenticado
 * 3. Sube el archivo a Storage en el bucket 'elitebucket'
 * 4. Obtiene URL pública y crea registro en la tabla `photos` o `videos`
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
  const mediaTypeRaw = (formData.get("mediaType") as string) || (formData.get("type") as string) || ""
  let mediaType = mediaTypeRaw ? (mediaTypeRaw.toLowerCase() === "image" ? "photo" : mediaTypeRaw.toLowerCase()) : ""
    const title = (formData.get("title") as string) || null
    const description = (formData.get("description") as string) || null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // If mediaType not provided, infer from the file MIME type
    if (!mediaType) {
      if (file.type && file.type.startsWith("video/")) mediaType = "video"
      else mediaType = "photo"
    }

    if (!["photo", "video"].includes(mediaType)) {
      return NextResponse.json({ error: "Invalid mediaType. Use 'photo' or 'video'." }, { status: 400 })
    }

    // Crear cliente Supabase ligado a las cookies de la petición
    const supabase = await createServerClient()

    // Obtener usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bucket = "elitebucket"
    const timestamp = Date.now()
    const safeName = file.name.replace(/\s+/g, "_")
    const path = `${user.id}/${timestamp}_${safeName}`

    // Convertir a ArrayBuffer/Uint8Array y subir
    const arrayBuffer = await file.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)
    const contentType = file.type || (mediaType === "video" ? "video/mp4" : "image/jpeg")

    console.log("Uploading to bucket", bucket, "path", path, "contentType", contentType, "size", uint8.length)

    let uploadResult
    try {
      uploadResult = await supabase.storage.from(bucket).upload(path, uint8, {
        contentType,
        upsert: false,
      })
      console.log("Supabase upload result:", uploadResult)
    } catch (e) {
      console.error("Exception during Supabase upload:", e)
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ error: String(e), stack: e instanceof Error ? e.stack : undefined }, { status: 500 })
      }
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    if (uploadResult?.error) {
      console.error("Supabase upload error:", uploadResult.error)
      const message = uploadResult.error.message || String(uploadResult.error)
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ error: message, details: uploadResult.error }, { status: 500 })
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    // Obtener URL pública
    const { data: publicData } = await supabase.storage.from(bucket).getPublicUrl(path)
    const publicUrl = publicData?.publicUrl || ""

    // Preparar payload para la BD
    const payload: any = {
      creator_id: user.id,
      url: publicUrl,
      path,
      filename: file.name,
      size: file.size,
      mime_type: contentType,
      title,
      description,
      created_at: new Date().toISOString(),
    }

    let insertResult
    if (mediaType === "video") {
      insertResult = await supabase.from("videos").insert(payload).select().single()
    } else {
      insertResult = await supabase.from("photos").insert(payload).select().single()
    }

    if (insertResult?.error) {
      // Rollback: eliminar archivo subido
      try {
        await supabase.storage.from(bucket).remove([path])
      } catch (e) {
        console.warn("Failed to remove uploaded file after DB error", e)
      }
      console.error("DB insert error:", insertResult.error)
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ error: insertResult.error.message, details: insertResult.error }, { status: 500 })
      }
      return NextResponse.json({ error: insertResult.error.message }, { status: 500 })
    }

    // Devolver url para compatibilidad con frontend antiguo y el registro creado
    return NextResponse.json({ url: publicUrl, file: insertResult.data })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
