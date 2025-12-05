import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  Camera, 
  Grid3x3,
  Home,
  ChevronDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AdminNav() {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="flex items-center gap-2">
      {/* Home Button */}
      <Button
        variant={isActive('/dashboard') ? 'default' : 'ghost'}
        size="sm"
        asChild
      >
        <Link to="/dashboard">
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Link>
      </Button>

      {/* Admin Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={location.pathname.startsWith('/admin') ? 'default' : 'ghost'} 
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Admin
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Administration</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link to="/admin/sites" className="cursor-pointer">
              <Camera className="h-4 w-4 mr-2" />
              Site Management
              <span className="ml-auto text-xs text-muted-foreground">
                Configure cameras
              </span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link to="/admin/calibrate" className="cursor-pointer">
              <Grid3x3 className="h-4 w-4 mr-2" />
              Region Calibration
              <span className="ml-auto text-xs text-muted-foreground">
                Draw zones
              </span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

