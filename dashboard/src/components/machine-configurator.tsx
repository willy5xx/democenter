import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, SaveIcon, TrashIcon, PlayIcon } from "lucide-react"
import { toast } from "sonner"
import machineConfig from "@/config/machine-config.json"

interface MachineBox {
  id: string
  name: string
  icon: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

const COLORS = [
  "#ef4444", // red
  "#f59e0b", // orange
  "#10b981", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
]

export function MachineConfigurator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [machines, setMachines] = useState<MachineBox[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentBox, setCurrentBox] = useState<Partial<MachineBox> | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)

  // Load existing machines from config on mount
  useEffect(() => {
    console.log("📦 Loading existing machines from config...")
    
    const existingMachines = machineConfig.machines
      .filter(m => m.id !== 'all' && m.crop) // Exclude "All Machines" and machines without crops
      .map((machine, index) => ({
        id: machine.id,
        name: machine.name,
        icon: machine.icon,
        x: machine.crop!.x,
        y: machine.crop!.y,
        width: machine.crop!.width,
        height: machine.crop!.height,
        color: COLORS[index % COLORS.length]
      }))

    if (existingMachines.length > 0) {
      setMachines(existingMachines)
      console.log(`✅ Loaded ${existingMachines.length} existing machines`)
    }
  }, [])

  // WebRTC setup for camera feed
  useEffect(() => {
    let pc: RTCPeerConnection | null = null

    const setupCamera = async () => {
      try {
        console.log("🎥 Starting camera setup...")
        
        pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        })

        pc.addTransceiver("video", { direction: "recvonly" })
        pc.addTransceiver("audio", { direction: "recvonly" })

        pc.ontrack = (event) => {
          console.log("✅ Got video track!", event.track.kind)
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0]
            console.log("✅ Video srcObject set")
            
            // Force video to play
            videoRef.current.play()
              .then(() => {
                console.log("▶️ Video playing!")
                setVideoLoaded(true)
              })
              .catch(err => console.error("❌ Play error:", err))
          }
        }

        pc.onconnectionstatechange = () => {
          console.log("🔗 Connection state:", pc?.connectionState)
        }

        pc.onicecandidateerror = (error) => {
          console.error("❌ ICE candidate error:", error)
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        console.log("📤 Created offer")

        await new Promise<void>((resolve) => {
          if (pc!.iceGatheringState === "complete") {
            resolve()
          } else {
            const timeout = setTimeout(() => {
              console.log("⏰ ICE gathering timeout, proceeding anyway")
              resolve()
            }, 2000)
            
            pc!.onicegatheringstatechange = () => {
              console.log("🧊 ICE gathering state:", pc!.iceGatheringState)
              if (pc!.iceGatheringState === "complete") {
                clearTimeout(timeout)
                resolve()
              }
            }
          }
        })

        console.log("📡 Sending offer to go2rtc...")
        const response = await fetch("/api/webrtc?src=tapo_dewarped", {
          method: "POST",
          body: pc.localDescription!.sdp,
          headers: { "Content-Type": "application/x-sdp" },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const answer = await response.text()
        console.log("📥 Got answer from go2rtc")
        
        await pc.setRemoteDescription({ type: "answer", sdp: answer })
        console.log("✅ WebRTC setup complete!")
      } catch (err) {
        console.error("❌ Camera setup failed:", err)
        alert(`Failed to connect to camera: ${err instanceof Error ? err.message : 'Unknown error'}\n\nMake sure go2rtc is running: ./go2rtc -config go2rtc.yaml`)
      }
    }

    setupCamera()

    return () => {
      if (pc) {
        console.log("🔌 Closing WebRTC connection")
        pc.close()
      }
    }
  }, [])

  // Draw boxes on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) {
      console.log("⚠️ Canvas or video ref not available yet")
      return
    }

    console.log("🎨 Starting canvas drawing loop")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.error("❌ Could not get canvas context")
      return
    }

    let animationId: number
    let frameCount = 0

    const drawFrame = () => {
      frameCount++
      
      // Log every 60 frames (once per second at 60fps)
      if (frameCount % 60 === 0) {
        console.log(`🖼️ Drawing frame ${frameCount}, video readyState: ${video.readyState}`)
      }

      // Always draw, even if video isn't loaded yet
      if (video.readyState >= 2) {
        // Video has data
        if (frameCount === 1) {
          console.log(`🖼️ Drawing video to canvas: ${video.videoWidth}x${video.videoHeight} -> ${canvas.width}x${canvas.height}`)
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      } else {
        // Show loading state
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#fff"
        ctx.font = "20px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Loading camera feed...", canvas.width / 2, canvas.height / 2)
        ctx.fillText(`Ready state: ${video.readyState}`, canvas.width / 2, canvas.height / 2 + 30)
      }

      // Draw existing machine boxes
      machines.forEach((machine) => {
        const x = machine.x < 0 ? machine.x + machine.width : machine.x
        const y = machine.y < 0 ? machine.y + machine.height : machine.y
        const w = Math.abs(machine.width)
        const h = Math.abs(machine.height)

        ctx.strokeStyle = machine.color
        ctx.lineWidth = 4
        ctx.strokeRect(x, y, w, h)

        // Draw label background
        ctx.fillStyle = machine.color
        ctx.fillRect(x, y - 30, 200, 30)
        
        // Draw label text
        ctx.fillStyle = "white"
        ctx.font = "bold 16px sans-serif"
        ctx.textAlign = "left"
        ctx.fillText(`${machine.icon} ${machine.name}`, x + 8, y - 8)
      })

      // Draw current box being drawn
      if (isDrawing && currentBox && currentBox.x !== undefined && currentBox.y !== undefined && currentBox.width && currentBox.height) {
        const x = currentBox.x < 0 ? currentBox.x + currentBox.width : currentBox.x
        const y = currentBox.y < 0 ? currentBox.y + currentBox.height : currentBox.y
        const w = Math.abs(currentBox.width)
        const h = Math.abs(currentBox.height)

        ctx.strokeStyle = "#22c55e"
        ctx.lineWidth = 4
        ctx.setLineDash([10, 5])
        ctx.strokeRect(x, y, w, h)
        ctx.setLineDash([])
      }

      animationId = requestAnimationFrame(drawFrame)
    }

    drawFrame()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [machines, isDrawing, currentBox])

  // Mouse events for drawing boxes
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    setIsDrawing(true)
    setCurrentBox({ x, y, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentBox || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const currentX = ((e.clientX - rect.left) / rect.width) * canvas.width
    const currentY = ((e.clientY - rect.top) / rect.height) * canvas.height

    setCurrentBox({
      ...currentBox,
      width: currentX - (currentBox.x || 0),
      height: currentY - (currentBox.y || 0),
    })
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return

    // Only add if box is big enough
    if (Math.abs(currentBox.width || 0) > 50 && Math.abs(currentBox.height || 0) > 50) {
      const newMachine: MachineBox = {
        id: `machine_${Date.now()}`,
        name: `Machine ${machines.length + 1}`,
        icon: ["🥤", "🍫", "🥗", "🍕", "☕", "🥪"][machines.length % 6],
        x: currentBox.x || 0,
        y: currentBox.y || 0,
        width: currentBox.width || 0,
        height: currentBox.height || 0,
        color: COLORS[machines.length % COLORS.length],
      }
      setMachines([...machines, newMachine])
    }

    setIsDrawing(false)
    setCurrentBox(null)
  }

  const deleteMachine = (id: string) => {
    setMachines(machines.filter((m) => m.id !== id))
    if (selectedMachine === id) setSelectedMachine(null)
  }

  const updateMachineName = (id: string, name: string) => {
    setMachines(machines.map((m) => (m.id === id ? { ...m, name } : m)))
  }

  const updateMachineIcon = (id: string, icon: string) => {
    setMachines(machines.map((m) => (m.id === id ? { ...m, icon } : m)))
  }

  const saveMachines = async () => {
    try {
      if (machines.length === 0) {
        console.log("🧹 Clearing all machines...")
        toast.info("Clearing all machines and resetting configuration...")
      } else {
        console.log("💾 Saving machines to backend...")
      }
      
      // Prepare machine data with normalized crop coordinates
      const machineData = machines.map(machine => ({
        name: machine.name,
        icon: machine.icon,
        crop: {
          width: Math.abs(Math.round(machine.width)),
          height: Math.abs(Math.round(machine.height)),
          x: Math.round(machine.x < 0 ? machine.x + machine.width : machine.x),
          y: Math.round(machine.y < 0 ? machine.y + machine.height : machine.y),
        }
      }))

      const response = await fetch("/api/save-machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machines: machineData })
      })

      const data = await response.json()

      if (data.success) {
        if (data.machinesConfigured === 0) {
          toast.success("✅ All machines cleared! Configuration reset.")
        } else {
          toast.success(`✅ Saved ${data.machinesConfigured} machine${data.machinesConfigured > 1 ? 's' : ''}! go2rtc restarting...`)
        }
        console.log("✅ Configuration saved successfully")
        
        // Reload the config to show updated boxes
        setTimeout(() => {
          toast.info("🔄 Reloading configuration...", { duration: 2000 })
          // Reload the page to get fresh config
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }, 2000)
        
        // Also remind about dashboard if machines exist
        if (data.machinesConfigured > 0) {
          setTimeout(() => {
            toast.info("💡 Visit the dashboard to see your new machine views!", {
              duration: 5000
            })
          }, 4000)
        }
      } else {
        toast.error(`Failed to save: ${data.error}`)
      }
    } catch (error) {
      console.error("❌ Save error:", error)
      toast.error("Failed to save configuration. Make sure the backend is running on port 3001.")
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Canvas Area */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Draw Machine Focus Areas</CardTitle>
            <CardDescription>
              Click and drag to draw a box around each machine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="hidden"
                onLoadedData={(e) => {
                  const vid = e.target as HTMLVideoElement
                  console.log("📺 Video loaded data!")
                  console.log(`📐 Video dimensions: ${vid.videoWidth}x${vid.videoHeight}`)
                  console.log(`📐 Video element size: ${vid.width}x${vid.height}`)
                  setVideoLoaded(true)
                }}
                onPlay={() => console.log("▶️ Video playing")}
                onError={(e) => console.error("❌ Video error:", e)}
              />
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className="w-full rounded-lg border-2 border-muted cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-white">Loading camera feed...</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machine List */}
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Machines ({machines.length})</span>
              <Button size="sm" onClick={saveMachines}>
                <SaveIcon className="size-4 mr-2" />
                {machines.length === 0 ? "Clear All" : "Save"}
              </Button>
            </CardTitle>
            <CardDescription>
              {machines.length > 0 ? (
                <span className="text-green-600 dark:text-green-400">
                  ✓ {machines.length} machine{machines.length > 1 ? 's' : ''} loaded
                </span>
              ) : (
                "Draw boxes on the camera view to add machines"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {machines.length === 0 && (
              <div className="text-center text-muted-foreground py-6">
                <p className="text-sm">No machines configured</p>
                <p className="text-xs mt-2">Draw boxes or click "Clear All" to reset</p>
              </div>
            )}
            {machines.map((machine) => (
              <div
                key={machine.id}
                className="p-3 rounded-lg border-2 hover:bg-muted/50 transition-colors"
                style={{ borderColor: machine.color }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={machine.icon}
                      onChange={(e) => updateMachineIcon(machine.id, e.target.value)}
                      className="w-12 h-8 text-center p-0"
                      maxLength={2}
                    />
                    <Input
                      value={machine.name}
                      onChange={(e) => updateMachineName(machine.id, e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteMachine(machine.id)}
                  >
                    <TrashIcon className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  crop={Math.abs(Math.round(machine.width))}:{Math.abs(Math.round(machine.height))}:
                  {Math.round(machine.x < 0 ? machine.x + machine.width : machine.x)}:
                  {Math.round(machine.y < 0 ? machine.y + machine.height : machine.y)}
                </div>
              </div>
            ))}

            {machines.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                <PlusIcon className="size-8 mx-auto mb-2 opacity-50" />
                Draw boxes on the camera view to add machines
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground">
            <p>1. Click and drag on the camera view to draw a box</p>
            <p>2. Each box defines a machine focus area</p>
            <p>3. Edit the name and icon for each machine</p>
            <p>4. Click Save to automatically update configs</p>
            <p>5. Your boxes are saved and will reload on next visit</p>
            <p className="text-xs mt-2 text-green-600 dark:text-green-400">
              💡 Tip: Draw larger boxes (500-800px) for better quality
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

