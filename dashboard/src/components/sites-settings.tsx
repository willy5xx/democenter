import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  Camera,
  RefreshCw,
  Zap
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Site {
  id: number
  name: string
  camera_url: string
  camera_type: string
  dewarp_params: {
    cx?: number
    cy?: number
    k1?: number
    k2?: number
    enable_dewarp?: boolean
  }
  stream_resolution: string
  transition_speed?: number
}

export function SitesSettings() {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Fetch sites
  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sites')
      const data = await response.json()
      
      if (data.success) {
        setSites(data.data)
        if (data.data.length > 0 && !selectedSite) {
          setSelectedSite(data.data[0])
        }
      }
    } catch (err) {
      console.error('Error fetching sites:', err)
    }
  }

  const handleSaveSite = async () => {
    if (!selectedSite) return

    setSaveStatus('saving')

    try {
      const endpoint = isCreating
        ? 'http://localhost:3001/api/sites'
        : `http://localhost:3001/api/sites/${selectedSite.id}`
      
      const method = isCreating ? 'POST' : 'PUT'

      console.log('💾 Saving site:', method, endpoint);
      console.log('📤 Sending data:', selectedSite);

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSite),
      })

      const data = await response.json()
      
      console.log('📥 Response:', data);

      if (data.success) {
        setSaveStatus('success')
        setStatusMessage(isCreating ? 'Site created!' : 'Site updated!')
        setIsEditing(false)
        setIsCreating(false)
        
        await fetchSites()
        
        // Regenerate go2rtc config
        await regenerateGo2rtcConfig()
        
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setStatusMessage(data.error || 'Failed to save site')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (err) {
      console.error('Error saving site:', err)
      setSaveStatus('error')
      setStatusMessage('Network error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const regenerateGo2rtcConfig = async () => {
    try {
      // This would call a backend endpoint to regenerate go2rtc.yaml
      console.log('Regenerating go2rtc config...')
      // For now, just log - you'd add a backend endpoint for this
    } catch (err) {
      console.error('Error regenerating config:', err)
    }
  }

  const handleDeleteSite = async (siteId: number) => {
    if (!confirm('Are you sure you want to delete this site? All machine regions will also be deleted.')) return

    try {
      const response = await fetch(`http://localhost:3001/api/sites/${siteId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchSites()
        setSelectedSite(null)
      }
    } catch (err) {
      console.error('Error deleting site:', err)
    }
  }

  const handleCreateNew = () => {
    const newSite: Site = {
      id: 0,
      name: 'New Site',
      camera_url: '',
      camera_type: 'generic',
      dewarp_params: {
        enable_dewarp: false,
        cx: 0.5,
        cy: 0.5,
        k1: -0.23,
        k2: -0.02,
      },
      stream_resolution: '1920x1080',
      transition_speed: 300,
    }
    setSelectedSite(newSite)
    setIsCreating(true)
    setIsEditing(true)
  }

  const enableDewarp = selectedSite?.dewarp_params?.enable_dewarp ?? false

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold mb-2">Site Management</h2>
          <p className="text-muted-foreground">
            Configure camera sources and streaming settings
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Site
        </Button>
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
        {/* Sites List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Sites ({sites.length})</CardTitle>
              <CardDescription>Select a site to configure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sites.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sites configured yet. Click "Add New Site" to create one.
                  </p>
                ) : (
                  sites.map((site) => (
                    <div
                      key={site.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSite?.id === site.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedSite(site)
                        setIsEditing(false)
                        setIsCreating(false)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{site.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {site.camera_type}
                            </p>
                          </div>
                        </div>
                        {selectedSite?.id === site.id && (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Site Configuration */}
        <div className="lg:col-span-2">
          {selectedSite ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {isCreating ? 'Create New Site' : isEditing ? 'Edit Site' : selectedSite.name}
                    </CardTitle>
                    <CardDescription>
                      Configure camera connection and processing settings
                    </CardDescription>
                  </div>
                  {!isEditing && !isCreating && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSite(selectedSite.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Basic Settings</h3>
                  
                  <div>
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input
                      id="site-name"
                      value={selectedSite.name}
                      onChange={(e) => setSelectedSite({ ...selectedSite, name: e.target.value })}
                      disabled={!isEditing && !isCreating}
                      placeholder="e.g., Demo Center, Office"
                    />
                  </div>

                  <div>
                    <Label htmlFor="camera-type">Camera Type</Label>
                    <Select
                      value={selectedSite.camera_type}
                      onValueChange={(value) => {
                        // Auto-apply dewarp settings based on camera type
                        const dewarpPresets: Record<string, any> = {
                          'generic': { enable_dewarp: false },
                          'webcam': { enable_dewarp: false },
                          'rtsp': { enable_dewarp: false },
                          'fisheye': { 
                            enable_dewarp: true, 
                            cx: 0.5, 
                            cy: 0.5, 
                            k1: -0.23, 
                            k2: -0.02 
                          },
                          'tapo-c200': { enable_dewarp: false },
                          'tapo-c310': { enable_dewarp: false },
                          'tapo-c510w': { 
                            enable_dewarp: true, 
                            cx: 0.5, 
                            cy: 0.5, 
                            k1: -0.22, 
                            k2: -0.02 
                          },
                          'wyze-cam': { enable_dewarp: false },
                          'reolink-fisheye': { 
                            enable_dewarp: true, 
                            cx: 0.5, 
                            cy: 0.5, 
                            k1: -0.28, 
                            k2: -0.03 
                          },
                        }
                        
                        setSelectedSite({ 
                          ...selectedSite, 
                          camera_type: value,
                          dewarp_params: dewarpPresets[value] || { enable_dewarp: false }
                        })
                      }}
                      disabled={!isEditing && !isCreating}
                    >
                      <SelectTrigger id="camera-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">Generic IP Camera</SelectItem>
                        <SelectItem value="rtsp">RTSP Stream (Generic)</SelectItem>
                        <SelectItem value="webcam">USB Webcam</SelectItem>
                        <SelectItem value="tapo-c200">TP-Link Tapo C200/C210</SelectItem>
                        <SelectItem value="tapo-c310">TP-Link Tapo C310/C320</SelectItem>
                        <SelectItem value="tapo-c510w">TP-Link Tapo C510W (with dewarping)</SelectItem>
                        <SelectItem value="wyze-cam">Wyze Cam v3/v4</SelectItem>
                        <SelectItem value="fisheye">Generic Fisheye (180°)</SelectItem>
                        <SelectItem value="reolink-fisheye">Reolink Fisheye</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lens correction is automatically configured based on camera type
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="camera-url">Camera URL / Stream Source</Label>
                    <Input
                      id="camera-url"
                      value={selectedSite.camera_url}
                      onChange={(e) => setSelectedSite({ ...selectedSite, camera_url: e.target.value })}
                      disabled={!isEditing && !isCreating}
                      placeholder="rtsp://camera-ip/stream or avfoundation:0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Examples: rtsp://camera-ip/stream, avfoundation:0 (Mac webcam), /dev/video0 (Linux)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="resolution">Stream Resolution</Label>
                    <Select
                      value={selectedSite.stream_resolution}
                      onValueChange={(value) => setSelectedSite({ ...selectedSite, stream_resolution: value })}
                      disabled={!isEditing && !isCreating}
                    >
                      <SelectTrigger id="resolution">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                        <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                        <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transition Speed */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="transition-speed" className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Transition Speed
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          How fast the camera zooms between machines
                        </p>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {selectedSite.transition_speed || 300}ms
                      </Badge>
                    </div>
                    <Slider
                      id="transition-speed"
                      min={0}
                      max={1000}
                      step={50}
                      value={[selectedSite.transition_speed || 300]}
                      onValueChange={(value) => setSelectedSite({ 
                        ...selectedSite, 
                        transition_speed: value[0] 
                      })}
                      disabled={!isEditing && !isCreating}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>⚡ Instant (0ms)</span>
                      <span>🐌 Slow (1000ms)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSite({ ...selectedSite, transition_speed: 0 })}
                        disabled={!isEditing && !isCreating}
                      >
                        Instant
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSite({ ...selectedSite, transition_speed: 300 })}
                        disabled={!isEditing && !isCreating}
                      >
                        Normal
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSite({ ...selectedSite, transition_speed: 600 })}
                        disabled={!isEditing && !isCreating}
                      >
                        Smooth
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lens Correction Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Lens Correction</h3>
                      <p className="text-sm text-muted-foreground">
                        {enableDewarp 
                          ? '✓ Enabled automatically based on camera type' 
                          : 'Not needed for this camera type'}
                      </p>
                    </div>
                    <Badge variant={enableDewarp ? "default" : "secondary"}>
                      {enableDewarp ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  {enableDewarp && (isEditing || isCreating) && (
                    <details className="space-y-4">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        Advanced: Fine-tune dewarp parameters (optional)
                      </summary>
                      <div className="space-y-4 pl-4 border-l-2 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cx">Center X (cx)</Label>
                            <Input
                              id="cx"
                              type="number"
                              step="0.01"
                              value={selectedSite.dewarp_params.cx || 0.5}
                              onChange={(e) => setSelectedSite({
                                ...selectedSite,
                                dewarp_params: {
                                  ...selectedSite.dewarp_params,
                                  cx: parseFloat(e.target.value),
                                }
                              })}
                              disabled={!isEditing && !isCreating}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cy">Center Y (cy)</Label>
                            <Input
                              id="cy"
                              type="number"
                              step="0.01"
                              value={selectedSite.dewarp_params.cy || 0.5}
                              onChange={(e) => setSelectedSite({
                                ...selectedSite,
                                dewarp_params: {
                                  ...selectedSite.dewarp_params,
                                  cy: parseFloat(e.target.value),
                                }
                              })}
                              disabled={!isEditing && !isCreating}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="k1">Distortion K1</Label>
                            <Input
                              id="k1"
                              type="number"
                              step="0.01"
                              value={selectedSite.dewarp_params.k1 || -0.23}
                              onChange={(e) => setSelectedSite({
                                ...selectedSite,
                                dewarp_params: {
                                  ...selectedSite.dewarp_params,
                                  k1: parseFloat(e.target.value),
                                }
                              })}
                              disabled={!isEditing && !isCreating}
                            />
                          </div>
                          <div>
                            <Label htmlFor="k2">Distortion K2</Label>
                            <Input
                              id="k2"
                              type="number"
                              step="0.01"
                              value={selectedSite.dewarp_params.k2 || -0.02}
                              onChange={(e) => setSelectedSite({
                                ...selectedSite,
                                dewarp_params: {
                                  ...selectedSite.dewarp_params,
                                  k2: parseFloat(e.target.value),
                                }
                              })}
                              disabled={!isEditing && !isCreating}
                            />
                          </div>
                        </div>

                        <Alert>
                          <AlertDescription className="text-xs">
                            <strong>Tip:</strong> Only adjust these if the default preset doesn't look right.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </details>
                  )}
                </div>

                {/* Actions */}
                {(isEditing || isCreating) && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={handleSaveSite}
                      disabled={saveStatus === 'saving'}
                      className="flex-1"
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save & Apply
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setIsCreating(false)
                        fetchSites()
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Info */}
                {!isEditing && !isCreating && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      After saving changes, go2rtc will need to be restarted for the new configuration to take effect.
                      Run: <code className="bg-muted px-2 py-1 rounded">pkill go2rtc && go2rtc -config go2rtc.yaml &</code>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a site from the list or create a new one
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

