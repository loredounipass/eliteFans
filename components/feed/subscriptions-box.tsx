"use client"

import { SubscriptionsSection } from "./subscriptions-section"
import { ChatSection } from "./chat-section"

export function SubscriptionsBox() {
  return (
    <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm p-4 shadow-lg shadow-[#D4AF37]/5">
      <h4 className="mb-2 text-sm font-bold text-[#D4AF37]">Suscripciones y Chat</h4>
  {/* Introducción eliminada; la caja mostrará las secciones Suscripciones y Chat */}

      <div className="mt-4 space-y-4">
        <SubscriptionsSection />
        <ChatSection />
      </div>
    </div>
  )
}

