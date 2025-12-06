import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CameraViewVirtualPTZ } from "@/components/camera-view-virtual-ptz"
import { SiteSelector } from "@/components/site-selector"
import { Maximize, Settings } from "lucide-react"

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

  // Fetch machine regions when siteId changes
  useEffect(() => {
    if (!siteId) return

    const fetchRegions = async () => {
      try {
        const regionsRes = await fetch(`http://localhost:3001/api/machine-regions?site_id=${siteId}`)
        const regionsData = await regionsRes.json()
        
        if (regionsData.success) {
          setMachineRegions(regionsData.data)
          
          // Set default region if available
          const defaultRegion = regionsData.data.find((r: MachineRegion) => r.is_default)
          if (defaultRegion) {
            setCurrentRegionId(defaultRegion.id)
          } else {
            setCurrentRegionId(null)
          }
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
        
        {/* Hover Controls - absolute positioned top-right */}
        <div 
          className={`absolute top-4 right-4 flex gap-2 transition-opacity duration-300 z-10 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-black/50 backdrop-blur-sm rounded-md border border-white/20 p-1">
            <SiteSelector 
              value={siteId} 
              onChange={setSiteId}
              className="text-white" 
            />
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleFullscreen}
            className="shadow-lg backdrop-blur-sm bg-black/50 hover:bg-black/70 text-white border-white/20"
          >
            <Maximize className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            asChild
            className="shadow-lg backdrop-blur-sm bg-black/50 hover:bg-black/70 text-white border-white/20"
          >
            <Link to="/admin">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Bottom Bar - Machine Selector */}
      {machineRegions.length > 0 && (
        <div className="h-24 bg-gray-900/90 backdrop-blur-xl border-t border-white/10 flex-shrink-0 px-8">
          <div className="h-full flex items-center justify-center gap-3">
            {/* Full View Button */}
            <Button
              variant={currentRegionId === null ? "default" : "ghost"}
              size="lg"
              onClick={() => handleRegionSwitch(null)}
              className={`min-w-36 h-14 text-base transition-all ${
                currentRegionId === null 
                  ? 'shadow-lg shadow-primary/50 scale-105' 
                  : 'text-white/70 hover:text-white border-white/10'
              }`}
            >
              <span className="text-2xl mr-2">📹</span>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Full View</span>
                {currentRegionId === null && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] mt-0.5">
                    Active
                  </Badge>
                )}
              </div>
            </Button>
            
            {/* Machine Region Buttons */}
            {machineRegions
              .sort((a, b) => a.display_order - b.display_order)
              .map((region) => (
                <Button
                  key={region.id}
                  variant={currentRegionId === region.id ? "default" : "ghost"}
                  size="lg"
                  onClick={() => handleRegionSwitch(region.id)}
                  className={`min-w-36 h-14 text-base transition-all ${
                    currentRegionId === region.id 
                      ? 'shadow-lg shadow-primary/50 scale-105' 
                      : 'text-white/70 hover:text-white border-white/10'
                  }`}
                >
                  <span className="text-2xl mr-2">{region.icon}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{region.name}</span>
                    {currentRegionId === region.id && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px] mt-0.5">
                        Active
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}










