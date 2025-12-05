#!/bin/bash
# Serve vendVision demo viewer on port 8080

echo "🚀 Starting vendVision Demo Viewer Server..."
echo ""
echo "📺 Access demo viewer at:"
echo "   http://localhost:8080/demo_viewer.html"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8080

