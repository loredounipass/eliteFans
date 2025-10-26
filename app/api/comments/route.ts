import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const postId = body?.postId
    const text = (body?.text || "").toString().trim()
    const parentId = body?.parentId || null

    if (!postId || !text) return NextResponse.json({ error: "postId and text are required" }, { status: 400 })

    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const payload: any = {
      post_id: postId,
      user_id: user.id,
      content: text,
    }
    if (parentId) payload.parent_id = parentId

    const { data, error } = await supabase
      .from("comments")
      .insert(payload)
      .select(`*, profiles:user_id(id, username, full_name, avatar_url)`)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Fetch updated comment count for the post to allow client sync
    const { data: postData } = await supabase.from("posts").select("comment_count").eq("id", postId).maybeSingle()

    return NextResponse.json({ ok: true, comment: data, comment_count: postData?.comment_count ?? null })
  } catch (err: any) {
    console.error("Comments API error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const commentId = url.searchParams.get("id")
    if (!commentId) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    // Ensure the user is owner (RLS should also enforce this) then delete and return updated comment_count
    const { data: deleted, error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id)
      .select("post_id")
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If we know the post_id, fetch the updated comment count
    let comment_count = null
    if (deleted && (deleted as any).post_id) {
      const postIdDeleted = (deleted as any).post_id
      const { data: postData } = await supabase.from("posts").select("comment_count").eq("id", postIdDeleted).maybeSingle()
      comment_count = postData?.comment_count ?? null
    }

    return NextResponse.json({ ok: true, comment_count })
  } catch (err: any) {
    console.error("Comments DELETE error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const commentId = body?.id
    const text = (body?.text || "").toString().trim()

    if (!commentId || !text) return NextResponse.json({ error: "id and text are required" }, { status: 400 })

    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    // Update only if the user is the owner
    const { data, error } = await supabase
      .from("comments")
      .update({ content: text })
      .eq("id", commentId)
      .eq("user_id", user.id)
      .select(`*, profiles:user_id(id, username, full_name, avatar_url)`)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, comment: data })
  } catch (err: any) {
    console.error("Comments PATCH error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const postId = url.searchParams.get("postId")
    const limit = Number(url.searchParams.get("limit") || 20)
    const offset = Number(url.searchParams.get("offset") || 0)

    if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 })

    const supabase = await createServerClient()

    // Join with profiles to get author info
    const { data, error } = await supabase
      .from("comments")
      // Use relation by foreign key user_id to fetch profile fields
      .select(`*, profiles:user_id(id, username, full_name, avatar_url)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, comments: data })
  } catch (err: any) {
    console.error("Comments GET error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
