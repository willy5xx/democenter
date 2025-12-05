import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Crown, Building2, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import tenants from "@/config/tenants.json"

export function DemoLanding() {
  const navigate = useNavigate()

  const clientDemos = [
    {
      id: 'redbull',
      tenant: tenants.redbull,
      path: '/clients/redbull',
      tier: 'pro',
      icon: '⚡',
      description: 'Energy drink company with pro-level analytics',
      features: ['Demographics', 'AI Insights', 'Custom Reports', 'Multi-location']
    },
    {
      id: 'huel',
      tenant: tenants.huel,
      path: '/clients/huel',
      tier: 'standard',
      icon: '🥤',
      description: 'Nutrition brand with standard plan features',
      features: ['Basic Analytics', 'Real-time Alerts', 'Multi-location']
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                vendVision
              </h1>
              <p className="text-sm text-gray-400 mt-1">Multi-Tenant Demo Portal</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Admin Dashboard →
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/50">
            Interactive Demo
          </Badge>
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Client Dashboard Experiences
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Explore how vendVision adapts to each client's brand with white-labeled dashboards and tier-based features
          </p>
        </div>

        {/* Client Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {clientDemos.map((demo) => {
            const isPro = demo.tier === 'pro'
            
            return (
              <Card 
                key={demo.id}
                className="group relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] hover:border-white/20 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(demo.path)}
              >
                {/* Gradient accent */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-70"
                  style={{ background: demo.tenant.theme.gradient }}
                />

                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="text-4xl w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: demo.tenant.theme.gradient }}
                    >
                      {demo.icon}
                    </div>
                    <Badge 
                      className={isPro 
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black border-yellow-600 shadow-lg shadow-yellow-500/50"
                        : "bg-gradient-to-r from-gray-300 to-gray-400 text-black border-gray-400"
                      }
                    >
                      {isPro ? (
                        <><Crown className="h-3 w-3 mr-1" /> PRO</>
                      ) : (
                        'STANDARD'
                      )}
                    </Badge>
                  </div>

                  <CardTitle className="text-2xl text-white mb-2">
                    {demo.tenant.displayName}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {demo.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Color Palette Preview */}
                  <div className="flex gap-2 mb-4">
                    <div 
                      className="h-8 flex-1 rounded-lg shadow-lg"
                      style={{ backgroundColor: demo.tenant.theme.primary }}
                      title="Primary"
                    />
                    <div 
                      className="h-8 flex-1 rounded-lg shadow-lg"
                      style={{ backgroundColor: demo.tenant.theme.secondary }}
                      title="Secondary"
                    />
                    <div 
                      className="h-8 flex-1 rounded-lg shadow-lg"
                      style={{ backgroundColor: demo.tenant.theme.accent }}
                      title="Accent"
                    />
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {demo.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: demo.tenant.theme.primary }}
                        />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className="w-full group-hover:shadow-xl transition-all"
                    style={{
                      background: demo.tenant.theme.gradient,
                      color: 'white'
                    }}
                  >
                    View Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Features Comparison */}
        <Card className="max-w-5xl mx-auto border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Feature Comparison</CardTitle>
            <CardDescription className="text-gray-400">
              See what's included in each subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-sm text-gray-400">
                <div className="font-semibold text-white mb-4">Feature</div>
                <div className="space-y-3">
                  <div>Basic Analytics</div>
                  <div>Real-time Alerts</div>
                  <div>Multi-location</div>
                  <div>Demographics</div>
                  <div>AI Insights</div>
                  <div>Custom Reports</div>
                  <div>API Access</div>
                </div>
              </div>

              <div className="text-sm text-center">
                <div className="font-semibold text-white mb-4">Standard</div>
                <div className="space-y-3">
                  <div className="text-green-400">✓</div>
                  <div className="text-green-400">✓</div>
                  <div className="text-green-400">✓</div>
                  <div className="text-gray-600">✗</div>
                  <div className="text-gray-600">✗</div>
                  <div className="text-gray-600">✗</div>
                  <div className="text-gray-600">✗</div>
                </div>
              </div>

              <div className="text-sm text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="font-semibold text-white">Pro</span>
                  <Crown className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="space-y-3 text-yellow-400">
                  <div>✓</div>
                  <div>✓</div>
                  <div>✓</div>
                  <div>✓</div>
                  <div>✓</div>
                  <div>✓</div>
                  <div>✓</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <div className="text-center mt-16">
          <Badge variant="outline" className="border-white/20 text-gray-400 mb-4">
            Coming Soon
          </Badge>
          <h3 className="text-2xl font-bold text-white mb-8">More Features In Development</h3>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-white/10 bg-white/5">
              <Building2 className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <div className="font-semibold text-white mb-2">Location Map View</div>
              <div className="text-sm text-gray-400">Interactive map for multi-site monitoring</div>
            </div>
            
            <div className="p-6 rounded-xl border border-white/10 bg-white/5">
              <Lock className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <div className="font-semibold text-white mb-2">Security Array</div>
              <div className="text-sm text-gray-400">Grid view of all live camera feeds</div>
            </div>
            
            <div className="p-6 rounded-xl border border-white/10 bg-white/5">
              <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
              <div className="font-semibold text-white mb-2">More Clients</div>
              <div className="text-sm text-gray-400">Snap Fitness & additional brands</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}












