#!/usr/bin/env node

/**
 * Detect available hardware encoders for FFmpeg
 * Returns the best available encoder for the current system
 */

import { execSync } from 'child_process';

/**
 * Check if an FFmpeg encoder is available
 */
function checkEncoder(encoderName) {
  try {
    const result = execSync(`ffmpeg -hide_banner -encoders 2>/dev/null | grep -q "${encoderName}"`, {
      stdio: 'pipe',
      timeout: 5000
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if running on Apple Silicon
 */
function isAppleSilicon() {
  try {
    const arch = execSync('uname -m', { encoding: 'utf-8' }).trim();
    return arch === 'arm64';
  } catch {
    return false;
  }
}

/**
 * Check if NVIDIA GPU is available
 */
function hasNvidiaGpu() {
  try {
    execSync('nvidia-smi', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect the best available hardware encoder
 * Returns encoder config object with name and FFmpeg args
 */
export function detectHardwareEncoder() {
  const encoders = [];

  // Check macOS VideoToolbox (Apple Silicon or Intel with hardware support)
  if (process.platform === 'darwin') {
    if (checkEncoder('h264_videotoolbox')) {
      encoders.push({
        name: 'videotoolbox',
        displayName: 'Apple VideoToolbox',
        encoder: 'h264_videotoolbox',
        // VideoToolbox-specific low-latency settings
        args: '-c:v h264_videotoolbox -realtime true -prio_speed true -allow_sw 0',
        priority: isAppleSilicon() ? 100 : 80, // Prefer on Apple Silicon
        latencyMs: 30
      });
    }
  }

  // Check NVIDIA NVENC
  if (hasNvidiaGpu() && checkEncoder('h264_nvenc')) {
    encoders.push({
      name: 'nvenc',
      displayName: 'NVIDIA NVENC',
      encoder: 'h264_nvenc',
      // NVENC low-latency preset
      args: '-c:v h264_nvenc -preset p1 -tune ll -zerolatency 1 -rc cbr -b:v 4M',
      priority: 90,
      latencyMs: 25
    });
  }

  // Check Intel QuickSync (Linux/Windows)
  if (checkEncoder('h264_qsv')) {
    encoders.push({
      name: 'qsv',
      displayName: 'Intel QuickSync',
      encoder: 'h264_qsv',
      args: '-c:v h264_qsv -preset veryfast -look_ahead 0',
      priority: 70,
      latencyMs: 35
    });
  }

  // Check VA-API (Linux AMD/Intel)
  if (process.platform === 'linux' && checkEncoder('h264_vaapi')) {
    encoders.push({
      name: 'vaapi',
      displayName: 'VA-API',
      encoder: 'h264_vaapi',
      args: '-vaapi_device /dev/dri/renderD128 -c:v h264_vaapi',
      priority: 60,
      latencyMs: 40
    });
  }

  // Software fallback (always available) - optimized for low latency
  encoders.push({
    name: 'software',
    displayName: 'Software (libx264)',
    encoder: 'libx264',
    args: '-c:v libx264 -preset ultrafast -tune zerolatency -crf 28 -g 1 -bf 0 -x264-params keyint=1:min-keyint=1:scenecut=0:bframes=0:ref=1:rc-lookahead=0:sync-lookahead=0',
    priority: 10,
    latencyMs: 150
  });

  // Sort by priority (highest first) and return best
  encoders.sort((a, b) => b.priority - a.priority);
  
  return {
    best: encoders[0],
    available: encoders,
    hasHardware: encoders[0].name !== 'software'
  };
}

/**
 * Build the complete FFmpeg filter and encoding command for go2rtc
 */
export function buildFfmpegCommand(sourceStream, options = {}) {
  const {
    enableDewarp = true,
    dewarpParams = {},
    resolution = '1920x1080',
    encoder = null // Auto-detect if not specified
  } = options;

  const detectedEncoder = encoder || detectHardwareEncoder().best;
  const [width, height] = resolution.split('x');

  // Build filter chain
  const filters = [];
  
  // Input optimizations for low latency
  const inputArgs = '-fflags nobuffer+genpts -flags low_delay -probesize 32 -analyzeduration 0';

  // Lens correction (dewarp) if enabled
  if (enableDewarp) {
    const { cx = 0.5, cy = 0.5, k1 = -0.23, k2 = -0.02 } = dewarpParams;
    filters.push(`lenscorrection=cx=${cx}:cy=${cy}:k1=${k1}:k2=${k2}`);
  }

  // Optional crop
  if (dewarpParams.crop_x !== undefined) {
    const { crop_x, crop_y, crop_width, crop_height } = dewarpParams;
    filters.push(`crop=${crop_width}:${crop_height}:${crop_x}:${crop_y}`);
  }

  // Scale to target resolution
  filters.push(`scale=${width}:${height}`);

  // For hardware encoders that need format conversion
  if (detectedEncoder.name === 'vaapi') {
    filters.push('format=nv12', 'hwupload');
  }

  const filterChain = filters.join(',');

  // Build final FFmpeg command for go2rtc
  const ffmpegCmd = `ffmpeg:${sourceStream}#video=h264#raw=${inputArgs} -vf ${filterChain} ${detectedEncoder.args}`;

  return {
    command: ffmpegCmd,
    encoder: detectedEncoder,
    filters: filterChain
  };
}

// CLI usage
if (process.argv[1].endsWith('detect-hardware-encoder.js')) {
  const result = detectHardwareEncoder();
  
  console.log('🔍 Hardware Encoder Detection\n');
  console.log('Best available encoder:');
  console.log(`  ✅ ${result.best.displayName} (${result.best.encoder})`);
  console.log(`     Expected latency: ~${result.best.latencyMs}ms`);
  console.log('');
  
  if (result.available.length > 1) {
    console.log('All available encoders:');
    result.available.forEach((enc, i) => {
      const marker = i === 0 ? '→' : ' ';
      console.log(`  ${marker} ${enc.displayName} (priority: ${enc.priority}, latency: ~${enc.latencyMs}ms)`);
    });
  }
  
  console.log('');
  console.log(`Hardware acceleration: ${result.hasHardware ? '✅ Available' : '❌ Not available (using software)'}`);
}

