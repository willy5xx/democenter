import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CameraIcon, MaximizeIcon, CameraOffIcon, EyeIcon, EyeOffIcon, Settings, Move, MonitorIcon, ZoomInIcon } from "lucide-react"
import { DevSettingsPanel } from "@/components/dev-settings-panel"

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
  stream_resolution: string
  dewarp_params?: {
    video_sharpen_amount?: number
    video_contrast?: number
    video_brightness?: number
    video_saturation?: number
  }
}

interface TransitionStyle {
  name: string
  duration: number
  easing: string
}

const TRANSITION_STYLES: Record<string, TransitionStyle> = {
  smooth: { name: 'Smooth', duration: 300, easing: 'ease-out' },
  instant: { name: 'Instant', duration: 0, easing: 'linear' },
  slow: { name: 'Slow', duration: 600, easing: 'ease-in-out' },
  bounce: { name: 'Bounce', duration: 500, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
}

interface CameraViewVirtualPTZProps {
  siteId?: number | null
  hideControls?: boolean  // Hide the bottom machine selector for presentation mode
  externalRegionId?: number | null  // Control region from parent component
  onRegionChange?: (regionId: number | null) => void  // Callback when region changes
}

export function CameraViewVirtualPTZ({ 
  siteId: propSiteId, 
  hideControls = false,
  externalRegionId,
  onRegionChange 
}: CameraViewVirtualPTZProps = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const [site, setSite] = useState<Site | null>(null)
  const [machineRegions, setMachineRegions] = useState<MachineRegion[]>([])
  const [currentRegionId, setCurrentRegionId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fps, setFps] = useState<number>(0)
  const [latency, setLatency] = useState<number>(0)
  const [showROI, setShowROI] = useState(false)
  const [transitionStyle, setTransitionStyle] = useState<string>('smooth')
  const [transitionDuration, setTransitionDuration] = useState<number>(300)
  const [showDevSettings, setShowDevSettings] = useState(false)
  const [isPtzEnabled, setIsPtzEnabled] = useState(false)
  const lastPtzDirection = useRef<string | null>(null)
  
  // Video enhancements state
  const [videoSettings, setVideoSettings] = useState({
    sharpenAmount: 0,
    contrast: 100,
    brightness: 100,
    saturation: 100,
  })
  
  // Virtual PTZ transform state
  const [transform, setTransform] = useState({ scale: 1, translateX: 0, translateY: 0 })

  // Fetch site and machine regions from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        let targetSiteId = propSiteId
        
        // If no site ID provided, fetch the first available site
        if (!targetSiteId) {
          const sitesRes = await fetch('http://localhost:3001/api/sites')
          const sitesData = await sitesRes.json()
          
          if (sitesData.success && sitesData.data.length > 0) {
            targetSiteId = sitesData.data[0].id
          } else {
            console.error('No sites available')
            return
          }
        }
        
        // Fetch the specific site
        const siteRes = await fetch(`http://localhost:3001/api/sites/${targetSiteId}`)
        const siteData = await siteRes.json()
        
        if (siteData.success) {
          setSite(siteData.data)
          
          // Set video settings from site config
          if (siteData.data.dewarp_params) {
            setVideoSettings({
              sharpenAmount: siteData.data.dewarp_params.video_sharpen_amount || 0,
              contrast: siteData.data.dewarp_params.video_contrast || 100,
              brightness: siteData.data.dewarp_params.video_brightness || 100,
              saturation: siteData.data.dewarp_params.video_saturation || 100,
            })
          }
          
          // Set transition duration from site settings (or use default)
          if (siteData.data.transition_speed !== undefined) {
            setTransitionDuration(siteData.data.transition_speed)
          }
          
          // Fetch machine regions for this site
          const regionsRes = await fetch(`http://localhost:3001/api/machine-regions?site_id=${targetSiteId}`)
          const regionsData = await regionsRes.json()
          
          if (regionsData.success) {
            setMachineRegions(regionsData.data)
            
            // Set default region ONLY if not controlled externally
            if (externalRegionId === undefined) {
              const defaultRegion = regionsData.data.find((r: MachineRegion) => r.is_default)
              if (defaultRegion) {
                setCurrentRegionId(defaultRegion.id)
              } else {
                setCurrentRegionId(null)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching config:', err)
      }
    }
    
    fetchConfig()
  }, [propSiteId])

  // Listen for SSE config updates
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/events')
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('SSE update:', data)
      
      // Reload config when changes occur
      if (data.type === 'region_created' || data.type === 'region_updated' || data.type === 'region_deleted') {
        // Refetch regions
        if (site) {
          fetch(`http://localhost:3001/api/machine-regions?site_id=${site.id}`)
            .then(res => res.json())
            .then(result => {
              if (result.success) {
                setMachineRegions(result.data)
              }
            })
        }
      }
    }
    
    return () => eventSource.close()
  }, [site])

  // Listen for dev settings changes
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      const { key, value } = event.detail
      
      if (key === 'transition_style') {
        setTransitionStyle(value)
      } else if (key === 'transition_duration') {
        setTransitionDuration(parseInt(value))
      } else if (key === 'show_region_boundaries') {
        setShowROI(value === 'true')
      }
    }
    
    window.addEventListener('devSettingsChanged', handleSettingsChange as EventListener)
    
    return () => {
      window.removeEventListener('devSettingsChanged', handleSettingsChange as EventListener)
    }
  }, [])

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/settings')
        const data = await response.json()
        
        if (data.success) {
          setTransitionStyle(data.data.transition_style || 'smooth')
          setTransitionDuration(parseInt(data.data.transition_duration) || 300)
          setShowROI(data.data.show_region_boundaries === 'true')
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
      }
    }
    
    fetchSettings()
  }, [])

  // Keyboard shortcut for dev settings (Cmd/Ctrl + Shift + D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        setShowDevSettings(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // PTZ Control Keyboard Listeners
  useEffect(() => {
    if (!isPtzEnabled || !site) return

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if repeating (held down) or if modifiers are pressed
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return

      let direction = ''
      switch (e.key) {
        case 'ArrowLeft': direction = 'left'; break;
        case 'ArrowRight': direction = 'right'; break;
        case 'ArrowUp': direction = 'up'; break;
        case 'ArrowDown': direction = 'down'; break;
        default: return;
      }

      // Prevent scrolling
      e.preventDefault()

      console.log(`PTZ Move: ${direction}`)
      lastPtzDirection.current = direction
      
      try {
        await fetch(`/api/sites/${site.id}/ptz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'move', direction })
        })
      } catch (err) {
        console.error('PTZ Error:', err)
      }
    }

    const handleKeyUp = async (e: KeyboardEvent) => {
      let direction = ''
      switch (e.key) {
        case 'ArrowLeft': direction = 'left'; break;
        case 'ArrowRight': direction = 'right'; break;
        case 'ArrowUp': direction = 'up'; break;
        case 'ArrowDown': direction = 'down'; break;
        default: return;
      }
      
      // Only stop if the released key was the one driving the movement
      if (lastPtzDirection.current === direction) {
        console.log(`PTZ Stop (released ${direction})`)
        lastPtzDirection.current = null
        
        try {
          await fetch(`/api/sites/${site.id}/ptz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'stop' })
          })
        } catch (err) {
          console.error('PTZ Error:', err)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      
      // Safety: stop movement on unmount/disable
      if (lastPtzDirection.current && site) {
        fetch(`/api/sites/${site.id}/ptz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'stop' })
        }).catch(console.error)
      }
    }
  }, [isPtzEnabled, site])

  // Sync external region control
  useEffect(() => {
    if (externalRegionId !== undefined) {
      setCurrentRegionId(externalRegionId)
    }
  }, [externalRegionId])

  // Calculate virtual PTZ transform when region changes
  useEffect(() => {
    if (!currentRegionId || !containerRef.current || !videoRef.current) {
      // Reset to full view
      setTransform({ scale: 1, translateX: 0, translateY: 0 })
      return
    }
    
    const region = machineRegions.find(r => r.id === currentRegionId)
    if (!region) return
    
    // Get container dimensions
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const sourceWidth = 1920
    const sourceHeight = 1080
    
    // Calculate how the video is actually displayed (accounting for object-contain)
    const videoAspectRatio = sourceWidth / sourceHeight
    const containerAspectRatio = containerWidth / containerHeight
    
    let displayedVideoWidth: number
    let displayedVideoHeight: number
    let videoOffsetX = 0
    let videoOffsetY = 0
    
    if (containerAspectRatio > videoAspectRatio) {
      // Container is wider - video has letterboxing on sides
      displayedVideoHeight = containerHeight
      displayedVideoWidth = containerHeight * videoAspectRatio
      videoOffsetX = (containerWidth - displayedVideoWidth) / 2
    } else {
      // Container is taller - video has letterboxing on top/bottom (THIS IS YOUR ISSUE!)
      displayedVideoWidth = containerWidth
      displayedVideoHeight = containerWidth / videoAspectRatio
      videoOffsetY = (containerHeight - displayedVideoHeight) / 2
    }
    
    // Calculate scale needed to make the region fill the viewport
    const scaleX = displayedVideoWidth / (region.width * displayedVideoWidth / sourceWidth)
    const scaleY = displayedVideoHeight / (region.height * displayedVideoHeight / sourceHeight)
    const scale = Math.min(scaleX, scaleY)
    
    // Calculate translation to center the region
    // Work in the coordinate space of the source video
    const regionCenterX = region.x + region.width / 2
    const regionCenterY = region.y + region.height / 2
    
    const translateX = ((sourceWidth / 2 - regionCenterX) / sourceWidth) * 100
    const translateY = ((sourceHeight / 2 - regionCenterY) / sourceHeight) * 100
    
    setTransform({ scale, translateX, translateY })
  }, [currentRegionId, machineRegions])

  // Initialize WebRTC connection to the single dewarped stream
  useEffect(() => {
    if (!site) return
    
    let pc: RTCPeerConnection | null = null

    const startStream = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Clean up existing connection
        if (pcRef.current) {
          pcRef.current.close()
        }

        // Create peer connection - Use STUN for Tailscale/Remote access support
        // We need STUN to traverse NAT/VPN interfaces correctly
        pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          iceTransportPolicy: 'all'
        })

        pcRef.current = pc

        // Add transceivers
        pc.addTransceiver("video", { direction: "recvonly" })
        pc.addTransceiver("audio", { direction: "recvonly" })

        // Handle incoming tracks
        pc.ontrack = (event) => {
          console.log("Track received:", event.track.kind)
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0]
            setIsLoading(false)
          }
        }

        // Handle connection state
        pc.onconnectionstatechange = () => {
          console.log("Connection state:", pc?.connectionState)
          if (pc?.connectionState === "failed") {
            setError("Connection failed")
          }
        }

        // Create offer
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // Wait for ICE gathering to complete, but with a timeout
        // Since we removed STUN, this should be nearly instant
        await new Promise<void>((resolve) => {
          if (pc!.iceGatheringState === "complete") {
            resolve()
          } else {
            const timeout = setTimeout(() => {
              console.warn("ICE gathering timed out, sending offer anyway")
              resolve()
            }, 1000) // 1 second timeout is plenty for local only
            
            pc!.onicegatheringstatechange = () => {
              if (pc!.iceGatheringState === "complete") {
                clearTimeout(timeout)
                resolve()
              }
            }
          }
        })

        // Send offer to go2rtc (using site-specific dewarped stream)
        const streamName = `site${site.id}_dewarped`
        const response = await fetch(
          `/api/webrtc?src=${streamName}`,
          {
            method: "POST",
            body: pc.localDescription!.sdp,
            headers: { "Content-Type": "application/x-sdp" },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Set remote description
        const answer = await response.text()
        
        // CRITICAL: Check if connection is still open before setting remote description
        // This prevents "InvalidStateError: ... signalingState is 'closed'" race conditions
        if (pc.signalingState === 'closed') {
          console.warn("Connection closed before remote description could be set")
          return
        }

        await pc.setRemoteDescription({
          type: "answer",
          sdp: answer,
        })

        console.log("WebRTC connection established")
      } catch (err) {
        // Ignore errors if connection was intentionally closed
        if (pc && pc.signalingState === 'closed') return
        
        console.error("Error starting stream:", err)
        setError(err instanceof Error ? err.message : "Failed to start stream")
        setIsLoading(false)
      }
    }

    startStream()

    return () => {
      if (pc) {
        pc.close()
      }
    }
  }, [site])

  // Monitor video stats (FPS and latency)
  useEffect(() => {
    if (!videoRef.current || !pcRef.current) return

    const pc = pcRef.current
    let lastFrames = 0
    let lastTime = Date.now()

    const statsInterval = setInterval(async () => {
      if (!pc || pc.connectionState !== 'connected') return

      try {
        const stats = await pc.getStats()
        let inboundRtp: any = null

        stats.forEach((report: any) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            inboundRtp = report
          }
        })

        if (inboundRtp) {
          // Calculate FPS
          const currentFrames = inboundRtp.framesDecoded || 0
          const currentTime = Date.now()
          const timeDiff = (currentTime - lastTime) / 1000
          const framesDiff = currentFrames - lastFrames

          if (timeDiff > 0) {
            const currentFps = Math.round(framesDiff / timeDiff)
            setFps(currentFps)
          }

          lastFrames = currentFrames
          lastTime = currentTime

          // Calculate latency
          const jitterBufferDelay = inboundRtp.jitterBufferDelay || 0
          const jitterBufferEmittedCount = inboundRtp.jitterBufferEmittedCount || 1
          const avgLatency = (jitterBufferDelay / jitterBufferEmittedCount) * 1000
          setLatency(Math.round(avgLatency))
        }
      } catch (err) {
        console.warn('Stats error:', err)
      }
    }, 1000)

    return () => clearInterval(statsInterval)
  }, [])

  // Draw ROI overlays
  useEffect(() => {
    if (!showROI || !overlayCanvasRef.current || !containerRef.current) return

    const canvas = overlayCanvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    let animationId: number

    const drawOverlays = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Only show boxes when not zoomed into a specific region
      if (!currentRegionId) {
        machineRegions.forEach((region, index) => {
          // Scale region coordinates to canvas size
          const scaleX = canvas.width / 1920
          const scaleY = canvas.height / 1080
          
          const x = region.x * scaleX
          const y = region.y * scaleY
          const w = region.width * scaleX
          const h = region.height * scaleY

          // Draw box
          const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]
          ctx.strokeStyle = colors[index % colors.length]
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, w, h)

          // Draw label
          ctx.fillStyle = colors[index % colors.length]
          ctx.fillRect(x, y - 30, 200, 30)
          ctx.fillStyle = "white"
          ctx.font = "bold 14px sans-serif"
          ctx.fillText(`${region.icon} ${region.name}`, x + 8, y - 8)
        })
      }

      animationId = requestAnimationFrame(drawOverlays)
    }

    drawOverlays()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [showROI, currentRegionId, machineRegions])

  const handleFullscreen = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen()
    }
  }

  const handleRegionSwitch = (regionId: number | null) => {
    setCurrentRegionId(regionId)
  }

  if (error) {
    return (
      <div className="relative h-full w-full rounded-xl bg-muted/50 flex flex-col items-center justify-center p-4 text-center">
        <CameraOffIcon className="size-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">{error}</p>
        <p className="text-xs text-muted-foreground">
          Run: <code className="bg-background px-2 py-1 rounded">./go2rtc -config go2rtc.yaml</code>
        </p>
      </div>
    )
  }

  const currentTransition = TRANSITION_STYLES[transitionStyle] || TRANSITION_STYLES.smooth
  // Override duration if set via dev settings
  const effectiveDuration = transitionDuration !== 300 ? transitionDuration : currentTransition.duration

  // Calculate sharpen matrix
  const amount = videoSettings.sharpenAmount / 100
  // Kernel: 0 -amount 0, -amount 1+4*amount -amount, 0 -amount 0
  const center = 1 + (4 * amount)
  const neighbor = -amount
  const kernelMatrix = `0 ${neighbor} 0 ${neighbor} ${center} ${neighbor} 0 ${neighbor} 0`

  return (
    <>
      <svg className="hidden">
        <defs>
          <filter id="sharpen">
            <feConvolveMatrix
              order="3,3"
              preserveAlpha="true"
              kernelMatrix={kernelMatrix}
            />
          </filter>
        </defs>
      </svg>
      <DevSettingsPanel isOpen={showDevSettings} onClose={() => setShowDevSettings(false)} />
      
      <div className="flex flex-col h-full gap-3">
      {/* Video Container */}
      <div 
        ref={containerRef}
        className="relative flex-1 w-full rounded-xl bg-black overflow-hidden group"
      >
        {/* Video Element with Virtual PTZ Transform */}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transition: effectiveDuration > 0 
              ? `transform ${effectiveDuration}ms ${currentTransition.easing}`
              : 'none',
            transform: `scale(${transform.scale}) translate(${transform.translateX}%, ${transform.translateY}%)`,
            transformOrigin: 'center center',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="none"
            className="w-full h-full object-contain"
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              filter: `
                contrast(${videoSettings.contrast}%) 
                brightness(${videoSettings.brightness}%) 
                saturate(${videoSettings.saturation}%)
                ${videoSettings.sharpenAmount > 0 ? 'url(#sharpen)' : ''}
              `
            }}
          />
        </div>
        
        {/* ROI Overlay Canvas */}
        {showROI && (
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-sm text-white">Connecting to camera...</p>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live (Virtual PTZ)
              </Badge>
              {fps > 0 && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {fps} FPS
                </Badge>
              )}
              {latency > 0 && (
                <Badge 
                  variant={latency < 200 ? "secondary" : "destructive"} 
                  className="font-mono text-xs"
                >
                  {latency}ms
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => setShowROI(!showROI)}
                title={showROI ? "Hide machine boxes" : "Show machine boxes"}
              >
                {showROI ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 hover:bg-white/20 ${isPtzEnabled ? "text-green-400 bg-white/10" : "text-white"}`}
                onClick={() => setIsPtzEnabled(!isPtzEnabled)}
                title={isPtzEnabled ? "Disable PTZ Control" : "Enable PTZ Control (Arrow Keys)"}
              >
                <Move className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => setShowDevSettings(true)}
                title="Developer Settings (Cmd/Ctrl+Shift+D)"
              >
                <Settings className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={handleFullscreen}
              >
                <MaximizeIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Camera Icon when no hover (top right now that controls are bottom) */}
        <div className="absolute top-3 right-3 opacity-50">
          <CameraIcon className="size-4 text-white" />
        </div>
      </div>

      {/* Machine Selector Buttons - Hide in presentation mode */}
      {!hideControls && machineRegions.length > 0 && (
        <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <MonitorIcon className="size-3.5" />
            <span className="font-medium">Camera Presets</span>
            <span className="text-[10px] ml-auto opacity-70">Select a region to zoom</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {/* Full View Button */}
            <Button
              variant={currentRegionId === null ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleRegionSwitch(null)}
              className={`justify-start gap-2 h-auto py-2 ${currentRegionId === null ? "bg-secondary border-primary/20" : "hover:bg-muted"}`}
            >
              <MaximizeIcon className="size-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium text-xs truncate w-full">Full View</span>
                {currentRegionId === null && (
                  <span className="text-[10px] text-green-500 font-medium">Active</span>
                )}
              </div>
            </Button>
            
            {/* Machine Region Buttons */}
            {machineRegions
              .sort((a, b) => a.display_order - b.display_order)
              .map((region) => (
                <Button
                  key={region.id}
                  variant={currentRegionId === region.id ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleRegionSwitch(region.id)}
                  className={`justify-start gap-2 h-auto py-2 ${currentRegionId === region.id ? "bg-secondary border-primary/20" : "hover:bg-muted"}`}
                >
                  <ZoomInIcon className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col items-start min-w-0">
                    <span className="font-medium text-xs truncate w-full">{region.name}</span>
                    {currentRegionId === region.id && (
                      <span className="text-[10px] text-green-500 font-medium">Active</span>
                    )}
                  </div>
                </Button>
              ))}
          </div>
        </div>
      )}
      </div>
    </>
  )
}

