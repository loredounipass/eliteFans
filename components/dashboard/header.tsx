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
import { LogOut, Settings, User, Grid, Home, Globe } from "lucide-react"
import i18n from "@/lib/i18n"
import { useTranslation } from 'react-i18next'
import { useToast } from "@/hooks/use-toast"

export function DashboardHeader() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { t } = useTranslation()
  const currentLang = (i18n.language || 'es').substring(0,2).toLowerCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast({
      title: t('account.signed_out_title'),
      description: t('account.signed_out_description'),
    })
    router.push("/")
  }

  // CABECERA FIJA CON NAVEGACION
  return (
    <header className="sticky top-0 z-50 border-b border-[#D4AF37]/20 bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-0">
            <img src="/favicon.ico?v=2" alt="EliteFans" width={72} height={72} className="h-[69px] w-[69px] object-contain" />
         
        </Link>
        <nav className="flex items-center gap-6">
          {/* Language selector - moved before Dashboard */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <span className="text-sm font-semibold">{currentLang}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[#D4AF37]/20 bg-black text-[#D4AF37]">
              <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#D4AF37]/20" />
              <DropdownMenuItem
                onClick={() => {
                  i18n.changeLanguage('es')
                  try { localStorage.setItem('i18nextLng', 'es') } catch (e) { /* ignore */ }
                }}
                className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
              >
                {t('language.es')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  i18n.changeLanguage('en')
                  try { localStorage.setItem('i18nextLng', 'en') } catch (e) { /* ignore */ }
                }}
                className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
              >
                {t('language.en')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  i18n.changeLanguage('zh')
                  try { localStorage.setItem('i18nextLng', 'zh') } catch (e) { /* ignore */ }
                }}
                className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
              >
                {t('language.chinese') || 'Mandarin'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  i18n.changeLanguage('ru')
                  try { localStorage.setItem('i18nextLng', 'ru') } catch (e) { /* ignore */ }
                }}
                className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
              >
                {t('language.russian') || 'Russian'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#D4AF37]/80 transition-colors hover:text-[#D4AF37] uppercase">
            <Grid className="h-4 w-4" />
            <span>{t('dashboard.title')}</span>
          </Link>
          <Link href="/feed" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#D4AF37]/80 transition-colors hover:text-[#D4AF37] uppercase">
            <Home className="h-4 w-4" />
            <span>{t('feed.title')}</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#D4AF37] hover:bg-[#D4AF37]/10">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[#D4AF37]/20 bg-black text-[#D4AF37]">
              <DropdownMenuLabel>{t('account.my_account')}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#D4AF37]/20" />
              <DropdownMenuItem
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                    if (user && (user.user_metadata as any)?.username) {
                    router.push(`/profile/${(user.user_metadata as any).username}`)
                  } else {
                    toast({ title: t('account.profile_unavailable'), description: t('account.username_not_found') })
                  }
                }}
                className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
              >
                <User className="mr-2 h-4 w-4" />
                {t('account.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  router.push('/dashboard/settings')
                }}
                className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
              >
                <Settings className="mr-2 h-4 w-4" />
                {t('account.settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">
                <LogOut className="mr-2 h-4 w-4" />
                {t('account.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
