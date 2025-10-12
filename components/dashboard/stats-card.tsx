import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

// COMPONENTE REUTILIZABLE DE TARJETA DE ESTADISTICAS

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export function StatsCard({ title, value, icon: Icon, description }: StatsCardProps) {
  return (
    <Card className="border-[#D4AF37]/20 bg-black/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#D4AF37]/80">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[#D4AF37]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#D4AF37]">{value}</div>
        {description && <p className="text-xs text-[#D4AF37]/60">{description}</p>}
      </CardContent>
    </Card>
  )
}
