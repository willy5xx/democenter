import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Settings, RefreshCw } from "lucide-react"

interface DevSettings {
  transition_style: string
  transition_duration: number
  show_fps_overlay: boolean
  show_region_boundaries: boolean
}

interface DevSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const TRANSITION_STYLES = [
  { value: 'smooth', label: 'Smooth', description: '300ms ease-out' },
  { value: 'instant', label: 'Instant', description: 'No animation' },
  { value: 'slow', label: 'Slow', description: '600ms ease-in-out' },
  { value: 'bounce', label: 'Bounce', description: '500ms elastic' },
]

export function DevSettingsPanel({ isOpen, onClose }: DevSettingsPanelProps) {
  const [settings, setSettings] = useState<DevSettings>({
    transition_style: 'smooth',
    transition_duration: 300,
    show_fps_overlay: false,
    show_region_boundaries: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch current settings from backend
  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/settings')
      const data = await response.json()
      
      if (data.success) {
          setSettings({
          transition_style: data.data.transition_style || 'smooth',
          transition_duration: parseInt(data.data.transition_duration) || 300,
          show_fps_overlay: data.data.show_fps_overlay === 'true',
          show_region_boundaries: data.data.show_region_boundaries === 'true',
        })
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSetting = async (key: string, value: string | number | boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: String(value) }),
      })

      const data = await response.json()
      
      if (data.success) {
        console.log(`Setting ${key} saved:`, value)
        
        // Trigger a custom event so other components can react
        window.dispatchEvent(new CustomEvent('devSettingsChanged', { 
          detail: { key, value } 
        }))
      }
    } catch (err) {
      console.error('Error saving setting:', err)
    }
  }

  const handleTransitionStyleChange = async (value: string) => {
    setSettings({ ...settings, transition_style: value })
    await saveSetting('transition_style', value)
  }

  const handleTransitionDurationChange = async (value: number[]) => {
    const duration = value[0]
    setSettings({ ...settings, transition_duration: duration })
    await saveSetting('transition_duration', duration)
  }

  const handleToggle = async (key: keyof DevSettings, value: boolean) => {
    setSettings({ ...settings, [key]: value })
    await saveSetting(key, value)
  }

  const handleResetDefaults = async () => {
    setIsSaving(true)
    
    const defaults: DevSettings = {
      transition_style: 'smooth',
      transition_duration: 300,
      show_fps_overlay: false,
      show_region_boundaries: false,
    }
    
    try {
      await Promise.all([
        saveSetting('transition_style', defaults.transition_style),
        saveSetting('transition_duration', defaults.transition_duration),
        saveSetting('show_fps_overlay', defaults.show_fps_overlay),
        saveSetting('show_region_boundaries', defaults.show_region_boundaries),
      ])
      
      setSettings(defaults)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="!max-w-[540px] w-full sm:w-[640px]">
        <SheetHeader className="px-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <SheetTitle>Developer Settings</SheetTitle>
          </div>
          <SheetDescription>
            Configure virtual PTZ behavior and visual preferences
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Transition Style */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="transition-style" className="text-base font-medium">
                    Transition Style
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Animation style when switching between machines
                  </p>
                </div>
                <Select
                  value={settings.transition_style}
                  onValueChange={handleTransitionStyleChange}
                >
                  <SelectTrigger id="transition-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITION_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{style.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {style.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transition Duration */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="transition-duration" className="text-base font-medium">
                    Transition Duration
                  </Label>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      Animation speed in milliseconds
                    </p>
                    <Badge variant="secondary" className="font-mono">
                      {settings.transition_duration}ms
                    </Badge>
                  </div>
                </div>
                <Slider
                  id="transition-duration"
                  min={0}
                  max={1000}
                  step={50}
                  value={[settings.transition_duration]}
                  onValueChange={handleTransitionDurationChange}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Instant (0ms)</span>
                  <span>Slow (1000ms)</span>
                </div>
              </div>

              {/* Display Options */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-medium">Display Options</Label>
                
                {/* Show FPS Overlay */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="fps-overlay" className="text-sm font-normal">
                      Show FPS Overlay
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Display frames per second counter
                    </p>
                  </div>
                  <Switch
                    id="fps-overlay"
                    checked={settings.show_fps_overlay}
                    onCheckedChange={(checked) => handleToggle('show_fps_overlay', checked)}
                  />
                </div>

                {/* Show Region Boundaries */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="region-boundaries" className="text-sm font-normal">
                      Show Region Boundaries
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Display machine region outlines
                    </p>
                  </div>
                  <Switch
                    id="region-boundaries"
                    checked={settings.show_region_boundaries}
                    onCheckedChange={(checked) => handleToggle('show_region_boundaries', checked)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResetDefaults}
                  disabled={isSaving}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
                  Reset to Defaults
                </Button>
              </div>

              {/* Info */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Keyboard Shortcut:</strong> Press <kbd className="px-2 py-1 bg-muted rounded">Cmd/Ctrl + Shift + D</kbd> to toggle this panel
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

