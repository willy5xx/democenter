import { useTenant } from "@/lib/tenant-theme"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ThemedMetricCardProps {
  icon: string
  title: string
  value: string | number
  change?: number
  description: string
  footer?: string
  locked?: boolean
}

export function ThemedMetricCard({ 
  icon, 
  title, 
  value, 
  change, 
  description, 
  footer,
  locked = false 
}: ThemedMetricCardProps) {
  const { tenant } = useTenant()
  
  if (!tenant) return null

  const isPositive = change !== undefined && change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card 
      className="relative overflow-hidden transition-all hover:shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${tenant.theme.surface} 0%, ${tenant.theme.background}20 100%)`,
        borderColor: tenant.theme.primary + '40'
      }}
    >
      {/* Gradient accent on top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: tenant.theme.gradient }}
      />

      <CardHeader className="relative">
        <CardDescription style={{ color: tenant.theme.textSecondary }}>
          {icon} {title}
        </CardDescription>
        <CardTitle 
          className="text-3xl font-bold tabular-nums"
          style={{ color: tenant.theme.text }}
        >
          {locked ? (
            <div className="flex items-center gap-2">
              <span className="blur-sm">###</span>
              <Badge variant="outline" className="text-xs">
                🔒 PRO
              </Badge>
            </div>
          ) : (
            value
          )}
        </CardTitle>
        
        {change !== undefined && !locked && (
          <div className="absolute right-4 top-4">
            <Badge 
              variant="outline" 
              className="flex gap-1 rounded-lg text-xs font-semibold"
              style={{
                borderColor: isPositive ? tenant.theme.success : tenant.theme.secondary,
                color: isPositive ? tenant.theme.success : tenant.theme.secondary,
                backgroundColor: (isPositive ? tenant.theme.success : tenant.theme.secondary) + '20'
              }}
            >
              <TrendIcon className="size-3" />
              {isPositive ? '+' : ''}{change}%
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardFooter className="flex-col items-start gap-1 text-sm">
        {!locked && change !== undefined && (
          <div 
            className="line-clamp-1 flex gap-2 font-medium"
            style={{ color: tenant.theme.text }}
          >
            {isPositive ? 'Trending up' : 'Trending down'} <TrendIcon className="size-4" />
          </div>
        )}
        <div style={{ color: tenant.theme.textSecondary }}>
          {locked ? 'Upgrade to Pro to see detailed analytics' : description}
        </div>
        {footer && !locked && (
          <div 
            className="text-xs mt-2 font-medium"
            style={{ color: tenant.theme.primary }}
          >
            {footer}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

