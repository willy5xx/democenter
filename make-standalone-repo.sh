#!/bin/bash

# Script to create a standalone repo from demo-center
# This will copy the demo-center to a new location as its own git repo

set -e

echo "🔧 Creating standalone vendVision Demo Center repo"
echo "=================================================="
echo ""

# Default target location
DEFAULT_TARGET="$HOME/src/vendvision-demo-center"

# Ask for target directory
read -p "Where should we create the new repo? [$DEFAULT_TARGET]: " TARGET_DIR
TARGET_DIR="${TARGET_DIR:-$DEFAULT_TARGET}"

# Check if target already exists
if [ -d "$TARGET_DIR" ]; then
    echo "⚠️  Directory $TARGET_DIR already exists!"
    read -p "Remove it and continue? [y/N]: " CONFIRM
    if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
        rm -rf "$TARGET_DIR"
    else
        echo "Aborting."
        exit 1
    fi
fi

# Get source directory (where this script is)
SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "📁 Source: $SOURCE_DIR"
echo "📁 Target: $TARGET_DIR"
echo ""

# Create target directory
mkdir -p "$TARGET_DIR"

# Copy files (excluding .git, node_modules, and other ignored files)
echo "📋 Copying files..."
rsync -av --progress \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'go2rtc' \
    --exclude '*.db' \
    --exclude '*.db-shm' \
    --exclude '*.db-wal' \
    --exclude '*.db.backup' \
    --exclude '*.backup' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    "$SOURCE_DIR/" "$TARGET_DIR/"

echo ""
echo "🔨 Initializing git repository..."
cd "$TARGET_DIR"
git init
git add .
git commit -m "Initial commit: vendVision Demo Center

Camera streaming dashboard for sales demos.

Features:
- Live camera feeds with WebRTC
- Virtual PTZ controls
- OBS integration for Zoom
- Machine calibration tools
"

echo ""
echo "✅ Done! Your new standalone repo is at:"
echo "   $TARGET_DIR"
echo ""
echo "Next steps:"
echo "1. cd $TARGET_DIR"
echo "2. Create a GitHub repo and push:"
echo "   git remote add origin https://github.com/YOUR_ORG/vendvision-demo-center.git"
echo "   git push -u origin main"
echo ""
echo "Your colleagues can then:"
echo "   git clone https://github.com/YOUR_ORG/vendvision-demo-center.git"
echo "   cd vendvision-demo-center"
echo "   ./setup-demo.sh"
echo ""

