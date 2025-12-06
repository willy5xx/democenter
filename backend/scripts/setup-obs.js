#!/usr/bin/env node

/**
 * OBS Auto-Configuration Script for vendVision Demo Center
 * Automatically configures OBS Studio for perfect Zoom integration
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function getOBSConfigDir() {
  const platform = os.platform();
  
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library/Application Support/obs-studio');
  } else if (platform === 'linux') {
    return path.join(os.homedir(), '.config/obs-studio');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA, 'obs-studio');
  }
  
  throw new Error('Unsupported operating system');
}

function isOBSInstalled() {
  const platform = os.platform();
  
  try {
    if (platform === 'darwin') {
      return fs.existsSync('/Applications/OBS.app');
    } else if (platform === 'linux') {
      execSync('which obs', { stdio: 'ignore' });
      return true;
    } else if (platform === 'win32') {
      // Check common installation paths on Windows
      const paths = [
        'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe',
        'C:\\Program Files (x86)\\obs-studio\\bin\\32bit\\obs32.exe'
      ];
      return paths.some(p => fs.existsSync(p));
    }
  } catch (error) {
    return false;
  }
  
  return false;
}

function isOBSRunning() {
  try {
    const platform = os.platform();
    if (platform === 'darwin' || platform === 'linux') {
      execSync('pgrep -x obs', { stdio: 'ignore' });
      return true;
    } else if (platform === 'win32') {
      execSync('tasklist | findstr /I "obs64.exe obs32.exe"', { stdio: 'ignore' });
      return true;
    }
  } catch (error) {
    return false;
  }
  
  return false;
}

function createProfileConfig(profileDir) {
  const configContent = `[General]
Name=vendVision

[Output]
Mode=Simple
FilePath=
RecFormat=mkv
RecEncoder=x264

[Video]
BaseCX=1920
BaseCY=1080
OutputCX=1920
OutputCY=1080
FPSType=0
FPSCommon=30 FPS

[Audio]
SampleRate=44100
ChannelSetup=Stereo

[AdvOut]
RecEncoder=obs_x264
FFOutputToFile=true
FFFormat=
FFFormatMimeType=
`;

  fs.writeFileSync(path.join(profileDir, 'basic.ini'), configContent);
}

function createSceneCollection(scenesDir) {
  const sceneCollection = {
    "current_scene": "vendVision Demo",
    "current_program_scene": "vendVision Demo",
    "scene_order": [
      {
        "name": "vendVision Demo"
      }
    ],
    "name": "vendVision",
    "sources": [
      {
        "versioned_id": "browser_source",
        "name": "Demo Center Browser",
        "uuid": "vendvision-browser-source-001",
        "id": "browser_source",
        "settings": {
          "url": "http://localhost:5173/presentation",
          "width": 1920,
          "height": 1080,
          "fps": 30,
          "shutdown": false,
          "restart_when_active": true,
          "css": "body { margin: 0px auto; overflow: hidden; }",
          "webpage_control_level": 1
        },
        "sync": 0,
        "flags": 0,
        "volume": 1.0,
        "balance": 0.5,
        "mixers": 255,
        "private_settings": {}
      },
      {
        "versioned_id": "scene",
        "name": "vendVision Demo",
        "uuid": "vendvision-scene-001",
        "id": "scene",
        "settings": {},
        "sync": 0,
        "flags": 0,
        "volume": 1.0,
        "balance": 0.5,
        "mixers": 0,
        "private_settings": {}
      }
    ],
    "scene_items": [
      {
        "name": "Demo Center Browser",
        "source_uuid": "vendvision-browser-source-001",
        "visible": true,
        "locked": false,
        "pos": {
          "x": 0.0,
          "y": 0.0
        },
        "scale": {
          "x": 1.0,
          "y": 1.0
        },
        "rot": 0.0,
        "crop_left": 0,
        "crop_top": 0,
        "crop_right": 0,
        "crop_bottom": 0,
        "crop_to_bounds": false,
        "bounds_type": 0,
        "bounds_align": 0,
        "bounds": {
          "x": 0.0,
          "y": 0.0
        },
        "blend_method": "default",
        "blend_mode": "normal"
      }
    ],
    "groups": []
  };

  fs.writeFileSync(
    path.join(scenesDir, 'vendVision.json'),
    JSON.stringify(sceneCollection, null, 2)
  );
}

function updateGlobalConfig(obsConfigDir) {
  const globalConfigPath = path.join(obsConfigDir, 'global.ini');
  
  // Backup existing config if it exists
  if (fs.existsSync(globalConfigPath)) {
    fs.copyFileSync(globalConfigPath, `${globalConfigPath}.backup`);
    log('✅ Backed up existing OBS configuration', colors.green);
  }
  
  const globalConfig = `[General]
Name=vendVision
`;
  
  fs.writeFileSync(globalConfigPath, globalConfig);
}

function createQuickReference(obsConfigDir) {
  const referenceContent = `vendVision OBS Setup - Quick Reference
======================================

✅ OBS has been automatically configured!

Next Steps:
-----------
1. Launch OBS Studio
2. You should see "vendVision Demo" scene with a browser source
3. Click "Start Virtual Camera" (bottom right corner)
4. Open Zoom → Settings → Video
5. Select "OBS Virtual Camera" from the camera dropdown

Manual Adjustments (Optional):
-------------------------------
- Crop the browser source if needed:
  Right-click source → Transform → Edit Transform

- Add your webcam as picture-in-picture:
  Sources → Add → Video Capture Device

- Adjust resolution if laggy:
  Settings → Video → Output Resolution → 1280x720

URLs:
-----
Presentation Mode: http://localhost:5173
Dashboard: http://localhost:5173/dashboard
go2rtc Admin: http://localhost:1984

Troubleshooting:
----------------
- Black screen? Make sure vendVision is running (npm run dev)
- Laggy video? Lower resolution or FPS in Settings → Video
- Camera not showing in Zoom? Restart Zoom after starting Virtual Camera

Need Help?
----------
See ZOOM_VIRTUAL_CAMERA_GUIDE.md for full documentation
`;

  fs.writeFileSync(path.join(obsConfigDir, 'VENDVISION_SETUP.txt'), referenceContent);
}

async function main() {
  console.log('');
  log('🎥 vendVision OBS Auto-Setup', colors.bright + colors.cyan);
  log('════════════════════════════════════════', colors.cyan);
  console.log('');

  // Check if OBS is installed
  if (!isOBSInstalled()) {
    log('❌ OBS Studio not found!', colors.red);
    console.log('');
    log('Please install OBS Studio first:', colors.yellow);
    log('  1. Visit: https://obsproject.com', colors.yellow);
    log('  2. Download OBS Studio for your OS', colors.yellow);
    log('  3. Install and run it once', colors.yellow);
    log('  4. Then run this script again', colors.yellow);
    console.log('');
    process.exit(1);
  }

  log(`✅ OBS Studio detected`, colors.green);

  // Check if OBS is running
  if (isOBSRunning()) {
    log('⚠️  OBS is currently running!', colors.yellow);
    log('Please close OBS before running this setup script.', colors.yellow);
    console.log('');
    process.exit(1);
  }

  try {
    const obsConfigDir = getOBSConfigDir();
    log(`📁 OBS Config: ${obsConfigDir}`, colors.blue);
    console.log('');

    // Create necessary directories
    const profileDir = path.join(obsConfigDir, 'basic/profiles/vendVision');
    const scenesDir = path.join(obsConfigDir, 'basic/scenes');

    fs.mkdirSync(profileDir, { recursive: true });
    fs.mkdirSync(scenesDir, { recursive: true });

    log('⚙️  Creating vendVision profile...', colors.cyan);
    createProfileConfig(profileDir);
    log('✅ Profile created', colors.green);

    log('🎬 Creating scene collection...', colors.cyan);
    createSceneCollection(scenesDir);
    log('✅ Scene collection created', colors.green);

    log('🔧 Updating global config...', colors.cyan);
    updateGlobalConfig(obsConfigDir);
    log('✅ Global config updated', colors.green);

    log('📖 Creating quick reference...', colors.cyan);
    createQuickReference(obsConfigDir);
    log('✅ Quick reference created', colors.green);

    console.log('');
    log('════════════════════════════════════════', colors.green);
    log('🎉 OBS Configuration Complete!', colors.bright + colors.green);
    log('════════════════════════════════════════', colors.green);
    console.log('');
    log('Next steps:', colors.bright);
    console.log('');
    log('1. Start your vendVision services:', colors.cyan);
    log('   ./start-dev.sh', colors.yellow);
    console.log('');
    log('2. Launch OBS Studio', colors.cyan);
    log('   - You\'ll see the \'vendVision Demo\' scene ready to go', colors.yellow);
    console.log('');
    log('3. Click \'Start Virtual Camera\' in OBS', colors.cyan);
    console.log('');
    log('4. In Zoom:', colors.cyan);
    log('   Settings → Video → Select \'OBS Virtual Camera\'', colors.yellow);
    console.log('');
    log(`📖 Quick reference saved to:`, colors.blue);
    log(`   ${path.join(obsConfigDir, 'VENDVISION_SETUP.txt')}`, colors.yellow);
    console.log('');
    log('💡 Tip: Keep OBS running in the background during Zoom calls!', colors.magenta);
    console.log('');

  } catch (error) {
    log('❌ Error during setup:', colors.red);
    console.error(error.message);
    process.exit(1);
  }
}

// Run as CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, getOBSConfigDir, isOBSInstalled, isOBSRunning };

