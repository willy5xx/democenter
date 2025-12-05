import { TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {/* Footfall - People passing by */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">👣 Footfall</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">1,247</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+15%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">People passing by the machine</p>
        </CardContent>
      </Card>

      {/* Touches - Screen interactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">👆 Touches</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">342</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+8%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">Screen interactions today</p>
        </CardContent>
      </Card>

      {/* Vends - Successful purchases */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">🛒 Vends</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">89</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+12%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">Successful purchases</p>
        </CardContent>
      </Card>

      {/* Sales - Revenue */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">💰 Sales</CardDescription>
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-2xl font-bold tabular-nums">$267.00</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">
              <TrendingUpIcon className="size-2.5 mr-0.5" />+18%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">Total sales revenue</p>
        </CardContent>
      </Card>
    </div>
  )
}
