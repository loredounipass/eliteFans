import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`

    const supabase = await createServerClient()

    // Upload to bucket 'elitebucket'
    const { data, error: uploadError } = await supabase.storage.from("elitebucket").upload(filename, file as any, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: publicData } = supabase.storage.from("elitebucket").getPublicUrl(filename)

    return NextResponse.json({ url: publicData.publicUrl })
  } catch (err: any) {
    console.error("Upload route error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
