import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const commentId = body?.commentId
    if (!commentId) return NextResponse.json({ error: "commentId is required" }, { status: 400 })

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    // Try insert like, if violation -> delete (toggle)
    const { data, error } = await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: commentId }).select().single()
    if (error) {
      // If unique violation, try delete
      const del = await supabase.from("comment_likes").delete().eq("user_id", user.id).eq("comment_id", commentId)
      if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 })
      // return unliked
      // get count
      const { data: countData } = await supabase.from("comment_likes").select("id", { count: "exact", head: true }).eq("comment_id", commentId)
      const count = (countData as any)?.count ?? null
      return NextResponse.json({ ok: true, action: "unliked", like_count: count })
    }

    // success inserted
    const { data: countData } = await supabase.from("comment_likes").select("id", { count: "exact", head: true }).eq("comment_id", commentId)
    const count = (countData as any)?.count ?? null
    return NextResponse.json({ ok: true, action: "liked", like_count: count })
  } catch (err: any) {
    console.error("Comment likes POST error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const commentId = url.searchParams.get("commentId")
    if (!commentId) return NextResponse.json({ error: "commentId is required" }, { status: 400 })

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // get like count
    const { data: countData, error: cntErr } = await supabase.from("comment_likes").select("id", { count: "exact", head: true }).eq("comment_id", commentId)
    if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 500 })
    const count = (countData as any)?.count ?? 0

    // check if current user liked
    let liked = false
    if (user) {
      const { data: likeData, error: likeErr } = await supabase.from("comment_likes").select().eq("comment_id", commentId).eq("user_id", user.id).limit(1)
      if (!likeErr && likeData && likeData.length > 0) liked = true
    }

    return NextResponse.json({ ok: true, like_count: count, liked })
  } catch (err: any) {
    console.error("Comment likes GET error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
