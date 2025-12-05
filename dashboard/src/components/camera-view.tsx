import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CameraIcon, MaximizeIcon, CameraOffIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import machineConfig from "@/config/machine-config.json"

const STREAMS = {
  tapo_dewarped: "🎯 Dewarped (Low Lag)",
  tapo_closeup: "🔍 Close-up",
  tapo_main: "📷 Direct Camera",
}

export function CameraView() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fps, setFps] = useState<number>(0)
  const [latency, setLatency] = useState<number>(0)
  const [showROI, setShowROI] = useState(false)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Initialize WebRTC connection - SIMPLIFIED
  useEffect(() => {
    let pc: RTCPeerConnection | null = null

    const startStream = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Clean up existing connection
        if (pcRef.current) {
          pcRef.current.close()
        }

        // Create peer connection without external STUN to avoid long gathering delays
        pc = new RTCPeerConnection()

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

        // Send offer to go2rtc
        const response = await fetch(
          `/api/webrtc?src=${currentStream}`,
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
        await pc.setRemoteDescription({
          type: "answer",
          sdp: answer,
        })

        console.log("WebRTC connection established")
      } catch (err) {
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
  }, [currentStream])

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

          // Calculate latency (jitter buffer delay)
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

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen()
    }
  }

  // Switch to a specific machine and update URL
  const handleMachineSwitch = (machineId: string) => {
    const machine = machineConfig.machines.find(m => m.id === machineId)
    if (machine) {
      setCurrentStream(machine.stream)
      
      // Update URL parameter without reloading
      const url = new URL(window.location.href)
      if (machineId === machineConfig.settings.defaultMachine) {
        url.searchParams.delete('machine')
      } else {
        url.searchParams.set('machine', machineId)
      }
      window.history.pushState({}, '', url)
    }
  }

  // Get current machine ID from stream name
  const getCurrentMachineId = () => {
    const machine = machineConfig.machines.find(m => m.stream === currentStream)
    return machine?.id || 'all'
  }

  // Draw ROI overlays on canvas
  useEffect(() => {
    if (!showROI || !overlayCanvasRef.current || !videoRef.current) return

    const canvas = overlayCanvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Match canvas size to video
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
        // Draw boxes for each configured machine (except "all")
        machineConfig.machines
          .filter(m => m.id !== 'all' && m.crop)
          .forEach((machine, index) => {
            const crop = machine.crop!
            
            // Scale crop coordinates to canvas size
            const scaleX = canvas.width / 1920  // Assuming 1920x1080 source
            const scaleY = canvas.height / 1080
            
            const x = crop.x * scaleX
            const y = crop.y * scaleY
            const w = crop.width * scaleX
            const h = crop.height * scaleY

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

  if (error) {
    return (
      <div className="relative h-full w-full rounded-xl bg-muted/50 flex flex-col items-center justify-center p-4 text-center">
        <CameraOffIcon className="size-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">{error}</p>
        <p className="text-xs text-muted-foreground">
          Run: <code className="bg-background px-2 py-1 rounded">docker-compose restart go2rtc</code>
        </p>
      </div>
    )
  }

  const currentMachineId = getCurrentMachineId()

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Video Container */}
      <div className="relative flex-1 w-full rounded-xl bg-black overflow-hidden group">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="none"
          className="w-full h-full object-contain"
          style={{ objectFit: 'contain' }}
        />
        
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
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
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
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={handleFullscreen}
              >
                <MaximizeIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Camera Icon when no hover */}
        <div className="absolute bottom-3 right-3 opacity-50">
          <CameraIcon className="size-4 text-white" />
        </div>
      </div>

      {/* Machine Selector Buttons */}
      {machineConfig.settings.showMachineSelector && (
        <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">📍 Quick Focus:</span>
            <span className="text-xs">Click to zoom into specific machines</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {machineConfig.machines.map((machine) => (
              <Button
                key={machine.id}
                variant={currentMachineId === machine.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleMachineSwitch(machine.id)}
                className="gap-1.5"
              >
                <span className="text-base">{machine.icon}</span>
                <span>{machine.name}</span>
                {currentMachineId === machine.id && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    Active
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          {machineConfig.machines.find(m => m.id === currentMachineId)?.description && (
            <p className="text-xs text-muted-foreground">
              {machineConfig.machines.find(m => m.id === currentMachineId)?.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
