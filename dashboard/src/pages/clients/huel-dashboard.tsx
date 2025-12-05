import { TenantProvider, useTenant } from "@/lib/tenant-theme"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { CameraView } from "@/components/camera-view-optimized"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { TrendingUpIcon, Lock, Sparkles, MapPin } from "lucide-react"
import tenants from "@/config/tenants.json"

function HuelHeader() {
  const { tenant } = useTenant()
  
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <div className="flex items-center gap-3">
          <img 
            src={tenant?.branding.logo} 
            alt={tenant?.name}
            className="h-7 w-auto"
            onError={(e) => {
              // Fallback if logo not found
              e.currentTarget.style.display = 'none'
            }}
          />
          <Badge variant="secondary" className="h-5 text-[10px] font-medium">
            STANDARD
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="h-5 text-[10px]">
            ● {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </div>
    </header>
  )
}

function MetricCards() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">👣 Footfall</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">8,241</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+12%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">People passing by machines</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">👆 Touch Interactions</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">1,047</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+8%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">Screen touches today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">💰 Revenue</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">$2,842</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+15%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">Total sales revenue</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">⚡ Engagement Rate</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">12.7%</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+3%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">Footfall to interaction ratio</p>
        </CardContent>
      </Card>
    </div>
  )
}

function UpgradeCTA() {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Unlock Pro Features</CardTitle>
            </div>
            <CardDescription>
              Upgrade to access advanced demographics, AI insights, custom reports, and more
            </CardDescription>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold">
            UPGRADE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span>Demographics</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span>AI Insights</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span>Heatmaps</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span>Custom Reports</span>
          </div>
        </div>
        <Button className="w-full md:w-auto">
          Upgrade to Pro Plan →
        </Button>
      </CardContent>
    </Card>
  )
}

function LockedFeatures() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Locked Demographics */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="font-semibold">Pro Feature</div>
            <Badge variant="secondary" className="text-[10px]">Upgrade to unlock</Badge>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-base">Demographics</CardTitle>
          <CardDescription>Customer age & gender analytics</CardDescription>
        </CardHeader>
        <CardContent className="opacity-30 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Age 18-24</span>
              <span className="font-medium">##%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Age 25-34</span>
              <span className="font-medium">##%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary" />
          </div>
        </CardContent>
      </Card>

      {/* Locked AI Insights */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="font-semibold">Pro Feature</div>
            <Badge variant="secondary" className="text-[10px]">Upgrade to unlock</Badge>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-base">AI-Powered Insights</CardTitle>
          <CardDescription>Smart recommendations for your business</CardDescription>
        </CardHeader>
        <CardContent className="opacity-30 space-y-3">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-sm font-medium mb-1">████████</div>
            <p className="text-xs text-muted-foreground">
              ████████████████████████████████
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LocationCards() {
  const { tenant } = useTenant()
  
  return (
    <div className="grid gap-4">
      {tenant?.locations?.map((location) => (
        <Card key={location.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {location.name}
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {location.machines} {location.machines === 1 ? 'Machine' : 'Machines'}
              </Badge>
            </div>
            <CardDescription>{location.city}, {location.state}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold">8.2k</div>
                <div className="text-xs text-muted-foreground">Footfall</div>
              </div>
              <div>
                <div className="text-lg font-bold">$2.8k</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
              <div>
                <div className="text-lg font-bold">99%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function HuelDashboard() {
  const tenant = tenants.huel

  return (
    <TenantProvider tenant={tenant as any}>
      <SidebarProvider>
        <SidebarInset>
          <HuelHeader />
          <div className="flex flex-1 flex-col gap-3 p-4">
            <MetricCards />
            <UpgradeCTA />
            <LockedFeatures />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="min-h-[300px]">
                <ChartAreaInteractive />
              </div>
              <div className="min-h-[300px]">
                <CameraView />
              </div>
            </div>
            <LocationCards />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TenantProvider>
  )
}
