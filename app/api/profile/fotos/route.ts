import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Base45 charset per RFC9285
const BASE45_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"

function encodeBase45(input: Buffer): string {
  const chars = BASE45_CHARSET
  let i = 0
  let out = ""
  while (i < input.length) {
    if (i + 1 < input.length) {
      const x = input[i] * 256 + input[i + 1]
      const e = x % 45
      const d = Math.floor(x / 45) % 45
      const c = Math.floor(x / 45 / 45)
      out += chars[e] + chars[d] + chars[c]
      i += 2
    } else {
      const x = input[i]
      const e = x % 45
      const d = Math.floor(x / 45)
      out += chars[e] + chars[d]
      i += 1
    }
  }
  return out
}

function decodeBase45(s: string): Buffer {
  const chars = BASE45_CHARSET
  const charIdx = (ch: string) => chars.indexOf(ch)
  const bytes: number[] = []
  let i = 0
  while (i < s.length) {
    if (i + 2 < s.length) {
      const e = charIdx(s[i])
      const d = charIdx(s[i + 1])
      const c = charIdx(s[i + 2])
      const x = e + d * 45 + c * 45 * 45
      bytes.push((x >> 8) & 0xff)
      bytes.push(x & 0xff)
      i += 3
    } else if (i + 1 < s.length) {
      const e = charIdx(s[i])
      const d = charIdx(s[i + 1])
      const x = e + d * 45
      bytes.push(x & 0xff)
      i += 2
    } else {
      throw new Error("Invalid base45 length")
    }
  }
  return Buffer.from(bytes)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { fileName, contentType, base64, kind } = body || {}

    if (!fileName || !contentType || !base64) {
      return NextResponse.json({ error: "fileName, contentType and base64 are required" }, { status: 400 })
    }

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    // Server-side validation
    const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/heic"]
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // approximate size from base64 length
    const approxSize = Math.ceil((base64.length * 3) / 4)
    if (approxSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const buffer = Buffer.from(base64, "base64")

    // Encode to base45 for storage in table
    const base45 = encodeBase45(buffer)

    // Insert into 'photos' table with data_base45 column (photos table exists in migrations)
    try {
      // Insert with temporary url/path to satisfy NOT NULL constraints
      const tempUrl = "temp"
      const tempPath = "temp"
      const { data, error } = await supabase
        .from("photos")
        .insert({
          creator_id: user.id,
          filename: fileName,
          mime_type: contentType,
          size: approxSize,
          data_base45: base45,
          url: tempUrl,
          path: tempPath,
        })
        .select()
        .single()

      if (error) throw error

      const inserted = data

      // Update the record to set the proper url and path now that we have the id
      const finalUrl = `/api/profile/fotos/${inserted.id}`
      const finalPath = `photos/${inserted.id}`
      const { error: upErr } = await supabase.from("photos").update({ url: finalUrl, path: finalPath }).eq("id", inserted.id)
      if (upErr) {
        console.error("Failed to update photo url/path:", upErr)
      }

      return NextResponse.json({ ok: true, id: inserted?.id })
    } catch (err: any) {
      console.error("Insert photos error:", err)
      return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
    }
  } catch (err: any) {
    console.error("Fotros POST error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
