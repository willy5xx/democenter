import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SiteSelector } from "@/components/site-selector"
import { 
  Save, 
  Trash2, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Pencil 
} from "lucide-react"

interface MachineRegion {
  id?: number
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
}

export function CalibrationSettings() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [regions, setRegions] = useState<MachineRegion[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [editingRegion, setEditingRegion] = useState<MachineRegion | null>(null)
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Fetch site and regions when site changes
  useEffect(() => {
    if (!selectedSiteId) return
    
    const fetchData = async () => {
      try {
        const siteRes = await fetch(`http://localhost:3001/api/sites/${selectedSiteId}`)
        const siteData = await siteRes.json()
        
        if (siteData.success) {
          setSite(siteData.data)
          
          const regionsRes = await fetch(`http://localhost:3001/api/machine-regions?site_id=${selectedSiteId}`)
          const regionsData = await regionsRes.json()
          
          if (regionsData.success) {
            setRegions(regionsData.data)
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }
    
    fetchData()
  }, [selectedSiteId])

  // Initialize WebRTC stream
  useEffect(() => {
    if (!site) return // Wait for site to be loaded
    
    let pc: RTCPeerConnection | null = null

    const startStream = async () => {
      try {
        setIsLoading(true)

        if (pcRef.current) {
          pcRef.current.close()
        }

        pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        })

        pcRef.current = pc

        pc.addTransceiver("video", { direction: "recvonly" })
        pc.addTransceiver("audio", { direction: "recvonly" })

        pc.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0]
            setIsLoading(false)
          }
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // Wait for ICE gathering with timeout (don't wait forever)
        await new Promise<void>((resolve) => {
          if (pc!.iceGatheringState === "complete") {
            resolve()
          } else {
            const timeout = setTimeout(() => {
              console.warn("ICE gathering timed out, proceeding anyway")
              resolve()
            }, 2000) // 2 second timeout
            
            pc!.onicegatheringstatechange = () => {
              if (pc!.iceGatheringState === "complete") {
                clearTimeout(timeout)
                resolve()
              }
            }
          }
        })

        // Use site-specific stream name
        const streamName = `site${site.id}_dewarped`
        const response = await fetch(`/api/webrtc?src=${streamName}`, {
          method: "POST",
          body: pc.localDescription!.sdp,
          headers: { "Content-Type": "application/x-sdp" },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const answer = await response.text()
        await pc.setRemoteDescription({
          type: "answer",
          sdp: answer,
        })

        console.log("WebRTC connection established")
      } catch (err) {
        console.error("Error starting stream:", err)
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

  // Draw regions on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const scaleX = canvas.width / 1920
      const scaleY = canvas.height / 1080

      // Draw existing regions
      regions.forEach((region, index) => {
        const x = region.x * scaleX
        const y = region.y * scaleY
        const w = region.width * scaleX
        const h = region.height * scaleY

        const isSelected = selectedRegionId === region.id
        const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]
        const color = colors[index % colors.length]

        ctx.strokeStyle = color
        ctx.lineWidth = isSelected ? 4 : 2
        ctx.strokeRect(x, y, w, h)

        ctx.fillStyle = color
        ctx.fillRect(x, y - 30, 220, 30)
        ctx.fillStyle = "white"
        ctx.font = "bold 14px sans-serif"
        ctx.fillText(`${region.icon} ${region.name}`, x + 8, y - 8)
      })

      // Draw current drawing rectangle
      if (currentRect) {
        const x = currentRect.x * scaleX
        const y = currentRect.y * scaleY
        const w = currentRect.width * scaleX
        const h = currentRect.height * scaleY

        ctx.strokeStyle = "#10b981"
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
        ctx.strokeRect(x, y, w, h)
        ctx.setLineDash([])
      }

      requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [regions, currentRect, selectedRegionId])

  // Mouse event handlers for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingRegion) return // Don't draw when editing

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = 1920 / rect.width
    const scaleY = 1080 / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setIsDrawing(true)
    setDrawStart({ x, y })
    setCurrentRect({ x, y, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = 1920 / rect.width
    const scaleY = 1080 / rect.height

    const currentX = (e.clientX - rect.left) * scaleX
    const currentY = (e.clientY - rect.top) * scaleY

    const width = currentX - drawStart.x
    const height = currentY - drawStart.y

    setCurrentRect({
      x: width < 0 ? currentX : drawStart.x,
      y: height < 0 ? currentY : drawStart.y,
      width: Math.abs(width),
      height: Math.abs(height),
    })
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || !site) return

    // Only create region if it's large enough
    if (currentRect.width > 50 && currentRect.height > 50) {
      const newRegion: MachineRegion = {
        site_id: site.id,
        name: `Machine ${regions.length + 1}`,
        icon: "📦",
        x: Math.round(currentRect.x),
        y: Math.round(currentRect.y),
        width: Math.round(currentRect.width),
        height: Math.round(currentRect.height),
        is_default: regions.length === 0,
        display_order: regions.length,
      }

      setEditingRegion(newRegion)
    }

    setIsDrawing(false)
    setDrawStart(null)
    setCurrentRect(null)
  }

  const handleSaveRegion = async () => {
    if (!editingRegion) return

    try {
      setSaveStatus('saving')
      
      const endpoint = editingRegion.id 
        ? `http://localhost:3001/api/machine-regions/${editingRegion.id}`
        : 'http://localhost:3001/api/machine-regions'
      
      const method = editingRegion.id ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRegion),
      })

      const data = await response.json()

      if (data.success) {
        setSaveStatus('success')
        setStatusMessage(editingRegion.id ? 'Region updated!' : 'Region created!')
        
        // Refresh regions
        if (site) {
          const regionsRes = await fetch(`http://localhost:3001/api/machine-regions?site_id=${site.id}`)
          const regionsData = await regionsRes.json()
          if (regionsData.success) {
            setRegions(regionsData.data)
          }
        }

        setEditingRegion(null)
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setStatusMessage(data.error || 'Failed to save region')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (err) {
      console.error('Error saving region:', err)
      setSaveStatus('error')
      setStatusMessage('Network error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleDeleteRegion = async (regionId: number) => {
    if (!confirm('Are you sure you want to delete this region?')) return

    try {
      const response = await fetch(`http://localhost:3001/api/machine-regions/${regionId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success && site) {
        const regionsRes = await fetch(`http://localhost:3001/api/machine-regions?site_id=${site.id}`)
        const regionsData = await regionsRes.json()
        if (regionsData.success) {
          setRegions(regionsData.data)
        }
      }
    } catch (err) {
      console.error('Error deleting region:', err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold mb-2">Machine Region Calibration</h2>
          <p className="text-muted-foreground">
            Draw regions on the camera feed to define virtual PTZ zones for each machine
          </p>
        </div>
        <SiteSelector 
          value={selectedSiteId} 
          onChange={setSelectedSiteId}
        />
      </div>

      {/* Status Alert */}
      {saveStatus !== 'idle' && (
        <Alert variant={saveStatus === 'error' ? 'destructive' : 'default'}>
          {saveStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {saveStatus === 'error' && <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Feed
              </CardTitle>
              <CardDescription>
                Click and drag on the video to draw machine regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={containerRef}
                className="relative w-full bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: '16/9' }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
                
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      <p className="text-sm text-white">Loading camera...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-1">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Click and drag to draw a rectangle around a machine</li>
                  <li>Fill in the machine details in the form</li>
                  <li>Click "Save Region" to confirm</li>
                  <li>Repeat for each machine in your demo center</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Region Editor & List */}
        <div className="space-y-6">
          {/* Region Editor Form */}
          {editingRegion && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingRegion.id ? 'Edit Region' : 'New Region'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Machine Name</Label>
                  <Input
                    id="name"
                    value={editingRegion.name}
                    onChange={(e) => setEditingRegion({ ...editingRegion, name: e.target.value })}
                    placeholder="e.g., Machine 1"
                  />
                </div>

                <div>
                  <Label htmlFor="icon">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    value={editingRegion.icon}
                    onChange={(e) => setEditingRegion({ ...editingRegion, icon: e.target.value })}
                    placeholder="📦"
                    maxLength={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Position</Label>
                    <p className="font-mono">{editingRegion.x}, {editingRegion.y}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Size</Label>
                    <p className="font-mono">{editingRegion.width} × {editingRegion.height}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveRegion}
                    className="flex-1"
                    disabled={saveStatus === 'saving'}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Region
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingRegion(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Configured Regions ({regions.length})</span>
                <Badge variant="secondary">{regions.length}/10</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {regions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No regions configured yet. Draw your first region on the camera feed.
                  </p>
                ) : (
                  regions.map((region, index) => (
                    <div
                      key={region.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRegionId === region.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedRegionId(region.id!)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{region.icon}</span>
                          <div>
                            <p className="font-medium">{region.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {region.width} × {region.height}px
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingRegion(region)
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRegion(region.id!)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

