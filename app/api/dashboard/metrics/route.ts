import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    // Get profile aggregated fields
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("is_creator, subscriber_count, total_earnings, post_count")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    const subscribers = profileData?.subscriber_count ?? 0
    const total_earnings = profileData?.total_earnings ?? 0
    const posts_count = profileData?.post_count ?? 0

    // Fetch posts for the creator to calculate likes/comments totals and recent post IDs
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, like_count, comment_count, created_at")
      .eq("creator_id", user.id)

    if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })

    const total_likes = (posts || []).reduce((acc: number, p: any) => acc + (p.like_count ?? 0), 0)
    const total_comments = (posts || []).reduce((acc: number, p: any) => acc + (p.comment_count ?? 0), 0)
    const postIds = (posts || []).map((p: any) => p.id).filter(Boolean)

    // Recent transactions (payments) for this creator
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, amount, type, status, created_at, user_id, subscription_id, post_id")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    // Recent subscriptions
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("id, subscriber_id, status, amount, start_date, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    // Recent comments on creator posts
    let comments: any[] = []
    if (postIds.length > 0) {
      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, post_id, user_id, content, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: false })
        .limit(5)
      comments = commentsData || []
    }

    // Recent likes on creator posts
    let likes: any[] = []
    if (postIds.length > 0) {
      const { data: likesData } = await supabase
        .from("likes")
        .select("id, post_id, user_id, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: false })
        .limit(5)
      likes = likesData || []
    }

    // Collect all user IDs referenced in recent activity so we can fetch usernames
    const userIds = new Set<string>()
    ;(transactions || []).forEach((t: any) => t.user_id && userIds.add(t.user_id))
    ;(subscriptions || []).forEach((s: any) => s.subscriber_id && userIds.add(s.subscriber_id))
    comments.forEach((c: any) => c.user_id && userIds.add(c.user_id))
    likes.forEach((l: any) => l.user_id && userIds.add(l.user_id))

    const userIdArray = Array.from(userIds)
    let usersMap: Record<string, any> = {}
    if (userIdArray.length > 0) {
      const { data: usersData } = await supabase.from("profiles").select("id, username").in("id", userIdArray)
      ;(usersData || []).forEach((u: any) => {
        usersMap[u.id] = u
      })
    }

    // Attach username to recent items if available
    comments = comments.map((c: any) => ({ ...c, username: usersMap[c.user_id]?.username || c.user_id }))
    likes = likes.map((l: any) => ({ ...l, username: usersMap[l.user_id]?.username || l.user_id }))
    const transactionsWithUser = (transactions || []).map((t: any) => ({
      ...t,
      username: usersMap[t.user_id]?.username || t.user_id,
    }))
    const subscriptionsWithUser = (subscriptions || []).map((s: any) => ({
      ...s,
      username: usersMap[s.subscriber_id]?.username || s.subscriber_id,
    }))

    return NextResponse.json({
      profile: {
        subscribers,
        total_earnings,
        posts_count,
        is_creator: profileData?.is_creator ?? false,
      },
      metrics: {
        total_likes,
        total_comments,
      },
      recent: {
        transactions: transactionsWithUser || [],
        subscriptions: subscriptionsWithUser || [],
        comments,
        likes,
      },
    })
  } catch (err: any) {
    console.error("Dashboard metrics error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
