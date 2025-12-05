import { useTenant } from "@/lib/tenant-theme"
import { Badge } from "@/components/ui/badge"
import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BrandedHeader() {
  const { tenant } = useTenant()
  
  if (!tenant) return null

  const badgeStyles = tenant.branding.badgeColor === 'gold' 
    ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-600 shadow-lg shadow-yellow-500/50'
    : 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-black border-gray-500'

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ 
        borderBottomColor: tenant.theme.primary + '33',
        background: `linear-gradient(to right, ${tenant.theme.background}f0, ${tenant.theme.surface}f0)`
      }}
    >
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Left: Logo & Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center text-2xl font-bold"
              style={{ 
                background: tenant.theme.gradient,
                color: tenant.theme.text
              }}
            >
              {tenant.name[0]}
            </div>
            <div>
              <h1 
                className="text-xl font-bold tracking-tight"
                style={{ color: tenant.theme.text }}
              >
                {tenant.displayName}
              </h1>
              <p 
                className="text-xs"
                style={{ color: tenant.theme.textSecondary }}
              >
                {tenant.branding.tagline}
              </p>
            </div>
          </div>
          
          <Badge className={`${badgeStyles} text-xs font-bold px-3 py-1`}>
            ⭐ {tenant.branding.badgeLabel}
          </Badge>
        </div>

        {/* Center: Current Time */}
        <div className="hidden md:block text-center">
          <div 
            className="text-sm font-medium"
            style={{ color: tenant.theme.textSecondary }}
          >
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div 
            className="text-2xl font-bold tabular-nums"
            style={{ color: tenant.theme.primary }}
          >
            {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" style={{ color: tenant.theme.textSecondary }} />
            <span 
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ 
                backgroundColor: tenant.theme.primary,
                color: tenant.theme.text
              }}
            >
              3
            </span>
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" style={{ color: tenant.theme.textSecondary }} />
          </Button>
        </div>
      </div>
    </header>
  )
}












