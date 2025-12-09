#!/bin/bash

# vendVision Setup Verification Script
# Run this to check if everything is configured correctly

echo "🔍 vendVision Setup Verification"
echo "================================="
echo ""

ERRORS=0

# Check Node.js
echo "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    echo "  Node.js: $(node -v)"
else
    echo "  ❌ Node.js not found"
    ERRORS=$((ERRORS + 1))
fi

# Check go2rtc binary
echo ""
echo "✓ Checking go2rtc..."
if [ -f "./go2rtc" ]; then
    echo "  ✓ go2rtc binary exists"
else
    echo "  ❌ go2rtc binary not found - run ./setup-demo.sh"
    ERRORS=$((ERRORS + 1))
fi

# Check dependencies
echo ""
echo "✓ Checking dependencies..."
if [ -d "backend/node_modules" ]; then
    echo "  ✓ Backend dependencies installed"
else
    echo "  ❌ Backend dependencies missing - run ./setup-demo.sh"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "dashboard/node_modules" ]; then
    echo "  ✓ Frontend dependencies installed"
else
    echo "  ❌ Frontend dependencies missing - run ./setup-demo.sh"
    ERRORS=$((ERRORS + 1))
fi

# Check database
echo ""
echo "✓ Checking database..."
if [ -f "backend/db/config.db" ]; then
    echo "  ✓ Database exists"
else
    echo "  ❌ Database not found - run ./setup-demo.sh"
    ERRORS=$((ERRORS + 1))
fi

# Check go2rtc.yaml
echo ""
echo "✓ Checking go2rtc configuration..."
if [ -f "./go2rtc.yaml" ]; then
    echo "  ✓ go2rtc.yaml exists"
    
    # Check for correct stream naming
    if grep -q "site1_main:" "./go2rtc.yaml" && grep -q "site1_dewarped:" "./go2rtc.yaml"; then
        echo "  ✓ Stream names configured correctly (site1_main, site1_dewarped)"
    elif grep -q "main:" "./go2rtc.yaml" && grep -q "dewarped:" "./go2rtc.yaml"; then
        echo "  ⚠️  Stream names missing site prefix!"
        echo "     Run: cd backend && node scripts/generate-go2rtc-config.js"
        ERRORS=$((ERRORS + 1))
    else
        echo "  ⚠️  Unexpected stream configuration"
    fi
else
    echo "  ❌ go2rtc.yaml not found - run ./setup-demo.sh"
    ERRORS=$((ERRORS + 1))
fi

# Check if go2rtc is running
echo ""
echo "✓ Checking running services..."
if pgrep go2rtc > /dev/null; then
    echo "  ✓ go2rtc is running"
    echo "    Admin: http://localhost:1984"
else
    echo "  ⓘ go2rtc is not running (this is OK if you haven't started yet)"
    echo "    Run: ./start_vendvision_ext.sh"
fi

# Check OBS installation (for Zoom demos)
echo ""
echo "✓ Checking OBS (for Zoom demos)..."
OBS_INSTALLED=0
OBS_CONFIG_DIR=""

if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -d "/Applications/OBS.app" ]; then
        OBS_INSTALLED=1
        OBS_CONFIG_DIR="$HOME/Library/Application Support/obs-studio"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v obs &> /dev/null; then
        OBS_INSTALLED=1
        OBS_CONFIG_DIR="$HOME/.config/obs-studio"
    fi
fi

if [ $OBS_INSTALLED -eq 1 ]; then
    echo "  ✓ OBS Studio is installed"
    
    # Check for vendVision profile
    if [ -d "$OBS_CONFIG_DIR/basic/profiles/vendVision" ]; then
        echo "  ✓ vendVision OBS profile configured"
    else
        echo "  ⚠️  vendVision OBS profile not found"
        echo "     Run: ./setup-obs.sh"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check for vendVision scene
    if [ -f "$OBS_CONFIG_DIR/basic/scenes/vendVision.json" ]; then
        echo "  ✓ vendVision scene collection ready"
    else
        echo "  ⚠️  vendVision scene not found"
        echo "     Run: ./setup-obs.sh"
    fi
else
    echo "  ⚠️  OBS Studio not installed"
    echo "     OBS is required for Zoom/Teams demos (virtual camera)"
    echo "     Download from: https://obsproject.com"
    echo "     Then run: ./setup-obs.sh"
fi

# Summary
echo ""
echo "================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./start_vendvision_ext.sh"
    echo "  2. Open: http://localhost:5173"
    echo "  3. Verify camera at: http://localhost:1984"
else
    echo "❌ Found $ERRORS issue(s)"
    echo ""
    echo "To fix, run: ./setup-demo.sh"
fi
echo ""



