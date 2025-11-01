"use client"

import { Users, Heart } from "lucide-react"
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
              <div
                key={index}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 hover:bg-black/50 transition-all duration-200 cursor-pointer group"
              >
                <img
                  src={creator.avatar_url || "/placeholder-user.jpg"}
                  alt={creator.username}
                  className="h-10 w-10 rounded-full object-cover border-2 border-[#D4AF37]/30 group-hover:border-[#D4AF37]/50 transition-all duration-200"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#D4AF37] group-hover:text-[#F4BF37] transition-colors">
                    {creator.full_name || creator.username}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#D4AF37]/70">
                    <Users className="h-3 w-3" />
                    <span>{creator.subscriber_count || 0} {t('profile.stats.subscribers')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity moved to Settings page */}
      </div>
    </aside>
  )
}
