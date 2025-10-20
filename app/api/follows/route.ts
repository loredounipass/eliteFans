import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { following_id?: string; action?: string }
    const following_id = body?.following_id
    const action = body?.action

    if (!following_id) {
      return NextResponse.json({ error: "following_id is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already following (use maybeSingle to avoid 406 when no row exists)
    const existingFollowRes = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", following_id)
      .maybeSingle()

  const existingFollow = existingFollowRes.data ?? null
  const isCurrentlyFollowing = !!existingFollow

    // Handle explicit action or toggle behavior
    let shouldFollow: boolean
    if (action === 'follow') {
      shouldFollow = true
    } else if (action === 'unfollow') {
      shouldFollow = false
    } else {
      // Toggle behavior (default)
      shouldFollow = !isCurrentlyFollowing
    }

    if (shouldFollow && !isCurrentlyFollowing) {
      // Create follow relationship
      const insertRes = await supabase
        .from("follows")
        .insert({
          follower_id: user.id,
          following_id: following_id
        })
        .select()

      if (insertRes.error) {
        console.error("Follow error:", insertRes.error)
        return NextResponse.json({ error: insertRes.error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'followed', data: insertRes.data })
    } else if (!shouldFollow && isCurrentlyFollowing) {
      // Remove follow relationship
      const deleteRes = await supabase
        .from("follows")
        .delete()
        .eq("id", existingFollow?.id)

      if (deleteRes.error) {
        console.error("Unfollow error:", deleteRes.error)
        return NextResponse.json({ error: deleteRes.error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'unfollowed' })
    } else {
      // No change needed
      return NextResponse.json({ 
        success: true, 
        action: isCurrentlyFollowing ? 'already_following' : 'not_following' 
      })
    }
  } catch (error) {
    console.error("Follow API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const following_id = searchParams.get("following_id")

    if (!following_id) {
      return NextResponse.json({ error: "following_id is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete follow relationship
    const deleteRes = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", following_id)

    if (deleteRes.error) {
      console.error("Unfollow error:", deleteRes.error)
      return NextResponse.json({ error: deleteRes.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: 'unfollowed' })
  } catch (error) {
    console.error("Unfollow API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get("user_id")
    const type = searchParams.get("type") // 'followers' or 'following'

    if (!user_id || !type) {
      return NextResponse.json({ error: "user_id and type are required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    let query: any
    if (type === 'followers') {
      // Get users who follow this user
      query = supabase
        .from("follows")
        .select(`
          follower_id,
          created_at,
          profiles!follows_follower_id_fkey (
            user_id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq("following_id", user_id)
    } else if (type === 'following') {
      // Get users this user follows
      query = supabase
        .from("follows")
        .select(`
          following_id,
          created_at,
          profiles!follows_following_id_fkey (
            user_id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq("follower_id", user_id)
    } else {
      return NextResponse.json({ error: "Invalid type. Use 'followers' or 'following'" }, { status: 400 })
    }

    const queryRes = await query.order("created_at", { ascending: false })
    const data = queryRes.data
    const error = queryRes.error

    if (error) {
      console.error("Get follows error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Get follows API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}