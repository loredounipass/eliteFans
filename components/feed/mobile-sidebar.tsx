"use client"

import { Sparkles, Users, TrendingUp, Filter, MessageSquare } from "lucide-react"

interface Props {
  activeTab: 'parati' | 'siguiendo' | 'popular'
  setActiveTab: (t: 'parati' | 'siguiendo' | 'popular') => void
  onOpenFilters: () => void
  onOpenSubscriptions?: () => void
  onOpenChat?: () => void
}

export function MobileSidebar({ activeTab, setActiveTab, onOpenFilters, onOpenSubscriptions, onOpenChat }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-black/80 backdrop-blur-md rounded-none px-4 py-2 shadow-lg lg:hidden">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveTab('parati')} className={`flex flex-col items-center text-xs ${activeTab === 'parati' ? 'text-[#D4AF37]' : 'text-[#D4AF37]/70'}`}>
          <Sparkles className="h-5 w-5" />
          <span className="mt-0.5">Para ti</span>
        </button>
        <button onClick={() => setActiveTab('siguiendo')} className={`flex flex-col items-center text-xs ${activeTab === 'siguiendo' ? 'text-[#D4AF37]' : 'text-[#D4AF37]/70'}`}>
          <Users className="h-5 w-5" />
          <span className="mt-0.5">Siguiendo</span>
        </button>
        <button onClick={() => setActiveTab('popular')} className={`flex flex-col items-center text-xs ${activeTab === 'popular' ? 'text-[#D4AF37]' : 'text-[#D4AF37]/70'}`}>
          <TrendingUp className="h-5 w-5" />
          <span className="mt-0.5">Popular</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onOpenFilters} aria-label="Abrir filtros" className="flex flex-col items-center text-xs text-[#D4AF37]/70">
          <Filter className="h-5 w-5" />
          <span className="mt-0.5">Filtros</span>
        </button>
        <button onClick={onOpenSubscriptions} className="flex flex-col items-center text-xs text-[#D4AF37]/70">
          <Users className="h-5 w-5" />
          <span className="mt-0.5">Suscripciones</span>
        </button>
        <button onClick={onOpenChat} className="flex flex-col items-center text-xs text-[#D4AF37]/70">
          <MessageSquare className="h-5 w-5" />
          <span className="mt-0.5">Chat</span>
        </button>
      </div>
    </nav>
  )
}

