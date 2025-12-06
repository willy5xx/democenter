#!/bin/bash

# vendVision Stop Script
# Run this to stop all vendVision services

echo "🛑 Stopping vendVision..."

# 1. Stop go2rtc
if pgrep -x "go2rtc" > /dev/null; then
    echo "   Stopping go2rtc..."
    pkill -x go2rtc
    echo "   ✅ go2rtc stopped"
else
    echo "   ℹ️  go2rtc not running"
fi

# 2. Stop backend (Node.js on port 3001)
BACKEND_PID=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$BACKEND_PID" ]; then
    echo "   Stopping backend (PID: $BACKEND_PID)..."
    kill -9 $BACKEND_PID 2>/dev/null
    echo "   ✅ Backend stopped"
else
    echo "   ℹ️  Backend not running"
fi

# 3. Stop frontend (Vite on port 5173)
FRONTEND_PID=$(lsof -ti:5173 2>/dev/null)
if [ ! -z "$FRONTEND_PID" ]; then
    echo "   Stopping frontend (PID: $FRONTEND_PID)..."
    kill -9 $FRONTEND_PID 2>/dev/null
    echo "   ✅ Frontend stopped"
else
    echo "   ℹ️  Frontend not running"
fi

# Also check port 5174 (Vite fallback)
FRONTEND_PID2=$(lsof -ti:5174 2>/dev/null)
if [ ! -z "$FRONTEND_PID2" ]; then
    echo "   Stopping frontend on 5174 (PID: $FRONTEND_PID2)..."
    kill -9 $FRONTEND_PID2 2>/dev/null
    echo "   ✅ Frontend (5174) stopped"
fi

# 4. Optionally stop Tailscale daemon (uncomment if desired)
# echo "   Stopping Tailscale daemon..."
# sudo pkill tailscaled

echo ""
echo "✅ All vendVision services stopped!"
echo ""
echo "To restart, run: ./start-vendvision.sh"
echo ""

