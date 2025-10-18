import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type PostRow = { id: string; like_count?: number; comment_count?: number }
type ProfileData = { is_creator?: boolean; subscriber_count?: number; total_earnings?: number; post_count?: number }
type SimpleUser = { id: string; username?: string }

const RECENT_LIMIT = 5

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    // Fetch profile and posts in parallel for speed
    const [profileRes, postsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("is_creator, subscriber_count, total_earnings, post_count")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("posts").select("id, like_count, comment_count, created_at").eq("creator_id", user.id),
    ])

    if (profileRes.error) return NextResponse.json({ error: profileRes.error.message }, { status: 500 })
    if (postsRes.error) return NextResponse.json({ error: postsRes.error.message }, { status: 500 })

    const profileData = profileRes.data as ProfileData | null
    const posts = (postsRes.data || []) as PostRow[]

    const subscribers = profileData?.subscriber_count ?? 0
    const total_earnings = profileData?.total_earnings ?? 0
    const posts_count = profileData?.post_count ?? 0

    const total_likes = posts.reduce((acc, p) => acc + (p.like_count ?? 0), 0)
    const total_comments = posts.reduce((acc, p) => acc + (p.comment_count ?? 0), 0)
    const postIds = posts.map((p) => p.id).filter(Boolean)

    // Fetch recent activity in parallel (transactions, subscriptions)
    const [transactionsRes, subscriptionsRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, amount, type, status, created_at, user_id, subscription_id, post_id")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT),
      supabase
        .from("subscriptions")
        .select("id, subscriber_id, status, amount, start_date, created_at")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT),
    ])

    if (transactionsRes.error) return NextResponse.json({ error: transactionsRes.error.message }, { status: 500 })
    if (subscriptionsRes.error) return NextResponse.json({ error: subscriptionsRes.error.message }, { status: 500 })

    const transactions = (transactionsRes.data || [])
    const subscriptions = (subscriptionsRes.data || [])

    // Fetch recent comments and likes only if there are posts
    let comments: any[] = []
    let likes: any[] = []
    if (postIds.length > 0) {
      const [commentsRes, likesRes] = await Promise.all([
        supabase
          .from("comments")
          .select("id, post_id, user_id, content, created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: false })
          .limit(RECENT_LIMIT),
        supabase
          .from("likes")
          .select("id, post_id, user_id, created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: false })
          .limit(RECENT_LIMIT),
      ])

      comments = commentsRes.data || []
      likes = likesRes.data || []
    }

    // Collect user IDs referenced in recent activity and fetch usernames
    const userIds = new Set<string>()
    ;(transactions || []).forEach((t: any) => t.user_id && userIds.add(t.user_id))
    ;(subscriptions || []).forEach((s: any) => s.subscriber_id && userIds.add(s.subscriber_id))
    comments.forEach((c: any) => c.user_id && userIds.add(c.user_id))
    likes.forEach((l: any) => l.user_id && userIds.add(l.user_id))

    const userIdArray = Array.from(userIds)
    const usersMap: Record<string, SimpleUser> = {}
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
