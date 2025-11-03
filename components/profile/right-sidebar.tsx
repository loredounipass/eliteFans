"use client"

import { Users, Heart } from "lucide-react"
import { CreatorCard } from "@/components/feed/creator-card"
import { useTranslation } from "react-i18next"

interface RightSidebarProps {
  suggestedCreators: any[]
  posts: any[]
  profile: any
}

export default function RightSidebar({ suggestedCreators, posts, profile }: RightSidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className="hidden lg:block lg:w-72">
      <div className="sticky top-0 space-y-4">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
          <h3 className="mb-3 text-base font-bold text-[#D4AF37] flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('profile.sidebar.similar_creators')}
          </h3>
          <div className="space-y-3">
            {(suggestedCreators || []).map((creator: any, index: number) => (
              <div key={index}>
                <CreatorCard
                  name={creator.full_name || creator.username}
                  username={creator.username}
                  avatar={creator.avatar_url || "/placeholder-user.jpg"}
                  coverImage={creator.cover_image || creator.cover_url || "/placeholder.jpg"}
                  subscribers={creator.subscriber_count || 0}
                  compact
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity moved to Settings page */}
      </div>
    </aside>
  )
}
