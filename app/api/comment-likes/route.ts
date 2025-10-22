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
      const { count: delCount, error: delCountErr } = await supabase.from("comment_likes").select("id", { count: "exact", head: true }).eq("comment_id", commentId)
      if (delCountErr) return NextResponse.json({ error: delCountErr.message }, { status: 500 })
      return NextResponse.json({ ok: true, action: "unliked", like_count: delCount ?? 0 })
    }

    // success inserted
    const { count: insCount, error: insCountErr } = await supabase.from("comment_likes").select("id", { count: "exact", head: true }).eq("comment_id", commentId)
    if (insCountErr) return NextResponse.json({ error: insCountErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: "liked", like_count: insCount ?? 0 })
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
  const { count, error: cntErr } = await supabase.from("comment_likes").select("id", { count: "exact", head: true }).eq("comment_id", commentId)
  if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 500 })

    // check if current user liked
    let liked = false
    if (user) {
      const { data: likeData, error: likeErr } = await supabase.from("comment_likes").select().eq("comment_id", commentId).eq("user_id", user.id).limit(1)
      if (!likeErr && likeData && likeData.length > 0) liked = true
    }

    return NextResponse.json({ ok: true, like_count: count ?? 0, liked })
  } catch (err: any) {
    console.error("Comment likes GET error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}