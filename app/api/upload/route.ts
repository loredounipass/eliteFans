import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Use Node runtime for this API route to avoid Edge runtime body size restrictions.
// If your deployment platform (Vercel, etc.) has its own body size limits, you may
// need to increase those or implement chunked uploads.
export const runtime = "nodejs"

// Server-side max allowed upload size (bytes). Adjust according to your Supabase plan.
const SERVER_MAX_UPLOAD = 600 * 1024 * 1024 // 600 MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const uploadId = (formData.get("uploadId") as string) || null
    const chunkIndex = formData.get("chunkIndex") ? Number(formData.get("chunkIndex")) : null
    const totalChunks = formData.get("totalChunks") ? Number(formData.get("totalChunks")) : null
    const isLast = formData.get("isLast") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Basic validation: accept images and video files (including many extensions)
    const fileType = file.type || ""
  // Some chunked uploads may send a File-like blob without name/type; allow filename/contentType in form data
  const providedFilename = (formData.get("filename") as string) || null
  const providedContentType = (formData.get("contentType") as string) || null
  const fileName = file.name || providedFilename || ""
  const ext = (fileName.split(".").pop() || "").toLowerCase()

    const allowedImageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"]
    const allowedVideoExts = ["mp4", "mov", "mkv", "webm", "mpg", "mpeg", "avi", "m4v", "ogv", "ogg"]

  const effectiveType = fileType || providedContentType || ""
  const isImage = effectiveType.startsWith("image/") || allowedImageExts.includes(ext)
  const isVideo = effectiveType.startsWith("video/") || allowedVideoExts.includes(ext)

    if (!(isImage || isVideo)) {
      const details = { fileType, providedContentType, fileName, ext, effectiveType }
      console.error("Rejecting upload: Tipo de archivo no permitido", details)
      return NextResponse.json({ error: "Tipo de archivo no permitido", details }, { status: 400 })
    }

    // Enforce server size limit
    const size = (file as any).size || 0
    if (size > SERVER_MAX_UPLOAD) {
      return NextResponse.json({ error: "File too large", details: { size, max: SERVER_MAX_UPLOAD } }, { status: 413 })
    }

  const filename = `${Date.now()}_${(fileName || file.name).replace(/[^a-zA-Z0-9_.-]/g, "_")}`

    const supabase = await createServerClient()

    // If uploadId is provided, treat this as a chunked upload: append to a temp file
    if (uploadId) {
      // server temp path
      const os = require("os")
      const path = require("path")
      const fs = require("fs")

      const tempDir = os.tmpdir()
      const tempPath = path.join(tempDir, `${uploadId}_${filename}`)

      // Append chunk data to temp file
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        // Ensure append (create if not exists)
        await fs.promises.appendFile(tempPath, buffer)
      } catch (e: any) {
        console.error("Failed to append chunk:", e)
        return NextResponse.json({ error: "Failed to append chunk", details: String(e) }, { status: 500 })
      }

      // If not last chunk, return OK
      if (!isLast) {
        return NextResponse.json({ ok: true })
      }

      // If last chunk, upload the assembled file to Supabase
      try {
        const stream = fs.createReadStream(tempPath)
        const { data, error: uploadError } = await supabase.storage.from("elitebucket").upload(filename, stream as any, {
          cacheControl: "3600",
          upsert: false,
          contentType: fileType,
        })

        // Clean up temp file regardless of result
        try {
          await fs.promises.unlink(tempPath)
        } catch (e) {
          console.warn("Failed to remove temp file", tempPath, e)
        }

        if (uploadError) {
          console.error("Upload error from Supabase (chunked final):", uploadError)
          try {
            console.error("Upload error (full):", JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError), 2))
          } catch (e) {
            console.error("Upload error stringify failed", e)
          }
          return NextResponse.json({ error: uploadError.message || String(uploadError), details: uploadError }, { status: 400 })
        }

        const { data: publicData } = supabase.storage.from("elitebucket").getPublicUrl(filename)
        return NextResponse.json({ url: publicData.publicUrl })
      } catch (e: any) {
        console.error("Failed final upload for chunked file:", e)
        return NextResponse.json({ error: "Failed final upload", details: String(e) }, { status: 500 })
      }
    }

    // Full (non-chunked) upload path

    const { data, error: uploadError } = await supabase.storage
      .from("elitebucket")
      .upload(filename, file as any, {
        cacheControl: "3600",
        upsert: false,
        contentType: fileType,
      })

    if (uploadError) {
      console.error("Upload error from Supabase:", uploadError)
      try {
        // print non-enumerable props too
        console.error("Upload error (full):", JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError), 2))
      } catch (e) {
        console.error("Upload error stringify failed", e)
      }

      // Return the Supabase error message and details to help debugging in dev
      const status = 400
      return NextResponse.json({ error: uploadError.message || String(uploadError), details: uploadError }, { status })
    }

    // Get public URL
    const { data: publicData } = supabase.storage.from("elitebucket").getPublicUrl(filename)

    return NextResponse.json({ url: publicData.publicUrl })
  } catch (err: any) {
    console.error("Upload route error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
