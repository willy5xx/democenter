import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CameraViewVirtualPTZ } from "@/components/camera-view-virtual-ptz"
import { SiteSelector } from "@/components/site-selector"
import { Maximize, Settings, Monitor, Video, VideoOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Custom Vending Machine Icon
const VendingMachineIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <rect x="8" y="5" width="8" height="10" rx="1" />
    <path d="M8 19h8" />
  </svg>
)

interface MachineRegion {
  id: number
  site_id: number
  name: string
  icon: string
  x: number
  y: number
  width: number
  height: number
  is_default: boolean
  display_order: number
}

interface Site {
  id: number
  name: string
  camera_url: string
  camera_type: string
  stream_resolution: string
}

export function PresentationPage() {
  const navigate = useNavigate()
  const [siteId, setSiteId] = useState<number | null>(null)
  const [machineRegions, setMachineRegions] = useState<MachineRegion[]>([])
  const [currentRegionId, setCurrentRegionId] = useState<number | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [obsConnected, setObsConnected] = useState(false)
  const [virtualCamActive, setVirtualCamActive] = useState(false)
  const [obsLoading, setObsLoading] = useState(false)

  // Check OBS status periodically
  useEffect(() => {
    const checkObsStatus = async () => {
      try {
        const res = await fetch('/api/obs/status')
        const data = await res.json()
        
        if (data.success && data.obs) {
          setObsConnected(data.obs.connected)
          setVirtualCamActive(data.obs.virtualCamActive)
        }
      } catch (err) {
        console.error('Error checking OBS status:', err)
        setObsConnected(false)
      }
    }

    checkObsStatus()
    const interval = setInterval(checkObsStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const toggleVirtualCam = async () => {
    setObsLoading(true)
    try {
      const action = virtualCamActive ? 'stop' : 'start'
      const res = await fetch('/api/obs/virtual-cam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const data = await res.json()
      if (data.success) {
        setVirtualCamActive(action === 'start')
        toast.success(`Virtual Camera ${action === 'start' ? 'Started' : 'Stopped'}`)
      } else {
        toast.error(`Failed: ${data.error}`)
      }
    } catch (err) {
      console.error('Error toggling virtual cam:', err)
      toast.error('Failed to communicate with OBS')
    } finally {
      setObsLoading(false)
    }
  }

  // Fetch machine regions when siteId changes
  useEffect(() => {
    if (!siteId) return

    const fetchRegions = async () => {
      try {
        const regionsRes = await fetch(`http://localhost:3001/api/machine-regions?site_id=${siteId}`)
        const regionsData = await regionsRes.json()
        
        if (regionsData.success) {
          setMachineRegions(regionsData.data)
          
          // Default to Full View (null) instead of the default region
          // This ensures a consistent starting state on refresh
          setCurrentRegionId(null)
        }
      } catch (err) {
        console.error('Error fetching regions:', err)
      }
    }

    fetchRegions()
  }, [siteId])

  // Initial site fetch
  useEffect(() => {
    const fetchInitialSite = async () => {
      try {
        const sitesRes = await fetch('http://localhost:3001/api/sites')
        const sitesData = await sitesRes.json()
        
        if (sitesData.success && sitesData.data.length > 0 && !siteId) {
          setSiteId(sitesData.data[0].id)
        }
      } catch (err) {
        console.error('Error fetching sites:', err)
      }
    }
    
    fetchInitialSite()
  }, [])

  // Listen for SSE updates to machine regions
  useEffect(() => {
    if (!siteId) return
    
    const eventSource = new EventSource('http://localhost:3001/api/events')
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'region_created' || data.type === 'region_updated' || data.type === 'region_deleted') {
        // Refetch regions
        fetch(`http://localhost:3001/api/machine-regions?site_id=${siteId}`)
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              setMachineRegions(result.data)
            }
          })
      }
    }
    
    return () => eventSource.close()
  }, [siteId])

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  const handleRegionSwitch = (regionId: number | null) => {
    setCurrentRegionId(regionId)
  }

  // Keyboard shortcuts: 1 = Full View, 2 = Machine 1, 3 = Machine 2, etc.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = e.key
      
      // Only handle number keys 1-9
      if (!/^[1-9]$/.test(key)) return

      const num = parseInt(key, 10)
      
      if (num === 1) {
        // '1' = Full View
        handleRegionSwitch(null)
        toast.success('Full View', { duration: 1500 })
      } else {
        // '2' = first machine, '3' = second machine, etc.
        const sortedRegions = [...machineRegions].sort((a, b) => a.display_order - b.display_order)
        const regionIndex = num - 2 // '2' maps to index 0
        
        if (regionIndex >= 0 && regionIndex < sortedRegions.length) {
          const region = sortedRegions[regionIndex]
          handleRegionSwitch(region.id)
          toast.success(`${region.name}`, { duration: 1500 })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [machineRegions])

  return (
    <div 
      className="h-screen w-screen bg-gradient-to-b from-gray-950 to-black flex flex-col overflow-hidden"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Camera Container - flex-1 to fill available space */}
      <div className="flex-1 relative min-h-0">
        {/* Use existing CameraViewVirtualPTZ with controls hidden */}
        <CameraViewVirtualPTZ 
          siteId={siteId} 
          hideControls={true}
          externalRegionId={currentRegionId}
          onRegionChange={setCurrentRegionId}
        />
        
      </div>
      {/* Bottom Bar - Machine Selector */}
      <div className="h-16 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 flex-shrink-0 px-4 flex items-center justify-between gap-4">
        {/* Spacer for balance if needed, or Site Selector could go here */}
        <div className="flex-1" />

        {/* Center: Region Buttons */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar px-2">
          {/* Full View Button */}
          <Button
            variant={currentRegionId === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleRegionSwitch(null)}
            className={`min-w-28 h-10 text-xs transition-all border ${
              currentRegionId === null 
                ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.25)] border-white' 
                : 'text-white/60 hover:text-white hover:bg-white/10 border-white/5'
            }`}
          >
            <kbd className={`text-[10px] font-mono px-1 py-0.5 rounded mr-1.5 ${
              currentRegionId === null 
                ? 'bg-black/20 text-black' 
                : 'bg-white/10 text-white/40'
            }`}>1</kbd>
            <Monitor className={`size-3.5 mr-1.5 ${currentRegionId === null ? "text-black" : "text-white/60"}`} />
            <div className="flex flex-col items-start leading-none gap-0.5">
              <span className="font-semibold tracking-wide">Full View</span>
            </div>
          </Button>
          
          {/* Machine Region Buttons */}
          {machineRegions
            .sort((a, b) => a.display_order - b.display_order)
            .map((region, index) => (
              <Button
                key={region.id}
                variant={currentRegionId === region.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleRegionSwitch(region.id)}
                className={`min-w-28 h-10 text-xs transition-all border ${
                  currentRegionId === region.id 
                    ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.25)] border-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/10 border-white/5'
                }`}
              >
                <kbd className={`text-[10px] font-mono px-1 py-0.5 rounded mr-1.5 ${
                  currentRegionId === region.id 
                    ? 'bg-black/20 text-black' 
                    : 'bg-white/10 text-white/40'
                }`}>{index + 2}</kbd>
                <VendingMachineIcon className={`size-3.5 mr-1.5 ${currentRegionId === region.id ? "text-black" : "text-white/60"}`} />
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="font-semibold tracking-wide">{region.name}</span>
                </div>
              </Button>
            ))}
        </div>

        {/* Right: System Controls */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* OBS Virtual Cam Toggle */}
          {obsConnected && (
            <Button
              variant={virtualCamActive ? "secondary" : "outline"}
              size="sm"
              onClick={toggleVirtualCam}
              disabled={obsLoading}
              className={`h-9 gap-2 min-w-[100px] transition-all ${
                virtualCamActive 
                  ? "bg-red-500/20 text-red-200 hover:bg-red-500/30 border-red-500/50" 
                  : "bg-green-500/10 text-green-200 hover:bg-green-500/20 border-green-500/30"
              }`}
            >
              {obsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : virtualCamActive ? (
                <VideoOff className="h-4 w-4" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">
                {virtualCamActive ? "Stop Cam" : "Start Cam"}
              </span>
            </Button>
          )}

          <div className="bg-black/40 rounded-md border border-white/10 px-2 py-0.5">
            <SiteSelector 
              value={siteId} 
              onChange={setSiteId}
              className="text-white text-xs h-8 border-none bg-transparent focus:ring-0" 
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleFullscreen}
            className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-md"
            title="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-md"
            title="Settings"
          >
            <Link to="/admin">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}










