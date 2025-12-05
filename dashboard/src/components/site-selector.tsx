import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"

interface Site {
  id: number
  name: string
  camera_url: string
  stream_resolution: string
}

interface SiteSelectorProps {
  value: number | null
  onChange: (siteId: number) => void
  className?: string
}

export function SiteSelector({ value, onChange, className }: SiteSelectorProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/sites')
      const data = await response.json()
      
      if (data.success) {
        setSites(data.data)
        
        // Auto-select first site if none selected
        if (!value && data.data.length > 0) {
          onChange(data.data[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching sites:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading sites...</span>
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No sites configured</span>
      </div>
    )
  }

  // If only one site, show it as a label instead of dropdown
  if (sites.length === 1) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{sites[0].name}</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Label htmlFor="site-selector" className="flex items-center gap-2 text-sm whitespace-nowrap">
        <MapPin className="h-4 w-4" />
        Location:
      </Label>
      <Select
        value={value?.toString()}
        onValueChange={(val) => onChange(parseInt(val))}
      >
        <SelectTrigger id="site-selector" className="w-[200px]">
          <SelectValue placeholder="Select a site" />
        </SelectTrigger>
        <SelectContent>
          {sites.map((site) => (
            <SelectItem key={site.id} value={site.id.toString()}>
              {site.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

