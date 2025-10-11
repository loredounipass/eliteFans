import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserX } from "lucide-react"

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <UserX className="mb-4 h-16 w-16 text-[#D4AF37]/50" />
          <h1 className="mb-2 text-3xl font-bold text-[#D4AF37]">Perfil no encontrado</h1>
          <p className="mb-6 text-[#D4AF37]/60">El usuario que buscas no existe o ha sido eliminado.</p>
          <Link href="/feed">
            <Button className="bg-[#D4AF37] text-black hover:bg-[#C9A961]">Volver al Feed</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
