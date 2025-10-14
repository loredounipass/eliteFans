import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const postId = body?.postId

    if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 })

    const supabase = await createServerClient()

    // Obtener usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    // INTENTAR ELIMINAR (UNLIKE) SI EXISTE
    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    if (existing && (existing as any).id) {
      const { error: delError } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id)
      if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

      // Obtener contador actualizado
      const { data: postData } = await supabase.from("posts").select("like_count").eq("id", postId).maybeSingle()
      return NextResponse.json({ ok: true, action: "unliked", like_count: postData?.like_count ?? null })
    }

    // CREAR LIKE (INSERT). MANEJAR CONFLICTOS DE UNIQUE
    const { data, error } = await supabase.from("likes").insert({ post_id: postId, user_id: user.id }).select().single()

    if (error) {
      // POSIBLE CONFLICTO UNICO (YA EXISTE)
      const msg = (error?.message || "").toLowerCase()
      if (msg.includes("duplicate") || msg.includes("unique")) {
        // Obtener contador actual
        const { data: postData } = await supabase.from("posts").select("like_count").eq("id", postId).maybeSingle()
        return NextResponse.json({ ok: true, action: "already_liked", like_count: postData?.like_count ?? null })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: postData } = await supabase.from("posts").select("like_count").eq("id", postId).maybeSingle()
    return NextResponse.json({ ok: true, action: "liked", like_count: postData?.like_count ?? null, like: data })
  } catch (err: any) {
    console.error("Likes API error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const postId = url.searchParams.get("postId")

    if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 })

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ liked: false, like_count: null })

    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    const { data: postData } = await supabase.from("posts").select("like_count").eq("id", postId).maybeSingle()

    return NextResponse.json({ liked: !!existing, like_count: postData?.like_count ?? null })
  } catch (err: any) {
    console.error("Likes GET error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
