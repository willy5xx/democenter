import { TenantProvider, useTenant } from "@/lib/tenant-theme"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { ArrowLeft, Crown, TrendingUp, Users, Eye, Calendar, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import tenants from "@/config/tenants.json"

function DemographicsHeader() {
  const { tenant } = useTenant()
  const navigate = useNavigate()
  
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear bg-gradient-to-r from-background via-background to-background" style={{ backgroundImage: tenant?.theme.gradientSubtle }}>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8"
          onClick={() => navigate('/clients/redbull')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-base font-medium">Demographics Analytics</h1>
          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] h-5 font-bold">
            <Crown className="h-3 w-3 mr-0.5" /> PRO
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5">
            <Eye className="h-3 w-3 mr-1" />
            AI Vision Powered
          </Badge>
        </div>
      </div>
    </header>
  )
}

function DemographicsOverview() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Total Visitors</CardDescription>
          <CardTitle className="text-2xl font-bold">24,871</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>+18% vs last week</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Unique Profiles</CardDescription>
          <CardTitle className="text-2xl font-bold">18,247</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">AI-identified individuals</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Conversion Rate</CardDescription>
          <CardTitle className="text-2xl font-bold">13.1%</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">Viewers to purchasers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Avg. Dwell Time</CardDescription>
          <CardTitle className="text-2xl font-bold">42s</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">Time spent viewing</p>
        </CardContent>
      </Card>
    </div>
  )
}

