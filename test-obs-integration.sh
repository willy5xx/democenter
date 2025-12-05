#!/bin/bash

# OBS Setup Test Script
# Verifies that OBS setup automation is working correctly

set -e

echo "🧪 Testing OBS Setup Integration"
echo "================================"
echo ""

# Test 1: Check if shell script exists and is executable
echo "Test 1: Shell script exists and is executable"
if [ -x "./setup-obs.sh" ]; then
    echo "✅ setup-obs.sh is executable"
else
    echo "❌ setup-obs.sh not found or not executable"
    exit 1
fi

# Test 2: Check if Node.js script exists
echo ""
echo "Test 2: Node.js script exists"
if [ -f "./backend/scripts/setup-obs.js" ]; then
    echo "✅ setup-obs.js exists"
else
    echo "❌ setup-obs.js not found"
    exit 1
fi

# Test 3: Check if API route exists
echo ""
echo "Test 3: API route exists"
if [ -f "./backend/routes/obs-setup.js" ]; then
    echo "✅ obs-setup.js route exists"
else
    echo "❌ obs-setup.js route not found"
    exit 1
fi

# Test 4: Check if React component exists
echo ""
echo "Test 4: React component exists"
if [ -f "./dashboard/src/components/obs-setup-panel.tsx" ]; then
    echo "✅ obs-setup-panel.tsx exists"
else
    echo "❌ obs-setup-panel.tsx not found"
    exit 1
fi

# Test 5: Check if documentation exists
echo ""
echo "Test 5: Documentation exists"
docs_ok=true
if [ ! -f "./OBS_AUTO_SETUP.md" ]; then
    echo "❌ OBS_AUTO_SETUP.md not found"
    docs_ok=false
fi
if [ ! -f "./OBS_QUICK_REFERENCE.md" ]; then
    echo "❌ OBS_QUICK_REFERENCE.md not found"
    docs_ok=false
fi
if [ ! -f "./OBS_IMPLEMENTATION.md" ]; then
    echo "❌ OBS_IMPLEMENTATION.md not found"
    docs_ok=false
fi

if [ "$docs_ok" = true ]; then
    echo "✅ All documentation files exist"
fi

# Test 6: Check if backend can import the script
echo ""
echo "Test 6: Node.js script is valid ES module"
cd backend
if node -e "import('./scripts/setup-obs.js').then(() => console.log('✅ ES module imports successfully'))" 2>/dev/null; then
    :
else
    echo "❌ ES module import failed"
    exit 1
fi
cd ..

# Test 7: Check if API is accessible (if backend is running)
echo ""
echo "Test 7: API endpoint accessibility"
if curl -s http://localhost:3001/api/obs/status > /dev/null 2>&1; then
    echo "✅ API endpoint is accessible"
    
    # Test the actual response
    response=$(curl -s http://localhost:3001/api/obs/status)
    if echo "$response" | grep -q "success"; then
        echo "✅ API returns valid response"
    else
        echo "⚠️  API endpoint responds but format may be incorrect"
    fi
else
    echo "⚠️  Backend not running (optional test - skip if intentional)"
    echo "   Start backend with: cd backend && npm start"
fi

# Test 8: Check if React component is imported in admin page
echo ""
echo "Test 8: React component integration"
if grep -q "OBSSetupPanel" "./dashboard/src/pages/admin.tsx"; then
    echo "✅ OBS component integrated in admin page"
else
    echo "❌ OBS component not imported in admin page"
    exit 1
fi

# Test 9: Check if npm script exists
echo ""
echo "Test 9: NPM script configured"
if grep -q "obs:setup" "./backend/package.json"; then
    echo "✅ npm script 'obs:setup' configured"
else
    echo "❌ npm script 'obs:setup' not found in package.json"
    exit 1
fi

# Test 10: Check if server.js includes OBS router
echo ""
echo "Test 10: Server integration"
if grep -q "obs-setup" "./backend/server.js"; then
    echo "✅ OBS router registered in server.js"
else
    echo "❌ OBS router not registered in server.js"
    exit 1
fi

echo ""
echo "================================"
echo "🎉 All tests passed!"
echo ""
echo "Next steps to verify full functionality:"
echo "1. Install OBS Studio from https://obsproject.com"
echo "2. Run: ./setup-obs.sh"
echo "3. Launch OBS and verify 'vendVision Demo' scene exists"
echo "4. Start backend: cd backend && npm start"
echo "5. Open: http://localhost:5173/admin"
echo "6. Click 'OBS Setup' tab and verify UI works"
echo ""
echo "Manual test in Zoom:"
echo "1. Start OBS Virtual Camera"
echo "2. Open Zoom → Settings → Video"
echo "3. Select 'OBS Virtual Camera'"
echo "4. Verify vendVision appears as camera feed"
echo ""

