import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { following_id } = await request.json()

    if (!following_id) {
      return NextResponse.json({ error: "following_id is required" }, { status: 400 })
    }

    const cookieStore = cookies()
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", following_id)
      .single()

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 })
    }

    // Create follow relationship
    const { data, error } = await supabase
      .from("follows")
      .insert({
        follower_id: user.id,
        following_id: following_id
      })
      .select()

    if (error) {
      console.error("Follow error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
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

    const cookieStore = cookies()
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete follow relationship
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", following_id)

    if (error) {
      console.error("Unfollow error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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

    const cookieStore = cookies()
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

    let query
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

    const { data, error } = await query.order("created_at", { ascending: false })

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