function AgeAnalytics() {
  const ageGroups = [
    { range: '18-24', count: 10445, percentage: 42, growth: '+22%', avgSpend: '$3.20' },
    { range: '25-34', count: 8705, percentage: 35, growth: '+15%', avgSpend: '$4.10' },
    { range: '35-44', count: 3728, percentage: 15, growth: '+8%', avgSpend: '$3.80' },
    { range: '45-54', count: 1494, percentage: 6, growth: '+5%', avgSpend: '$3.50' },
    { range: '55+', count: 499, percentage: 2, growth: '+2%', avgSpend: '$2.90' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Age Distribution</CardTitle>
        <CardDescription className="text-xs">Detailed breakdown by age group</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          {ageGroups.map((group) => (
            <div key={group.range} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium w-16">{group.range}</span>
                  <span className="text-muted-foreground">{group.count.toLocaleString()} visitors</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-600 text-[10px]">{group.growth}</span>
                  <span className="font-medium">{group.percentage}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${group.percentage}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Avg. spend: {group.avgSpend}</span>
                <span>Conversion: {(group.percentage * 0.3).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function GenderAnalytics() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Gender Distribution</CardTitle>
        <CardDescription className="text-xs">Gender-based analytics</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950">
              <div className="text-3xl font-bold text-blue-600">58%</div>
              <div className="text-xs text-muted-foreground mt-1">Male</div>
              <div className="text-xs font-medium mt-2">14,425 visitors</div>
            </div>
            <div className="p-3 rounded-lg border bg-pink-50 dark:bg-pink-950">
              <div className="text-3xl font-bold text-pink-600">42%</div>
              <div className="text-xs text-muted-foreground mt-1">Female</div>
              <div className="text-xs font-medium mt-2">10,446 visitors</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-xs font-medium mb-2">Purchase Behavior</div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Male conversion rate</span>
              <span className="font-medium">11.2%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Female conversion rate</span>
              <span className="font-medium">15.8%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Male avg. spend</span>
              <span className="font-medium">$3.45</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Female avg. spend</span>
              <span className="font-medium">$4.20</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EthnicityAnalytics() {
  const ethnicities = [
    { group: 'White/Caucasian', percentage: 48, count: 11938 },
    { group: 'Hispanic/Latino', percentage: 22, count: 5472 },
    { group: 'Black/African American', percentage: 15, count: 3731 },
    { group: 'Asian', percentage: 10, count: 2487 },
    { group: 'Other/Mixed', percentage: 5, count: 1243 },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Ethnicity Distribution</CardTitle>
        <CardDescription className="text-xs">Diversity analytics</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2.5">
          {ethnicities.map((item) => (
            <div key={item.group} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.group}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{item.count.toLocaleString()}</span>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${item.percentage}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmotionAnalytics() {
  const emotions = [
    { emotion: '😊 Positive', percentage: 62, color: 'bg-green-500' },
    { emotion: '😐 Neutral', percentage: 28, color: 'bg-gray-500' },
    { emotion: '😟 Negative', percentage: 10, color: 'bg-red-500' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Emotion Detection</CardTitle>
        <CardDescription className="text-xs">AI-powered sentiment analysis</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          {emotions.map((item) => (
            <div key={item.emotion} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{item.emotion}</span>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.color}`} 
                    style={{ width: `${item.percentage}%` }} 
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Separator className="my-2" />
          
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Positive → Purchase rate</span>
              <span className="font-medium text-green-600">18.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neutral → Purchase rate</span>
              <span className="font-medium">8.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Negative → Purchase rate</span>
              <span className="font-medium text-red-600">2.1%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TimeBasedAnalytics() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Peak Demographics by Time</CardTitle>
        <CardDescription className="text-xs">When different groups visit</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2.5">
          <div className="rounded-lg border p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">6 AM - 10 AM</span>
              </div>
              <Badge variant="secondary" className="text-[10px] h-4">Morning Rush</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <div>• 45% Age 25-34 (commuters)</div>
              <div>• 65% Male</div>
              <div>• High conversion: 16.2%</div>
            </div>
          </div>

          <div className="rounded-lg border p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">12 PM - 2 PM</span>
              </div>
              <Badge variant="secondary" className="text-[10px] h-4">Lunch Peak</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <div>• 48% Age 18-24 (students)</div>
              <div>• 52% Female</div>
              <div>• Highest traffic period</div>
            </div>
          </div>

          <div className="rounded-lg border p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">6 PM - 10 PM</span>
              </div>
              <Badge variant="secondary" className="text-[10px] h-4">Evening</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <div>• 40% Age 18-24 (social)</div>
              <div>• 55% Male</div>
              <div>• Group purchases common</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AdvancedInsights() {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">AI Vision Insights</CardTitle>
        <CardDescription className="text-xs">Advanced behavioral analysis</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border p-2 bg-blue-50 dark:bg-blue-950">
            <div className="text-xs font-medium mb-1">👥 Group Behavior</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              23% of purchases made by groups of 2-3. Groups spend 47% more on average ($6.20 vs $4.20). Peak group times: evenings and weekends.
            </p>
          </div>

          <div className="rounded-lg border p-2 bg-purple-50 dark:bg-purple-950">
            <div className="text-xs font-medium mb-1">👀 Attention Tracking</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Avg. 2.3 products viewed before purchase. Top-shelf items get 3x more attention. Eye-level products convert 2.1x better.
            </p>
          </div>

          <div className="rounded-lg border p-2 bg-green-50 dark:bg-green-950">
            <div className="text-xs font-medium mb-1">🎯 Product Preferences</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              18-24 prefer sugar-free (62%). 35+ prefer original (71%). Female shoppers choose tropical flavors 3x more than male shoppers.
            </p>
          </div>

          <div className="rounded-lg border p-2 bg-orange-50 dark:bg-orange-950">
            <div className="text-xs font-medium mb-1">⏱️ Decision Speed</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Fast deciders (&lt;15s) have 85% purchase rate. Browsers (45s+) only 22%. Optimize for quick, confident decisions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function RedBullDemographics() {
  const tenant = tenants.redbull

  return (
    <TenantProvider tenant={tenant as any}>
      <SidebarProvider>
        <SidebarInset>
          <DemographicsHeader />
          <div className="flex flex-1 flex-col gap-3 p-4 max-w-7xl mx-auto">
            <DemographicsOverview />
            
            <div className="grid gap-3 md:grid-cols-2">
              <AgeAnalytics />
              <GenderAnalytics />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <EthnicityAnalytics />
              <EmotionAnalytics />
              <TimeBasedAnalytics />
            </div>

            <AdvancedInsights />

            <div className="min-h-[300px]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Visitor Trends Over Time</CardTitle>
                  <CardDescription className="text-xs">Historical demographic patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartAreaInteractive />
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TenantProvider>
  )
}

