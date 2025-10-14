import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const postId = body?.postId
    const text = (body?.text || "").toString().trim()

    if (!postId || !text) return NextResponse.json({ error: "postId and text are required" }, { status: 400 })

    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const payload = {
      post_id: postId,
      user_id: user.id,
      content: text,
    }

    const { data, error } = await supabase.from("comments").insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, comment: data })
  } catch (err: any) {
    console.error("Comments API error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
