"use client"
// USAR <img> SIMPLE PARA EL FAVICON EN LA BARRA DE NAVEGACION
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { LogOut, Settings, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DashboardHeader() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
    })
    router.push("/")
  }

  // CABECERA FIJA CON NAVEGACION
  return (
    <header className="sticky top-0 z-50 border-b border-[#D4AF37]/20 bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/favicon.ico?v=2" alt="ElitFans" width={56} height={56} className="h-14 w-14 object-contain" />
          <span className="text-2xl font-extrabold tracking-wide text-[#D4AF37]">ElitFans</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-wide text-[#D4AF37]/80 transition-colors hover:text-[#D4AF37] uppercase"
          >
            Dashboard
          </Link>
          <Link href="/feed" className="text-sm font-semibold tracking-wide text-[#D4AF37]/80 transition-colors hover:text-[#D4AF37] uppercase">
            Feed
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#D4AF37] hover:bg-[#D4AF37]/10">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[#D4AF37]/20 bg-black text-[#D4AF37]">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#D4AF37]/20" />
              <DropdownMenuItem className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
