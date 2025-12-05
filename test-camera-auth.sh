#!/bin/bash

# Camera Connection Test Script
# Tests different authentication methods for Tapo cameras

CAMERA_IP="10.1.10.149"
STREAM_PATH="stream1"

echo "🎥 Testing Camera Authentication: $CAMERA_IP"
echo "================================================"
echo ""

# Array of credential combinations to test
declare -a credentials=(
    "secretlab:tapo123"
    "admin:tapo123"
    "admin:admin"
    "secretlab:secretlab"
)

echo "Testing ${#credentials[@]} credential combinations..."
echo ""

for cred in "${credentials[@]}"; do
    echo "Testing: $cred"
    rtsp_url="rtsp://${cred}@${CAMERA_IP}:554/${STREAM_PATH}"
    
    # Use ffprobe to test connection (timeout after 3 seconds)
    output=$(ffprobe -v quiet -print_format json -show_streams "$rtsp_url" 2>&1 &
    pid=$!
    sleep 3
    kill $pid 2>/dev/null
    wait $pid 2>/dev/null
    echo "$output")
    
    if echo "$output" | grep -q "401 Unauthorized"; then
        echo "  ❌ 401 Unauthorized"
    elif echo "$output" | grep -q "streams"; then
        echo "  ✅ SUCCESS! Working credentials: $cred"
        echo ""
        echo "Update your database with:"
        echo "sqlite3 backend/db/config.db \"UPDATE sites SET camera_url = '$rtsp_url' WHERE id = 1;\""
        exit 0
    else
        echo "  ⚠️  Connection failed (timeout or network issue)"
    fi
    echo ""
done

echo "❌ None of the tested credentials worked."
echo ""
echo "Next steps:"
echo "1. Check if camera is online: ping $CAMERA_IP"
echo "2. Verify camera credentials in Tapo app"
echo "3. Try accessing camera web interface"
echo "4. Check if camera is using a different port"

