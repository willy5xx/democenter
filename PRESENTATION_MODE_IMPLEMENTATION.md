# Presentation Mode Implementation Guide

> **For LLM Implementation**: This document contains specifications for restructuring the demo-center app to be presentation-first. Follow each section in order.

---

## Overview

### Current State
- `/` → Dashboard with metrics + small camera view
- `/demo` → Landing page for client demos

### Target State  
- `/` → **Full-screen Presentation** (camera stream + machine view buttons)
- `/dashboard` → Metrics dashboard (move current `/` here)
- `/admin/*` → Admin pages (unchanged)
- `/clients/*` → Client dashboards (unchanged)

---

## Task 1: Create Presentation Page

### File to Create
`dashboard/src/pages/presentation.tsx`

### Requirements
- Full viewport height (`h-screen w-screen`)
- Dark background (`bg-black` or `bg-gradient-to-b from-gray-950 to-black`)
- NO sidebar, NO header - clean presentation view
- Camera stream takes ~85% of vertical space
- Machine selector buttons in bottom bar (~15%)

### Component Structure

```tsx
// Import the existing camera component
import { CameraViewVirtualPTZ } from "@/components/camera-view-virtual-ptz"

// State needed:
// - siteId: number | null (fetch first site from backend on mount)
// - machineRegions: array from backend API
// - currentRegionId: number | null (which view is active)
// - showControls: boolean (show navigation on hover)

// Layout structure:
<div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
  
  {/* Camera Container - flex-1 to fill available space */}
  <div className="flex-1 relative min-h-0">
    {/* Use existing CameraViewVirtualPTZ component */}
    {/* Pass siteId prop */}
    
    {/* Hover Controls - absolute positioned top-right */}
    {/* Show on hover with opacity transition */}
    {/* Buttons: Dashboard link, Fullscreen toggle, Settings link */}
  </div>
  
  {/* Bottom Bar - Machine Selector */}
  <div className="h-24 bg-gray-900/90 backdrop-blur-xl border-t border-white/10 flex-shrink-0">
    {/* Center the buttons horizontally */}
    {/* "Full View" button + one button per machine region */}
  </div>
  
</div>
```

### Machine Button Design
- Size: Large and touch-friendly (`min-w-36 h-14` or similar)
- Layout: Icon on left, label on right (or stacked)
- Active state: Primary/accent color with subtle glow
- Inactive state: Ghost/outline variant
- Use shadcn `Button` component with variants

### API Endpoints to Fetch
1. `GET http://localhost:3001/api/sites` → Get first site ID
2. `GET http://localhost:3001/api/machine-regions?site_id={id}` → Get machine regions for buttons

### Hover Controls (Top Right)
```tsx
<div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
  <Button variant="secondary" size="sm" asChild>
    <Link to="/dashboard">📊 Dashboard</Link>
  </Button>
  <Button variant="secondary" size="sm" onClick={handleFullscreen}>
    ⛶ Fullscreen
  </Button>
  <Button variant="secondary" size="sm" asChild>
    <Link to="/admin/sites">⚙️</Link>
  </Button>
</div>
```

### Fullscreen Function
```tsx
const handleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}
```

---

## Task 2: Update Routes

### File to Modify
`dashboard/src/main.tsx`

### Current Routes (lines 18-32)
```tsx
<Routes>
  <Route path="/demo" element={<DemoLanding />} />
  <Route path="/" element={<App />} />
  <Route path="/configure" element={<ConfigureMachinesPage />} />
  // ... etc
</Routes>
```

### New Routes
```tsx
import { PresentationPage } from './pages/presentation.tsx'

<Routes>
  {/* Presentation Mode - NEW HOME */}
  <Route path="/" element={<PresentationPage />} />
  
  {/* Dashboard with metrics - MOVED from / */}
  <Route path="/dashboard" element={<App />} />
  
  {/* Demo Portal */}
  <Route path="/demo" element={<DemoLanding />} />
  
  {/* Admin Pages - unchanged */}
  <Route path="/configure" element={<ConfigureMachinesPage />} />
  <Route path="/admin/sites" element={<AdminSitesPage />} />
  <Route path="/admin/calibrate" element={<AdminCalibratePage />} />
  
  {/* Client Dashboards - unchanged */}
  <Route path="/clients/redbull" element={<RedBullDashboard />} />
  <Route path="/clients/redbull/demographics" element={<RedBullDemographics />} />
  <Route path="/clients/huel" element={<HuelDashboard />} />
</Routes>
```

