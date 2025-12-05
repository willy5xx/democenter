#!/bin/bash
# vendVision Demo Center - Quick Start Script

echo "🎪 Starting vendVision Demo Center..."
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.demo.yml" ]; then
    echo "❌ Error: Run this script from the demo-center directory"
    exit 1
fi

# Start go2rtc for camera streaming
echo "📹 Starting go2rtc (camera streaming)..."
docker-compose -f docker-compose.demo.yml up -d
if [ $? -eq 0 ]; then
    echo "✅ go2rtc started on http://localhost:1984"
else
    echo "❌ Failed to start go2rtc"
    exit 1
fi

# Start backend API
echo ""
echo "🚀 Starting backend API..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi
npm start &
BACKEND_PID=$!
echo "✅ Backend started on http://localhost:3001 (PID: $BACKEND_PID)"
cd ..

# Wait a moment for backend to initialize
sleep 2

# Start frontend dashboard
echo ""
echo "🎨 Starting frontend dashboard..."
cd dashboard
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dashboard dependencies..."
    npm install
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ vendVision Demo Center is starting!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Dashboard:  http://localhost:5173"
echo "🔌 Backend:    http://localhost:3001"
echo "📹 go2rtc:     http://localhost:1984"
echo ""
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start frontend (this will keep the script running)
npm run dev

# Cleanup when script exits
trap "echo '\n\n🛑 Shutting down...'; kill $BACKEND_PID 2>/dev/null; docker-compose -f ../docker-compose.demo.yml down; echo '✅ Demo center stopped'; exit" INT TERM

