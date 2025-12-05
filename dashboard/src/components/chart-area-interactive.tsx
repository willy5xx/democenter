"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
const chartData = [
  { date: "2024-04-01", touches: 150, vends: 222 },
  { date: "2024-04-02", touches: 180, vends: 97 },
  { date: "2024-04-03", touches: 120, vends: 167 },
  { date: "2024-04-04", touches: 260, vends: 242 },
  { date: "2024-04-05", touches: 290, vends: 373 },
  { date: "2024-04-06", touches: 340, vends: 301 },
  { date: "2024-04-07", touches: 180, vends: 245 },
  { date: "2024-04-08", touches: 320, vends: 409 },
  { date: "2024-04-09", touches: 110, vends: 59 },
  { date: "2024-04-10", touches: 190, vends: 261 },
  { date: "2024-04-11", touches: 350, vends: 327 },
  { date: "2024-04-12", touches: 210, vends: 292 },
  { date: "2024-04-13", touches: 380, vends: 342 },
  { date: "2024-04-14", touches: 220, vends: 137 },
  { date: "2024-04-15", touches: 170, vends: 120 },
  { date: "2024-04-16", touches: 190, vends: 138 },
  { date: "2024-04-17", touches: 360, vends: 446 },
  { date: "2024-04-18", touches: 410, vends: 364 },
  { date: "2024-04-19", touches: 180, vends: 243 },
  { date: "2024-04-20", touches: 150, vends: 89 },
  { date: "2024-04-21", touches: 200, vends: 137 },
  { date: "2024-04-22", touches: 170, vends: 224 },
  { date: "2024-04-23", touches: 230, vends: 138 },
  { date: "2024-04-24", touches: 290, vends: 387 },
  { date: "2024-04-25", touches: 250, vends: 215 },
  { date: "2024-04-26", touches: 130, vends: 75 },
  { date: "2024-04-27", touches: 420, vends: 383 },
  { date: "2024-04-28", touches: 180, vends: 122 },
  { date: "2024-04-29", touches: 240, vends: 315 },
  { date: "2024-04-30", touches: 380, vends: 454 },
  { date: "2024-05-01", touches: 220, vends: 165 },
  { date: "2024-05-02", touches: 310, vends: 293 },
  { date: "2024-05-03", touches: 190, vends: 247 },
  { date: "2024-05-04", touches: 420, vends: 385 },
  { date: "2024-05-05", touches: 390, vends: 481 },
  { date: "2024-05-06", touches: 520, vends: 498 },
  { date: "2024-05-07", touches: 300, vends: 388 },
  { date: "2024-05-08", touches: 210, vends: 149 },
  { date: "2024-05-09", touches: 180, vends: 227 },
  { date: "2024-05-10", touches: 330, vends: 293 },
  { date: "2024-05-11", touches: 270, vends: 335 },
  { date: "2024-05-12", touches: 240, vends: 197 },
  { date: "2024-05-13", touches: 160, vends: 197 },
  { date: "2024-05-14", touches: 490, vends: 448 },
  { date: "2024-05-15", touches: 380, vends: 473 },
  { date: "2024-05-16", touches: 400, vends: 338 },
  { date: "2024-05-17", touches: 420, vends: 499 },
  { date: "2024-05-18", touches: 350, vends: 315 },
  { date: "2024-05-19", touches: 180, vends: 235 },
  { date: "2024-05-20", touches: 230, vends: 177 },
  { date: "2024-05-21", touches: 140, vends: 82 },
  { date: "2024-05-22", touches: 120, vends: 81 },
  { date: "2024-05-23", touches: 290, vends: 252 },
  { date: "2024-05-24", touches: 220, vends: 294 },
  { date: "2024-05-25", touches: 250, vends: 201 },
  { date: "2024-05-26", touches: 170, vends: 213 },
  { date: "2024-05-27", touches: 460, vends: 420 },
  { date: "2024-05-28", touches: 190, vends: 233 },
  { date: "2024-05-29", touches: 130, vends: 78 },
  { date: "2024-05-30", touches: 280, vends: 340 },
  { date: "2024-05-31", touches: 230, vends: 178 },
  { date: "2024-06-01", touches: 200, vends: 178 },
  { date: "2024-06-02", touches: 410, vends: 470 },
  { date: "2024-06-03", touches: 160, vends: 103 },
  { date: "2024-06-04", touches: 380, vends: 439 },
  { date: "2024-06-05", touches: 140, vends: 88 },
  { date: "2024-06-06", touches: 250, vends: 294 },
  { date: "2024-06-07", touches: 370, vends: 323 },
  { date: "2024-06-08", touches: 320, vends: 385 },
  { date: "2024-06-09", touches: 480, vends: 438 },
  { date: "2024-06-10", touches: 200, vends: 155 },
  { date: "2024-06-11", touches: 150, vends: 92 },
  { date: "2024-06-12", touches: 420, vends: 492 },
  { date: "2024-06-13", touches: 130, vends: 81 },
  { date: "2024-06-14", touches: 380, vends: 426 },
  { date: "2024-06-15", touches: 350, vends: 307 },
  { date: "2024-06-16", touches: 310, vends: 371 },
  { date: "2024-06-17", touches: 520, vends: 475 },
  { date: "2024-06-18", touches: 170, vends: 107 },
  { date: "2024-06-19", touches: 290, vends: 341 },
  { date: "2024-06-20", touches: 450, vends: 408 },
  { date: "2024-06-21", touches: 210, vends: 169 },
  { date: "2024-06-22", touches: 270, vends: 317 },
  { date: "2024-06-23", touches: 530, vends: 480 },
  { date: "2024-06-24", touches: 180, vends: 132 },
  { date: "2024-06-25", touches: 190, vends: 141 },
  { date: "2024-06-26", touches: 380, vends: 434 },
  { date: "2024-06-27", touches: 490, vends: 448 },
  { date: "2024-06-28", touches: 200, vends: 149 },
  { date: "2024-06-29", touches: 160, vends: 103 },
  { date: "2024-06-30", touches: 400, vends: 446 },
]

const chartConfig = {
  interactions: {
    label: "Interactions",
  },
  touches: {
    label: "Touches",
    color: "hsl(var(--chart-1))",
  },
  vends: {
    label: "Vends",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Touches & Vends</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Total for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillTouches" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-touches)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-touches)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillVends" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-vends)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-vends)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="vends"
              type="natural"
              fill="url(#fillVends)"
              stroke="var(--color-vends)"
              stackId="a"
            />
            <Area
              dataKey="touches"
              type="natural"
              fill="url(#fillTouches)"
              stroke="var(--color-touches)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
