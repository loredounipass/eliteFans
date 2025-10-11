import { DashboardHeader } from "@/components/dashboard/header"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-48 w-full rounded-t-lg bg-[#D4AF37]/10 md:h-64" />
          <div className="rounded-b-lg border border-t-0 border-[#D4AF37]/20 bg-black/50 p-6">
            <div className="flex gap-4">
              <Skeleton className="h-24 w-24 rounded-full bg-[#D4AF37]/10 md:h-32 md:w-32" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48 bg-[#D4AF37]/10" />
                <Skeleton className="h-4 w-32 bg-[#D4AF37]/10" />
                <Skeleton className="h-4 w-64 bg-[#D4AF37]/10" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