### Import to Add
```tsx
import { PresentationPage } from './pages/presentation.tsx'
```

---

## Task 3: Update Dashboard Navigation Links

### Files to Check/Modify
- `dashboard/src/components/app-sidebar.tsx`
- `dashboard/src/components/admin-nav.tsx`
- `dashboard/src/pages/demo-landing.tsx`

### Changes Needed
Any links pointing to `/` that expect the dashboard should now point to `/dashboard`.

Example in `demo-landing.tsx` (around line 44-49):
```tsx
// Change this:
<Button onClick={() => navigate('/')}>Admin Dashboard →</Button>

// To this:
<Button onClick={() => navigate('/dashboard')}>Admin Dashboard →</Button>
```

Search for `navigate('/')` and `to="/"` and update as appropriate.

---

## Task 4: Optional - Modify Camera Component for Presentation Mode

### File to Modify (Optional)
`dashboard/src/components/camera-view-virtual-ptz.tsx`

### Why This Might Be Needed
The `CameraViewVirtualPTZ` component currently includes its own machine selector buttons at the bottom. For the presentation page, we want to control these externally.

### Option A: Add a `hideControls` prop
```tsx
interface CameraViewVirtualPTZProps {
  siteId?: number | null
  hideControls?: boolean  // NEW: hide internal machine buttons
  onRegionChange?: (regionId: number | null) => void  // NEW: callback
  externalRegionId?: number | null  // NEW: controlled from parent
}
```

### Option B: Keep it simple
Just use the component as-is on the presentation page. The duplicate machine buttons (component's internal ones + presentation page's bottom bar) won't show if we style the presentation page's camera container to hide overflow or if we modify the component.

**Recommendation**: Start with Option B (simpler), only do Option A if needed.

---

## Reference: Existing Component Props

### CameraViewVirtualPTZ (current)
Location: `dashboard/src/components/camera-view-virtual-ptz.tsx`

```tsx
interface CameraViewVirtualPTZProps {
  siteId?: number | null
}
```

The component:
- Fetches site and machine regions from backend
- Handles WebRTC connection to go2rtc
- Renders video with CSS transform for virtual PTZ
- Has internal state for `currentRegionId`
- Renders machine selector buttons internally

---

## Reference: API Response Shapes

### GET /api/sites
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Demo Center",
      "camera_url": "rtsp://...",
      "camera_type": "fisheye",
      "stream_resolution": "1920x1080"
    }
  ]
}
```

### GET /api/machine-regions?site_id=1
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "site_id": 1,
      "name": "Snack Machine",
      "icon": "🍫",
      "x": 100,
      "y": 50,
      "width": 400,
      "height": 600,
      "is_default": false,
      "display_order": 1
    }
  ]
}
```

---

## Testing Checklist

After implementation, verify:

- [ ] `http://localhost:5173/` shows full-screen presentation view
- [ ] `http://localhost:5173/dashboard` shows metrics dashboard
- [ ] Camera stream loads on presentation page
- [ ] Machine buttons switch views with smooth animation
- [ ] "Full View" button resets to wide shot
- [ ] Hover controls appear in top-right
- [ ] Fullscreen button works
- [ ] Dashboard link navigates correctly
- [ ] Admin pages still work (`/admin/sites`, `/admin/calibrate`)
- [ ] Client demos still work (`/clients/redbull`, etc.)

---

## Styling Notes

### Use these shadcn components:
- `Button` from `@/components/ui/button`
- `Badge` from `@/components/ui/badge` (for "Live" indicator if needed)

### Color Palette for Presentation Page
- Background: `bg-black` or `bg-gray-950`
- Bottom bar: `bg-gray-900/90 backdrop-blur-xl`
- Border: `border-white/10`
- Active button: Use primary color or white
- Inactive button: `variant="ghost"` or `variant="outline"`

### Typography
- Machine labels: `text-sm font-medium text-white`
- Consider `font-mono` for any stats/badges

---

## Files Summary

| Action | File Path |
|--------|-----------|
| CREATE | `dashboard/src/pages/presentation.tsx` |
| MODIFY | `dashboard/src/main.tsx` |
| CHECK  | `dashboard/src/components/app-sidebar.tsx` |
| CHECK  | `dashboard/src/components/admin-nav.tsx` |
| CHECK  | `dashboard/src/pages/demo-landing.tsx` |
| OPTIONAL | `dashboard/src/components/camera-view-virtual-ptz.tsx` |










