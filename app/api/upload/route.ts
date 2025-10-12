import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// USAR RUNTIME NODE PARA EVITAR RESTRICCIONES DE TAMAÑO EN EDGE
export const runtime = "nodejs"

// IMPORTS DE NODE.JS PARA MANEJO DE CHUNKS
import fs from "fs"
import os from "os"
import path from "path"

// CONFIGURACION VIA ENV (FÁCIL DE AJUSTAR EN DESPLIEGUE)
const SERVER_MAX_UPLOAD = Number(process.env.SERVER_MAX_UPLOAD) || 600 * 1024 * 1024 // 600 MB
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET || "elitebucket"
const TEMP_DIR_BASE = process.env.UPLOAD_TEMP_DIR || os.tmpdir()

// UTILS
const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_.-]/g, "_")
const sanitizeId = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_")

export async function POST(req: Request) {
  // MANEJO GENERAL CON RESPUESTAS JSON
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const uploadId = (formData.get("uploadId") as string) || null
    const isLast = formData.get("isLast") === "true"

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    // NORMALIZAR METADATOS DE ARCHIVO
    const providedFilename = (formData.get("filename") as string) || null
    const providedContentType = (formData.get("contentType") as string) || null
    const fileName = (file.name || providedFilename || "").toString()
    const ext = (fileName.split(".").pop() || "").toLowerCase()
    const fileType = (file.type || providedContentType || "").toString()

    // TIPOS PERMITIDOS
    const allowedImageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"]
    const allowedVideoExts = ["mp4", "mov", "mkv", "webm", "mpg", "mpeg", "avi", "m4v", "ogv", "ogg"]
    const isImage = fileType.startsWith("image/") || allowedImageExts.includes(ext)
    const isVideo = fileType.startsWith("video/") || allowedVideoExts.includes(ext)

    if (!(isImage || isVideo)) {
      const details = { fileType, providedContentType, fileName, ext }
      console.error("TIPO DE ARCHIVO NO PERMITIDO", details)
      return NextResponse.json({ error: "Tipo de archivo no permitido", details }, { status: 400 })
    }

    // VALIDAR TAMAÑO
    const size = Number((file as any).size || 0)
    if (size > SERVER_MAX_UPLOAD) return NextResponse.json({ error: "File too large", details: { size, max: SERVER_MAX_UPLOAD } }, { status: 413 })

    // NOMBRE SEGURO PARA STORAGE
    const safeBase = `${Date.now()}_${fileName || file.name}`.replace(/[^a-zA-Z0-9_.-]/g, "_")
    const filename = safeBase

    const supabase = await createServerClient()

    // SI HAY UPLOAD ID, TRATAR COMO UPLOAD CHUNKED
    if (uploadId) {
      const tempDir = TEMP_DIR_BASE
      const tempPath = path.join(tempDir, `${sanitizeId(uploadId)}_${sanitize(filename)}`)

      // LIMITAR TAMAÑO ACUMULADO EN TEMPORAL (EVITAR AGOTAR ESPACIO)
      const MAX_TEMP_ACCUM = Number(process.env.MAX_TEMP_ACCUM) || SERVER_MAX_UPLOAD * 1.5

      try {
        const buffer = Buffer.from(await file.arrayBuffer())

        // Si el archivo temporal excede un umbral, rechazamos para proteger disco
        try {
          const stats = await fs.promises.stat(tempPath).catch(() => ({ size: 0 }))
          const accumulated = Number(stats.size || 0) + buffer.length
          if (accumulated > MAX_TEMP_ACCUM) {
            console.warn("TEMPORAL EXCEDE LIMITE", { tempPath, accumulated, MAX_TEMP_ACCUM })
            return NextResponse.json({ error: "Temporary storage limit exceeded" }, { status: 413 })
          }
        } catch (statErr) {
          console.warn("ERROR AL COMPROBAR TEMP", statErr)
        }

        await fs.promises.appendFile(tempPath, buffer)
      } catch (e: any) {
        console.error("FALLO AL ESCRIBIR CHUNK", e)
        return NextResponse.json({ error: "Failed to append chunk", details: String(e) }, { status: 500 })
      }

      if (!isLast) return NextResponse.json({ ok: true })

      // SUBIR ARCHIVO ASSEMBLEADO
      let uploaded = false
      try {
        const stream = fs.createReadStream(tempPath)
        const { error: uploadError } = await supabase.storage.from(UPLOAD_BUCKET).upload(filename, stream as any, {
          cacheControl: "3600",
          upsert: false,
          contentType: fileType,
        })

        if (uploadError) {
          console.error("ERROR SUBIENDO CHUNK FINAL", uploadError)
          return NextResponse.json({ error: uploadError.message || String(uploadError), details: uploadError }, { status: 400 })
        }

        uploaded = true
        const { data: publicData } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(filename)
        return NextResponse.json({ url: publicData.publicUrl })
      } catch (e: any) {
        console.error("ERROR EN SUBIDA FINAL CHUNKED", e)
        return NextResponse.json({ error: "Failed final upload", details: String(e) }, { status: 500 })
      } finally {
        // LIMPIAR TEMP SI EXISTE (INTENTAR SIEMPRE)
        fs.promises.unlink(tempPath).catch((e) => console.warn("NO SE PUDO ELIMINAR TEMP", tempPath, e))
      }
    }

    // RUTA PARA SUBIDA COMPLETA (NO CHUNKED)
    try {
      const { error: uploadError } = await supabase.storage.from(UPLOAD_BUCKET).upload(filename, file as any, {
        cacheControl: "3600",
        upsert: false,
        contentType: fileType,
      })

      if (uploadError) {
        console.error("ERROR EN SUBIDA", uploadError)
        return NextResponse.json({ error: uploadError.message || String(uploadError), details: uploadError }, { status: 400 })
      }

      const { data: publicData } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(filename)
      return NextResponse.json({ url: publicData.publicUrl })
    } catch (e: any) {
      console.error("ERROR EN SUBIDA COMPLETA", e)
      return NextResponse.json({ error: "Upload failed", details: String(e) }, { status: 500 })
    }
  } catch (err: any) {
    console.error("ERROR EN RUTA DE UPLOAD", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
