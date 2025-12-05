#!/bin/bash

echo "🚀 Starting vendVision Development Environment"
echo ""

# Check if go2rtc is running
if ! docker ps | grep -q vendvision-go2rtc; then
    echo "❌ go2rtc is not running. Starting with docker-compose..."
    cd /Users/willleifker/src/vendVision
    docker-compose up -d go2rtc
    sleep 2
fi

echo "✅ go2rtc is running"

# Start backend in background
echo "🔧 Starting backend API on port 3001..."
cd /Users/willleifker/src/vendVision/web/vendvision-backend
npm start &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Start frontend
echo "🎨 Starting frontend on port 5173..."
cd /Users/willleifker/src/vendVision/web/vendvision-dashboard
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT















