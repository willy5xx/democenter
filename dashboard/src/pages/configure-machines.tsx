import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { MachineConfigurator } from "@/components/machine-configurator"

export function ConfigureMachinesPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Configure Machine Focus Areas</h1>
              <p className="text-muted-foreground">
                Draw boxes around machines to create focus presets for demos
              </p>
            </div>
          </div>
          <MachineConfigurator />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


