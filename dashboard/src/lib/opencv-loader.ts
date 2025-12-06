/**
 * OpenCV.js Lazy Loader
 * 
 * Loads OpenCV.js from CDN only when needed to avoid bloating the main bundle.
 * The library is ~8MB and includes WASM, so we lazy-load it on demand.
 */

// Type declarations for OpenCV.js
declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let cvInstance: any = null;
let loadPromise: Promise<any> | null = null;

const OPENCV_CDN_URL = 'https://docs.opencv.org/4.8.0/opencv.js';

/**
 * Load OpenCV.js from CDN
 * Returns cached instance if already loaded
 */
export async function loadOpenCV(): Promise<any> {
  // Return cached instance
  if (cvInstance) {
    return cvInstance;
  }

  // Return existing load promise if loading
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.cv && window.cv.Mat) {
      cvInstance = window.cv;
      resolve(cvInstance);
      return;
    }

    console.log('🔄 Loading OpenCV.js from CDN...');
    const startTime = Date.now();

    const script = document.createElement('script');
    script.src = OPENCV_CDN_URL;
    script.async = true;

    script.onload = () => {
      // OpenCV.js uses a callback when WASM is ready
      if (window.cv && window.cv.onRuntimeInitialized) {
        // Already initialized
        cvInstance = window.cv;
        console.log(`✅ OpenCV.js loaded in ${Date.now() - startTime}ms`);
        resolve(cvInstance);
      } else {
        // Wait for WASM initialization
        const checkReady = setInterval(() => {
          if (window.cv && window.cv.Mat) {
            clearInterval(checkReady);
            cvInstance = window.cv;
            console.log(`✅ OpenCV.js ready in ${Date.now() - startTime}ms`);
            resolve(cvInstance);
          }
        }, 100);

        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkReady);
          if (!cvInstance) {
            reject(new Error('OpenCV.js initialization timed out'));
          }
        }, 30000);
      }
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load OpenCV.js from CDN'));
    };

    document.body.appendChild(script);
  });

  return loadPromise;
}

/**
 * Check if OpenCV is loaded and ready
 */
export function isOpenCVReady(): boolean {
  return cvInstance !== null && cvInstance.Mat !== undefined;
}

/**
 * Get the cached OpenCV instance (throws if not loaded)
 */
export function getOpenCV(): any {
  if (!cvInstance) {
    throw new Error('OpenCV not loaded. Call loadOpenCV() first.');
  }
  return cvInstance;
}


