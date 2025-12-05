# 🎨 vendVision Multi-Tenant Dashboard System

## Overview

The vendVision dashboard now supports **white-labeled, multi-tenant experiences** with subscription tier-based feature gating. Each client gets their own branded dashboard with custom colors, logos, and feature sets.

---

## 🌐 Live Demo URLs

Access the dashboards at these URLs when running `npm run dev`:

### Demo Portal
- **http://localhost:5173/demo** - Interactive landing page showcasing all client dashboards

### Admin Dashboard
- **http://localhost:5173/** - Internal admin dashboard (full features)
- **http://localhost:5173/configure** - Machine configuration tool

### Client Dashboards

#### Red Bull (Pro Plan) ⚡
- **URL:** http://localhost:5173/clients/redbull
- **Tier:** PRO (Gold Badge)
- **Features:**
  - ✅ Advanced Demographics
  - ✅ AI-Powered Insights
  - ✅ Customer Heatmaps
  - ✅ Custom Reports
  - ✅ Real-time Alerts
  - ✅ API Access
  - ✅ Multi-location Support
  - ✅ Unlimited Historical Data

**Brand Colors:**
- Primary: `#E40521` (Red Bull Red)
- Secondary: `#FFD100` (Gold)
- Accent: `#0051A5` (Blue)
- Background: `#000000` (Black)

---

#### Huel (Standard Plan) 🥤
- **URL:** http://localhost:5173/clients/huel
- **Tier:** STANDARD (Silver Badge)
- **Features:**
  - ✅ Basic Analytics
  - ✅ Real-time Alerts
  - ✅ Multi-location Support
  - ✅ Standard Reports
  - ❌ Demographics (Locked - Upgrade Required)
  - ❌ AI Insights (Locked - Upgrade Required)
  - ❌ Custom Reports (Locked - Upgrade Required)
  - ❌ API Access (Locked - Upgrade Required)

**Brand Colors:**
- Primary: `#F26C4F` (Huel Orange)
- Secondary: `#00C896` (Huel Mint)
- Accent: `#4A4A4A` (Gray)
- Background: `#FAFAFA` (Light Gray)

---

## 🏗️ Architecture

### File Structure

```
src/
├── config/
│   ├── tenants.json              # Client configurations
│   └── subscription-tiers.json   # Tier definitions
│
├── lib/
│   └── tenant-theme.tsx          # Theme provider & context
│
├── components/
│   └── tenant-branded/
│       ├── branded-header.tsx    # Dynamic header with logo/badge
│       └── themed-metric-card.tsx # Branded metric cards
│
└── pages/
    ├── demo-landing.tsx          # Demo portal
    └── clients/
        ├── redbull-dashboard.tsx # Red Bull Pro dashboard
        └── huel-dashboard.tsx    # Huel Standard dashboard
```

---

## 📝 How to Add a New Client

### Step 1: Add Tenant Configuration

Edit `src/config/tenants.json`:

```json
{
  "newclient": {
    "id": "newclient",
    "name": "New Client",
    "displayName": "New Client Vending",
    "subscriptionTier": "pro",
    "theme": {
      "primary": "#FF0000",
      "secondary": "#00FF00",
      "accent": "#0000FF",
      "background": "#FFFFFF",
      "surface": "#F5F5F5",
      "text": "#000000",
      "textSecondary": "#666666",
      "success": "#00FF00",
      "gradient": "linear-gradient(135deg, #FF0000 0%, #0000FF 100%)"
    },
    "branding": {
      "logo": "/logos/newclient-logo.svg",
      "badgeColor": "gold",
      "badgeLabel": "PRO",
      "tagline": "Your tagline here"
    },
    "features": {
      "demographics": true,
      "advancedAnalytics": true,
      "heatmaps": true,
      "aiInsights": true,
      "customReports": true,
      "realtimeAlerts": true,
      "apiAccess": true,
      "multiLocation": true
    },
    "locations": [
      {
        "id": "newclient-location-1",
        "name": "Location Name",
        "city": "City",
        "state": "ST",
        "machines": 2
      }
    ]
  }
}
```

### Step 2: Create Dashboard Component

Create `src/pages/clients/newclient-dashboard.tsx`:

```tsx
import { TenantProvider } from "@/lib/tenant-theme"
import { BrandedHeader } from "@/components/tenant-branded/branded-header"
import { ThemedMetricCard } from "@/components/tenant-branded/themed-metric-card"
import { CameraView } from "@/components/camera-view-optimized"
import tenants from "@/config/tenants.json"

export function NewClientDashboard() {
  const tenant = tenants.newclient

  return (
    <TenantProvider tenant={tenant as any}>
      <div style={{ backgroundColor: tenant.theme.background }}>
        <BrandedHeader />
        
        <main className="container mx-auto p-6 space-y-6">
          {/* Add your dashboard content here */}
          <ThemedMetricCard
            icon="👣"
            title="Footfall"
            value="12,345"
            change={15}
            description="People passing by today"
          />
          
          {/* Camera feed */}
          <CameraView />
        </main>
      </div>
    </TenantProvider>
  )
}
```

