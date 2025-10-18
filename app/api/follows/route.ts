import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { following_id?: string }
    const following_id = body?.following_id

    if (!following_id) {
      return NextResponse.json({ error: "following_id is required" }, { status: 400 })
    }

  const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const getUserRes = await supabase.auth.getUser()
    const user = getUserRes.data?.user ?? null
    const authError = getUserRes.error ?? null

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

    // If already following -> unfollow (delete)
    if (existingFollowRes.data) {
      const deleteRes = await supabase
        .from("follows")
        .delete()
        .eq("id", existingFollowRes.data.id)

      if (deleteRes.error) {
        console.error("Unfollow error:", deleteRes.error)
        return NextResponse.json({ error: deleteRes.error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'unfollowed' })
    }

    // Otherwise create follow relationship
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
  } catch (error) {
    console.error("Follow API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const following_id = searchParams.get("following_id")

    if (!following_id) {
      return NextResponse.json({ error: "following_id is required" }, { status: 400 })
    }

  const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const getUserRes = await supabase.auth.getUser()
    const user = getUserRes.data?.user ?? null
    const authError = getUserRes.error ?? null

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unfollow API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get("user_id")
    const type = searchParams.get("type") // 'followers' or 'following'

    if (!user_id || !type) {
      return NextResponse.json({ error: "user_id and type are required" }, { status: 400 })
    }

  const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

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