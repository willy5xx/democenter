import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { CameraViewVirtualPTZ } from "@/components/camera-view-virtual-ptz"
import { SiteSelector } from "@/components/site-selector"
import { AdminNav } from "@/components/admin-nav"
import data from "@/app/dashboard/data.json"

function App() {
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Top Bar with Site Selector and Admin Nav */}
          <div className="flex items-center justify-between">
            <SiteSelector 
              value={selectedSiteId} 
              onChange={setSelectedSiteId}
            />
            <AdminNav />
          </div>
          
          <SectionCards />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="min-h-[300px]">
              <ChartAreaInteractive />
            </div>
            <div className="min-h-[300px]">
              <CameraViewVirtualPTZ siteId={selectedSiteId} />
            </div>
          </div>
          <DataTable data={data} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
