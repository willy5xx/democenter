import { createContext, useContext, useEffect, ReactNode } from 'react'

export interface TenantTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  success: string
  gradient: string
  gradientSubtle?: string
}

export interface TenantBranding {
  logo: string
  badgeColor: 'gold' | 'silver'
  badgeLabel: string
  tagline: string
}

export interface TenantConfig {
  id: string
  name: string
  displayName: string
  subscriptionTier: 'pro' | 'standard'
  theme: TenantTheme
  branding: TenantBranding
  features: {
    demographics: boolean
    advancedAnalytics: boolean
    heatmaps: boolean
    aiInsights: boolean
    customReports: boolean
    realtimeAlerts: boolean
    apiAccess: boolean
    multiLocation: boolean
  }
  locations?: Array<{
    id: string
    name: string
    city: string
    state: string
    machines: number
    coordinates?: { lat: number; lng: number }
  }>
}

interface TenantContextType {
  tenant: TenantConfig | null
  setTenant: (config: TenantConfig) => void
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  setTenant: () => {},
})

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}

interface TenantProviderProps {
  children: ReactNode
  tenant: TenantConfig
}

export function TenantProvider({ children, tenant }: TenantProviderProps) {
  useEffect(() => {
    // Apply theme to CSS variables
    const root = document.documentElement
    
    root.style.setProperty('--tenant-primary', tenant.theme.primary)
    root.style.setProperty('--tenant-secondary', tenant.theme.secondary)
    root.style.setProperty('--tenant-accent', tenant.theme.accent)
    root.style.setProperty('--tenant-background', tenant.theme.background)
    root.style.setProperty('--tenant-surface', tenant.theme.surface)
    root.style.setProperty('--tenant-text', tenant.theme.text)
    root.style.setProperty('--tenant-text-secondary', tenant.theme.textSecondary)
    root.style.setProperty('--tenant-success', tenant.theme.success)
    root.style.setProperty('--tenant-gradient', tenant.theme.gradient)
    if (tenant.theme.gradientSubtle) {
      root.style.setProperty('--tenant-gradient-subtle', tenant.theme.gradientSubtle)
    }
  }, [tenant])

  return (
    <TenantContext.Provider value={{ tenant, setTenant: () => {} }}>
      {children}
    </TenantContext.Provider>
  )
}