### Step 3: Add Route

Edit `src/main.tsx`:

```tsx
import { NewClientDashboard } from './pages/clients/newclient-dashboard.tsx'

// In the Routes section:
<Route path="/clients/newclient" element={<NewClientDashboard />} />
```

### Step 4: Test

Navigate to: **http://localhost:5173/clients/newclient**

---

## 🎨 Theming System

The theme provider automatically applies CSS variables based on tenant configuration:

```css
--tenant-primary
--tenant-secondary
--tenant-accent
--tenant-background
--tenant-surface
--tenant-text
--tenant-text-secondary
--tenant-success
--tenant-gradient
```

Use these in your components:

```tsx
<div style={{ 
  backgroundColor: tenant.theme.primary,
  color: tenant.theme.text 
}}>
  Content
</div>
```

Or use the `useTenant()` hook:

```tsx
import { useTenant } from "@/lib/tenant-theme"

export function MyComponent() {
  const { tenant } = useTenant()
  
  return (
    <div style={{ color: tenant.theme.primary }}>
      {tenant.displayName}
    </div>
  )
}
```

---

## 🔒 Feature Gating

Check if a feature is available:

```tsx
const { tenant } = useTenant()

if (tenant.features.demographics) {
  // Show demographics chart
} else {
  // Show upgrade CTA
}
```

Use the `locked` prop on ThemedMetricCard:

```tsx
<ThemedMetricCard
  icon="👥"
  title="Demographics"
  value="N/A"
  description="Age and gender analytics"
  locked={!tenant.features.demographics}
/>
```

---

## 🏆 Subscription Tiers

### Pro Plan (Gold Badge) ⭐
- All features unlocked
- Advanced analytics
- Unlimited data retention
- API access
- Priority support

### Standard Plan (Silver Badge)
- Basic analytics only
- 30-day data retention
- No API access
- Standard support
- Locked pro features shown with upgrade CTA

---

## 📊 Demo Metrics

All dashboards currently use **mock data**. When ready to integrate real metrics:

1. Create API endpoint: `/api/metrics/:tenantId`
2. Add React Query for data fetching
3. Update ThemedMetricCard with real values
4. Add WebSocket for real-time updates

---

## 🚀 Next Steps

### Planned Features

1. **Location Map View** 🗺️
   - Interactive map showing all machine locations
   - Click location to see machines
   - Snap Fitness multi-location demo

2. **Security Array View** 📹
   - Grid of all live camera feeds
   - Quick monitoring dashboard
   - Full-screen mode

3. **Real Data Integration** 📈
   - Connect to actual vending machine APIs
   - Real-time metrics
   - Historical data charts

4. **More Clients** 🏢
   - Snap Fitness (Standard Plan)
   - Additional demo clients

---

## 🎯 Best Practices

### Adding Custom Components

Always wrap client dashboards with `TenantProvider`:

```tsx
<TenantProvider tenant={tenant as any}>
  {/* Your dashboard content */}
</TenantProvider>
```

### Styling Guidelines

1. Use tenant theme colors via `style` props
2. Respect dark/light theme preferences
3. Keep consistent spacing and sizing
4. Use themed components when available

### Performance

- Lazy load dashboard routes
- Optimize images
- Cache API responses
- Use React.memo for heavy components

---

## 📞 Quick Reference

```bash
# Start dev server
npm run dev

# Access dashboards
http://localhost:5173/demo           # Demo portal
http://localhost:5173/clients/redbull  # Red Bull Pro
http://localhost:5173/clients/huel     # Huel Standard

# Admin tools
http://localhost:5173/                # Admin dashboard
http://localhost:5173/configure       # Machine configurator
```

---

## 💡 Tips

1. **Testing Different Brands:** Use `/demo` to quickly navigate between all client dashboards
2. **Customizing Themes:** Edit `tenants.json` and refresh - changes apply instantly
3. **Adding Locations:** Update the `locations` array in tenant config
4. **Feature Flags:** Use `tenant.features` object to gate functionality
5. **Badge Colors:** Supports `gold` (Pro) or `silver` (Standard)

---

## 🐛 Troubleshooting

**Dashboard not loading?**
- Check tenant ID matches filename
- Verify tenants.json syntax
- Check browser console for errors

**Colors not applying?**
- Ensure TenantProvider wraps your component
- Verify theme values in tenants.json
- Check CSS variables in DevTools

**Features not gating correctly?**
- Verify `subscriptionTier` in tenants.json
- Check `features` object configuration
- Use `useTenant()` hook to access config

---

**Built with** ⚡ React + TypeScript + Vite + Shadcn UI

Last Updated: October 4, 2025












