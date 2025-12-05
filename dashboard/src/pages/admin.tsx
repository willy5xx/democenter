import { useNavigate } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { SitesSettings } from "@/components/sites-settings"
import { CalibrationSettings } from "@/components/calibration-settings"
import { OBSSetupPanel } from "@/components/obs-setup-panel"

export function AdminPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <div className="border-b">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Demo
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold text-lg">Admin Settings</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="sites" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sites">Site Configuration</TabsTrigger>
            <TabsTrigger value="calibration">Machine Calibration</TabsTrigger>
            <TabsTrigger value="obs">OBS Setup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sites" className="space-y-6 focus-visible:outline-none">
            <SitesSettings />
          </TabsContent>
          
          <TabsContent value="calibration" className="space-y-6 focus-visible:outline-none">
            <CalibrationSettings />
          </TabsContent>
          
          <TabsContent value="obs" className="space-y-6 focus-visible:outline-none">
            <OBSSetupPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

