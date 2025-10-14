import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Base45 charset per RFC9285
const BASE45_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"

function charIdx(ch: string) {
  return BASE45_CHARSET.indexOf(ch)
}

function decodeBase45ToBuffer(s: string) {
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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // params may be a promise in Next.js app routes; await before using
    const { id } = await params
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("photos")
      .select("id, filename, mime_type, data_base45")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("Fotros GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const base45 = data.data_base45
  if (!base45) return NextResponse.json({ error: "No data" }, { status: 404 })

  const buffer = decodeBase45ToBuffer(base45)
  const headers = new Headers()
  headers.set("Content-Type", data.mime_type || "application/octet-stream")

    return new NextResponse(buffer, {
      status: 200,
      headers: headers,
    })
  } catch (err: any) {
    console.error("Fotros GET error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
