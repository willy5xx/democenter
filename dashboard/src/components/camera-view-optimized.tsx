import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CameraIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import machineConfig from "@/config/machine-config.json"

type StreamConnection = {
  pc: RTCPeerConnection
  video: HTMLVideoElement
  isReady: boolean
}

export function CameraView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const streamsRef = useRef<Map<string, StreamConnection>>(new Map())
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  
  // Get initial machine from URL parameter or default
  const getInitialMachine = () => {
    const params = new URLSearchParams(window.location.search)
    const machineParam = params.get('machine')
    
    if (machineParam && machineConfig.settings.allowUrlParameters) {
      const machine = machineConfig.machines.find(m => m.id === machineParam)
      if (machine) return machine.stream
    }
    
    const defaultMachine = machineConfig.machines.find(m => m.isDefault)
    return defaultMachine?.stream || "tapo_dewarped"
  }
  
  const [currentStream, setCurrentStream] = useState(getInitialMachine())
  const [loadedStreams, setLoadedStreams] = useState<Set<string>>(new Set())
  const [showROI, setShowROI] = useState(false)

  // Initialize stream on demand (lazy loading with caching)
  const initializeStream = async (streamId: string) => {
    // Skip if already initialized
    if (streamsRef.current.has(streamId)) {
      console.log(`♻️ Stream already loaded: ${streamId}`)
      return
    }
    
    try {
      console.log(`🎥 Initializing stream: ${streamId}`)
      
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      })

      pc.addTransceiver("video", { direction: "recvonly" })
      pc.addTransceiver("audio", { direction: "recvonly" })

      // Create hidden video element
      const video = document.createElement("video")
      video.autoplay = true
      video.muted = true
      video.playsInline = true
      video.className = "absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
      video.style.opacity = streamId === currentStream ? "1" : "0"
      video.style.pointerEvents = "none"

      // Handle incoming tracks
      pc.ontrack = (event) => {
        if (event.streams[0]) {
          video.srcObject = event.streams[0]
          setLoadedStreams(prev => new Set(prev).add(streamId))
          console.log(`✅ Stream ready: ${streamId}`)
        }
      }

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve()
        } else {
          const timeout = setTimeout(() => resolve(), 2000)
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === "complete") {
              clearTimeout(timeout)
              resolve()
            }
          }
        }
      })

      // Send to go2rtc
      const response = await fetch(`/api/webrtc?src=${streamId}`, {
        method: "POST",
        body: pc.localDescription!.sdp,
        headers: { "Content-Type": "application/x-sdp" },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const answer = await response.text()
      await pc.setRemoteDescription({ type: "answer", sdp: answer })

      // Store connection
      streamsRef.current.set(streamId, { pc, video, isReady: false })
      
      // Add video to container
      if (containerRef.current) {
        containerRef.current.appendChild(video)
      }

      console.log(`🎬 Stream connected: ${streamId}`)
    } catch (error) {
      console.error(`❌ Failed to initialize ${streamId}:`, error)
    }
  }

  // Load current stream when it changes
  useEffect(() => {
    initializeStream(currentStream)
  }, [currentStream])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      streamsRef.current.forEach(({ pc, video }) => {
        pc.close()
        video.remove()
      })
      streamsRef.current.clear()
    }
  }, [])

  // Handle stream switching
  useEffect(() => {
    streamsRef.current.forEach(({ video }, streamId) => {
      video.style.opacity = streamId === currentStream ? "1" : "0"
      video.style.zIndex = streamId === currentStream ? "10" : "1"
    })
  }, [currentStream])

  // Handle machine switching via button
  const handleMachineSwitch = (machineId: string) => {
    const machine = machineConfig.machines.find(m => m.id === machineId)
    if (machine) {
      setCurrentStream(machine.stream)
      
      // Update URL without reload
      if (machineConfig.settings.allowUrlParameters) {
        const url = new URL(window.location.href)
        url.searchParams.set('machine', machineId)
        window.history.pushState({}, '', url)
      }
    }
  }

  // Get current machine ID for UI
  const getCurrentMachineId = () => {
    const machine = machineConfig.machines.find(m => m.stream === currentStream)
    return machine?.id || 'all'
  }

  // Draw ROI overlays
  useEffect(() => {
    if (!showROI || !overlayCanvasRef.current) return

    const canvas = overlayCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get the current video element to match dimensions
    const currentStreamData = streamsRef.current.get(currentStream)
    if (!currentStreamData) return

    const video = currentStreamData.video

    const updateCanvasSize = () => {
      const rect = video.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    let animationId: number

    const drawOverlays = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Only show boxes when viewing "All Machines"
      if (getCurrentMachineId() === 'all') {
        machineConfig.machines
          .filter(m => m.id !== 'all' && m.crop)
          .forEach((machine, index) => {
            const crop = machine.crop!
            
            const scaleX = canvas.width / 1920
            const scaleY = canvas.height / 1080
            
            const x = crop.x * scaleX
            const y = crop.y * scaleY
            const w = crop.width * scaleX
            const h = crop.height * scaleY

            const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]
            ctx.strokeStyle = colors[index % colors.length]
            ctx.lineWidth = 3
            ctx.strokeRect(x, y, w, h)

            ctx.fillStyle = colors[index % colors.length]
            ctx.fillRect(x, y - 30, 200, 30)
            ctx.fillStyle = "white"
            ctx.font = "bold 14px sans-serif"
            ctx.fillText(`${machine.icon} ${machine.name}`, x + 8, y - 8)
          })
      }

      animationId = requestAnimationFrame(drawOverlays)
    }

    drawOverlays()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [showROI, currentStream])

  const currentMachineId = getCurrentMachineId()
  const isStreamLoaded = loadedStreams.has(currentStream)

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <CameraIcon className="h-5 w-5" />
          <h2 className="font-semibold">Live Camera Feed</h2>
          <Badge variant={isStreamLoaded ? "default" : "secondary"}>
            {isStreamLoaded ? "● LIVE" : "○ Connecting..."}
          </Badge>
        </div>
        
        {/* ROI Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowROI(!showROI)}
          className="gap-2"
        >
          {showROI ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
          {showROI ? "Hide" : "Show"} Regions
        </Button>
      </div>

      {/* Machine Selector Buttons */}
      <div className="border-b p-3 bg-muted/50">
        <div className="flex flex-wrap gap-2">
          {machineConfig.machines.map((machine) => (
            <Button
              key={machine.id}
              variant={currentMachineId === machine.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleMachineSwitch(machine.id)}
              className="gap-1.5"
            >
              <span>{machine.icon}</span>
              <span>{machine.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black min-h-[400px]">
        <div ref={containerRef} className="absolute inset-0">
          {/* Video elements are added here dynamically */}
        </div>
        
        {/* ROI Overlay Canvas */}
        {showROI && (
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 100 }}
          />
        )}

        {/* Loading Indicator */}
        {!isStreamLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Connecting to camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with machine description */}
      <div className="border-t p-3 text-sm text-muted-foreground">
        {machineConfig.machines.find(m => m.id === currentMachineId)?.description || "Loading..."}
      </div>
    </div>
  )
}

