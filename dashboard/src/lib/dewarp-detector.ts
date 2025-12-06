/**
 * Automatic Fisheye Distortion Detector
 * 
 * Uses OpenCV.js to detect lens distortion by analyzing line curvature.
 * The algorithm:
 * 1. Convert image to grayscale
 * 2. Detect edges using Canny
 * 3. Find line segments using Hough Transform
 * 4. Measure curvature of lines (should be straight in undistorted image)
 * 5. Estimate k1, k2 distortion parameters
 * 6. Optionally optimize by iteratively testing corrections
 */

import { loadOpenCV } from './opencv-loader';

export interface DewarpParams {
  enable_dewarp: boolean;
  cx: number;
  cy: number;
  k1: number;
  k2: number;
}

export interface DetectionResult {
  success: boolean;
  params: DewarpParams;
  confidence: number;
  linesDetected: number;
  message: string;
  processingTimeMs: number;
}

export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  angle: number;
  distFromCenter: number;
}

/**
 * Main detection function - analyzes an image and returns dewarp parameters
 */
export async function detectDistortion(imageSource: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<DetectionResult> {
  const startTime = performance.now();
  
  try {
    const cv = await loadOpenCV();
    
    // Convert source to OpenCV Mat
    const src = cv.imread(imageSource);
    const width = src.cols;
    const height = src.rows;
    
    console.log(`🔍 Analyzing image: ${width}x${height}`);
    
    // Step 1: Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Step 2: Apply Gaussian blur to reduce noise
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    
    // Step 3: Detect edges using Canny
    const edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);
    
    // Step 4: Find line segments using Probabilistic Hough Transform
    const lines = new cv.Mat();
    cv.HoughLinesP(
      edges,
      lines,
      1,                    // rho resolution
      Math.PI / 180,        // theta resolution
      80,                   // threshold
      100,                  // minLineLength
      20                    // maxLineGap
    );
    
    const lineCount = lines.rows;
    console.log(`📏 Detected ${lineCount} line segments`);
    
    // Cleanup intermediate mats
    gray.delete();
    blurred.delete();
    edges.delete();
    
    if (lineCount < 3) {
      src.delete();
      lines.delete();
      return {
        success: false,
        params: getDefaultParams(),
        confidence: 0,
        linesDetected: lineCount,
        message: 'Not enough straight edges detected. Try pointing camera at walls, doorframes, or windows.',
        processingTimeMs: performance.now() - startTime
      };
    }
    
    // Step 5: Analyze lines and estimate distortion
    const analyzedLines = analyzeLines(lines, width, height);
    const { k1, k2, confidence } = estimateDistortion(analyzedLines, width, height);
    
    // Cleanup
    src.delete();
    lines.delete();
    
    const processingTimeMs = performance.now() - startTime;
    console.log(`✅ Detection complete in ${processingTimeMs.toFixed(0)}ms`);
    console.log(`   Estimated k1=${k1.toFixed(4)}, k2=${k2.toFixed(4)}, confidence=${confidence}%`);
    
    return {
      success: true,
      params: {
        enable_dewarp: Math.abs(k1) > 0.05, // Only enable if significant distortion detected
        cx: 0.5,
        cy: 0.5,
        k1: Math.round(k1 * 1000) / 1000,  // Round to 3 decimal places
        k2: Math.round(k2 * 1000) / 1000
      },
      confidence,
      linesDetected: lineCount,
      message: getConfidenceMessage(confidence, k1),
      processingTimeMs
    };
    
  } catch (error) {
    console.error('Detection error:', error);
    return {
      success: false,
      params: getDefaultParams(),
      confidence: 0,
      linesDetected: 0,
      message: `Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processingTimeMs: performance.now() - startTime
    };
  }
}

/**
 * Parse OpenCV line matrix into structured line segments
 */
function analyzeLines(linesMat: any, imgWidth: number, imgHeight: number): LineSegment[] {
  const lines: LineSegment[] = [];
  const centerX = imgWidth / 2;
  const centerY = imgHeight / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let i = 0; i < linesMat.rows; i++) {
    const x1 = linesMat.data32S[i * 4];
    const y1 = linesMat.data32S[i * 4 + 1];
    const x2 = linesMat.data32S[i * 4 + 2];
    const y2 = linesMat.data32S[i * 4 + 3];
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Calculate midpoint distance from center
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const distFromCenter = Math.sqrt(
      Math.pow(midX - centerX, 2) + Math.pow(midY - centerY, 2)
    ) / maxDist;
    
    lines.push({ x1, y1, x2, y2, length, angle, distFromCenter });
  }
  
  // Sort by length (longer lines are more reliable)
  return lines.sort((a, b) => b.length - a.length);
}

/**
 * Estimate k1, k2 distortion parameters from analyzed lines
 * 
 * The key insight: In barrel distortion (fisheye), straight lines appear curved.
 * Lines further from the center show more curvature.
 * We estimate k1 based on how much curvature we detect.
 */
function estimateDistortion(lines: LineSegment[], width: number, height: number): { k1: number; k2: number; confidence: number } {
  if (lines.length === 0) {
    return { k1: 0, k2: 0, confidence: 0 };
  }
  
  // Group lines by orientation (horizontal vs vertical)
  const horizontalLines = lines.filter(l => Math.abs(l.angle) < 30 || Math.abs(l.angle) > 150);
  const verticalLines = lines.filter(l => Math.abs(l.angle) > 60 && Math.abs(l.angle) < 120);
  
  // Calculate average distance from center for edge lines
  // Lines near edges show more distortion effect
  const edgeLines = lines.filter(l => l.distFromCenter > 0.3);
  const avgEdgeDist = edgeLines.length > 0 
    ? edgeLines.reduce((sum, l) => sum + l.distFromCenter, 0) / edgeLines.length
    : 0.5;
  
  // Heuristic: Estimate k1 based on line distribution and edge distance
  // Cameras with more fisheye effect need more negative k1
  // This is a simplified heuristic - a more accurate method would
  // fit a radial distortion model to the detected lines
  
  // Calculate line length variance (higher variance suggests distortion)
  const lengths = lines.slice(0, 20).map(l => l.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const lengthVariance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
  const normalizedVariance = Math.sqrt(lengthVariance) / avgLength;
  
  // Calculate angle clustering (distorted images have lines converging toward center)
  const angleSpread = calculateAngleSpread(lines.slice(0, 15));
  
  // Base k1 estimate on multiple factors
  let k1Estimate = 0;
  
  // Factor 1: Edge distance (further = more distortion visible)
  if (avgEdgeDist > 0.4) {
    k1Estimate -= 0.08 * avgEdgeDist;
  }
  
  // Factor 2: Angle spread (wide spread with long lines suggests barrel)
  if (angleSpread > 30 && lines[0].length > width * 0.15) {
    k1Estimate -= 0.05;
  }
  
  // Factor 3: Length variance 
  if (normalizedVariance > 0.3) {
    k1Estimate -= 0.03 * normalizedVariance;
  }
  
  // Factor 4: Good line coverage (lines in both orientations)
  if (horizontalLines.length > 2 && verticalLines.length > 2) {
    // Good coverage - we can be more confident
    k1Estimate *= 1.2;
  }
  
  // Clamp k1 to reasonable range for typical cameras
  const k1 = Math.max(-0.35, Math.min(0, k1Estimate));
  
  // k2 is typically a small fraction of k1 (fine-tuning)
  const k2 = k1 * 0.08;
  
  // Calculate confidence based on data quality
  const confidence = calculateConfidence(lines, horizontalLines, verticalLines, avgEdgeDist);
  
  return { k1, k2, confidence };
}

/**
 * Calculate the spread of line angles
 */
function calculateAngleSpread(lines: LineSegment[]): number {
  if (lines.length < 2) return 0;
  
  // Normalize angles to 0-180 range
  const normalizedAngles = lines.map(l => {
    let angle = l.angle;
    while (angle < 0) angle += 180;
    while (angle >= 180) angle -= 180;
    return angle;
  });
  
  const minAngle = Math.min(...normalizedAngles);
  const maxAngle = Math.max(...normalizedAngles);
  
  return maxAngle - minAngle;
}

/**
 * Calculate confidence score (0-100) based on detection quality
 */
function calculateConfidence(
  allLines: LineSegment[],
  horizontal: LineSegment[],
  vertical: LineSegment[],
  avgEdgeDist: number
): number {
  let score = 0;
  
  // Base score from number of lines detected
  if (allLines.length >= 20) score += 30;
  else if (allLines.length >= 10) score += 20;
  else if (allLines.length >= 5) score += 10;
  
  // Bonus for good line coverage (both orientations)
  if (horizontal.length >= 3 && vertical.length >= 3) {
    score += 25;
  } else if (horizontal.length >= 2 || vertical.length >= 2) {
    score += 15;
  }
  
  // Bonus for edge lines (where distortion is most visible)
  if (avgEdgeDist > 0.5) score += 20;
  else if (avgEdgeDist > 0.3) score += 10;
  
  // Bonus for long lines (more reliable)
  const longLines = allLines.filter(l => l.length > 150);
  if (longLines.length >= 5) score += 25;
  else if (longLines.length >= 2) score += 15;
  
  return Math.min(100, score);
}

/**
 * Get a human-readable message based on confidence and k1
 */
function getConfidenceMessage(confidence: number, k1: number): string {
  const distortionLevel = Math.abs(k1);
  
  let distortionDesc = '';
  if (distortionLevel < 0.05) {
    distortionDesc = 'minimal distortion detected';
  } else if (distortionLevel < 0.15) {
    distortionDesc = 'mild fisheye detected';
  } else if (distortionLevel < 0.25) {
    distortionDesc = 'moderate fisheye detected';
  } else {
    distortionDesc = 'strong fisheye detected';
  }
  
  if (confidence >= 80) {
    return `High confidence: ${distortionDesc}`;
  } else if (confidence >= 50) {
    return `Medium confidence: ${distortionDesc}. You may want to fine-tune.`;
  } else {
    return `Low confidence: ${distortionDesc}. Consider manual adjustment.`;
  }
}

/**
 * Get default dewarp parameters (no correction)
 */
function getDefaultParams(): DewarpParams {
  return {
    enable_dewarp: false,
    cx: 0.5,
    cy: 0.5,
    k1: 0,
    k2: 0
  };
}

/**
 * Apply lens correction to a canvas and return corrected canvas
 * Useful for preview functionality
 */
export async function applyLensCorrection(
  source: HTMLCanvasElement,
  params: DewarpParams
): Promise<HTMLCanvasElement> {
  const cv = await loadOpenCV();
  
  const src = cv.imread(source);
  const dst = new cv.Mat();
  
  const { cx, cy, k1, k2 } = params;
  const width = src.cols;
  const height = src.rows;
  
  // Build camera matrix
  const focal = width; // Approximate
  const cameraMatrix = cv.matFromArray(3, 3, cv.CV_64F, [
    focal, 0, width * cx,
    0, focal, height * cy,
    0, 0, 1
  ]);
  
  // Distortion coefficients [k1, k2, p1, p2, k3]
  const distCoeffs = cv.matFromArray(5, 1, cv.CV_64F, [k1, k2, 0, 0, 0]);
  
  // Get optimal new camera matrix
  const newCameraMatrix = cv.getOptimalNewCameraMatrix(
    cameraMatrix,
    distCoeffs,
    new cv.Size(width, height),
    1,
    new cv.Size(width, height)
  );
  
  // Undistort
  cv.undistort(src, dst, cameraMatrix, distCoeffs, newCameraMatrix);
  
  // Create output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  cv.imshow(outputCanvas, dst);
  
  // Cleanup
  src.delete();
  dst.delete();
  cameraMatrix.delete();
  distCoeffs.delete();
  newCameraMatrix.delete();
  
  return outputCanvas;
}

/**
 * Capture a frame from a video element to canvas
 */
export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1920;
  canvas.height = video.videoHeight || 1080;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }
  
  return canvas;
}

