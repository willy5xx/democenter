import { TenantProvider, useTenant } from "@/lib/tenant-theme"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { CameraView } from "@/components/camera-view-optimized"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { TrendingUpIcon, TrendingDownIcon, Crown, Users, Brain, MapPin } from "lucide-react"
import { useNavigate } from "react-router-dom"
import tenants from "@/config/tenants.json"

function RedBullHeader() {
  const { tenant } = useTenant()
  
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear bg-gradient-to-r from-background via-background to-background" style={{ backgroundImage: tenant?.theme.gradientSubtle }}>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <div className="flex items-center gap-3">
          <img 
            src={tenant?.branding.logo} 
            alt={tenant?.name}
            className="h-8 w-auto"
            onError={(e) => {
              // Fallback if logo not found
              e.currentTarget.style.display = 'none'
            }}
          />
          <Badge className="h-5 text-[10px] bg-gradient-to-r from-yellow-400 to-yellow-600 text-black border-yellow-600 font-bold">
            <Crown className="h-3 w-3 mr-0.5" /> PRO
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
            <CardTitle className="text-2xl font-bold tabular-nums">24,871</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+18%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">People passing by all machines</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">👆 Touch Interactions</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">3,247</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+12%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">Screen touches across locations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">💰 Revenue</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">$8,942</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+22%
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
            <CardTitle className="text-2xl font-bold tabular-nums">13.1%</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+5%
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

function ProAnalytics() {
  const navigate = useNavigate()
  
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {/* Demographics - Pro Feature - Clickable */}
      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => navigate('/clients/redbull/demographics')}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Demographics</CardTitle>
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] h-4">
              PRO
            </Badge>
          </div>
          <CardDescription className="text-xs">Click for detailed analytics →</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pb-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Age 18-24</span>
              <span className="font-medium">42%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '42%' }} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Age 25-34</span>
              <span className="font-medium">35%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '35%' }} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Age 35+</span>
              <span className="font-medium">23%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '23%' }} />
            </div>
          </div>

          <Separator className="my-2" />
          
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg font-bold">58%</div>
              <div className="text-[10px] text-muted-foreground">Male</div>
            </div>
            <div>
              <div className="text-lg font-bold">42%</div>
              <div className="text-[10px] text-muted-foreground">Female</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights - Pro Feature */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">AI-Powered Insights</CardTitle>
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] h-4">
              PRO
            </Badge>
          </div>
          <CardDescription className="text-xs">Smart recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pb-3">
          <div className="rounded-lg border bg-card p-2">
            <div className="flex gap-2 items-start">
              <div className="text-xs">🎯</div>
              <div className="flex-1">
                <div className="text-xs font-medium mb-0.5">Peak Performance Alert</div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Madison Square Garden shows 34% higher engagement during sporting events. Consider stocking 2x inventory on game days.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-2">
            <div className="flex gap-2 items-start">
              <div className="text-xs">📊</div>
              <div className="flex-1">
                <div className="text-xs font-medium mb-0.5">Product Trend Detected</div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Sugar-free options seeing 48% higher selection among 25-34 age group. Expand sugar-free SKUs.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-2">
            <div className="flex gap-2 items-start">
              <div className="text-xs">💡</div>
              <div className="flex-1">
                <div className="text-xs font-medium mb-0.5">Optimization Opportunity</div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  LA Staples Center: Relocate machine 12ft north. Projected 18% engagement increase.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LocationCards() {
  const { tenant } = useTenant()
  
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {tenant?.locations?.map((location) => (
        <Card key={location.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {location.name}
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] h-4">
                {location.machines} {location.machines === 1 ? 'Machine' : 'Machines'}
              </Badge>
            </div>
            <CardDescription className="text-xs">{location.city}, {location.state}</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-base font-bold">8.2k</div>
                <div className="text-[10px] text-muted-foreground">Footfall</div>
              </div>
              <div>
                <div className="text-base font-bold">$2.1k</div>
                <div className="text-[10px] text-muted-foreground">Revenue</div>
              </div>
              <div>
                <div className="text-base font-bold">98%</div>
                <div className="text-[10px] text-muted-foreground">Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function RedBullDashboard() {
  const tenant = tenants.redbull

  return (
    <TenantProvider tenant={tenant as any}>
      <SidebarProvider>
        <SidebarInset>
          <RedBullHeader />
          <div className="flex flex-1 flex-col gap-3 p-4">
            <MetricCards />
            <ProAnalytics />
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
