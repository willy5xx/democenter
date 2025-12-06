/**
 * Auto Dewarp Modal Component
 * 
 * Provides one-click automatic fisheye detection and correction.
 * Features:
 * - Captures frame from live camera stream
 * - Analyzes image for distortion using OpenCV.js
 * - Shows before/after preview
 * - Allows manual fine-tuning with sliders
 * - Applies settings on confirmation
 */

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Wand2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  SlidersHorizontal,
  Camera
} from "lucide-react"
import { 
  detectDistortion, 
  applyLensCorrection, 
  captureVideoFrame,
  type DewarpParams,
  type DetectionResult 
} from "@/lib/dewarp-detector"
import { loadOpenCV, isOpenCVReady } from "@/lib/opencv-loader"

interface AutoDewarpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: number
  siteName: string
  currentParams: DewarpParams
  onApply: (params: DewarpParams) => void
  streamUrl?: string
}

type DetectionStatus = 'idle' | 'loading-opencv' | 'capturing' | 'analyzing' | 'success' | 'error'

export function AutoDewarpModal({
  open,
  onOpenChange,
  siteId,
  siteName,
  currentParams,
  onApply,
  streamUrl
}: AutoDewarpModalProps) {
  const [status, setStatus] = useState<DetectionStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [previewParams, setPreviewParams] = useState<DewarpParams>(currentParams)
  const [showPreview, setShowPreview] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const originalFrameRef = useRef<HTMLCanvasElement | null>(null)
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStatus('idle')
      setProgress(0)
      setResult(null)
      setPreviewParams(currentParams)
      setShowPreview(false)
      setErrorMessage('')
    }
  }, [open, currentParams])
  
  // Connect to camera stream when modal opens
  useEffect(() => {
    if (!open || !videoRef.current) return
    
    const video = videoRef.current
    
    // Use go2rtc WebRTC for the stream
    const connectStream = async () => {
      try {
        // For now, capture from the video element that's already on the page
        // In production, you'd connect to go2rtc's WebRTC endpoint
        const streamName = `site${siteId}_main`
        
        // Create a simple fetch to get a snapshot from go2rtc
        // go2rtc provides /api/frame.jpeg endpoint
        const snapshotUrl = `http://localhost:1984/api/frame.jpeg?src=${streamName}`
        
        // We'll use this URL to load an image for analysis
        console.log('Stream URL for snapshot:', snapshotUrl)
      } catch (err) {
        console.error('Failed to connect to stream:', err)
      }
    }
    
    connectStream()
    
    return () => {
      // Cleanup
    }
  }, [open, siteId])
  
  /**
   * Main detection workflow
   */
  const runDetection = useCallback(async () => {
    setStatus('loading-opencv')
    setProgress(10)
    setErrorMessage('')
    
    try {
      // Step 1: Load OpenCV.js
      if (!isOpenCVReady()) {
        await loadOpenCV()
      }
      setProgress(30)
      
      // Step 2: Capture frame from camera
      setStatus('capturing')
      setProgress(40)
      
      // Try to get a frame from go2rtc snapshot API
      const streamName = `site${siteId}_main`
      const snapshotUrl = `http://localhost:1984/api/frame.jpeg?src=${streamName}`
      
      // Load image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load camera frame'))
        img.src = snapshotUrl
      })
      
      // Draw to canvas for analysis
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')
      ctx.drawImage(img, 0, 0)
      
      // Store original frame for preview
      originalFrameRef.current = canvas
      
      // Show the captured frame
      if (canvasRef.current) {
        const displayCtx = canvasRef.current.getContext('2d')
        if (displayCtx) {
          canvasRef.current.width = canvas.width
          canvasRef.current.height = canvas.height
          displayCtx.drawImage(canvas, 0, 0)
        }
      }
      
      setProgress(60)
      
      // Step 3: Run detection
      setStatus('analyzing')
      const detectionResult = await detectDistortion(canvas)
      setProgress(90)
      
      setResult(detectionResult)
      
      if (detectionResult.success) {
        setPreviewParams(detectionResult.params)
        setStatus('success')
      } else {
        setErrorMessage(detectionResult.message)
        setStatus('error')
      }
      
      setProgress(100)
      
    } catch (error) {
      console.error('Detection failed:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Detection failed')
    }
  }, [siteId])
  
  /**
   * Update preview when params change
   */
  const updatePreview = useCallback(async () => {
    if (!originalFrameRef.current || !previewCanvasRef.current || !showPreview) return
    
    try {
      if (previewParams.enable_dewarp && (previewParams.k1 !== 0 || previewParams.k2 !== 0)) {
        const corrected = await applyLensCorrection(originalFrameRef.current, previewParams)
        const ctx = previewCanvasRef.current.getContext('2d')
        if (ctx) {
          previewCanvasRef.current.width = corrected.width
          previewCanvasRef.current.height = corrected.height
          ctx.drawImage(corrected, 0, 0)
        }
      } else {
        // Show original
        const ctx = previewCanvasRef.current.getContext('2d')
        if (ctx && originalFrameRef.current) {
          previewCanvasRef.current.width = originalFrameRef.current.width
          previewCanvasRef.current.height = originalFrameRef.current.height
          ctx.drawImage(originalFrameRef.current, 0, 0)
        }
      }
    } catch (error) {
      console.error('Preview update failed:', error)
    }
  }, [previewParams, showPreview])
  
  useEffect(() => {
    updatePreview()
  }, [updatePreview])
  
  /**
   * Apply the detected/adjusted parameters
   */
  const handleApply = () => {
    onApply(previewParams)
    onOpenChange(false)
  }
  
  const getStatusMessage = () => {
    switch (status) {
      case 'loading-opencv':
        return 'Loading OpenCV.js (~8MB)...'
      case 'capturing':
        return 'Capturing frame from camera...'
      case 'analyzing':
        return 'Analyzing distortion patterns...'
      case 'success':
        return 'Detection complete!'
      case 'error':
        return 'Detection failed'
      default:
        return 'Click "Detect" to analyze your camera'
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Auto-Detect Dewarp Settings
          </DialogTitle>
          <DialogDescription>
            Automatically detect and correct fisheye distortion for {siteName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status & Progress */}
          {status !== 'idle' && status !== 'success' && status !== 'error' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {getStatusMessage()}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* Error State */}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {/* Success State */}
          {status === 'success' && result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{result.message}</span>
                <Badge variant="secondary">
                  {result.confidence}% confidence • {result.linesDetected} lines detected
                </Badge>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Camera Preview / Captured Frame */}
          <div className="relative border rounded-lg overflow-hidden bg-black aspect-video">
            {status === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Camera className="h-12 w-12 mb-2 opacity-50" />
                <p>Click "Detect" to capture and analyze</p>
              </div>
            )}
            
            {/* Original frame canvas */}
            <canvas 
              ref={canvasRef} 
              className={`w-full h-full object-contain ${showPreview ? 'hidden' : ''}`}
            />
            
            {/* Preview canvas (with correction applied) */}
            <canvas 
              ref={previewCanvasRef} 
              className={`w-full h-full object-contain ${!showPreview ? 'hidden' : ''}`}
            />
            
            {/* Hidden video element for stream connection */}
            <video ref={videoRef} className="hidden" autoPlay playsInline muted />
            
            {/* Preview toggle */}
            {originalFrameRef.current && status === 'success' && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Original
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Detect Button */}
          {(status === 'idle' || status === 'error') && (
            <Button 
              onClick={runDetection} 
              className="w-full"
              size="lg"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {status === 'error' ? 'Try Again' : 'Detect Distortion'}
            </Button>
          )}
          
          {/* Manual Adjustment (shown after detection) */}
          {status === 'success' && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Fine-Tune Parameters
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={runDetection}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Re-detect
                </Button>
              </div>
              
              {/* K1 Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>K1 (Radial Distortion)</Label>
                  <Badge variant="outline" className="font-mono">
                    {previewParams.k1.toFixed(3)}
                  </Badge>
                </div>
                <Slider
                  min={-0.5}
                  max={0.1}
                  step={0.005}
                  value={[previewParams.k1]}
                  onValueChange={(value) => {
                    setPreviewParams({ ...previewParams, k1: value[0] })
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Strong fisheye (-0.5)</span>
                  <span>No distortion (0)</span>
                </div>
              </div>
              
              {/* K2 Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>K2 (Edge Fine-Tuning)</Label>
                  <Badge variant="outline" className="font-mono">
                    {previewParams.k2.toFixed(3)}
                  </Badge>
                </div>
                <Slider
                  min={-0.1}
                  max={0.05}
                  step={0.001}
                  value={[previewParams.k2]}
                  onValueChange={(value) => {
                    setPreviewParams({ ...previewParams, k2: value[0] })
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>More edge correction (-0.1)</span>
                  <span>Less (0.05)</span>
                </div>
              </div>
              
              {/* Center Point (Advanced) */}
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Advanced: Optical Center
                </summary>
                <div className="grid grid-cols-2 gap-4 mt-2 pl-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Center X</Label>
                      <Badge variant="outline" className="font-mono text-xs">
                        {previewParams.cx.toFixed(2)}
                      </Badge>
                    </div>
                    <Slider
                      min={0.3}
                      max={0.7}
                      step={0.01}
                      value={[previewParams.cx]}
                      onValueChange={(value) => {
                        setPreviewParams({ ...previewParams, cx: value[0] })
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Center Y</Label>
                      <Badge variant="outline" className="font-mono text-xs">
                        {previewParams.cy.toFixed(2)}
                      </Badge>
                    </div>
                    <Slider
                      min={0.3}
                      max={0.7}
                      step={0.01}
                      value={[previewParams.cy]}
                      onValueChange={(value) => {
                        setPreviewParams({ ...previewParams, cy: value[0] })
                      }}
                    />
                  </div>
                </div>
              </details>
              
              {/* Detected vs Current comparison */}
              {result && (
                <Alert>
                  <AlertDescription className="text-xs">
                    <strong>Detected:</strong> k1={result.params.k1}, k2={result.params.k2}
                    <br />
                    <strong>Current:</strong> k1={currentParams.k1 || 0}, k2={currentParams.k2 || 0}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {status === 'success' && (
            <Button onClick={handleApply}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Apply Settings
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


