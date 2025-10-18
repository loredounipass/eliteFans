import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

type ProfileRow = {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
}

const DEFAULT_LIMIT = 6
const MAX_LIMIT = 50

function parseQueryParams(req: Request) {
  const url = new URL(req.url)
  const rawQ = (url.searchParams.get("q") || "").toString().trim()
  const q = rawQ
  let limit = Number(url.searchParams.get("limit") || DEFAULT_LIMIT)
  if (!Number.isFinite(limit) || limit <= 0) limit = DEFAULT_LIMIT
  limit = Math.min(limit, MAX_LIMIT)
  return { q, limit }
}

async function fetchProfiles(supabase: any, q: string, limit: number) {
  const pattern = `%${q}%` // contains match; change to `${q}%` for prefix-only
  return supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .or(`username.ilike.${pattern},full_name.ilike.${pattern}`)
    .limit(limit)
}

export async function GET(req: Request) {
  try {
    const { q, limit } = parseQueryParams(req)

    if (!q) return NextResponse.json({ ok: true, users: [] })

    const supabase = await createServerClient()

    const { data, error } = await fetchProfiles(supabase, q, limit)

    const found = Array.isArray(data) ? data.length : 0
    console.debug("Search users q=", q, "limit=", limit, "found=", found)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, users: (data as ProfileRow[]) || [] })
  } catch (err: any) {
    console.error("Search users error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
