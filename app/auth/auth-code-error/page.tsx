import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-6">
      <Card className="w-full max-w-md border-[#D4AF37] bg-black text-[#D4AF37]">
        <CardHeader>
          <CardTitle className="text-2xl">Error de Confirmación</CardTitle>
          <CardDescription className="text-[#D4AF37]/70">
            Hubo un problema al confirmar tu correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[#D4AF37]/80">
            El enlace de confirmación puede haber expirado o ya fue utilizado. Por favor intenta iniciar sesión o
            solicita un nuevo enlace de confirmación.
          </p>
          <Button asChild className="w-full bg-[#D4AF37] text-black hover:bg-[#C9A961]">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
